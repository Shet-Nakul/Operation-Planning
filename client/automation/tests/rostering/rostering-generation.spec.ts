// spec: specs/Rostering.md – 2. Wait for Rostering to Complete
// seed: tests/seed.spec.ts
import { test, expect } from '../../fixtures/test-fixtures';
import { ROSTERING_TIMEOUT_MS, demandChange, orNursingPool } from '../../test-data/rostering';

test.describe('Wait for Rostering to Complete', () => {
  test.describe.configure({ timeout: 8 * 60_000 });

  test('The rostering loading state appears and then clears', async ({
    originalDemandBaseline,
    poolDetailsPage: pool,
    weeklyDemandPage,
  }) => {
    expect(originalDemandBaseline).toHaveLength(4);
    const weekBefore = await pool.readWeekRange();

    // 1. Perform 1.2 and 1.3 (edit Late / Wed and save)
    await pool.openDemandEditor();
    await weeklyDemandPage.setDemand(demandChange.shift, demandChange.day, demandChange.value);
    await weeklyDemandPage.saveDemandBaseline();

    // 2. Right after returning to the pool page, check the Schedule Output section
    await expect(pool.poolHeading(orNursingPool.name)).toBeVisible();
    await expect(pool.generatingRosterMessage).toBeVisible();
    await expect(pool.generatingRosterDetail).toBeVisible();
    await expect(pool.scheduleTable).toBeHidden();

    // 3. Wait for the loading message to disappear (timeout 240 s)
    await expect(pool.generatingRosterMessage).toBeHidden({ timeout: ROSTERING_TIMEOUT_MS });

    await expect(pool.currentWeekPlanningHeading).toBeVisible();
    await expect(pool.scheduleTable).toBeVisible();
    expect(await pool.readWeekRange()).toBe(weekBefore);
    await expect(pool.errorMessage).toHaveCount(0);
  });

  test('Navigating away during rostering', async ({
    page,
    originalDemandBaseline,
    poolDetailsPage: pool,
    poolDirectoryPage,
    weeklyDemandPage,
  }) => {
    expect(originalDemandBaseline).toHaveLength(4);
    await pool.openDemandEditor();
    await weeklyDemandPage.setDemand(demandChange.shift, demandChange.day, demandChange.value);
    await weeklyDemandPage.saveDemandBaseline();
    await expect(pool.generatingRosterMessage).toBeVisible();

    // 1. While "Generating…" is shown, click Resource Pools, wait ~10 s, and open OR Nursing Pool again
    await pool.resourcePoolsBreadcrumb.click();
    await expect(poolDirectoryPage.heading).toBeVisible();
    // The plan explicitly asks to stay away for ~10 s while the solver keeps running.
    await page.waitForTimeout(10_000);
    await poolDirectoryPage.openPool(orNursingPool.name);

    await expect(pool.poolHeading(orNursingPool.name)).toBeVisible();
    // Either still generating (grid hidden) or the finished grid – never a partial grid.
    await expect(pool.generatingRosterMessage.or(pool.scheduleTable)).toBeVisible();
    if (await pool.generatingRosterMessage.isVisible()) {
      await expect(pool.scheduleTable).toBeHidden();
    }
    await expect(pool.generatingRosterMessage).toBeHidden({ timeout: ROSTERING_TIMEOUT_MS });
    await expect(pool.scheduleTable).toBeVisible();
    const lateWed = await pool.readScheduleCell(demandChange.shift, demandChange.day);
    expect(lateWed.required).toBe(demandChange.value);
  });
});
