import type { ResourcePool } from '../components/hr-pool/types';
import { normalizeScheduleRoleName, type StaffMember } from '../components/staff/types';
import type { PhaseResource } from '../types/surgery';
import { toBackendRoleName } from '../utils/surgeryMappers';

type ResourceRole = Pick<PhaseResource, 'name' | 'roles'>;

function normalizeRole(value: string): string {
  return toBackendRoleName(normalizeScheduleRoleName(value))
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export function matchesResourceRole(resource: ResourceRole, candidateRoles: string[]): boolean {
  const roles = resource.roles?.filter(role => role.trim()) ?? [];
  const expected = (roles.length > 0 ? roles : [resource.name]).map(normalizeRole).filter(Boolean);
  return candidateRoles.some(role => {
    const normalized = normalizeRole(role);
    return Boolean(normalized) && expected.includes(normalized);
  });
}

export function staffMatchesResourceRole(resource: ResourceRole, member: StaffMember): boolean {
  const roles = [
    ...member.effortRoles.map(role => role.description),
    ...member.weeklySchedule.map(block => block.role),
  ].filter(role => role.trim());
  return matchesResourceRole(resource, roles.length > 0 ? roles : [member.title]);
}

export function isHumanPool(pool: ResourcePool): boolean {
  return pool.kind ? pool.kind === 'human' : ['user', 'nurse', 'users'].includes(pool.icon.toLowerCase());
}

/**
 * Renewable (non-human) pools have no dedicated role column on the backend, only a
 * `resource_type` (BED/EQUIPMENT/ROOM/…). We mirror the planning payload preparer and treat the
 * pool name (minus a trailing "Pool") as the role, falling back to the resource type.
 */
export function renewablePoolRole(poolName: string, resourceType: string): string {
  const stripped = poolName.replace(/\s*pool\s*$/i, '').trim();
  return stripped || resourceType.trim();
}

export function poolMatchesResourceRole(resource: ResourceRole, pool: ResourcePool): boolean {
  const candidates = isHumanPool(pool)
    ? [pool.primarySkill]
    : [pool.primarySkill, pool.resourceType ?? ''];
  return matchesResourceRole(resource, candidates);
}

export function getResourceAssignmentMode(resource: PhaseResource): 'staff' | 'pool' | 'nonhuman' {
  if (!['user', 'nurse', 'users'].includes(resource.icon.toLowerCase())) return 'nonhuman';
  return resource.assignments?.some(assignment => assignment.type === 'pool') ? 'pool' : 'staff';
}
