// Full lifecycle: DRAFT → ESTIMATED → PLANNING → PLANNED → IN_PROGRESS → DONE (or CANCELLED at any stage)
export const SURGERY_STATUSES = ['DRAFT', 'ESTIMATED', 'PLANNING', 'PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;
export type SurgeryStatus = typeof SURGERY_STATUSES[number];

// Total pipeline duration in minutes: the maximum `duration[1]` (end-offset) across every stage
// requirement in every stage array. Returns 0 if stages is empty/malformed - callers must treat
// 0 as "no resolvable duration" rather than "instantly done".
export function computeSurgeryDurationMinutes(stages: any): number {
  if (!stages || typeof stages !== 'object') return 0;
  let max = 0;
  for (const entries of Object.values(stages)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries as any[]) {
      const end = entry?.duration?.[1];
      if (typeof end === 'number' && end > max) max = end;
    }
  }
  return max;
}

// time_windows.planned_start is stored as a bare "YYYY-MM-DDTHH:mm" string (UTC, no timezone
// suffix - same format produced by formatExecutionDatetime in planningPayloadPreparer.ts). JS
// Date parses bare datetime strings as LOCAL time per spec, so we append ":00Z" explicitly.
export function parseUtcDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(`${value}:00Z`);
  return isNaN(date.getTime()) ? null : date;
}

// Statuses that should NOT be sent to the planning solver:
//   DRAFT - not yet formally estimated, too early for planning
//   IN_PROGRESS / DONE - surgery has started or finished, nothing to plan
//   CANCELLED - terminated, skip
// ESTIMATED, PLANNING, and PLANNED are all still eligible (solver can refine an existing plan).
const EXCLUDED_FROM_PLANNING = new Set<SurgeryStatus>(['DRAFT', 'IN_PROGRESS', 'DONE', 'CANCELLED']);
export function isExcludedFromPlanning(status: string): boolean {
  return EXCLUDED_FROM_PLANNING.has(status as SurgeryStatus);
}
