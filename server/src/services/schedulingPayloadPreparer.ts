import prisma from '../models/prisma';
import logger from '../config/logger';
import { ContractType } from '@prisma/client';

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
      include: { demand_configs: true }
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

    // Get this month's rostering data as the previous_schedule context.
    // Using the current calendar month (not the most recent row) so month-boundary rest
    // constraints (e.g. night shift on the last day of the current month) are correctly
    // applied to the next month's roster being built.
    const now = new Date();
    const previousRostering = await prisma.rostering.findUnique({
      where: {
        organization_id_year_month: {
          organization_id: organizationId,
          year: now.getUTCFullYear(),
          month: now.getUTCMonth() + 1,
        }
      }
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
                demandMatrix = (pool.demand_configs[0].demand_matrix as any[]).reduce(
                    (acc, item) => {
                        const shiftAlias =
                            shiftNameToAliasMap[item.shift] || item.shift;

                        const { shift, ...dayRequirements } = item;

                        acc[shiftAlias] = dayRequirements;

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

        // Prepare previous_schedule - only include employees in this group from previous rostering
        const previousSchedule: Record<string, any> = {};
        if (previousRostering?.employee_centric) {
            const employeeCentric = previousRostering.employee_centric as Record<string, any>;
            groupEmployeeIds.forEach(empId => {
                if (employeeCentric[empId]) {
                    previousSchedule[empId] = employeeCentric[empId];
                }
            });
        }

        return {
            start_date: startDate.toISOString().split('T')[0],
            horizon: numDays,
            pool_role_map: poolsMap,
            employee_profiles: employeeProfiles,
            contracts: contractsMap,
            shift_requirements: shiftRequirements,
            preferred_shifts: {},
            previous_schedule: previousSchedule
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