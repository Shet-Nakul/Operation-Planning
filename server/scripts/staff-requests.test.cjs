require('ts-node').register({ project: require('node:path').join(__dirname, '../tsconfig.json') });
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../src/models/prisma').default;
const workflow = require('../src/controllers/leaveRequestsController');
const { isValidRequestDate } = require('../src/services/staffRequestWorkflow');
const scheduling = require('../src/services/schedulingAutoTrigger');

const accounts = [
  { id: 1, organization_id: 5, email: 'staff@example.test', is_active: true, role: { name: 'USER' } },
  { id: 2, organization_id: 5, email: 'supervisor@example.test', is_active: true, role: { name: 'USER' } },
  { id: 3, organization_id: 5, email: 'other@example.test', is_active: true, role: { name: 'USER' } },
];
const members = [
  { id: 10, organization_id: 5, staff_id: 'STAFF-001', name: 'Staff Member', email: accounts[0].email, supervisor: 'Supervisor', pool_assignments: [{ pool_id: 'POOL-1' }] },
  { id: 20, organization_id: 5, staff_id: 'STAFF-002', name: 'Supervisor', email: accounts[1].email, supervisor: null, pool_assignments: [{ pool_id: 'POOL-2' }] },
];
let requests;
let rosterJobs;
const hydrate = request => ({ ...request, staff: members.find(member => member.id === request.staff_id), leave_type: request.leave_type_id ? { id: 1, name: 'Vacation' } : null });

beforeEach(() => {
  requests = [];
  rosterJobs = [];
  scheduling.queueSwapRostering = job => rosterJobs.push(job);
  prisma.user.findFirst = async ({ where }) => accounts.find(account => {
    if (where.organization_id !== account.organization_id) return false;
    return where.id ? account.id === where.id : account.email === where.email.equals;
  });
  prisma.user.findMany = async () => accounts;
  prisma.staff.findMany = async ({ where }) => members.filter(member => member.organization_id === where.organization_id && (!where.OR || where.OR.some(condition => member.id === condition.id || member.staff_id === condition.staff_id || member.name === condition.name || member.email === condition.email?.equals)));
  prisma.staff.findUnique = async ({ where }) => members.find(member => member.staff_id === where.staff_id);
  prisma.leaveType.findFirst = async ({ where }) => where.name === 'Vacation' ? { id: 1, name: 'Vacation' } : null;
  prisma.shift.findMany = async () => [{ alias: 'E' }];
  prisma.leaveShiftRequest.create = async ({ data }) => {
    const created = { ...data, id: requests.length + 1, created_at: new Date(), updated_at: new Date() };
    requests.push(created);
    return hydrate(created);
  };
  prisma.leaveShiftRequest.findMany = async ({ where }) => requests.filter(request => request.organization_id === where.organization_id && (!where.staff_id || request.staff_id === where.staff_id)).map(hydrate);
  prisma.leaveShiftRequest.findUnique = async ({ where }) => {
    const request = requests.find(item => item.id === where.id);
    return request ? hydrate(request) : null;
  };
  prisma.leaveShiftRequest.findUniqueOrThrow = prisma.leaveShiftRequest.findUnique;
  prisma.leaveShiftRequest.updateMany = async ({ where, data }) => {
    const request = requests.find(item => item.id === where.id && item.status === where.status && (!where.metadata || JSON.stringify(item.metadata) === JSON.stringify(where.metadata.equals)));
    if (!request) return { count: 0 };
    Object.assign(request, data);
    return { count: 1 };
  };
  prisma.leaveShiftRequest.deleteMany = async ({ where }) => {
    const index = requests.findIndex(item => item.id === where.id && item.status === where.status);
    if (index < 0) return { count: 0 };
    requests.splice(index, 1);
    return { count: 1 };
  };
});

async function invoke(handler, userId = 1, body = {}, query = {}, organizationId = 5, role = 'USER') {
  const response = { code: 200, body: null, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, send() { return this; } };
  await handler({ user: { id: userId, role, organization_id: organizationId }, body, query, params: { id: '1' } }, response);
  return response;
}

