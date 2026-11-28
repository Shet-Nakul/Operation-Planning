import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { PoolDirectoryPage } from '../pages/PoolDirectoryPage';
import { PoolDetailsPage } from '../pages/PoolDetailsPage';
import { WeeklyDemandPage } from '../pages/WeeklyDemandPage';
import { StaffProfilePage } from '../pages/StaffProfilePage';
import { credentials, orNursingPool, ROSTERING_TIMEOUT_MS } from '../test-data/rostering';

type PageObjects = {
  loginPage: LoginPage;
  poolDirectoryPage: PoolDirectoryPage;
  poolDetailsPage: PoolDetailsPage;
  weeklyDemandPage: WeeklyDemandPage;
  staffProfilePage: StaffProfilePage;
};

type Scenarios = {
  /** Common Setup: signed in as admin with the OR Nursing Pool details page open. */
  openOrNursingPool: PoolDetailsPage;
  /**
   * Captures the Demand Baseline before the test and, after it, restores it (and waits
   * for the solver) if the test changed it. Use in every scenario that saves demand.
   */
  originalDemandBaseline: number[][];
};

export const test = base.extend<PageObjects & Scenarios>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  poolDirectoryPage: async ({ page }, use) => use(new PoolDirectoryPage(page)),
  poolDetailsPage: async ({ page }, use) => use(new PoolDetailsPage(page)),
  weeklyDemandPage: async ({ page }, use) => use(new WeeklyDemandPage(page)),
  staffProfilePage: async ({ page }, use) => use(new StaffProfilePage(page)),

  openOrNursingPool: async ({ loginPage, poolDirectoryPage, poolDetailsPage }, use) => {
    await loginPage.goto();
    await loginPage.login(credentials.admin.email, credentials.admin.password);
    await poolDirectoryPage.goToHumanResourcePool();
    await expect(poolDirectoryPage.heading).toBeVisible();
    await poolDirectoryPage.openPool(orNursingPool.name);
    await expect(poolDetailsPage.poolHeading(orNursingPool.name)).toBeVisible();
    // A previous run may still be solving; start every scenario from a settled grid.
    await poolDetailsPage.waitForRosteringIdle(ROSTERING_TIMEOUT_MS);
    await use(poolDetailsPage);
  },

  originalDemandBaseline: [
    async ({ openOrNursingPool, poolDirectoryPage, weeklyDemandPage }, use) => {
      const poolDetails = openOrNursingPool;
      const original = await poolDetails.readDemandBaseline();

      await use(original);

      // Cleanup: return to the pool and restore the baseline if it was changed.
      await poolDetails.goToHumanResourcePool();
      await poolDirectoryPage.openPool(orNursingPool.name);
      await poolDetails.waitForRosteringIdle(ROSTERING_TIMEOUT_MS);
      const current = await poolDetails.readDemandBaseline();
      if (JSON.stringify(current) === JSON.stringify(original)) return;

      await poolDetails.openDemandEditor();
      await weeklyDemandPage.setDemandMatrix(original);
      await weeklyDemandPage.saveDemandBaseline();
      await poolDetails.waitForRosteringToComplete(ROSTERING_TIMEOUT_MS);
      expect(await poolDetails.readDemandBaseline(), 'demand baseline restored').toEqual(original);
    },
    { timeout: 2 * ROSTERING_TIMEOUT_MS },
  ],
});

export { expect };
