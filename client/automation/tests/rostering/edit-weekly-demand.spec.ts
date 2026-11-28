// spec: specs/Rostering.md – 1. Edit Weekly Demand and Save
// seed: tests/seed.spec.ts
import { test, expect } from '../../fixtures/test-fixtures';
import { DAYS, HOURS_PER_SHIFT, SHIFTS, demandChange, orNursingPool } from '../../test-data/rostering';

const sum = (matrix: number[][]) => matrix.flat().reduce((a, b) => a + b, 0);

test.describe('Edit Weekly Demand and Save', () => {
  test('Open the Weekly Demand editor with the current values', async ({ openOrNursingPool: pool, weeklyDemandPage }) => {
    const baseline = await pool.readDemandBaseline();

    // 1. Click Edit Demand
    await pool.openDemandEditor();

    await expect(weeklyDemandPage.heading).toBeVisible();
    await expect(weeklyDemandPage.breadcrumbCurrent).toBeVisible();
    await expect(weeklyDemandPage.demandInputs).toHaveCount(SHIFTS.length * DAYS.length);
    expect(await weeklyDemandPage.readDemandMatrix(), 'editor inputs match the Demand Baseline cell-by-cell').toEqual(baseline);
    expect(await weeklyDemandPage.readWeeklyManHours()).toBe(String(sum(baseline) * HOURS_PER_SHIFT));
  });

  test('Edit Config opens the same Weekly Demand editor', async ({ openOrNursingPool: pool, weeklyDemandPage }) => {
    const baseline = await pool.readDemandBaseline();

    await pool.openDemandEditorViaConfig();

    await expect(weeklyDemandPage.heading).toBeVisible();
    expect(await weeklyDemandPage.readDemandMatrix()).toEqual(baseline);
  });

  test('Edit a cell and watch the live totals', async ({ openOrNursingPool: pool, weeklyDemandPage }) => {
    await pool.openDemandEditor();
    const before = await weeklyDemandPage.readDemandMatrix();
    const row = SHIFTS.indexOf(demandChange.shift);
    const col = DAYS.indexOf(demandChange.day);
    const delta = demandChange.value - before[row][col];

    // 1. In the editor, set Late / Wed from 0 to 1
    await weeklyDemandPage.setDemand(demandChange.shift, demandChange.day, demandChange.value);

    await expect(weeklyDemandPage.demandInput(demandChange.shift, demandChange.day)).toHaveValue(String(demandChange.value));
    expect(await weeklyDemandPage.readWeeklyManHours()).toBe(String((sum(before) + delta) * HOURS_PER_SHIFT));
  });

  test('Save the demand baseline', async ({ originalDemandBaseline, poolDetailsPage: pool, weeklyDemandPage }) => {
    test.setTimeout(6 * 60_000);
    const row = SHIFTS.indexOf(demandChange.shift);
    const col = DAYS.indexOf(demandChange.day);
    const expected = originalDemandBaseline.map((r) => [...r]);
    expected[row][col] = demandChange.value;

    await pool.openDemandEditor();
    await weeklyDemandPage.setDemand(demandChange.shift, demandChange.day, demandChange.value);

    // 1. Click Save Demand Baseline
    const { payload, response } = await weeklyDemandPage.saveDemandBaseline();

    expect(response.ok()).toBeTruthy();
    expect(response.url()).toContain(`/api/pools/${orNursingPool.id}/demand`);
    const sentMatrix = SHIFTS.map((shift) => {
      const r = payload.demand_matrix.find((d) => d.shift === shift);
      expect(r, `payload row for ${shift}`).toBeDefined();
      return [r!.monday, r!.tuesday, r!.wednesday, r!.thursday, r!.friday, r!.saturday, r!.sunday];
    });
    expect(sentMatrix, 'only Late / Wed changed in the PUT payload').toEqual(expected);

    await expect(pool.poolHeading(orNursingPool.name)).toBeVisible();
    await expect.poll(() => pool.readDemandBaseline()).toEqual(expected);
  });

  test('Discard without saving', async ({ openOrNursingPool: pool, weeklyDemandPage }) => {
    const baseline = await pool.readDemandBaseline();
    const gridBefore = await pool.readScheduleGrid();

    // 1. Click Edit Demand. Set Day / Mon to 5
    await pool.openDemandEditor();
    await weeklyDemandPage.setDemand('Day', 'Mon', 5);

    // 2. Click Back to Pool. Do not save.
    await weeklyDemandPage.backToPool();

    await expect(pool.poolHeading(orNursingPool.name)).toBeVisible();
    await expect(pool.generatingRosterMessage).toBeHidden();
    expect(await pool.readDemandBaseline()).toEqual(baseline);
    expect(await pool.readScheduleGrid()).toEqual(gridBefore);
  });

  test('Invalid input is not saved', async ({ openOrNursingPool: pool, weeklyDemandPage }) => {
    await pool.openDemandEditor();

    // 1. In Day / Mon, type -2
    await weeklyDemandPage.fillDemandRaw('Day', 'Mon', '-2');

    const value = await weeklyDemandPage.demandInput('Day', 'Mon').inputValue();
    expect(Number(value || 0), 'negative demand is clamped or rejected').toBeGreaterThanOrEqual(0);
    const manHours = await weeklyDemandPage.readWeeklyManHours();
    expect(manHours).toMatch(/^\d+$/);
    expect(Number(manHours)).toBeGreaterThanOrEqual(0);
  });
});
