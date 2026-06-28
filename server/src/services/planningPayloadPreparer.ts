import prisma from '../models/prisma';
import logger from '../config/logger';
import { ContractType } from '@prisma/client';

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
    const [globalSettings, shifts, departments, resourcePools, staff, contracts, surgeries, rosterings] = await Promise.all([
      prisma.globalSettings.findUnique({ where: { organization_id: organizationId } }),
      prisma.shift.findMany({ where: { organization_id: organizationId } }),
      prisma.department.findMany({ where: { organization_id: organizationId } }),
      prisma.resourcePool.findMany({ where: { organization_id: organizationId }, include: { demand_configs: true } }),
      prisma.staff.findMany({ where: { organization_id: organizationId } }),
      prisma.contract.findMany({ where: { organization_id: organizationId } }),
      prisma.surgery.findMany({ where: { organization_id: organizationId } }),
      prisma.rostering.findMany({ where: { organization_id: organizationId } }),
    ]);

    const staticContractIds = contracts.filter(c => c.type === ContractType.STATIC).map(c => c.contract_id);

    const operationStart = padTime(globalSettings?.business_hours_start || '08:00');
    const operationEnd = padTime(globalSettings?.business_hours_end || '18:00');
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
    shiftDefinitions['Operation_Hours'] = [[operationStart, operationEnd]];
    shiftDefinitions['Full_Day'] = [['00:00', '23:59']];

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
      const deptSurgeries = surgeries.filter(s => s.department_id === department.id);

      if (deptPools.length === 0 && deptStaffNoPool.length === 0 && deptSurgeries.length === 0) {
        continue;
      }

      const resources: any[] = [];

      // Pool-based resources: role + shifts come from the pool itself, specific_resource comes
      // from the already-solved staff roster (Rostering.pool_centric) for the planning window.
      deptPools.forEach(pool => {
        const demandMatrix = (pool.demand_configs?.[0]?.demand_matrix as any[]) || [];
        const poolShiftAliases = [...new Set(demandMatrix.map(item => shiftNameToAliasMap[item.shift] || item.shift))];

        const specificResource: Record<string, Record<string, string[]>> = {};
        planningDates.forEach(date => {
          const dayEntry: Record<string, string[]> = {};
          poolShiftAliases.forEach(alias => {
            dayEntry[alias] = mergedPoolCentric[pool.pool_id]?.[date]?.[alias] || [];
          });
          specificResource[date] = dayEntry;
        });

        resources.push({
          id: pool.pool_id,
          is_pool: true,
          role: pool.primary_role,
          shifts: poolShiftAliases,
          specific_resource: specificResource,
        });
      });

      // Individual (non-pool) static employees whose own department matches this group.
      const roleSeq: Record<string, number> = {};
      deptStaffNoPool.forEach(employee => {
        const weeklyTemplate = (employee.weekly_template as Record<string, RoleBasedDay>) || {};
        const role = primaryRoleOf(weeklyTemplate);
        const slug = slugify(role || 'staff');
        roleSeq[slug] = (roleSeq[slug] || 0) + 1;

        resources.push({
          id: `${slug}_${roleSeq[slug]}`,
          is_pool: false,
          weekly_template: toResourceWeeklyTemplate(weeklyTemplate),
        });
      });

      payloads.push({
        horizon,
        resolution,
        operation_start: operationStart,
        operation_end: operationEnd,
        execution_datetime: executionDatetime,
        shift_definitions: shiftDefinitions,
        department: department.name,
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
