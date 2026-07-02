import logger from '../config/logger';
import { triggerSurgeryPlanning, getPlanningProcessState } from './planningProcessManager';

// Per-organization count of pending changes (Surgery/ResourcePool/Staff create-update-delete,
// GlobalSettings update) since planning last started for that org.
const dirtyCounters = new Map<number, number>();

let tickInFlight = false;

// Call after any successful create/update/delete of Surgery, ResourcePool, or Staff, or after a
// GlobalSettings update, for the affected organization.
export function markPlanningDirty(organizationId: number): void {
  dirtyCounters.set(organizationId, (dirtyCounters.get(organizationId) || 0) + 1);
}

async function tick(): Promise<void> {
  if (tickInFlight) return;
  tickInFlight = true;

  try {
    if (getPlanningProcessState().running) return;

    const dueEntry = [...dirtyCounters.entries()].find(([, count]) => count > 0);
    if (!dueEntry) return;

    const [organizationId] = dueEntry;
    // Reset before starting, so changes that land while this run is in flight count toward the next run.
    dirtyCounters.set(organizationId, 0);

    logger.info(`Auto-triggering surgery planning for organization ${organizationId} (pending changes detected)`);
    const result = await triggerSurgeryPlanning(organizationId);
    if (!result.success) {
      logger.warn(`Auto-triggered surgery planning for organization ${organizationId} did not start: ${result.message}`);
    }
  } finally {
    tickInFlight = false;
  }
}

// Checks every `intervalMs` (default 5s) for organizations with pending changes and triggers
// planning for one of them if nothing is currently running.
export function startPlanningAutoTrigger(intervalMs = 5000): void {
  setInterval(() => {
    tick().catch(err => logger.error('Planning auto-trigger tick failed', err));
  }, intervalMs);

  logger.info(`Planning auto-trigger started (checks every ${intervalMs / 1000}s for pending changes)`);
}