const leave = { staff_id: 'STAFF-001', request_category: 'LEAVE', leave_type_name: 'Vacation', start_date: '2026-11-12', end_date: '2026-11-14', reason: 'Family event' };

test('submits pending leave, ignores spoofed reviewers, and reloads saved requests', async () => {
  const submitted = await invoke(workflow.createStaffRequest, 1, { ...leave, metadata: { supervisor_user_ids: [3] } });
  assert.equal(submitted.code, 201);
  assert.equal(submitted.body.data.status, 'PENDING');
  assert.deepEqual(submitted.body.data.metadata.supervisor_user_ids, [2]);
  const loaded = await invoke(workflow.getStaffRequests, 1, {}, { staffId: 'STAFF-001' });
  assert.equal(loaded.body.data.length, 1);
  assert.equal(loaded.body.data[0].can_review, false);
});

test('routes to the assigned supervisor and hides requests from unrelated users', async () => {
  await invoke(workflow.createStaffRequest, 1, leave);
  const supervisor = await invoke(workflow.getStaffRequests, 2);
  assert.equal(supervisor.body.data[0].can_review, true);
  assert.equal((await invoke(workflow.getStaffRequests, 3)).body.data.length, 0);
  assert.equal((await invoke(workflow.getStaffRequestById, 3)).code, 403);
  const team = await invoke(workflow.getSupervisorTeam, 2);
  assert.deepEqual(team.body.data.staff.map(member => member.staff_id), ['STAFF-001']);
});

test('only the supervisor can approve; repeated decisions fail', async () => {
  await invoke(workflow.createStaffRequest, 1, leave);
  assert.equal((await invoke(workflow.updateStaffRequest, 1, { status: 'APPROVED' })).code, 403);
  assert.equal((await invoke(workflow.updateStaffRequest, 3, { status: 'APPROVED' })).code, 403);
  assert.equal((await invoke(workflow.updateStaffRequest, 2, { status: 'APPROVED' })).code, 200);
  assert.equal(requests[0].metadata.updated_by, 2);
  assert.equal((await invoke(workflow.updateStaffRequest, 2, { status: 'REJECTED' })).code, 409);
  assert.equal((await invoke(workflow.getStaffRequests, 1)).body.data[0].status, 'APPROVED');
});

test('preserves the shift-off alias and supports supervisor rejection', async () => {
  const submitted = await invoke(workflow.createStaffRequest, 1, { ...leave, request_category: 'SHIFT', leave_type_name: undefined, shift: 'O' });
  assert.equal(submitted.code, 201);
  assert.equal(submitted.body.data.shift, 'O');
  assert.equal((await invoke(workflow.updateStaffRequest, 2, { status: 'REJECTED' })).code, 200);
  assert.equal(requests[0].status, 'REJECTED');
});

test('rejects invalid dates, pre-approved submissions, and submitting for others', async () => {
  assert.equal((await invoke(workflow.createStaffRequest, 1, { ...leave, start_date: '2026-02-30' })).code, 400);
  assert.equal((await invoke(workflow.createStaffRequest, 1, { ...leave, end_date: '2026-11-10' })).code, 400);
  assert.equal((await invoke(workflow.createStaffRequest, 1, { ...leave, status: 'APPROVED' })).code, 400);
  assert.equal((await invoke(workflow.createStaffRequest, 3, leave)).code, 403);
  assert.equal((await invoke(workflow.createStaffRequest, 1, leave, {}, 6)).code, 400);
  assert.equal(isValidRequestDate('2024-02-29'), true);
  assert.equal(isValidRequestDate('2026-02-29'), false);
});

test('fails clearly when supervisor account is absent', async () => {
  prisma.user.findMany = async () => [accounts[0], accounts[2]];
  const response = await invoke(workflow.createStaffRequest, 1, leave);
  assert.equal(response.code, 400);
  assert.match(response.body.error, /No active supervisor/);
});

