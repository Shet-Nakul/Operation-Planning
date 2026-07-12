import logger from '../config/logger';
import { triggerSurgeryPlanning, getPlanningProcessState, registerPlanningCompletionHook } from './planningProcessManager';

// Per-organization count of pending changes (Surgery/ResourcePool/Staff create-update-delete,
// GlobalSettings update) that have arrived since the last completed planning run.
const dirtyCounters = new Map<number, number>();

// Call after any successful create/update/delete of Surgery, ResourcePool, Staff, or GlobalSettings.
export function markPlanningDirty(organizationId: number): void {
  dirtyCounters.set(organizationId, (dirtyCounters.get(organizationId) || 0) + 1);
}

// Starts planning for the first org with pending changes.  Never starts if a run is in progress.
async function startIfDue(): Promise<void> {
  if (getPlanningProcessState().running) return;

  const dueEntry = [...dirtyCounters.entries()].find(([, count]) => count > 0);
  if (!dueEntry) return;

  const [organizationId] = dueEntry;
  logger.info(`Auto-triggering surgery planning for organization ${organizationId} (${dirtyCounters.get(organizationId)} pending change(s))`);

  const result = await triggerSurgeryPlanning(organizationId);
  if (!result.success) {
    // If it failed to start (race condition or already running), leave counter intact for next tick.
    logger.warn(`Auto-trigger: planning for organization ${organizationId} did not start: ${result.message}`);
  }
}

// Called by planningProcessManager when a run fully completes or fails.
// Resets the counter for that org ONLY now (result received), then immediately checks if
// further changes accumulated during the run and kicks off the next run if needed.
function onPlanningComplete(organizationId: number, success: boolean): void {
  logger.info(`Planning run for organization ${organizationId} finished (success=${success}) — resetting counter`);
  dirtyCounters.set(organizationId, 0);

  // Any org that accumulated changes while this run was in progress should be processed next.
  startIfDue().catch(err => logger.error('Follow-up planning trigger failed', err));
}

// Checks every `intervalMs` (default 10s) as a safety net in case the completion hook
// misses anything or changes arrive while no run is in progress.
export function startPlanningAutoTrigger(intervalMs = 10000): void {
  registerPlanningCompletionHook(onPlanningComplete);

  setInterval(() => {
    startIfDue().catch(err => logger.error('Planning auto-trigger tick failed', err));
  }, intervalMs);

  logger.info(`Planning auto-trigger started (checks every ${intervalMs / 1000}s; next run only starts after current run gives a result)`);
}
