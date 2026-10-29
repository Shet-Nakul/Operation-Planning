require('ts-node').register({ project: require('node:path').join(__dirname, '../tsconfig.json') });
const { test } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../src/models/prisma').default;
const payloads = require('../src/services/schedulingPayloadPreparer');
const manager = require('../src/services/schedulingProcessManager');
const { mergeRosteringViews } = require('../src/services/rosteringMerge');

test('approved swaps reroster affected overlap groups, exchange both shifts, and unpin old assignments', async () => {
  prisma.staff.findMany = async () => [
    { id: 1, staff_id: 'EMP-1', contract_id: 'DYNAMIC', roles: ['Nurse'], pool_assignments: [{ pool_id: 'POOL-1' }] },
    { id: 2, staff_id: 'EMP-2', contract_id: 'DYNAMIC', roles: ['Nurse'], pool_assignments: [{ pool_id: 'POOL-1' }, { pool_id: 'POOL-2' }] },
    { staff_id: 'EMP-3', contract_id: 'DYNAMIC', roles: ['Nurse'], pool_assignments: [{ pool_id: 'POOL-3' }] },
    { staff_id: 'EMP-4', contract_id: 'DYNAMIC', roles: ['Nurse'], pool_assignments: [{ pool_id: 'POOL-3' }] },
  ];
  prisma.resourcePool.findMany = async () => [1, 2, 3].map(id => ({
    pool_id: `POOL-${id}`, primary_role: 'Nurse', demand_configs: [{ demand_matrix: [{ shift: 'E', monday: 1 }] }],
  }));
  prisma.shift.findMany = async () => [{ name: 'Early', alias: 'E' }, { name: 'Night', alias: 'N' }];
  prisma.contract.findMany = async () => [{ contract_id: 'DYNAMIC', type: 'DYNAMIC', constraints: [] }];
  prisma.forbiddenPattern.findFirst = async () => null;
  prisma.rostering.findUnique = async () => ({ employee_centric: {
    'EMP-1': { '2026-11-12': { shift: 'E', pool: 'POOL-1' }, '2026-11-15': { shift: 'E', pool: 'POOL-1' } },
    'EMP-2': { '2026-11-12': { shift: 'N', pool: 'POOL-1' } },
  } });
  let approved = false;
  prisma.leaveShiftRequest.findMany = async () => approved ? [{
    id: 1, staff: { staff_id: 'EMP-1' }, shift_preference: 'E',
    metadata: { swap: true, preferred_shift: 'N', target_staff_id: 2, target_staff_code: 'EMP-2' },
    start_date: '2026-11-12', end_date: '2026-11-12', created_at: new Date('2026-10-29'),
  }] : [];
  const options = { triggerDate: new Date('2026-11-01'), poolIds: ['POOL-1'], endDate: new Date('2027-01-12') };
  const pending = await payloads.prepareSchedulePayload(5, options);
  assert.deepEqual(pending[0].preferred_schedules, {});
  approved = true;
  const payload = await payloads.prepareSchedulePayload(5, options);
  assert.equal(payload.length, 1);
  assert.deepEqual(Object.keys(payload[0].pool_role_map), ['POOL-1', 'POOL-2']);
  assert.equal(payload[0].preferred_schedules['EMP-1']['2026-11-12'].shift, 'N');
  assert.equal(payload[0].preferred_schedules['EMP-2']['2026-11-12'].shift, 'E');
  assert.equal(payload[0].assigned_schedules['EMP-1']['2026-11-12'], undefined);
  assert.equal(payload[0].assigned_schedules['EMP-2']['2026-11-12'], undefined);
  assert.equal(payload[0].assigned_schedules['EMP-1']['2026-11-15'].shift, 'E');
  assert.equal(payload[0].start_date, '2026-11-01');
  assert.equal(payload[0].horizon, 73);
});

test('pool-scoped persistence preserves other pools, employees, and dates', () => {
  const existing = {
    employee_centric: { A: { '2026-11-01': { shift: 'D' }, '2026-11-12': { shift: 'D' } }, B: { '2026-11-12': { shift: 'N' } } },
    pool_centric: { P1: { '2026-11-12': { D: ['A'] } }, P2: { '2026-11-12': { N: ['B'] } } },
    date_centric: { '2026-11-12': { P1: { D: ['A'] }, P2: { N: ['B'] } }, '2026-11-01': { P1: { D: ['A'] } } },
  };
  const result = mergeRosteringViews(existing, {
    employee_centric: { A: { '2026-11-12': { shift: 'N' } } },
    pool_centric: { P1: { '2026-11-12': { N: ['A'] } } },
    date_centric: { '2026-11-12': { P1: { N: ['A'] } } },
  }, ['P1']);
  assert.equal(result.employee_centric.A['2026-11-12'].shift, 'N');
  assert.deepEqual(result.employee_centric.B, existing.employee_centric.B);
  assert.deepEqual(result.employee_centric.A['2026-11-01'], existing.employee_centric.A['2026-11-01']);
  assert.deepEqual(result.pool_centric.P2, existing.pool_centric.P2);
  assert.deepEqual(result.date_centric['2026-11-12'].P2, existing.date_centric['2026-11-12'].P2);
  assert.deepEqual(result.pool_centric.P1['2026-11-12'], { N: ['A'] });
  const offDay = mergeRosteringViews(existing, {
    employee_centric: { A: { '2026-11-12': { shift: 'O' } } },
    pool_centric: {}, date_centric: {},
  }, ['P1']);
  assert.equal(offDay.pool_centric.P1['2026-11-12'], undefined);
  assert.equal(offDay.date_centric['2026-11-12'].P1, undefined);
  assert.deepEqual(offDay.date_centric['2026-11-12'].P2, existing.date_centric['2026-11-12'].P2);
  assert.deepEqual(existing.pool_centric.P1['2026-11-12'], { D: ['A'] });
});

