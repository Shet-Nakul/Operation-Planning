// Surgery lifecycle: DRAFT → ESTIMATED → PLANNING → PLANNED (or CANCELLED at any stage)
// Status transitions:
//   DRAFT     : default on create
//   ESTIMATED : manual (PUT status: ESTIMATED)
//   PLANNING  : automatic — when surgery is included in an outgoing planning solver payload
//   PLANNED   : automatic — when the planning solver returns 'completed' for that department
//   CANCELLED : manual (PUT status: CANCELLED)
// IN_PROGRESS and DONE remain in the enum for manual use or future integration.
export const SURGERY_STATUSES = ['DRAFT', 'ESTIMATED', 'PLANNING', 'PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;
export type SurgeryStatus = typeof SURGERY_STATUSES[number];

// Statuses NOT eligible for the planning solver payload (overridden at runtime by surgery_status_catalog.to_plan).
const EXCLUDED_FROM_PLANNING = new Set<SurgeryStatus>(['DRAFT', 'IN_PROGRESS', 'DONE', 'CANCELLED']);
export function isExcludedFromPlanning(status: string): boolean {
  return EXCLUDED_FROM_PLANNING.has(status as SurgeryStatus);
}
