import type { SurgeryRequestRecord } from '../types/surgery';
import { flattenSolverAssignments } from './phaseSolverAssignments';
import {
  classifyAssignmentRole,
  prettifySolverLabel,
  resolveAssignedResource,
  type ResourceCatalog,
} from './resolveAssignedResource';

function assignmentCandidates(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === 'string' || typeof value === 'number') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(assignmentCandidates);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = [
      'id', 'staff_id', 'staffId', 'employee_id', 'employeeId',
      'unit_id', 'unitId', 'resource_id', 'resourceId', 'pool_id', 'poolId',
      'name', 'assigned',
    ];
    const found: string[] = [];
    for (const k of keys) {
      const v = obj[k];
      if (typeof v === 'string' || typeof v === 'number') found.push(String(v));
    }
    return found;
  }
  return [];
}

export function getAssignedLead(record: SurgeryRequestRecord, catalog: ResourceCatalog): string {
  const assigned = (record.planResult?.result?.resources_assigned ?? {}) as Record<string, unknown>;
  const entries = flattenSolverAssignments(assigned);
  const surgeon = entries.find((e) => /surgeon/i.test(e.solverRoleKey));
  if (surgeon) {
    const resolved = resolveAssignedResource(
      assignmentCandidates(surgeon.value),
      surgeon.solverRoleKey,
      catalog,
    );
    if (resolved?.displayName) return resolved.displayName;
  }
  return record.data.primarySurgeon?.trim() || 'Unassigned';
}

export function getAssignedRoom(record: SurgeryRequestRecord, catalog: ResourceCatalog): string {
  const assigned = (record.planResult?.result?.resources_assigned ?? {}) as Record<string, unknown>;
  const entries = flattenSolverAssignments(assigned);
  const room = entries.find((e) =>
    /(room|theatre|theater|or\b|operating)/i.test(e.solverRoleKey),
  );
  if (room) {
    const resolved = resolveAssignedResource(
      assignmentCandidates(room.value),
      room.solverRoleKey,
      catalog,
    );
    if (resolved?.displayName) return resolved.displayName;
    const raw = assignmentCandidates(room.value)[0];
    if (raw) return prettifySolverLabel(raw) || raw;
  }
  return record.runtime?.assignedRoom || record.runtime?.assignedOr || 'Unassigned';
}

export type StaffOnSiteRow = { label: string; current: number; color: string };

export function staffOnSiteFromRecords(
  records: SurgeryRequestRecord[],
  catalog: ResourceCatalog,
): StaffOnSiteRow[] {
  const buckets: Record<'Surgeons' | 'Anesthesiologists' | 'Nurses' | 'Other staff', Set<string>> = {
    Surgeons: new Set(),
    Anesthesiologists: new Set(),
    Nurses: new Set(),
    'Other staff': new Set(),
  };

  for (const record of records) {
    const assigned = (record.planResult?.result?.resources_assigned ?? {}) as Record<string, unknown>;
    for (const entry of flattenSolverAssignments(assigned)) {
      if (classifyAssignmentRole(entry.solverRoleKey) === 'non-human') continue;
      const resolved = resolveAssignedResource(
        assignmentCandidates(entry.value),
        entry.solverRoleKey,
        catalog,
      );
      const id = resolved?.resourceId || assignmentCandidates(entry.value)[0] || entry.solverRoleKey;
      if (/surgeon/i.test(entry.solverRoleKey)) buckets.Surgeons.add(id);
      else if (/anesth/i.test(entry.solverRoleKey)) buckets.Anesthesiologists.add(id);
      else if (/nurse/i.test(entry.solverRoleKey)) buckets.Nurses.add(id);
      else buckets['Other staff'].add(id);
    }
  }

  return (Object.entries(buckets) as Array<[StaffOnSiteRow['label'], Set<string>]>)
    .filter(([, set]) => set.size > 0)
    .map(([label, set]) => ({
      label,
      current: set.size,
      color: label === 'Nurses' ? 'bg-orange-500' : 'bg-emerald-500',
    }));
}

export function uniqueRoomsInUse(records: SurgeryRequestRecord[], catalog: ResourceCatalog): number {
  const rooms = new Set<string>();
  for (const record of records) {
    const room = getAssignedRoom(record, catalog);
    if (room && room !== 'Unassigned') rooms.add(room);
  }
  return rooms.size;
}
