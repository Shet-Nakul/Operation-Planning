import { type PoolDetailsPage } from '../pages/PoolDetailsPage';
import { type SaveDemandResult, type WeeklyDemandPage } from '../pages/WeeklyDemandPage';
import { ROSTERING_TIMEOUT_MS, type Day, type Shift } from '../test-data/rostering';

/**
 * Multi-page flow reused by rostering scenarios: open the demand editor, change one
 * cell, save, and wait until the solver has regenerated the pool roster.
 */
export async function changeDemandAndWaitForRoster(
  pool: PoolDetailsPage,
  editor: WeeklyDemandPage,
  change: { shift: Shift; day: Day; value: number },
): Promise<SaveDemandResult> {
  await pool.openDemandEditor();
  await editor.setDemand(change.shift, change.day, change.value);
  const result = await editor.saveDemandBaseline();
  await pool.waitForRosteringToComplete(ROSTERING_TIMEOUT_MS);
  return result;
}
