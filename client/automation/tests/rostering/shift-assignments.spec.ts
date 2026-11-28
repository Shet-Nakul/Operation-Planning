// spec: specs/Rostering.md – 4. Open a Result Cell and Verify the Assigned People
// seed: tests/seed.spec.ts
import { test, expect } from '../../fixtures/test-fixtures';
import { changeDemandAndWaitForRoster } from '../../fixtures/rostering-flows';
import { DAYS, SHIFTS, demandChange } from '../../test-data/rostering';

test.describe('Open a Result Cell and Verify the Assigned People', () => {
  test('The drawer matches the clicked day and shift', async ({ originalDemandBaseline, poolDetailsPage: pool, weeklyDemandPage }) => {
    test.setTimeout(8 * 60_000);
    expect(originalDemandBaseline).toHaveLength(SHIFTS.length);
    await changeDemandAndWaitForRoster(pool, weeklyDemandPage, demandChange);
    const weekDates = await pool.currentWeekDates();
    const cell = await pool.readScheduleCell(demandChange.shift, demandChange.day);

    // 1. After rostering completes, click the Late / Wed cell
    await pool.openShift(demandChange.shift, demandChange.day);

    expect(await pool.readShiftDrawerHeading()).toBe(`${demandChange.shift} — ${weekDates[DAYS.indexOf(demandChange.day)]}`);
    await expect(pool.shiftDrawer.getByText('Assigned staff for this shift.')).toBeVisible();
    const staff = await pool.readAssignedStaff();
    expect(staff).toHaveLength(cell.assigned ?? 0);
    for (const person of staff) {
      expect(person.name).not.toBe('');
      expect(person.staffId).toMatch(/^STAFF-/);
    }

    await pool.closeShiftDrawer();
    await expect(pool.shiftDrawerHeading).toBeHidden();
  });

  test('Check the drawer for several cells', async ({ openOrNursingPool: pool }) => {
    const weekDates = await pool.currentWeekDates();

    // 1. For each clickable cell in the current week (skip "— No data"), open the drawer and compare counts
    for (const cell of await pool.readScheduleGrid()) {
      if (cell.assigned === null) continue;
      const label = `${cell.shift} / ${cell.day}`;

      await pool.openShift(cell.shift, cell.day);

      expect(await pool.readShiftDrawerHeading(), label).toBe(`${cell.shift} — ${weekDates[DAYS.indexOf(cell.day)]}`);
      if (cell.assigned === 0) {
        await expect(pool.shiftDrawerEmptyMessage, label).toBeVisible();
      }
      await expect(pool.shiftDrawerStaffButtons, label).toHaveCount(cell.assigned);
      await pool.closeShiftDrawer();
    }
  });

  test('A zero-assignment cell', async ({ openOrNursingPool: pool }) => {
    const empty = (await pool.readScheduleGrid()).find((c) => c.assigned === 0);
    test.skip(!empty, 'No 0/x cell in the current week');

    // 1. Click a 0/0 cell (e.g. Late / Tue)
    await pool.openShift(empty!.shift, empty!.day);

    await expect(pool.shiftDrawerEmptyMessage).toBeVisible();
    await expect(pool.shiftDrawerStaffButtons).toHaveCount(0);
    await pool.closeShiftDrawer();
  });
});
