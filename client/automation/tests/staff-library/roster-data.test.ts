import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeEmployeeRosterings, getUpcomingEmployeeShifts, type ServerRosteringRow } from '../../../src/services/api-rosterings';

test('merges all roster horizons and uses the most recent overlapping assignment', () => {
  const rows: ServerRosteringRow[] = [
    { id: 2, organization_id: 1, year: 2026, month: 10, created_at: '2026-10-02T12:00:00Z', employee_centric: { 'STAFF-001': { '2026-10-11': { shift: 'L', pool: 'POOL-2' }, '2026-11-01': { shift: 'N', pool: 'POOL-2' } } } },
    { id: 1, organization_id: 1, year: 2026, month: 9, created_at: '2026-10-01T12:00:00Z', employee_centric: { 'STAFF-001': { '2026-10-10': { shift: 'D', pool: 'POOL-1' }, '2026-10-11': { shift: 'D', pool: 'POOL-1' } }, 'STAFF-002': { '2026-10-11': { shift: 'E' } } } },
  ];
  const merged = mergeEmployeeRosterings(rows, '#STAFF-001');
  assert.equal(merged['2026-10-10'].shift, 'D');
  assert.equal(merged['2026-10-11'].shift, 'L');
  assert.equal(merged['2026-11-01'].shift, 'N');
  assert.equal(rows[0].id, 2);
});

test('upcoming shifts are sorted and exclude past dates, off days, leave, and empty assignments', () => {
  const upcoming = getUpcomingEmployeeShifts({
    '2026-10-15': { shift: 'N', pool: 'POOL-1' },
    '2026-10-10': { shift: 'D' },
    '2026-10-11': { shift: 'E', pool: 'POOL-2' },
    '2026-10-12': { shift: 'O' },
    '2026-10-13': { shift: 'V' },
    '2026-10-14': {},
    '2026-10-16': { shift: 'Off' },
  }, '2026-10-11');
  assert.deepEqual(upcoming.map(shift => shift.date), ['2026-10-11', '2026-10-15']);
  assert.equal(upcoming[0].pool, 'POOL-2');
});

test('missing staff and empty rosters do not manufacture shifts', () => {
  const merged = mergeEmployeeRosterings([{ id: 1, organization_id: 1, year: 2026, month: 10, employee_centric: { OTHER: { '2026-10-11': { shift: 'D' } } } }], 'MISSING');
  assert.deepEqual(merged, {});
  assert.deepEqual(getUpcomingEmployeeShifts(merged, '2026-10-11'), []);
});