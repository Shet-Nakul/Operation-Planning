import type { SurgeryRequestRecord, SurgeryRequestStatus } from '../types/surgery';

export type ControlLane = 'ongoing' | 'awaiting_complete' | 'today' | 'backlog' | 'history' | 'hidden';

function parseDurationToMinutes(duration: string): number {
  let total = 0;
  const dayMatch = duration.match(/(\d+)\s*day/);
  const hourMatch = duration.match(/(\d+)\s*hr/);
  const minMatch = duration.match(/(\d+)\s*min/);
  if (dayMatch) total += parseInt(dayMatch[1], 10) * 24 * 60;
  if (hourMatch) total += parseInt(hourMatch[1], 10) * 60;
  if (minMatch) total += parseInt(minMatch[1], 10);
  return total;
}

export function parseSolverDate(value?: string | null): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function totalSurgeryDurationMinutes(record: SurgeryRequestRecord): number {
  const phases = record.data.phases;
  const fromPhases = (['preOp', 'operative', 'postOp', 'sterilization', 'recovery'] as const).reduce(
    (acc, key) => acc + parseDurationToMinutes(phases[key]?.duration ?? ''),
    0,
  );
  if (fromPhases > 0) return fromPhases;
  return 90;
}

export function getPlannedStart(record: SurgeryRequestRecord): Date | null {
  return parseSolverDate(
    (record.planResult?.result?.planned_start as string | undefined) ||
      record.data.plannedStart,
  );
}

export function getExpectedEnd(record: SurgeryRequestRecord): Date | null {
  const start = getPlannedStart(record);
  if (!start) return null;
  return new Date(start.getTime() + totalSurgeryDurationMinutes(record) * 60_000);
}

export function formatDurationLabel(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h <= 0) return `${m} min`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function formatElapsedLabel(from: Date, to: Date): string {
  return formatDurationLabel((to.getTime() - from.getTime()) / 60_000);
}

export function sameCalendarDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function calendarDayBounds(day: Date): { start: Date; end: Date } {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/** True when the surgery's planned window falls on this calendar day. */
export function occursOnCalendarDay(record: SurgeryRequestRecord, day: Date): boolean {
  const start = getPlannedStart(record);
  if (!start) return false;
  if (sameCalendarDay(start, day)) return true;
  const end = getExpectedEnd(record);
  if (!end) return false;
  const bounds = calendarDayBounds(day);
  return start.getTime() <= bounds.end.getTime() && end.getTime() >= bounds.start.getTime();
}

export function classifySurgeryLane(record: SurgeryRequestRecord, now: Date): ControlLane {
  if (record.status === 'DONE') return 'history';
  if (record.status === 'CANCELLED') return 'hidden';
  if (record.status === 'DRAFT' || record.status === 'ESTIMATED' || record.status === 'PLANNING') {
    return 'backlog';
  }

  const start = getPlannedStart(record);
  const end = getExpectedEnd(record);

  if (record.status === 'IN_PROGRESS' || record.status === 'PLANNED') {
    if (start && end) {
      if (now.getTime() >= end.getTime()) {
        return occursOnCalendarDay(record, now) ? 'awaiting_complete' : 'backlog';
      }
      if (now.getTime() >= start.getTime()) return 'ongoing';
      if (sameCalendarDay(start, now)) return 'today';
      return 'backlog';
    }
    if (record.status === 'IN_PROGRESS') return 'ongoing';
    return 'backlog';
  }

  return 'hidden';
}

/**
 * A surgery is considered "started" once it is marked IN_PROGRESS/DONE, or once
 * a scheduled (PLANNED) case has reached its planned start time. Started cases
 * are locked for editing and their resources remain reserved until completion.
 */
export function isSurgeryStarted(record: SurgeryRequestRecord, now: Date): boolean {
  if (record.status === 'IN_PROGRESS' || record.status === 'DONE') return true;
  if (record.status === 'PLANNED') {
    const start = getPlannedStart(record);
    return Boolean(start && now.getTime() >= start.getTime());
  }
  return false;
}

/**
 * True only while the operation is actively happening, i.e. now is within the
 * planned window [start, end). A scheduled case whose window has fully elapsed
 * is NOT in progress — it is awaiting completion and handled separately.
 */
export function isSurgeryInProgress(record: SurgeryRequestRecord, now: Date): boolean {
  if (record.status !== 'PLANNED' && record.status !== 'IN_PROGRESS') return false;
  const start = getPlannedStart(record);
  if (!start || now.getTime() < start.getTime()) return false;
  const end = getExpectedEnd(record);
  if (end && now.getTime() >= end.getTime()) return false;
  return true;
}

/**
 * Derives the status shown to the user. A scheduled case that is currently
 * within its planned window is surfaced as IN_PROGRESS ("started") even though
 * the stored status is still PLANNED, since lifecycle advancement is time-based
 * on the client. Once the window elapses it reverts to its stored status.
 */
export function getDisplaySurgeryStatus(record: SurgeryRequestRecord, now: Date): SurgeryRequestStatus {
  if (record.status === 'PLANNED' && isSurgeryInProgress(record, now)) return 'IN_PROGRESS';
  return record.status;
}

export function surgeryProgressPercent(record: SurgeryRequestRecord, now: Date): number {
  const start = getPlannedStart(record);
  const total = totalSurgeryDurationMinutes(record);
  if (!start || total <= 0) return record.runtime?.progress ?? 0;
  const elapsedMin = (now.getTime() - start.getTime()) / 60_000;
  return Math.max(0, Math.min(100, Math.round((elapsedMin / total) * 100)));
}
