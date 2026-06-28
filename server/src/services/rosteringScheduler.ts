import cron from 'node-cron';
import prisma from '../models/prisma';
import logger from '../config/logger';
import { triggerProcess } from './schedulingProcessManager';

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

// Runs the rostering process for every organization whose GlobalSettings.schedule_date matches
// `now`'s day-of-month - clamped to the last day for short months (e.g. schedule_date=31 fires on
// Feb 28). triggerProcess itself builds the payload for *next* month's start_date.
export async function runDueScheduledRosterings(now: Date = new Date()): Promise<void> {
  const today = now.getUTCDate();
  const totalDays = daysInMonth(now.getUTCFullYear(), now.getUTCMonth());

  const allSettings = await prisma.globalSettings.findMany();
  const due = allSettings.filter(s => Math.min(s.schedule_date, totalDays) === today);

  for (const settings of due) {
    logger.info(`Scheduled rostering trigger due for organization ${settings.organization_id} (schedule_date=${settings.schedule_date})`);
    const result = await triggerProcess(settings.organization_id);
    if (!result.success) {
      logger.warn(`Scheduled rostering trigger for organization ${settings.organization_id} did not start: ${result.message}`);
    }
  }
}

// Daily check at 00:10 UTC against each organization's GlobalSettings.schedule_date.
export function startRosteringScheduler(): void {
  cron.schedule(
    '10 0 * * *',
    () => {
      runDueScheduledRosterings().catch(err => logger.error('Scheduled rostering run failed', err));
    },
    { timezone: 'UTC', noOverlap: true, name: 'monthly-rostering-trigger' }
  );

  logger.info('Rostering scheduler started (daily check at 00:10 UTC against GlobalSettings.schedule_date)');
}
