import logger from '../config/logger';
import { triggerProcess, getProcessState, registerSchedulingCompletionHook } from './schedulingProcessManager';

// Per-organization count of pending changes (Contract/Staff/ResourcePool create-update-delete)
// that have arrived since the last completed rostering run.
const dirtyCounters = new Map<number, number>();

export function markSchedulingDirty(organizationId: number): void {
  dirtyCounters.set(organizationId, (dirtyCounters.get(organizationId) || 0) + 1);
}

async function startIfDue(): Promise<void> {
  if (getProcessState().running) return;

  const dueEntry = [...dirtyCounters.entries()].find(([, count]) => count > 0);
  if (!dueEntry) return;

  const [organizationId] = dueEntry;
  logger.info(`Auto-triggering rostering for organization ${organizationId} (${dirtyCounters.get(organizationId)} pending change(s))`);

  const result = await triggerProcess(organizationId, { triggerDate: new Date() });
  if (!result.success) {
    logger.warn(`Auto-trigger: rostering for organization ${organizationId} did not start: ${result.message}`);
  }
}

// Called by schedulingProcessManager when a run fully completes or fails.
// Resets the counter for that org, then immediately checks if further changes
// accumulated during the run and kicks off the next run if needed.
function onSchedulingComplete(organizationId: number, success: boolean): void {
  logger.info(`Rostering run for organization ${organizationId} finished (success=${success}) — resetting counter`);
  dirtyCounters.set(organizationId, 0);

  startIfDue().catch(err => logger.error('Follow-up rostering trigger failed', err));
}

// Checks every `intervalMs` (default 10s) as a safety net in case the completion hook
// misses anything or changes arrive while no run is in progress.
export function startSchedulingAutoTrigger(intervalMs = 10000): void {
  registerSchedulingCompletionHook(onSchedulingComplete);

  setInterval(() => {
    startIfDue().catch(err => logger.error('Rostering auto-trigger tick failed', err));
  }, intervalMs);

  logger.info(`Rostering auto-trigger started (checks every ${intervalMs / 1000}s)`);
}
