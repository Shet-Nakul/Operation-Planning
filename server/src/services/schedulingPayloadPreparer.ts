import prisma from '../models/prisma';
import logger from '../config/logger';
import { ContractType } from '@prisma/client';
import { weightedConstraints } from '../config/schedulingConfig';

function toFiniteNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Solver looks up Python weekday names (`strftime("%A").lower()`), e.g. tuesday not tue. */
function toSolverWeeklyDemand(item: Record<string, any>): Record<string, number> {
  return {
    monday: toFiniteNumber(item.monday ?? item.mon),
    tuesday: toFiniteNumber(item.tuesday ?? item.tue),
    wednesday: toFiniteNumber(item.wednesday ?? item.wed),
    thursday: toFiniteNumber(item.thursday ?? item.thu),
    friday: toFiniteNumber(item.friday ?? item.fri),
    saturday: toFiniteNumber(item.saturday ?? item.sat),
    sunday: toFiniteNumber(item.sunday ?? item.sun),
  };
}

export async function prepareSchedulePayload(
  organizationId: number,
  options?: { triggerDate?: Date }
): Promise<any[]> {
  try {
    // Get staff data
    const staff = await prisma.staff.findMany({
      where: { organization_id: organizationId }
    });

    // Get resource pools
    const resourcePools = await prisma.resourcePool.findMany({
      where: { organization_id: organizationId },
      include: { demand_configs: { orderBy: { created_at: 'desc' }, take: 1 } }
    });

    // Get shifts
    const shifts = await prisma.shift.findMany({
      where: { organization_id: organizationId }
    });

    // Get contracts
    const contracts = await prisma.contract.findMany({
      where: { organization_id: organizationId }
    });

    // Prepare dynamic contracts and staff first
    const dynamicContracts = contracts.filter(c => c.type === ContractType.DYNAMIC);
    const dynamicContractIds = dynamicContracts.map(c => c.contract_id);
    const dynamicStaff = staff.filter(emp => 
      emp.contract_id !== null && dynamicContractIds.includes(emp.contract_id)
    );
    
    // Determine start date and horizon.
    // Dirty trigger (triggerDate supplied): start from today, cover remaining days of current month.
    // Normal trigger (cron / manual): start from first day of next month, full month.
    const currentDate = new Date();
    let startDate: Date;
    let numDays: number;

    if (options?.triggerDate) {
      const td = options.triggerDate;
      startDate = new Date(Date.UTC(td.getUTCFullYear(), td.getUTCMonth(), td.getUTCDate()));
      const lastDayOfMonth = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 0)).getUTCDate();
      numDays = lastDayOfMonth - startDate.getUTCDate() + 1;
    } else {
      startDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + 1, 1));
      numDays = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 0)).getUTCDate();
    }    
    const dateMap: Record<string, number> = {};
    
    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setUTCDate(startDate.getUTCDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap[dateStr] = i;
    }
    
    // Prepare shift aliases and shift name to alias map
    const shiftAliases = shifts.map(s => s.alias || s.name.charAt(0));
    const shiftNameToAliasMap: Record<string, string> = {};
    shifts.forEach(s => {
      shiftNameToAliasMap[s.name] = s.alias || s.name.charAt(0);
    });
    
    // Group pools by employee overlap using union-find
    const buildGroupsByOverlap = (poolEmployeeSets: Record<string, Set<string>>) => {
      const pools = Object.keys(poolEmployeeSets);
      const parent: Record<string, string> = {};
      pools.forEach(p => parent[p] = p);

      const find = (x: string): string => {
        while (parent[x] !== x) {
          parent[x] = parent[parent[x]];
          x = parent[x];
        }
        return x;
      };

      const union = (a: string, b: string) => {
        const ra = find(a);
        const rb = find(b);
        if (ra !== rb) {
          parent[rb] = ra;
        }
      };

      for (let i = 0; i < pools.length; i++) {
        const p1 = pools[i];
        const s1 = poolEmployeeSets[p1];
        for (let j = i + 1; j < pools.length; j++) {
          const p2 = pools[j];
          const s2 = poolEmployeeSets[p2];
          let hasOverlap = false;
          for (const emp of s1) {
            if (s2.has(emp)) {
              hasOverlap = true;
              break;
            }
          }
          if (hasOverlap) {
            union(p1, p2);
          }
        }
      }

      const groupedEmployeeMap: Record<string, Set<string>> = {};
      const groupedPoolsMap: Record<string, Set<string>> = {};

      for (const [poolId, employeeSet] of Object.entries(poolEmployeeSets)) {
        const root = find(poolId);
        if (!groupedEmployeeMap[root]) {
          groupedEmployeeMap[root] = new Set();
        }
        for (const emp of employeeSet) {
          groupedEmployeeMap[root].add(emp);
        }
        if (!groupedPoolsMap[root]) {
          groupedPoolsMap[root] = new Set();
        }
        groupedPoolsMap[root].add(poolId);
      }

      // Filter out groups with no employees
      const rootsWithEmployees = Object.keys(groupedEmployeeMap).filter(root => groupedEmployeeMap[root].size > 0);
      const groupedEmployee = rootsWithEmployees.map(root => Array.from(groupedEmployeeMap[root]));
      const groupPools: Record<number, string[]> = {};
      rootsWithEmployees.forEach((root, idx) => {
        groupPools[idx] = Array.from(groupedPoolsMap[root]);
      });
      return { groupedEmployee, groupPools };
    };

    // Create poolEmployeeSets
    const poolEmployeeSets: Record<string, Set<string>> = {};
    resourcePools.forEach(pool => {
      const employees = staff.filter(s => {
        const assignments = (s.pool_assignments as Array<{ pool_id?: string }>) || [];
        return assignments.some(a => a.pool_id === pool.pool_id);
      }).map(s => s.staff_id);
      poolEmployeeSets[pool.pool_id] = new Set(employees);
    });

    // Get global forbidden patterns (once for all groups)
    const globalForbiddenPatterns = await prisma.forbiddenPattern.findFirst({
      where: { organization_id: organizationId, scope: 'GLOBAL' }
    });
    const constraintList = globalForbiddenPatterns?.forbidden_patterns as Array<any> || [];

    const currentPayloadYear = startDate.getUTCFullYear();
    const currentPayloadMonth = startDate.getUTCMonth() + 1;
    const previousPayloadMonth = currentPayloadMonth === 1 ? 12 : currentPayloadMonth - 1;
    const previousPayloadYear = currentPayloadMonth === 1 ? currentPayloadYear - 1 : currentPayloadYear;

    const previousRostering = await prisma.rostering.findUnique({
      where: {
        organization_id_year_month: {
          organization_id: organizationId,
          year: previousPayloadYear,
          month: previousPayloadMonth,
        }
      }
    });

    const currentRostering = await prisma.rostering.findUnique({
      where: {
        organization_id_year_month: {
          organization_id: organizationId,
          year: currentPayloadYear,
          month: currentPayloadMonth,
        }
      }
    });

    const acceptedStaffRequests = await prisma.leaveShiftRequest.findMany({
      where: {
        organization_id: organizationId,
        status: 'APPROVED'
      },
      include: { staff: true }
    });

    const formatRequestDay = (date: Date) => date.toISOString().split('T')[0];
    const getDatesBetween = (start: string, end: string) => {
      const dates: string[] = [];
      let current = new Date(`${start}T00:00:00Z`);
      const stop = new Date(`${end}T00:00:00Z`);
      while (current <= stop) {
        dates.push(current.toISOString().split('T')[0]);
        current.setUTCDate(current.getUTCDate() + 1);
      }
      return dates;
    };

    const acceptedRequestMap: Record<string, Array<{ pool: string | null; shift: string | null; day_of_request: string; start_date: string; end_date: string }>> = {};
    acceptedStaffRequests.forEach((request: any) => {
      const staffExternalId = request.staff?.staff_id;
      if (!staffExternalId) return;
      const poolId = typeof request.pool_id === 'string' ? request.pool_id : null;
      const shift = request.shift || "V";
      const requestDate = request.created_at ? formatRequestDay(new Date(request.created_at)) : formatRequestDay(new Date());

      if (!acceptedRequestMap[staffExternalId]) {
        acceptedRequestMap[staffExternalId] = [];
      }
      acceptedRequestMap[staffExternalId].push({
        pool: poolId,
        shift,
        day_of_request: requestDate,
        start_date: request.start_date,
        end_date: request.end_date
      });
    });

    // Helper to convert camelCase to snake_case
    const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

    // Helper to find constraint by name
    const findConstraint = (name: string) => constraintList.find((c: any) => c.name === name);

    const { groupedEmployee, groupPools } = buildGroupsByOverlap(poolEmployeeSets);

    // Helper to prepare a single payload for a group
    const preparePayloadForGroup = (groupEmployeeIds: string[], groupPoolIds: string[]): any | null => {
        // Prepare shift requirements
        const shiftRequirements: Record<string, any> = {};
        
        // Process only the resource pools in this group
        resourcePools.filter(pool => groupPoolIds.includes(pool.pool_id)).forEach(pool => {
            // Compute employees: only include those in this group
            const employees = staff.filter(s => {
                const assignments = (s.pool_assignments as Array<{ pool_id?: string }>) || [];
                return groupEmployeeIds.includes(s.staff_id) && assignments.some(a => a.pool_id === pool.pool_id);
            }).map(s => s.staff_id);
            
            // Skip if no employees
            if (employees.length === 0) {
                return;
            }
            
            // Prepare demand matrix - use demand config if available and replace shift name with alias
            let demandMatrix: Record<string, any> = {};

            if (pool.demand_configs && pool.demand_configs.length > 0) {
                const rows = Array.isArray(pool.demand_configs[0].demand_matrix)
                    ? (pool.demand_configs[0].demand_matrix as any[])
                    : [];
                demandMatrix = rows.reduce(
                    (acc, item) => {
                        const shiftAlias =
                            shiftNameToAliasMap[item.shift] || item.shift;
                        if (!shiftAlias) return acc;

                        acc[shiftAlias] = toSolverWeeklyDemand(item);

                        return acc;
                    },
                    {} as Record<string, any>
                );
            }
            
            // Only include if we have demand matrix
            if (Object.keys(demandMatrix).length > 0) {
                shiftRequirements[pool.pool_id] = demandMatrix;
            }
        });

        // Prepare pools object
        const poolsMap: Record<string, any> = {};
        resourcePools.filter(pool => groupPoolIds.includes(pool.pool_id)).forEach(pool => {
            poolsMap[pool.pool_id] = pool.primary_role;
        });

        // Prepare employee profiles - include both dynamic and static contract employees in this group
        const employeeProfiles: Record<string, any> = {};
        
        // First process dynamic staff
        const groupDynamicStaff = dynamicStaff.filter(emp => groupEmployeeIds.includes(emp.staff_id));
        groupDynamicStaff.forEach((employee: any) => {
            const empKey = employee.staff_id;
            
            // Extract roles directly from employee
            const employeeRoles = employee.roles as string[] || [];
            
            // Prepare shifts and roles distribution
            const roleDistribution = employee.role_distribution as Record<string, number> || {};
            const rolesDist: Record<string, number> = {};
            
            employeeRoles.forEach((role: string) => {
                rolesDist[role] = roleDistribution[role] || (1 / employeeRoles.length);
            });

            // Extract pool assignments from staff (only include those in this group)
            const poolAssignments = (
                employee.pool_assignments as Array<{ pool_id?: string }> || []
            ).flatMap((p: any) => (p.pool_id && groupPoolIds.includes(p.pool_id)) ? [p.pool_id] : []);
            
            employeeProfiles[empKey] = {
                roles_distribution: rolesDist,
                pools: poolAssignments,
                contract: employee.contract_id || 'default'
            };
        });

        // Then process static staff
        const staticContractIds = contracts.filter(c => c.type === ContractType.STATIC).map(c => c.contract_id);
        const staticStaff = staff.filter(emp => 
            emp.contract_id !== null && staticContractIds.includes(emp.contract_id) && groupEmployeeIds.includes(emp.staff_id)
        );

        staticStaff.forEach((employee: any) => {
            const empKey = employee.staff_id;
            
            // Extract roles directly from employee
            const employeeRoles = employee.roles as string[] || [];
            
            // Prepare shifts and roles distribution
            const roleDistribution = employee.role_distribution as Record<string, number> || {};
            const rolesDist: Record<string, number> = {};
            
            employeeRoles.forEach((role: string) => {
                rolesDist[role] = roleDistribution[role] || (1 / employeeRoles.length);
            });

            // Extract pool assignments from staff (only include those in this group)
            const poolAssignments = (
                employee.pool_assignments as Array<{ pool_id?: string }> || []
            ).flatMap((p: any) => (p.pool_id && groupPoolIds.includes(p.pool_id)) ? [p.pool_id] : []);
            
            employeeProfiles[empKey] = {
                roles_distribution: rolesDist,
                pools: poolAssignments,
                contract: employee.contract_id,
                ...(employee.weekly_template && Object.keys(employee.weekly_template).length > 0 && { weekly_template: employee.weekly_template })
            };
        });

        // If less than 2 dynamic contract employees, skip this group
        if (groupDynamicStaff.length < 2) {
            return null;
        }

        // Prepare contracts - dynamic ones with constraints, static ones with null
        const contractsMap: Record<string, any> = {};

        // Add dynamic contracts with constraints first
        dynamicContracts.forEach(contract => {
            const contractConstraints: any[] = [];
            const config = contract.configuration as any || {};

            // Process scheduling rules
            if (config.schedulingRules) {
                Object.entries(config.schedulingRules).forEach(([ruleName, rule]: [string, any]) => {
                    const snakeName = toSnakeCase(ruleName);
                    const existingConstraint = findConstraint(snakeName);
                    contractConstraints.push({
                        name: snakeName,
                        active: rule.active || true,
                        hard: rule.mode === 'HARD',
                        weight: existingConstraint?.weight || 10,
                        reason: existingConstraint?.reason || 'Standard scheduling rule'
                    });
                });
            }

            // Process assignment limits
            if (config.assignmentLimits) {
                Object.entries(config.assignmentLimits).forEach(([ruleName, rule]: [string, any]) => {
                    const snakeName = toSnakeCase(ruleName);
                    const existingConstraint = findConstraint(snakeName);
                    contractConstraints.push({
                        name: snakeName,
                        active: rule.active || true,
                        hard: rule.mode === 'HARD',
                        weight: existingConstraint?.weight || 10,
                        value: rule.value,
                        reason: existingConstraint?.reason || 'Assignment limit'
                    });
                });
            }

            // Add forbidden patterns from constraints
            constraintList.forEach(constraint => {
                if (constraint.pattern) {
                    contractConstraints.push(constraint);
                }
            });

            contractsMap[contract.contract_id] = contractConstraints;
        });

        // Add static contracts with null values
        const staticContracts = contracts.filter(c => c.type === ContractType.STATIC);
        staticContracts.forEach(contract => {
            contractsMap[contract.contract_id] = null;
        });

        // Prepare previous_schedules - only include employees in this group from the previous month
        const previousSchedules: Record<string, any> = {};
        if (previousRostering?.employee_centric) {
            const employeeCentric = previousRostering.employee_centric as Record<string, any>;
            groupEmployeeIds.forEach(empId => {
                if (employeeCentric[empId]) {
                    previousSchedules[empId] = employeeCentric[empId];
                }
            });
        }

        // Prepare assigned_schedules - only include current month employee_centric schedules from the payload start_date through horizon
        const assignedSchedules: Record<string, any> = {};
        const allowedDates = new Set<string>();
        for (let i = 0; i < numDays; i++) {
            const date = new Date(startDate);
            date.setUTCDate(startDate.getUTCDate() + i);
            allowedDates.add(date.toISOString().split('T')[0]);
        }
        if (currentRostering?.employee_centric) {
            const employeeCentric = currentRostering.employee_centric as Record<string, any>;
            groupEmployeeIds.forEach(empId => {
                const schedule = employeeCentric[empId];
                if (!schedule) return;
                const filteredSchedule: Record<string, any> = {};
                Object.entries(schedule).forEach(([date, entry]) => {
                    if (allowedDates.has(date)) {
                        filteredSchedule[date] = entry;
                    }
                });
                if (Object.keys(filteredSchedule).length > 0) {
                    assignedSchedules[empId] = filteredSchedule;
                }
            });
        }

        const preferredSchedules: Record<string, any> = {};
        groupEmployeeIds.forEach(empId => {
            const requests = acceptedRequestMap[empId] || [];
            const schedule: Record<string, any> = {};

            requests.forEach(request => {
                getDatesBetween(request.start_date, request.end_date).forEach(date => {
                    if (!allowedDates.has(date)) return;
                    schedule[date] = {
                        pool: request.pool,
                        shift: request.shift,
                        status: 'accepted',
                        day_of_request: request.day_of_request
                    };
                });
            });

            if (Object.keys(schedule).length > 0) {
                preferredSchedules[empId] = schedule;
            }
        });
        logger.info(`Assigned Schedules`,{ assignedSchedules });
        logger.info(`Previous Schedules`,{ previousSchedules });
        return {
            start_date: startDate.toISOString().split('T')[0],
            horizon: numDays,
            pool_role_map: poolsMap,
            employee_profiles: employeeProfiles,
            contracts: contractsMap,
            shift_requirements: shiftRequirements,
            preferred_schedules: preferredSchedules,
            assigned_schedules: assignedSchedules,
            previous_schedules: previousSchedules,
            weighted_constraints: weightedConstraints
        };
    };

    // Prepare payloads for all groups, filter out groups with less than 2 dynamic contract employees
    const payloads: any[] = [];
    for (let groupIdx = 0; groupIdx < groupedEmployee.length; groupIdx++) {
        const groupEmployees = groupedEmployee[groupIdx];
        const payload = preparePayloadForGroup(groupEmployees, groupPools[groupIdx]);
        if (payload !== null) {
            payloads.push(payload);
        }
    }

    return payloads;
  } catch (error) {
    logger.error('Error preparing schedule payload:', error);
    throw error;
  }
}