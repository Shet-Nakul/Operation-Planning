import type { PhaseResource, UiPhaseKey } from '../types/surgery';
import { toBackendRoleName } from '../utils/surgeryMappers';

const STAGE_TO_PHASE: Record<string, UiPhaseKey> = {
  pre_op: 'preOp',
  preop: 'preOp',
  'pre op': 'preOp',
  'pre-operative': 'preOp',
  operative: 'operative',
  post_op: 'postOp',
  postop: 'postOp',
  'post op': 'postOp',
  'post-operative': 'postOp',
  sterilization: 'sterilization',
  'sterilization turnover': 'sterilization',
  recovery: 'recovery',
};

/** Equivalent role labels across UI defaults, backend slugs, and solver tokens. */
const ROLE_EQUIVALENCE_GROUPS: readonly string[][] = [
  ['surgeon', 'surgeons'],
  ['anesthesiologist', 'anesthesiologists', 'anesthesia tech'],
  ['operation_room', 'operation room', 'operating room', 'or', 'or suite', 'room'],
  ['or_nurse', 'or nurse', 'scrub nurse', 'scrub nurses', 'circulating nurse'],
  ['pacu_bed', 'pacu bed', 'pacu beds'],
  ['icu_bed', 'icu bed', 'icu beds'],
  ['envs', 'cleaning crew', 'sterilization tech', 'sterilization'],
  ['monitoring_equipment', 'monitoring equipment', 'monitor station'],
  ['respiratory_therapist', 'respiratory therapist'],
  ['vitals nurse', 'recovery nurse', 'icu nurse', 'pre op technician', 'pre-op technician'],
  ['operating table', 'surgical light', 'sterilizer machine', 'iv pump'],
];

const ROLE_GROUP_BY_TOKEN = (() => {
  const map = new Map<string, number>();
  ROLE_EQUIVALENCE_GROUPS.forEach((group, groupId) => {
    for (const term of group) {
      for (const variant of expandRoleTokenVariants(term)) {
        map.set(variant, groupId);
      }
    }
  });
  return map;
})();

export type FlatSolverAssignment = {
  solverRoleKey: string;
  phaseKey?: UiPhaseKey;
  value: unknown;
};

