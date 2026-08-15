export type StaffStatus = 'Active' | 'On Leave' | 'Archived';

export interface ScheduleBlock {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  role: string;
}

export interface EffortRole {
  id: string;
  type: 'CLINICAL' | 'RESEARCH' | 'TEACHING';
  description: string;
  percentage: number;
}

export function formatEffortRoleLabel(role: Pick<EffortRole, 'type' | 'description'>): string {
  // Weekly-template / planning roles must match Staff Tags exactly (e.g. "Surgeon").
  // Do not prefix with effort type ("Clinical (Surgeon)") — that breaks planning matching.
  const description = String(role.description ?? '').trim();
  if (description) return description;
  return role.type.charAt(0) + role.type.slice(1).toLowerCase();
}

/** Strip legacy "Clinical (Surgeon)" labels down to the inner planning role name. */
export function normalizeScheduleRoleName(roleLabel: string): string {
  const raw = String(roleLabel ?? '').trim();
  if (!raw) return '';
  const wrapped = raw.match(/^(Clinical|Research|Teaching)\s*\((.+)\)\s*$/i);
  if (wrapped?.[2]) return wrapped[2].trim();
  return raw;
}

export function scheduleBlockTone(roleLabel: string, effortRoles: EffortRole[]): EffortRole['type'] {
  const normalized = normalizeScheduleRoleName(roleLabel);
  const match = effortRoles.find(
    (r) => formatEffortRoleLabel(r) === roleLabel
      || formatEffortRoleLabel(r) === normalized
      || String(r.description ?? '').trim() === normalized,
  );
  if (match) return match.type;
  const upper = roleLabel.toUpperCase();
  if (upper.startsWith('RESEARCH')) return 'RESEARCH';
  if (upper.startsWith('TEACHING')) return 'TEACHING';
  return 'CLINICAL';
}

export interface StaffMember {
  id: string;
  name: string;
  title: string;
  specialization: string[];
  contractId: string;
  department?: string;
  departmentId?: number;
  supervisor: string;
  status: StaffStatus;
  email: string;
  avatarUrl?: string;
  employeeId: string;
  skills: string[];
  weeklySchedule: ScheduleBlock[];
  effortRoles: EffortRole[];
  pools: string[];
}
