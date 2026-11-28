import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getUpcomingEmployeeShifts, mergeEmployeeRosterings, type ServerRosteringRow } from '../src/services/api-rosterings';

test('merges roster horizons in creation order and filters off days', () => {
  const rows: ServerRosteringRow[] = [
    { id: 2, organization_id: 42, year: 2026, month: 11, created_at: '2026-11-02T00:00:00Z', employee_centric: { 'E-7': { '2026-11-26': { shift: 'N', pool: 'B' }, '2026-11-27': { shift: 'OFF' } } } },
    { id: 1, organization_id: 42, year: 2026, month: 11, created_at: '2026-11-01T00:00:00Z', employee_centric: { 'E-7': { '2026-11-26': { shift: 'D', pool: 'A' }, '2026-11-25': { shift: 'D', pool: 'A' } } } },
  ];
  assert.deepEqual(getUpcomingEmployeeShifts(mergeEmployeeRosterings(rows, '#E-7'), '2026-11-26'), [
    { date: '2026-11-26', shift: 'N', pool: 'B' },
  ]);
});