test('swap queue retries failed starts and retains approvals arriving during an active run', async () => {
  const original = { trigger: manager.triggerProcess, state: manager.getProcessState, hook: manager.registerSchedulingCompletionHook, interval: global.setInterval };
  let completion;
  let tick;
  let running = false;
  let fail = true;
  const calls = [];
  manager.getProcessState = () => ({ running });
  manager.registerSchedulingCompletionHook = hook => { completion = hook; };
  manager.triggerProcess = async (org, options) => {
    calls.push({ org, options });
    if (fail) return { success: false, message: 'Test failure' };
    running = true;
    return { success: true };
  };
  global.setInterval = callback => { tick = callback; return 0; };
  try {
    const queue = require('../src/services/schedulingAutoTrigger');
    queue.startSchedulingAutoTrigger();
    const job = { organizationId: 5, requestId: 10, poolIds: ['POOL-1'], startDate: '2026-11-12', endDate: '2027-01-12' };
    queue.queueSwapRostering(job);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls.length, 1);
    fail = false;
    tick();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[1].options.poolIds, ['POOL-1']);
    assert.equal(calls[1].options.endDate.toISOString().slice(0, 10), '2027-01-12');
    queue.queueSwapRostering({ ...job, requestId: 11, poolIds: ['POOL-2'] });
    assert.equal(calls.length, 2);
    running = false;
    completion(5, true);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls.length, 3);
    assert.deepEqual(calls[2].options.poolIds, ['POOL-2']);
    running = false;
    completion(5, false);
    tick();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls.length, 4);
    running = false;
    completion(5, true);
    tick();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls.length, 4);
  } finally {
    manager.triggerProcess = original.trigger;
    manager.getProcessState = original.state;
    manager.registerSchedulingCompletionHook = original.hook;
    global.setInterval = original.interval;
  }
});

test('a scoped solver run persists merged results and rejects a concurrent start during payload preparation', async () => {
  const { WebSocketServer } = require('ws');
  const ws = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  await new Promise(resolve => ws.once('listening', resolve));
  const originalPrepare = payloads.prepareSchedulePayload;
  const originalUrl = process.env.WEBSOCKET_URL_ROSTER;
  let releasePayload;
  let saved;
  let complete;
  const completion = new Promise(resolve => { complete = resolve; });
  const existing = {
    employee_centric: { OTHER: { '2026-11-12': { shift: 'N', pool: 'OTHER-POOL' } } },
    pool_centric: { 'OTHER-POOL': { '2026-11-12': { N: ['OTHER'] } } },
    date_centric: { '2026-11-12': { 'OTHER-POOL': { N: ['OTHER'] } } },
  };
  payloads.prepareSchedulePayload = async () => {
    await new Promise(resolve => { releasePayload = resolve; });
    return [{ start_date: '2026-11-01', employee_profiles: { A: {} }, pool_role_map: { P1: 'Nurse' } }];
  };
  prisma.$transaction = async callback => callback({
    rostering: {
      findUnique: async () => existing,
      upsert: async args => { saved = args; },
    },
  });
  manager.registerSchedulingCompletionHook((org, success) => complete({ org, success }));
  process.env.WEBSOCKET_URL_ROSTER = `ws://127.0.0.1:${ws.address().port}`;
  ws.on('connection', socket => socket.on('message', () => socket.send(JSON.stringify({
    status: 'completed',
    solutions: {
      employee_centric: { A: { '2026-11-12': { shift: 'E', pool: 'P1' } } },
      pool_centric: { P1: { '2026-11-12': { E: ['A'] } } },
      date_centric: { '2026-11-12': { P1: { E: ['A'] } } },
    },
  }))));
  try {
    const first = manager.triggerProcess(5, { poolIds: ['P1'] });
    assert.equal(manager.getProcessState().running, true);
    assert.equal((await manager.triggerProcess(5)).success, false);
    releasePayload();
    assert.equal((await first).success, true);
    assert.deepEqual(await completion, { org: 5, success: true });
    assert.deepEqual(saved.update.employee_centric.OTHER, existing.employee_centric.OTHER);
    assert.deepEqual(saved.update.pool_centric['OTHER-POOL'], existing.pool_centric['OTHER-POOL']);
    assert.equal(saved.update.employee_centric.A['2026-11-12'].shift, 'E');
    assert.equal(manager.getProcessState().running, false);
  } finally {
    payloads.prepareSchedulePayload = originalPrepare;
    if (originalUrl === undefined) delete process.env.WEBSOCKET_URL_ROSTER;
    else process.env.WEBSOCKET_URL_ROSTER = originalUrl;
    for (const socket of ws.clients) socket.terminate();
    await new Promise(resolve => ws.close(resolve));
  }
});
