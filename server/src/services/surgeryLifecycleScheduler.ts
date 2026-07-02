import prisma from '../models/prisma';
import logger from '../config/logger';
import { computeSurgeryDurationMinutes, parseUtcDateTime } from '../utils/surgeryStatus';

let tickInFlight = false;

// Advances PLANNED surgeries to IN_PROGRESS (when planned_start has arrived) and IN_PROGRESS
// surgeries to DONE (when planned_start + total stage duration has elapsed).
// Surgeries with no resolvable duration (empty stages) reach IN_PROGRESS but never auto-complete.
// Accepts an optional `now` override for direct testing without waiting for the real interval.
export async function runSurgeryLifecycleTransitions(now: Date = new Date()): Promise<void> {
  const candidates = await prisma.surgery.findMany({
    where: { status: { in: ['PLANNED', 'IN_PROGRESS'] } },
  });

  for (const surgery of candidates) {
    const timeWindows = (surgery.time_windows as any) || {};
    const plannedStart = parseUtcDateTime(timeWindows.planned_start);
    if (!plannedStart) continue;

    if (surgery.status === 'PLANNED') {
      if (now >= plannedStart) {
        await prisma.surgery.update({ where: { id: surgery.id }, data: { status: 'IN_PROGRESS' } });
        logger.info(`Surgery ${surgery.surgery_id}: PLANNED → IN_PROGRESS`);
      }
      // Re-check DONE on a later tick, once it's actually IN_PROGRESS
      continue;
    }

    if (surgery.status === 'IN_PROGRESS') {
      const durationMinutes = computeSurgeryDurationMinutes(surgery.stages);
      if (durationMinutes <= 0) continue; // no resolvable duration → never auto-completes
      const completionTime = new Date(plannedStart.getTime() + durationMinutes * 60_000);
      if (now >= completionTime) {
        await prisma.surgery.update({ where: { id: surgery.id }, data: { status: 'DONE' } });
        logger.info(`Surgery ${surgery.surgery_id}: IN_PROGRESS → DONE`);
      }
    }
  }
}

async function tick(): Promise<void> {
  if (tickInFlight) return;
  tickInFlight = true;
  try {
    await runSurgeryLifecycleTransitions();
  } finally {
    tickInFlight = false;
  }
}

// Checks every `intervalMs` (default 60s) for PLANNED and IN_PROGRESS surgeries whose
// scheduled window has been reached or exceeded, and advances their status accordingly.
export function startSurgeryLifecycleScheduler(intervalMs = 60000): void {
  setInterval(() => {
    tick().catch(err => logger.error('Surgery lifecycle scheduler tick failed', err));
  }, intervalMs);

  logger.info(`Surgery lifecycle scheduler started (checks every ${intervalMs / 1000}s for PLANNED→IN_PROGRESS→DONE transitions)`);
}