test('withdrawal is requester-only and cannot remove reviewed records', async () => {
  await invoke(workflow.createStaffRequest, 1, leave);
  assert.equal((await invoke(workflow.deleteStaffRequest, 3)).code, 403);
  assert.equal((await invoke(workflow.deleteStaffRequest, 1)).code, 204);
  await invoke(workflow.createStaffRequest, 1, leave);
  await invoke(workflow.updateStaffRequest, 2, { status: 'APPROVED' });
  assert.equal((await invoke(workflow.deleteStaffRequest, 1)).code, 409);
});

test('an assigned admin can approve leave submitted on behalf of another staff member', async () => {
  const originalMember = { ...members[0] };
  Object.assign(members[0], { email: accounts[2].email, supervisor: 'Hospital Admin' });
  prisma.user.findMany = async () => accounts.map(account => ({ ...account, role: { name: 'ADMIN' } }));
  try {
    const submitted = await invoke(workflow.createStaffRequest, 1, leave, {}, 5, 'ADMIN');
    assert.equal(submitted.code, 201);
    assert.deepEqual(submitted.body.data.metadata.supervisor_user_ids, [1, 2]);
    requests[0].metadata.supervisor_user_ids = [2];
    const inbox = await invoke(workflow.getStaffRequests, 1, {}, {}, 5, 'ADMIN');
    assert.equal(inbox.body.data[0].can_review, true);
    assert.equal((await invoke(workflow.updateStaffRequest, 3, { status: 'APPROVED' }, {}, 5, 'ADMIN')).code, 403);
    assert.equal((await invoke(workflow.updateStaffRequest, 1, { status: 'APPROVED' }, {}, 5, 'ADMIN')).code, 200);
  } finally {
    Object.assign(members[0], originalMember);
  }
});

test('pending requests with missing reviewer metadata are reviewable by the assigned supervisor', async () => {
  await invoke(workflow.createStaffRequest, 1, leave);
  delete requests[0].metadata.supervisor_user_ids;
  assert.equal((await invoke(workflow.getStaffRequests, 2)).body.data[0].can_review, true);
  assert.equal((await invoke(workflow.getStaffRequests, 3)).body.data.length, 0);
  assert.equal((await invoke(workflow.updateStaffRequest, 2, { status: 'APPROVED' })).code, 200);
  assert.deepEqual(requests[0].metadata.supervisor_user_ids, [2]);
});

test('reassigned pending requests route only to the current supervisor', async () => {
  await invoke(workflow.createStaffRequest, 1, leave);
  const originalSupervisor = members[0].supervisor;
  members[0].supervisor = accounts[2].email;
  try {
    assert.equal((await invoke(workflow.getStaffRequests, 2)).body.data.length, 0);
    assert.equal((await invoke(workflow.getStaffRequests, 3)).body.data[0].can_review, true);
    assert.equal((await invoke(workflow.updateStaffRequest, 2, { status: 'APPROVED' })).code, 403);
    assert.equal((await invoke(workflow.updateStaffRequest, 3, { status: 'APPROVED' })).code, 200);
  } finally {
    members[0].supervisor = originalSupervisor;
  }
});

const swap = { ...leave, request_category: 'SHIFT', leave_type_name: undefined, shift: 'E', swap: { target_staff_id: 'STAFF-002', preferred_shift: 'O' } };
const admin = { id: 4, organization_id: 5, email: 'admin@example.test', is_active: true, role: { name: 'ADMIN' } };

function enableSwapAdmins(admins = [admin]) {
  prisma.user.findMany = async ({ where }) => [...accounts, ...admins].filter(account =>
    account.organization_id === where.organization_id && account.is_active &&
    (!where.email || account.email.toLowerCase() === where.email.equals.toLowerCase()) &&
    (!where.role || (typeof where.role.name === 'string' ? account.role.name === where.role.name : where.role.name.in.includes(account.role.name))));
}

