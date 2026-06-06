import prisma from '../models/prisma';
import logger from '../config/logger';
import { ContractType } from '@prisma/client';

export async function prepareSchedulePayload(organizationId: number): Promise<any[]> {
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

    // Get staff tags (roles)
    const staffTags = await prisma.staffTag.findMany({
      where: { organization_id: organizationId }
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
    
    // Generate dates for the next month
    const currentDate = new Date();
    const startDate = new Date(
      Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth() + 1,
        1
      )
    );
    const numDays = new Date(
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth() + 1,
        0
      )
    ).getUTCDate();    
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

    // Helper to convert camelCase to snake_case
    const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

    // Helper to find constraint by name
    const findConstraint = (name: string) => constraintList.find((c: any) => c.name === name);

    const { groupedEmployee, groupPools } = buildGroupsByOverlap(poolEmployeeSets);

    // Helper to prepare a single payload for a group
    const preparePayloadForGroup = (groupEmployeeIds: string[], groupPoolIds: string[]): any => {
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
        let demandMatrix: any[] = [];
        if (pool.demand_configs && pool.demand_configs.length > 0) {
          demandMatrix = (pool.demand_configs[0].demand_matrix as any[]).map(item => ({
            ...item,
            shift: shiftNameToAliasMap[item.shift] || item.shift
          }));
        }
        
        // Only include if we have demand matrix
        if (demandMatrix.length > 0) {
          shiftRequirements[pool.pool_id] = {
            employees: employees,
            demand_matrix: demandMatrix
          };
        }
      });

      // Prepare pools object
      const poolsMap: Record<string, any> = {};
      resourcePools.filter(pool => groupPoolIds.includes(pool.pool_id)).forEach(pool => {
        poolsMap[pool.pool_id] = pool.primary_role;
      });

      // Prepare employee profiles - only include dynamic contract employees in this group
      const employeeProfiles: Record<string, any> = {};
      dynamicStaff.filter(emp => groupEmployeeIds.includes(emp.staff_id)).forEach((employee: any) => {
        const empKey = employee.staff_id;
        
        // Extract roles directly from employee
        const employeeRoles = employee.roles as string[] || [];
        
        // Prepare shifts and roles distribution
        const roleDistribution = employee.role_distribution as Record<string, number> || {};
        const shiftsDist: Record<string, number> = {};
        const rolesDist: Record<string, number> = {};
        
        shifts.forEach(shift => {
          const shiftAlias = shift.alias || shift.name.charAt(0);
          shiftsDist[shiftAlias] = 1 / shifts.length;
        });
        
        employeeRoles.forEach((role: string) => {
          rolesDist[role] = roleDistribution[role] || (1 / employeeRoles.length);
        });

        // Extract pool assignments from staff (only include those in this group)
        const poolAssignments = (
          employee.pool_assignments as Array<{ pool_id?: string }> || []
        ).flatMap(p => (p.pool_id && groupPoolIds.includes(p.pool_id)) ? [p.pool_id] : []);
        
        employeeProfiles[empKey] = {
          shifts: shiftsDist,
          roles: rolesDist,
          pools: poolAssignments,
          contract: employee.contract_id || 'default'
        };
      });

      // Prepare contracts - only dynamic ones, merge scheduling rules, assignment limits, and forbidden patterns
      const contractsMap: Record<string, any> = {};

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

      return {
        start_date: startDate.toISOString().split('T')[0],
        horizon: numDays,
        pool_role_map: poolsMap,
        employee_profiles: employeeProfiles,
        contracts: contractsMap,
        shift_requirements: shiftRequirements,
        preferred_shifts: {},
        previous_schedule: {}
      };
    };

    // Prepare payloads for all groups
    const payloads: any[] = [];
    for (let groupIdx = 0; groupIdx < groupedEmployee.length; groupIdx++) {
      payloads.push(
        preparePayloadForGroup(groupedEmployee[groupIdx], groupPools[groupIdx])
      );
    }

    return payloads;
  } catch (error) {
    logger.error('Error preparing schedule payload:', error);
    throw error;
  }
}
