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
    const [globalSettings, shifts, departments, resourcePools, staff, contracts, surgeries, rosterings, surgeryStatusCatalog] = await Promise.all([
      prisma.globalSettings.findUnique({ where: { organization_id: organizationId } }),
      prisma.shift.findMany({ where: { organization_id: organizationId } }),
      prisma.department.findMany({ where: { organization_id: organizationId } }),
      prisma.resourcePool.findMany({ where: { organization_id: organizationId }, include: { demand_configs: true, resources: true } }),
      prisma.staff.findMany({ where: { organization_id: organizationId } }),
      prisma.contract.findMany({ where: { organization_id: organizationId } }),
      prisma.surgery.findMany({ where: { organization_id: organizationId } }),
      prisma.rostering.findMany({ where: { organization_id: organizationId } }),
      prisma.surgeryStatusCatalog.findMany({ where: { organization_id: organizationId } }),
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

    for (const department of departments) {
      const deptPools = resourcePools.filter(p => p.department_id === department.id);
      const deptStaffNoPool = staff.filter(s => {
        if (s.department_id !== department.id) return false;
        if (!s.contract_id || !staticContractIds.includes(s.contract_id)) return false;
        const assignments = (s.pool_assignments as Array<{ pool_id?: string }>) || [];
        return assignments.length === 0;
      });
      const deptSurgeries = surgeries.filter(s =>
        s.department_id === department.id && toPlanStatuses.has(s.status)
      );

      if (deptPools.length === 0 && deptStaffNoPool.length === 0 && deptSurgeries.length === 0) {
        continue;
      }

      const resources: any[] = [];

      // Pool-based resources: availability comes from the already-solved staff roster
      // (Rostering.pool_centric) inverted into members[staff_id][date] = { shift: [aliases] }.
      deptPools.forEach(pool => {
        // All staff who list this pool in their pool_assignments.
        const poolStaffIds = staff
          .filter(s => ((s.pool_assignments as Array<{ pool_id?: string }>) || []).some(a => a.pool_id === pool.pool_id))
          .map(s => s.staff_id);

        // Initialise every member with an empty shift array for every planning date.
        const members: Record<string, Record<string, { shift: string[] }>> = {};
        poolStaffIds.forEach(staffId => {
          members[staffId] = {};
          planningDates.forEach(date => { members[staffId][date] = { shift: [] }; });
        });

        // Fill shifts from pool_centric: pool_centric[pool_id][date][shiftAlias] = [staffIds]
        const poolSchedule = mergedPoolCentric[pool.pool_id] || {};
        for (const date of planningDates) {
          const dateSchedule = poolSchedule[date] || {};
          for (const [shiftAlias, staffIds] of Object.entries(dateSchedule)) {
            for (const staffId of (staffIds as string[])) {
              if (members[staffId]?.[date]) {
                members[staffId][date].shift.push(shiftAlias);
              }
            }
          }
        }

        resources.push({
          id: pool.pool_id,
          resource_type: 'pool',
          role: pool.primary_role,
          availability: { members },
          reservations: [],
        });
      });

      // Collect roles from surgery stages that have an explicit assigned value (not null).
      // "assigned" here is a logical token like "surgeon_1", not a staff_id.
      // Map slugified role → original role string so we can match staff by role and
      // emit the surgery's role string (not the one derived from weekly_template).
      const assignedRoleSlugToName = new Map<string, string>();
      deptSurgeries.forEach(surgery => {
        const stages = surgery.stages as Record<string, Array<{ role?: string; assigned?: string | null }>>;
        Object.values(stages || {}).forEach(entries => {
          (entries || []).forEach(req => {
            if (req.assigned && req.role) assignedRoleSlugToName.set(slugify(req.role), req.role);
          });
        });
      });

      // Individual (non-pool) static employees — only those whose primary role matches a surgery
      // stage role that has an explicit assignment.
      deptStaffNoPool.forEach(employee => {
        const weeklyTemplate = (employee.weekly_template as Record<string, RoleBasedDay>) || {};
        const primaryRole = primaryRoleOf(weeklyTemplate);

        // Match against surgery stage roles (slug-normalised). Skip if no match.
        const surgeryRole = primaryRole ? assignedRoleSlugToName.get(slugify(primaryRole)) : undefined;
        if (!surgeryRole) return;

        // Convert role-based template {day: [{start,end,role}]} → hours-only {day: {hours: [[start,end]]}}
        const staffSchedule: Record<string, { hours: [string, string][] }> = {};
        for (const day of WEEK_DAYS) {
          const entries = weeklyTemplate?.[day];
          if (Array.isArray(entries) && entries.length > 0) {
            staffSchedule[day] = { hours: entries.map(e => [padTime(e.start), padTime(e.end)] as [string, string]) };
          } else {
            staffSchedule[day] = { hours: [] };
          }
        }

        resources.push({
          id: employee.staff_id,
          resource_type: 'individual',
          role: surgeryRole,           // role string from surgery stage, not from weekly_template
          availability: { members: { [employee.staff_id]: staffSchedule } },
          reservations: [],
        });
      });

      // PoolResource entries: each ResourcePool that has PoolResource children gets a resource entry.
      // members[resource_id] = the resource's weekly_template ({day: {hours: [[start,end]]}}).
      deptPools.forEach(pool => {
        const poolResources = (pool as any).resources as Array<{ resource_id: string; weekly_template: any }>;
        if (!poolResources || poolResources.length === 0) return;

        const members: Record<string, any> = {};
        poolResources.forEach(r => {
          members[r.resource_id] = r.weekly_template || {};
        });

        resources.push({
          id: pool.pool_id,
          resource_type: 'pool',
          role: pool.primary_role,
          availability: { members },
          reservations: [],
        });
      });

      payloads.push({
        department: department.name,
        horizon,
        resolution,
        operation_start: operationStart,
        operation_end: operationEnd,
        execution_datetime: executionDatetime,
        shift_definitions: shiftDefinitions,
        resources,
        surgeries: deptSurgeries.map(s => ({
          id: s.surgery_id,
          type: s.type,
          infection_type: s.infection_type,
          time_windows: s.time_windows,
          stages: s.stages,
        })),
      });
    }

    return payloads;
  } catch (error) {
    logger.error('Error preparing surgery planning payloads:', error);
    throw error;
  }
}