test('swaps require supervisor approval before hospital admin final approval', async () => {
  enableSwapAdmins();
  const submitted = await invoke(workflow.createStaffRequest, 1, { ...swap, metadata: { stage: 'ADMIN' } });
  assert.equal(submitted.code, 201);
  assert.equal(requests[0].metadata.stage, 'SUPERVISOR');
  assert.equal((await invoke(workflow.getStaffRequests, 2)).body.data[0].can_review, true);
  assert.equal((await invoke(workflow.updateStaffRequest, 4, { status: 'APPROVED' }, {}, 5, 'ADMIN')).code, 403);
  assert.equal((await invoke(workflow.updateStaffRequest, 1, { status: 'APPROVED' })).code, 403);
  const forwarded = await invoke(workflow.updateStaffRequest, 2, { status: 'APPROVED' });
  assert.equal(forwarded.code, 200);
  assert.equal(requests[0].status, 'PENDING');
  assert.equal(requests[0].metadata.stage, 'ADMIN');
  assert.equal(rosterJobs.length, 0);
  assert.equal((await invoke(workflow.getStaffRequests, 2)).body.data[0].can_review, false);
  const originalFindFirst = prisma.user.findFirst;
  prisma.user.findFirst = async args => args.where.id === admin.id ? admin : originalFindFirst(args);
  assert.equal((await invoke(workflow.getStaffRequests, 4, {}, {}, 5, 'ADMIN')).body.data[0].can_review, true);
  assert.equal((await invoke(workflow.updateStaffRequest, 2, { status: 'APPROVED' })).code, 403);
  assert.equal((await invoke(workflow.updateStaffRequest, 4, { status: 'APPROVED' }, {}, 5, 'ADMIN')).code, 200);
  assert.equal(requests[0].status, 'APPROVED');
  assert.equal(requests[0].metadata.supervisor_decision.by, 2);
  assert.equal(requests[0].metadata.admin_decision.by, 4);
  assert.deepEqual(rosterJobs, [{ organizationId: 5, requestId: 1, poolIds: ['POOL-1', 'POOL-2'], startDate: swap.start_date, endDate: swap.end_date }]);
  assert.equal((await invoke(workflow.updateStaffRequest, 4, { status: 'REJECTED' }, {}, 5, 'ADMIN')).code, 409);
});

test('supervisor and admin rejection each end the swap workflow', async () => {
  enableSwapAdmins();
  await invoke(workflow.createStaffRequest, 1, swap);
  assert.equal((await invoke(workflow.updateStaffRequest, 2, { status: 'REJECTED' })).code, 200);
  assert.equal(requests[0].status, 'REJECTED');
  assert.equal(rosterJobs.length, 0);
  requests = [];
  await invoke(workflow.createStaffRequest, 1, swap);
  await invoke(workflow.updateStaffRequest, 2, { status: 'APPROVED' });
  assert.equal((await invoke(workflow.updateStaffRequest, 4, { status: 'REJECTED' }, {}, 5, 'ADMIN')).code, 200);
  assert.equal(requests[0].status, 'REJECTED');
  assert.equal(rosterJobs.length, 0);
});

test('any current organization admin can finalize even when they submitted on behalf of staff', async () => {
  enableSwapAdmins();
  const secondAdmin = { ...admin, id: 5, email: 'admin2@example.test' };
  const lateAdmin = { ...admin, id: 6, email: 'admin3@example.test' };
  const originalFindFirst = prisma.user.findFirst;
  prisma.user.findFirst = async args => [admin, secondAdmin, lateAdmin].find(account => account.id === args.where.id) || originalFindFirst(args);
  assert.equal((await invoke(workflow.createStaffRequest, 4, swap, {}, 5, 'ADMIN')).code, 201);
  assert.equal((await invoke(workflow.updateStaffRequest, 2, { status: 'APPROVED' })).code, 200);
  enableSwapAdmins([admin, secondAdmin, lateAdmin]);
  for (const account of [admin, secondAdmin, lateAdmin]) {
    const inbox = await invoke(workflow.getStaffRequests, account.id, {}, {}, 5, 'ADMIN');
    assert.equal(inbox.body.data[0].can_review, true);
    const detail = await invoke(workflow.getStaffRequestById, account.id, {}, {}, 5, 'ADMIN');
    assert.equal(detail.body.data.can_review, true);
  }
  assert.equal((await invoke(workflow.updateStaffRequest, 6, { status: 'APPROVED' }, {}, 6, 'ADMIN')).code, 403);
  assert.equal((await invoke(workflow.updateStaffRequest, 6, { status: 'APPROVED' }, {}, 5, 'ADMIN')).code, 200);
  assert.equal(rosterJobs.length, 1);
});