function normalizeRoleKey(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function stripSlotSuffix(value: string): string {
  return value.replace(/\s+\d+$/, '').trim();
}

function expandRoleTokenVariants(value: string): string[] {
  const norm = normalizeRoleKey(value);
  const backend = normalizeRoleKey(toBackendRoleName(value));
  const withoutSlot = stripSlotSuffix(norm);
  const backendWithoutSlot = stripSlotSuffix(backend);
  return Array.from(new Set([norm, backend, withoutSlot, backendWithoutSlot].filter(Boolean)));
}

function roleGroupId(value: string): number | undefined {
  for (const token of expandRoleTokenVariants(value)) {
    const hit = ROLE_GROUP_BY_TOKEN.get(token);
    if (hit != null) return hit;
  }
  return undefined;
}

function resolvePhaseKey(rawKey: string): UiPhaseKey | undefined {
  const norm = normalizeRoleKey(rawKey).replace(/\s+/g, '_');
  if (STAGE_TO_PHASE[norm]) return STAGE_TO_PHASE[norm];
  const spaced = normalizeRoleKey(rawKey);
  if (STAGE_TO_PHASE[spaced]) return STAGE_TO_PHASE[spaced];
  const camel = rawKey.trim();
  if (camel === 'preOp') return 'preOp';
  if (camel === 'postOp') return 'postOp';
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function isStageKey(key: string): boolean {
  return resolvePhaseKey(key) != null;
}

function isStageContainer(key: string, value: unknown): value is Record<string, unknown> {
  return isStageKey(key) && isRecord(value);
}

function parseCompositeStageRole(key: string): { phaseKey?: UiPhaseKey; roleKey: string } {
  const norm = key.trim().toLowerCase();
  for (const stageToken of Object.keys(STAGE_TO_PHASE)) {
    const prefix = `${stageToken}_`;
    if (norm.startsWith(prefix)) {
      return {
        phaseKey: STAGE_TO_PHASE[stageToken],
        roleKey: norm.slice(prefix.length),
      };
    }
  }
  return { roleKey: key };
}

function extractRoleFromAssignmentItem(item: unknown): string | null {
  if (!isRecord(item)) return null;
  const roleKeys = ['role', 'resource_type', 'resourceType', 'name', 'type', 'position'];
  for (const k of roleKeys) {
    const v = item[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

function extractAssignedValue(item: unknown): unknown {
  if (!isRecord(item)) return item;
  const valueKeys = [
    'assigned', 'assigned_to', 'assignedTo', 'staff_id', 'staffId',
    'resource_id', 'resourceId', 'unit_id', 'unitId', 'id', 'value',
  ];
  for (const k of valueKeys) {
    if (item[k] != null && item[k] !== '') return item[k];
  }
  return item;
}

function pushAssignment(
  entries: FlatSolverAssignment[],
  solverRoleKey: string,
  value: unknown,
  phaseKey?: UiPhaseKey,
): void {
  if (value == null || value === '') return;
  entries.push({ solverRoleKey, phaseKey, value });
}

function flattenStageArray(
  entries: FlatSolverAssignment[],
  stageKey: string,
  items: unknown[],
): void {
  const phaseKey = resolvePhaseKey(stageKey);
  for (const item of items) {
    const role = extractRoleFromAssignmentItem(item);
    if (role) {
      pushAssignment(entries, role, extractAssignedValue(item), phaseKey);
      continue;
    }
    if (typeof item === 'string' || typeof item === 'number') {
      pushAssignment(entries, stageKey, item, phaseKey);
    }
  }
}

function flattenStageObject(
  entries: FlatSolverAssignment[],
  stageKey: string,
  value: Record<string, unknown>,
): void {
  const phaseKey = resolvePhaseKey(stageKey);
  for (const [roleKey, roleValue] of Object.entries(value)) {
    pushAssignment(entries, roleKey, roleValue, phaseKey);
  }
}

/** Flatten solver resources_assigned — flat roles, per-stage maps, arrays, or composite keys. */
export function flattenSolverAssignments(
  resourcesAssigned: Record<string, unknown>,
): FlatSolverAssignment[] {
  const entries: FlatSolverAssignment[] = [];

  for (const [key, value] of Object.entries(resourcesAssigned)) {
    if (Array.isArray(value) && isStageKey(key)) {
      flattenStageArray(entries, key, value);
      continue;
    }

    if (isStageContainer(key, value)) {
      flattenStageObject(entries, key, value);
      continue;
    }

    const composite = parseCompositeStageRole(key);
    if (composite.phaseKey) {
      pushAssignment(entries, composite.roleKey, value, composite.phaseKey);
      continue;
    }

    pushAssignment(entries, key, value);
  }

  return entries;
}

function resourceRoleTokens(resource: { name: string; roles?: string[] }): Set<string> {
  const tokens = new Set<string>();
  const names = [resource.name, ...(resource.roles ?? [])];
  for (const name of names) {
    for (const variant of expandRoleTokenVariants(name)) tokens.add(variant);
    for (const variant of expandRoleTokenVariants(toBackendRoleName(name, resource.roles))) {
      tokens.add(variant);
    }
  }
  return tokens;
}

function solverRoleTokens(solverRole: string): Set<string> {
  const tokens = new Set<string>();
  for (const variant of expandRoleTokenVariants(solverRole)) tokens.add(variant);
  return tokens;
}

/** Compare solver role keys (e.g. surgeon_1, or_nurse) to phase resource names (e.g. Surgeons). */
export function roleKeysMatch(solverRole: string, resourceName: string, resourceRoles?: string[]): boolean {
  const solverTokens = solverRoleTokens(solverRole);
  const resourceTokens = resourceRoleTokens({ name: resourceName, roles: resourceRoles });

  for (const left of solverTokens) {
    if (resourceTokens.has(left)) return true;
  }

  const solverGroup = roleGroupId(solverRole);
  if (solverGroup == null) return false;

  for (const name of [resourceName, ...(resourceRoles ?? []), toBackendRoleName(resourceName, resourceRoles)]) {
    if (roleGroupId(name) === solverGroup) return true;
  }

  return false;
}

export function matchAllocationsToPhaseResource(
  phaseKey: UiPhaseKey,
  resource: PhaseResource,
  flatAssignments: FlatSolverAssignment[],
): FlatSolverAssignment[] {
  return flatAssignments.filter((entry) => {
    if (entry.phaseKey && entry.phaseKey !== phaseKey) return false;
    return roleKeysMatch(entry.solverRoleKey, resource.name, resource.roles);
  });
}
