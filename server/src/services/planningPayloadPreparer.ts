import prisma from '../models/prisma';
import logger from '../config/logger';
import { ContractType } from '@prisma/client';
import { isExcludedFromPlanning } from '../utils/surgeryStatus';

function padTime(time: string): string {
  const [h, m] = time.split(':');
  return `${(h || '0').padStart(2, '0')}:${(m || '00').padStart(2, '0')}`;
}

function formatExecutionDatetime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');
// Normalise a role string to the lowercase_underscore format used in surgery stage requirements.
// "OR Nurse" → "or_nurse", "Anesthesiologist" → "anesthesiologist", "Senior Surgeon" → "senior_surgeon".
const normalizeRole = (role: string) => (role || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]+/g, '');

type RoleBasedDay = { start: string; end: string; role: string }[];

// Picks the most frequent non-null role across a role-based weekly_template - used to name/group
// individually-listed (non-pool) employee resources, e.g. "Surgeon" -> "surgeon_1".
function primaryRoleOf(weeklyTemplate: Record<string, RoleBasedDay>): string | null {
  const counts: Record<string, number> = {};
  Object.values(weeklyTemplate || {}).forEach(entries => {
    (entries || []).forEach(e => {
      if (e?.role) counts[e.role] = (counts[e.role] || 0) + 1;
    });
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || null;
}

const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Converts the legacy role-based weekly_template shape {day: [{start,end,role}]} (used by static
// employees with no pool assignment) into {day: {role, hours: [[start,end],...]}} for the planning payload.
function toResourceWeeklyTemplate(weeklyTemplate: Record<string, RoleBasedDay>) {
  const result: Record<string, { role: string | null; hours: [string, string][] }> = {};
  for (const day of WEEK_DAYS) {
    const entries = weeklyTemplate?.[day];
    if (Array.isArray(entries) && entries.length > 0) {
      result[day] = {
        role: entries[0].role ?? null,
        hours: entries.map(e => [padTime(e.start), padTime(e.end)] as [string, string]),
      };
    } else {
      result[day] = { role: null, hours: [] };
    }
  }
  return result;
}

// Builds one planning payload per department (resources + surgeries scoped to that department),
// to be sent to the solver one at a time - mirrors how the rostering payload is grouped per pool.
export async function prepareSurgeryPlanningPayloads(organizationId: number): Promise<any[]> {
  try {
    const [globalSettings, shifts, departments, resourcePools, staff, contracts, surgeries, rosterings, surgeryStatusCatalog, renewablePools] = await Promise.all([
      prisma.globalSettings.findUnique({ where: { organization_id: organizationId } }),
      prisma.shift.findMany({ where: { organization_id: organizationId } }),
      prisma.department.findMany({ where: { organization_id: organizationId } }),
      prisma.resourcePool.findMany({ where: { organization_id: organizationId }, include: { demand_configs: true, resources: true } }),
      prisma.staff.findMany({ where: { organization_id: organizationId } }),
      prisma.contract.findMany({ where: { organization_id: organizationId } }),
      prisma.surgery.findMany({ where: { organization_id: organizationId } }),
      prisma.rostering.findMany({ where: { organization_id: organizationId } }),
      prisma.surgeryStatusCatalog.findMany({ where: { organization_id: organizationId } }),
      prisma.renewableResourcePool.findMany({ where: { organization_id: organizationId }, include: { units: true } }),
    ]);

    // Statuses where to_plan=true are eligible for the planning payload; fall back to hardcoded set if catalog is empty.
    const toPlanStatuses = surgeryStatusCatalog.length > 0
      ? new Set(surgeryStatusCatalog.filter(s => s.to_plan).map(s => s.name))
      : new Set(['ESTIMATED', 'PLANNING', 'PLANNED']);

    const staticContractIds = contracts.filter(c => c.type === ContractType.STATIC).map(c => c.contract_id);

    const operationStart = padTime(globalSettings?.operation_hours_start || '08:00');
    const operationEnd = padTime(globalSettings?.operation_hours_end || '18:00');
    const horizon = globalSettings?.surgery_planning_horizon ?? 3;
    const resolution = globalSettings?.surgery_planning_resolution ?? 15;
    const executionDate = new Date();
    const executionDatetime = formatExecutionDatetime(executionDate);

    const shiftNameToAliasMap: Record<string, string> = {};
    shifts.forEach(s => { shiftNameToAliasMap[s.name] = s.alias || s.name.charAt(0); });

    // Shift catalog aliases (D/E/L/N, etc.) plus the fixed Operation_Hours/Full_Day windows - shared across departments
    const shiftDefinitions: Record<string, [string, string][]> = {};
    shifts.forEach(shift => {
      const alias = shift.alias || shift.name.charAt(0);
      shiftDefinitions[alias] = [[padTime(shift.start_time), padTime(shift.end_time)]];
    });
    shiftDefinitions['OH'] = [[operationStart, operationEnd]];
    shiftDefinitions['F'] = [['00:00', '23:59']];

    // Merge pool_centric across every rostering run on record (keyed by pool_id -> date -> shift -> [staff_ids])
    const mergedPoolCentric: Record<string, any> = {};
    rosterings.forEach(r => {
      Object.assign(mergedPoolCentric, (r.pool_centric as Record<string, any>) || {});
    });

    // execution_datetime's date through horizon * 2 + 1 days
    const planningDates: string[] = [];
    for (let i = 0; i <= horizon * 2; i++) {
      planningDates.push(formatDate(addDays(executionDate, i)));
    }

    const payloads: any[] = [];

    // Build org-wide resources once — shared across all department payloads.
    // Resources are not scoped to a single department because surgeries routinely need
    // staff from other departments (e.g. anesthesiologists, ICU nurses, OR rooms).
    const orgResources: any[] = [];

    // Staff pools: one resource entry per pool, members sourced from the solved roster.
    resourcePools.forEach(pool => {
      const poolStaffIds = staff
        .filter(s => ((s.pool_assignments as Array<{ pool_id?: string }>) || []).some(a => a.pool_id === pool.pool_id))
        .map(s => s.staff_id);

      const members: Record<string, Record<string, { shift: string[] }>> = {};
      poolStaffIds.forEach(staffId => {
        members[staffId] = {};
        planningDates.forEach(date => { members[staffId][date] = { shift: [] }; });
      });

      const poolSchedule = mergedPoolCentric[pool.pool_id] || {};
      for (const date of planningDates) {
        const dateSchedule = poolSchedule[date] || {};
        for (const [shiftAlias, staffIds] of Object.entries(dateSchedule)) {
          for (const staffId of (staffIds as string[])) {
            if (members[staffId]?.[date]) members[staffId][date].shift.push(shiftAlias);
          }
        }
        // If no rostering data exists for this specific date, default all members to OH.
        // The solver treats members with shift:[] as unavailable on that date.
        const dateHasData = Object.keys(dateSchedule).length > 0;
        if (!dateHasData) {
          poolStaffIds.forEach(staffId => { members[staffId][date] = { shift: ['OH'] }; });
        }
      }

      orgResources.push({
        id: pool.pool_id,
        resource_type: 'pool',
        role: normalizeRole(pool.primary_role || ''),
        availability: { members },
        reservations: [],
      });

      // Physical resources (PoolResource children) within this pool — weekday availability.
      const poolResources = (pool as any).resources as Array<{ resource_id: string; weekly_template: any }>;
      if (poolResources?.length > 0) {
        const physMembers: Record<string, any> = {};
        poolResources.forEach(r => { physMembers[r.resource_id] = r.weekly_template || {}; });
        orgResources.push({
          id: pool.pool_id,
          resource_type: 'pool',
          role: normalizeRole(pool.primary_role || ''),
          availability: { members: physMembers },
          reservations: [],
        });
      }
    });

    // Individual (non-pool) static employees: one resource entry per staff member.
    const staticStaffNoPool = staff.filter(s => {
      if (!s.contract_id || !staticContractIds.includes(s.contract_id)) return false;
      const assignments = (s.pool_assignments as Array<{ pool_id?: string }>) || [];
      return assignments.length === 0;
    });

    staticStaffNoPool.forEach(employee => {
      const weeklyTemplate = (employee.weekly_template as Record<string, RoleBasedDay>) || {};
      const primaryRole = primaryRoleOf(weeklyTemplate);
      if (!primaryRole) return;

      const staffSchedule: Record<string, { hours: [string, string][] }> = {};
      for (const day of WEEK_DAYS) {
        const entries = weeklyTemplate?.[day];
        if (Array.isArray(entries) && entries.length > 0) {
          staffSchedule[day] = { hours: entries.map(e => [padTime(e.start), padTime(e.end)] as [string, string]) };
        } else {
          staffSchedule[day] = { hours: [] };
        }
      }

      orgResources.push({
        id: employee.staff_id,
        resource_type: 'individual',
        role: normalizeRole(primaryRole),
        availability: { members: { [employee.staff_id]: staffSchedule } },
        reservations: [],
      });
    });

    // Physical renewable resource pools (beds, rooms, equipment): weekday-keyed availability.
    // pool_name is normalized to derive the role (e.g. "ICU Bed Pool" → "icu_bed").
    renewablePools.forEach(pool => {
      const roleName = normalizeRole((pool.pool_name || '').replace(/\s*pool\s*$/i, ''));
      const weeklyTpl = (pool.weekly_template as Record<string, any>) || {};
      const unitIds = pool.units.map((u: any) => u.unit_id);
      if (unitIds.length === 0) return;

      const physMembers: Record<string, any> = {};
      unitIds.forEach((uid: string) => {
        physMembers[uid] = {};
        for (const day of WEEK_DAYS) {
          const hours = weeklyTpl[day]?.hours ?? [];
          physMembers[uid][day] = { hours };
        }
      });

      orgResources.push({
        id: pool.pool_id,
        resource_type: 'pool',
        role: roleName,
        availability: { members: physMembers },
        reservations: (pool.reservations as any[]) || [],
      });
    });

    // Collect all roles referenced across all surgery stages so we can detect gaps.
    const coveredRoles = new Set(orgResources.map((r: any) => r.role));
    const allSurgeryStageRoles = new Set<string>();
    const roleToStaffIds: Record<string, string[]> = {};

    staff.forEach(employee => {
      const weeklyTemplate = employee.weekly_template as Record<string, RoleBasedDay> | undefined;
      if (!weeklyTemplate) return;
      Object.values(weeklyTemplate).forEach(entries => {
        (entries || []).forEach(entry => {
          if (entry?.role) {
            const normalized = normalizeRole(entry.role);
            if (!roleToStaffIds[normalized]) roleToStaffIds[normalized] = [];
            if (!roleToStaffIds[normalized].includes(employee.staff_id)) {
              roleToStaffIds[normalized].push(employee.staff_id);
            }
          }
        });
      });
    });

    surgeries.forEach(s => {
      const rawStages = s.stages as Record<string, Array<Record<string, any>>> | null;
      for (const reqs of Object.values(rawStages || {})) {
        for (const req of (reqs || [])) {
          if (req?.role) allSurgeryStageRoles.add(normalizeRole(req.role));
        }
      }
    });

    // Synthesize a resource for any normalized role referenced in surgery stages but not covered by any pool.
    // Prefer using actual staff IDs when available; do not generate synthetic pool IDs.
    allSurgeryStageRoles.forEach(role => {
      if (coveredRoles.has(role)) return;
      const actualStaffIds = roleToStaffIds[role] || [];

      if (actualStaffIds.length > 0) {
        actualStaffIds.forEach(staffId => {
          const staffSchedule: Record<string, any> = {};
          for (const day of WEEK_DAYS) {
            staffSchedule[day] = { hours: [[operationStart, operationEnd]] };
          }

          orgResources.push({
            id: staffId,
            resource_type: 'individual',
            role,
            availability: { members: { [staffId]: staffSchedule } },
            reservations: [],
          });
        });
        logger.info(`Synthesized resources for unconfigured role "${role}" using actual staff IDs`);
      } else {
        logger.info(`No actual staff IDs found for unconfigured role "${role}", skipping synthetic pool creation`);
      }
    });

    // One payload per department that has eligible surgeries. Resources are org-wide.
    for (const department of departments) {
      const deptSurgeries = surgeries.filter(s =>
        s.department_id === department.id && toPlanStatuses.has(s.status)
      );

      if (deptSurgeries.length === 0) continue;

      payloads.push({
        department: department.name,
        horizon,
        resolution,
        operation_start: operationStart,
        operation_end: operationEnd,
        execution_datetime: executionDatetime,
        shift_definitions: shiftDefinitions,
        resources: orgResources,
        surgeries: deptSurgeries.map(s => {
          // Strip null stage requirement fields (assigned: null crashes the Python solver via **None).
          const rawStages = s.stages as Record<string, Array<Record<string, any>>> | null;
          // All five stage keys must always be present — the solver's RawDataModel requires them.
          const stages: Record<string, Array<Record<string, any>>> = {
            pre_op: [], operative: [], post_op: [], sterilization: [], recovery: [],
          };
          const resourceIds = new Set(orgResources.map((r: any) => r.id));
          for (const [phase, reqs] of Object.entries(rawStages || {})) {
            stages[phase] = (reqs || []).map(req => {
              const cleaned: Record<string, any> = {};
              for (const [k, v] of Object.entries(req)) {
                if (v === null) continue;
                // Strip `assigned` when the referenced resource ID doesn't exist in the payload —
                // the solver rejects unknown resource IDs with a hard error.
                if (k === 'assigned' && typeof v === 'string' && !resourceIds.has(v)) continue;
                cleaned[k] = v;
              }
              return cleaned;
            });
          }
          // Strip null time_windows sub-fields for the same reason.
          const rawTw = s.time_windows as Record<string, any> | null;
          const time_windows: Record<string, any> = {};
          for (const [k, v] of Object.entries(rawTw || {})) {
            if (v !== null) time_windows[k] = v;
          }
          return { id: s.surgery_id, type: s.type, infection_type: s.infection_type, time_windows, stages };
        }),
      });
    }

    return payloads;
  } catch (error) {
    logger.error('Error preparing surgery planning payloads:', error);
    throw error;
  }
}