test('a final admin cannot approve their own staff swap', async () => {
  enableSwapAdmins();
  await invoke(workflow.createStaffRequest, 1, swap);
  await invoke(workflow.updateStaffRequest, 2, { status: 'APPROVED' });
  prisma.user.findMany = async () => [{ ...accounts[0], role: { name: 'ADMIN' } }, admin];
  assert.equal((await invoke(workflow.updateStaffRequest, 1, { status: 'APPROVED' }, {}, 5, 'ADMIN')).code, 403);
  assert.equal(rosterJobs.length, 0);
});

test('final approval fails clearly without assigned pools and keeps the request pending', async () => {
  enableSwapAdmins();
  await invoke(workflow.createStaffRequest, 1, swap);
  await invoke(workflow.updateStaffRequest, 2, { status: 'APPROVED' });
  prisma.staff.findMany = async () => members.map(member => ({ ...member, pool_assignments: [] }));
  const response = await invoke(workflow.updateStaffRequest, 4, { status: 'APPROVED' }, {}, 5, 'ADMIN');
  assert.equal(response.code, 400);
  assert.match(response.body.error, /resource pool/);
  assert.equal(requests[0].status, 'PENDING');
  assert.equal(rosterJobs.length, 0);
});
test('pending legacy colleague-stage swaps now route to the supervisor first', async () => {
  enableSwapAdmins();
  await invoke(workflow.createStaffRequest, 1, swap);
  requests[0].metadata.stage = 'COLLEAGUE';
  requests[0].metadata.target_user_ids = [3];
  assert.equal((await invoke(workflow.getStaffRequests, 3)).body.data[0].can_review, false);
  assert.equal((await invoke(workflow.updateStaffRequest, 3, { status: 'APPROVED' })).code, 403);
  assert.equal((await invoke(workflow.updateStaffRequest, 2, { status: 'APPROVED' })).code, 200);
  assert.equal(requests[0].metadata.stage, 'ADMIN');
});

test('a concurrent stage transition cannot overwrite the current approval stage', async () => {
  enableSwapAdmins();
  await invoke(workflow.createStaffRequest, 1, swap);
  const update = prisma.leaveShiftRequest.updateMany;
  prisma.leaveShiftRequest.updateMany = async args => {
    requests[0].metadata = { ...requests[0].metadata, stage: 'ADMIN' };
    return update(args);
  };
  assert.equal((await invoke(workflow.updateStaffRequest, 2, { status: 'APPROVED' })).code, 409);
});

test('swap submission fails explicitly when no final admin reviewer exists', async () => {
  const response = await invoke(workflow.createStaffRequest, 1, swap);
  assert.equal(response.code, 400);
  assert.match(response.body.error, /hospital admin/);
  assert.equal(requests.length, 0);
});

test('pending swaps follow a reassigned supervisor instead of stale routing metadata', async () => {
  enableSwapAdmins();
  await invoke(workflow.createStaffRequest, 1, swap);
  const originalSupervisor = members[0].supervisor;
  members[0].supervisor = accounts[2].email;
  try {
    assert.equal((await invoke(workflow.getStaffRequests, 2)).body.data[0].can_review, false);
    assert.equal((await invoke(workflow.getStaffRequests, 3)).body.data[0].can_review, true);
    assert.equal((await invoke(workflow.updateStaffRequest, 2, { status: 'APPROVED' })).code, 403);
    assert.equal((await invoke(workflow.updateStaffRequest, 3, { status: 'APPROVED' })).code, 200);
  } finally {
    members[0].supervisor = originalSupervisor;
  }
});