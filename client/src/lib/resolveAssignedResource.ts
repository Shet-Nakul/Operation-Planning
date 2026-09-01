import type { StaffMember } from '../components/staff/types';
import type { ResourceNavigationPayload } from '../types/surgery';

export type ResourceCatalog = {
  staff: StaffMember[];
  hrPools: Array<{ id: string; name: string }>;
  nhPools: Array<{
    pool_id: string;
    pool_name: string;
    resource_type?: string;
    resources?: string[];
  }>;
};

export type ResolvedAssignedResource = {
  kind: 'staff' | 'hr-pool' | 'nh-pool';
  displayName: string;
  subtitle?: string;
  resourceId: string;
  resourceName: string;
  unitId?: string;
  navigationType: ResourceNavigationPayload['resourceType'];
};

const NH_ROLE_RE =
  /\b(bed|beds|equipment|room|rooms|device|devices|vehicle|vehicles|theatre|theater|or|suite|icu|operating)\b/i;

const HUMAN_ROLE_RE =
  /\b(surgeon|nurse|anesthetist|anaesthetist|anesthesiologist|staff|doctor|physician|tech|technician|assistant|specialist|resident|fellow)\b/i;

function stripHash(value: string): string {
  return value.trim().replace(/^#/, '');
}

function normId(value: string): string {
  return stripHash(value).toLowerCase();
}

function idsEqual(a: string, b: string): boolean {
  return Boolean(a) && Boolean(b) && normId(a) === normId(b);
}

function looksLikeJson(value: string): boolean {
  const t = value.trim();
  return (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'));
}

export function prettifySolverLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || looksLikeJson(trimmed)) return '';
  return trimmed.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function classifyAssignmentRole(role: string): 'human' | 'non-human' | 'unknown' {
  const compact = role.toLowerCase().replace(/[_-]+/g, ' ').trim();
  if (/^(bed|equipment|room|device|vehicle)s?$/.test(compact) || NH_ROLE_RE.test(compact)) {
    return 'non-human';
  }
  if (HUMAN_ROLE_RE.test(compact)) return 'human';
  return 'unknown';
}

function navigationTypeForNh(resourceType?: string, roleKey?: string): ResourceNavigationPayload['resourceType'] {
  const token = `${resourceType ?? ''} ${roleKey ?? ''}`.toLowerCase();
  if (/\broom\b|\bor\b|theatre|theater|suite/.test(token)) return 'room';
  if (/\bdevice\b/.test(token)) return 'device';
  return 'equipment';
}

function normalizeStaffToken(value: string): string {
  return stripHash(value).toLowerCase().replace(/_/g, '-');
}

/** Map solver tokens like surgeon-staff-ds-0003 → STAFF-DS-0003 */
export function extractCanonicalStaffId(candidate: string): string | null {
  const key = normalizeStaffToken(candidate);
  if (!key) return null;

  const direct = key.match(/^staff-([a-z]{1,6})-(\d{4})$/);
  if (direct) return `STAFF-${direct[1].toUpperCase()}-${direct[2]}`;

  const rolePrefixed = key.match(/^(?:[a-z][a-z0-9-]*)-staff-([a-z]{1,6})-(\d{4})$/);
  if (rolePrefixed) return `STAFF-${rolePrefixed[1].toUpperCase()}-${rolePrefixed[2]}`;

  const suffix = key.match(/staff-([a-z]{1,6})-(\d{4})$/);
  if (suffix) return `STAFF-${suffix[1].toUpperCase()}-${suffix[2]}`;

  return null;
}

function formatStaffBadge(staffId: string): string {
  const canonical = extractCanonicalStaffId(staffId) ?? stripHash(staffId).toUpperCase();
  return canonical.startsWith('#') ? canonical : `#${canonical}`;
}

function findStaff(catalog: ResourceCatalog, candidate: string): StaffMember | undefined {
  const key = stripHash(candidate);
  if (!key) return undefined;
  const canonical = extractCanonicalStaffId(candidate);
  const canonicalNorm = canonical ? normId(canonical) : '';

  return catalog.staff.find((s) => {
    const emp = stripHash(String(s.employeeId ?? ''));
    const empNorm = normId(emp);
    const idNorm = normId(String(s.id ?? ''));
    return (
      idsEqual(String(s.id ?? ''), key) ||
      idsEqual(emp, key) ||
      idsEqual(String(s.name ?? ''), key) ||
      (canonicalNorm !== '' && (empNorm === canonicalNorm || idNorm === canonicalNorm))
    );
  });
}

function findHrPool(catalog: ResourceCatalog, candidate: string) {
  const key = stripHash(candidate);
  if (!key) return undefined;
  const nhIds = new Set(catalog.nhPools.map((p) => normId(p.pool_id)));
  return catalog.hrPools.find((p) => {
    if (nhIds.has(normId(p.id))) return false;
    return idsEqual(p.id, key) || idsEqual(p.name, key);
  });
}

function findNhPool(catalog: ResourceCatalog, candidate: string) {
  const key = stripHash(candidate);
  if (!key) return undefined;
  for (const pool of catalog.nhPools) {
    const units = Array.isArray(pool.resources) ? pool.resources : [];
    const unitMatch = units.find((u) => idsEqual(String(u), key));
    if (idsEqual(pool.pool_id, key) || idsEqual(pool.pool_name, key) || unitMatch) {
      return { pool, unitId: unitMatch ? String(unitMatch) : undefined };
    }
  }
  return undefined;
}

function staffResolution(staff: StaffMember): ResolvedAssignedResource {
  const emp = stripHash(String(staff.employeeId ?? ''));
  const staffId = emp || staff.id;
  const badge = formatStaffBadge(staffId);
  return {
    kind: 'staff',
    displayName: staff.name,
    subtitle: staff.title ? `${staff.title} · ${badge}` : badge,
    resourceId: staffId,
    resourceName: staff.name,
    navigationType: 'staff',
  };
}

function hrPoolResolution(pool: { id: string; name: string }): ResolvedAssignedResource {
  return {
    kind: 'hr-pool',
    displayName: pool.name,
    subtitle: 'Staff pool',
    resourceId: pool.id,
    resourceName: pool.name,
    navigationType: 'pool',
  };
}

function nhPoolResolution(
  pool: ResourceCatalog['nhPools'][number],
  unitId: string | undefined,
  roleKey: string,
): ResolvedAssignedResource {
  const displayName = unitId ? `${pool.pool_name} · ${unitId}` : pool.pool_name;
  return {
    kind: 'nh-pool',
    displayName,
    subtitle: pool.resource_type ? String(pool.resource_type).replace(/_/g, ' ') : 'Equipment',
    resourceId: pool.pool_id,
    resourceName: pool.pool_name,
    unitId,
    navigationType: navigationTypeForNh(pool.resource_type, roleKey),
  };
}

export function resolveAssignedResource(
  candidates: Array<string | null | undefined>,
  roleKey: string,
  catalog: ResourceCatalog,
): ResolvedAssignedResource | null {
  const roleClass = classifyAssignmentRole(roleKey);
  const unique = Array.from(
    new Set(
      candidates
        .map((c) => (typeof c === 'string' ? c.trim() : ''))
        .filter((c) => c && !looksLikeJson(c)),
    ),
  );

  if (roleClass !== 'non-human') {
    for (const candidate of unique) {
      const staff = findStaff(catalog, candidate);
      if (staff) return staffResolution(staff);
    }
  }

  if (roleClass !== 'human') {
    for (const candidate of unique) {
      const nh = findNhPool(catalog, candidate);
      if (nh) return nhPoolResolution(nh.pool, nh.unitId, roleKey);
    }
  }

  if (roleClass !== 'non-human') {
    for (const candidate of unique) {
      const hr = findHrPool(catalog, candidate);
      if (hr) return hrPoolResolution(hr);
    }
  }

  const canonicalStaffId =
    unique.map((candidate) => extractCanonicalStaffId(candidate)).find(Boolean) ?? null;

  const pretty =
    unique.map(prettifySolverLabel).find(Boolean) ||
    prettifySolverLabel(roleKey.replace(/_/g, ' '));

  if (roleClass === 'non-human') {
    return {
      kind: 'nh-pool',
      displayName: pretty || 'Allocated equipment',
      resourceId: unique[0] ? stripHash(unique[0]) : '',
      resourceName: pretty,
      navigationType: navigationTypeForNh(undefined, roleKey),
    };
  }

  if (roleClass !== 'non-human' && canonicalStaffId) {
    return {
      kind: 'staff',
      displayName: formatStaffBadge(canonicalStaffId),
      resourceId: canonicalStaffId,
      resourceName: formatStaffBadge(canonicalStaffId),
      navigationType: 'staff',
    };
  }

  if (roleClass === 'human' && pretty) {
    return {
      kind: 'staff',
      displayName: pretty,
      resourceId: unique[0] ? stripHash(unique[0]) : '',
      resourceName: pretty,
      navigationType: 'staff',
    };
  }

  return pretty
    ? {
        kind: 'staff',
        displayName: pretty,
        resourceId: unique[0] ? stripHash(unique[0]) : '',
        resourceName: pretty,
        navigationType: 'staff',
      }
    : null;
}

export function toNavigationPayload(
  resolved: ResolvedAssignedResource,
  extra: Pick<ResourceNavigationPayload, 'role' | 'surgeryStartTime' | 'surgeryEndTime' | 'surgeryReference' | 'phase'>,
): ResourceNavigationPayload {
  return {
    resourceType: resolved.navigationType,
    resourceId: resolved.resourceId,
    resourceName: resolved.resourceName,
    unitId: resolved.unitId,
    ...extra,
  };
}
