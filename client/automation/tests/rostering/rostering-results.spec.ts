// spec: specs/Rostering.md – 3. Verify the Rostering Results
// seed: tests/seed.spec.ts
import { test, expect } from '../../fixtures/test-fixtures';
import { changeDemandAndWaitForRoster } from '../../fixtures/rostering-flows';
import { DAYS, HOURS_PER_SHIFT, SHIFTS, demandChange } from '../../test-data/rostering';

test.describe('Verify the Rostering Results', () => {
  test.describe.configure({ timeout: 8 * 60_000 });

  test('Required values reflect the new demand', async ({ originalDemandBaseline, poolDetailsPage: pool, weeklyDemandPage }) => {
    const before = await pool.readScheduleCell(demandChange.shift, demandChange.day);
    expect(before.required).toBe(originalDemandBaseline[SHIFTS.indexOf(demandChange.shift)][DAYS.indexOf(demandChange.day)]);

    await changeDemandAndWaitForRoster(pool, weeklyDemandPage, demandChange);

    // 1. After rostering completes, read every cell of the Schedule Output grid
    const baseline = await pool.readDemandBaseline();
    for (const cell of await pool.readScheduleGrid()) {
      if (cell.required === null) continue; // "— No data"
      expect(cell.required, `${cell.shift} / ${cell.day} required`).toBe(baseline[SHIFTS.indexOf(cell.shift)][DAYS.indexOf(cell.day)]);
    }
    const changed = await pool.readScheduleCell(demandChange.shift, demandChange.day);
    expect(changed.required).toBe(demandChange.value);

    const totalDemand = baseline.flat().reduce((a, b) => a + b, 0);
    expect(await pool.readWeeklyCapacityHours()).toBe(totalDemand * HOURS_PER_SHIFT);
  });

  test('Coverage status is correct', async ({ openOrNursingPool: pool }) => {
    // 1. Check the status of each cell
    const cells = await pool.readScheduleGrid();
    expect(cells.some((c) => c.assigned !== null), 'grid has rostering data').toBeTruthy();

    for (const cell of cells) {
      if (cell.assigned === null || cell.required === null) {
        expect(cell.status, `${cell.shift} / ${cell.day}`).toContain('no data');
        continue;
      }
      if (cell.assigned >= cell.required) {
        expect(cell.status, `${cell.shift} / ${cell.day} ${cell.assigned}/${cell.required}`).toBe('fulfilled');
      } else {
        expect(cell.status, `${cell.shift} / ${cell.day} ${cell.assigned}/${cell.required}`).not.toBe('fulfilled');
        await expect(pool.alertsPanel).toContainText(cell.day);
      }
    }
  });

  test('Results also change for the following week', async ({ originalDemandBaseline, poolDetailsPage: pool, weeklyDemandPage }) => {
    expect(originalDemandBaseline).toHaveLength(SHIFTS.length);
    const currentWeek = await pool.readWeekRange();
    await changeDemandAndWaitForRoster(pool, weeklyDemandPage, demandChange);

    // 1. Click the next-week arrow
    await pool.goToNextWeek();

    const nextWeekDates = await pool.currentWeekDates();
    expect(await pool.readWeekRange()).not.toBe(currentWeek);
    expect(nextWeekDates).toHaveLength(7);
    const nextWeekCell = await pool.readScheduleCell(demandChange.shift, demandChange.day);
    expect(nextWeekCell.required, 'baseline applies from its effective date onward').toBe(demandChange.value);
    await expect(pool.previousWeekButton).toBeEnabled();

    await pool.goToPreviousWeek();
    expect(await pool.readWeekRange()).toBe(currentWeek);
    await expect(pool.previousWeekButton).toBeDisabled();
  });
});
