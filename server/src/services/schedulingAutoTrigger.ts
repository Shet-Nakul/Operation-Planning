import logger from '../config/logger';
import { triggerProcess, getProcessState, registerSchedulingCompletionHook } from './schedulingProcessManager';

// Per-organization count of pending changes (Contract/Staff/ResourcePool create-update-delete)
// that have arrived since the last completed rostering run.
const dirtyCounters = new Map<number, number>();
type SwapRosteringJob = { organizationId: number; requestId: number; poolIds: string[]; startDate: string; endDate: string };
const swapJobs = new Map<number, SwapRosteringJob>();
let starting = false;
let activeRun: { organizationId: number; dirtyCount: number; requestIds: number[] } | null = null;

export function queueSwapRostering(job: SwapRosteringJob): void {
  if (!job.poolIds.length) throw new Error('Shift swap rostering requires at least one assigned pool');
  swapJobs.set(job.requestId, job);
  void startIfDue().catch(error => logger.error('Unable to start approved swap rostering; retained for retry', error));
}

export function markSchedulingDirty(organizationId: number): void {
  dirtyCounters.set(organizationId, (dirtyCounters.get(organizationId) || 0) + 1);
}

async function startIfDue(): Promise<void> {
  if (starting || getProcessState().running) return;

  const dueEntry = [...dirtyCounters.entries()].find(([, count]) => count > 0);
  const firstSwap = swapJobs.values().next().value;
  const organizationId = dueEntry?.[0] ?? firstSwap?.organizationId;
  if (organizationId === undefined) return;
  const jobs = [...swapJobs.values()].filter(job => job.organizationId === organizationId);
  const dirtyCount = dirtyCounters.get(organizationId) || 0;
  const startDates = [new Date(), ...jobs.map(job => new Date(`${job.startDate}T00:00:00Z`))];
  const triggerDate = new Date(Math.min(...startDates.map(date => date.getTime())));
  const endDate = jobs.length ? new Date(Math.max(...jobs.map(job => Date.parse(`${job.endDate}T00:00:00Z`)))) : undefined;
  activeRun = { organizationId, dirtyCount, requestIds: jobs.map(job => job.requestId) };
  starting = true;
  logger.info(`Auto-triggering rostering for organization ${organizationId}`, { dirtyCount, swapRequestIds: activeRun.requestIds });

  try {
    const result = await triggerProcess(organizationId, {
      triggerDate, endDate,
      ...(dirtyCount === 0 ? { poolIds: [...new Set(jobs.flatMap(job => job.poolIds))] } : {}),
    });
    if (!result.success) {
      activeRun = null;
      logger.warn(`Auto-trigger: rostering for organization ${organizationId} did not start; retained for retry: ${result.message}`);
    }
  } finally {
    starting = false;
  }
}

// Called by schedulingProcessManager when a run fully completes or fails.
// Consume only changes included in a successful run; retain failures for the next tick.
function onSchedulingComplete(organizationId: number, success: boolean): void {
  const completed = activeRun;
  activeRun = null;
  logger.info(`Rostering run for organization ${organizationId} finished (success=${success})`);
  if (!success || completed?.organizationId !== organizationId) return;
  dirtyCounters.set(organizationId, Math.max(0, (dirtyCounters.get(organizationId) || 0) - completed.dirtyCount));
  completed.requestIds.forEach(id => swapJobs.delete(id));
  void startIfDue().catch(err => logger.error('Follow-up rostering trigger failed', err));
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
