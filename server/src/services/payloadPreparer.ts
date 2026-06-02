import prisma from '../models/prisma';
import logger from '../config/logger';
import { ContractType } from '@prisma/client';

export async function prepareSchedulePayload(organizationId: number): Promise<any> {
  try {
    // Get staff data
    const staff = await prisma.staff.findMany({
      where: { organization_id: organizationId }
    });

    // Get resource pools
    const resourcePools = await prisma.resourcePool.findMany({
      where: { organization_id: organizationId }
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

    // Generate dates for the next month
    const currentDate = new Date();
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const startDate = nextMonth;
    const numDays = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    const dateMap: Record<string, number> = {};
    const shiftRequirements: Record<string, Record<string, Record<string, number>>> = {};
    
    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap[dateStr] = i;
      
      // Initialize shift requirements
      for (const role of staffTags) {
        if (!shiftRequirements[role.name]) {
          shiftRequirements[role.name] = {};
        }
        shiftRequirements[role.name][dateStr] = {};
        for (const shift of shifts) {
          shiftRequirements[role.name][dateStr][shift.alias || shift.name.charAt(0)] = 1; // Default to 1
        }
      }
    }

    // Prepare pools object
    const poolsMap: Record<string, any> = {};
    resourcePools.forEach((pool, index) => {
      const poolKey = pool.pool_id || `POOL_${index}`;
      poolsMap[poolKey] = {
        role: pool.primary_role,
        shifts: shifts.map(s => s.alias || s.name.charAt(0))
      };
    });

    // Prepare employee profiles - only include dynamic contract employees
    const employeeProfiles: Record<string, any> = {};
    const dynamicContracts = contracts.filter(c => c.type === ContractType.DYNAMIC);
    const dynamicContractIds = dynamicContracts.map(c => c.contract_id);
    const dynamicStaff = staff.filter(emp => 
      emp.contract_id !== null && dynamicContractIds.includes(emp.contract_id)
    );

    dynamicStaff.forEach((employee: any, index: number) => {
      const empKey = `emp_${index}`;
      
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

      // Extract pool assignments from staff
      const poolAssignments = (employee.pool_assignments as Array<{ pool_id?: string; pool_name?: string }> || []).map(
        p => p.pool_id || p.pool_name?.split(' ').map(w => w[0]).join('').toUpperCase() + '-001'
      );
      
      employeeProfiles[empKey] = {
        shifts: shiftsDist,
        roles: rolesDist,
        pools: poolAssignments,
        contract: employee.contract_id || 'default'
      };
    });

    // Prepare contracts - only dynamic ones, merge scheduling rules, assignment limits, and forbidden patterns
    const contractsMap: Record<string, any> = {};
    const globalForbiddenPatterns = await prisma.forbiddenPattern.findFirst({
      where: { organization_id: organizationId, scope: 'GLOBAL' }
    });
    const constraintList = globalForbiddenPatterns?.forbidden_patterns as Array<any> || [];

    // Helper to convert camelCase to snake_case
    const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

    // Helper to find constraint by name
    const findConstraint = (name: string) => constraintList.find((c: any) => c.name === name);

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

    // Prepare shift penalty weights
    const shiftPenaltyWeights: Record<string, Record<string, number>> = {};
    staffTags.forEach(role => {
      shiftPenaltyWeights[role.name] = {};
      shifts.forEach(shift => {
        const shiftAlias = shift.alias || shift.name.charAt(0);
        shiftPenaltyWeights[role.name][shiftAlias] = 100;
      });
    });

    // Determine start day of week (Sunday = 0, Monday = 1, etc.)
    const startDayIndex = startDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const startDay = dayNames[startDayIndex];

    const payload = {
      start_date: startDate.toISOString().split('T')[0],
      num_days: numDays,
      num_employees: dynamicStaff.length,
      start_day: startDay,
      pools: poolsMap,
      employee_profiles: employeeProfiles,
      contracts: contractsMap,
      shift_requirements: shiftRequirements,
      shift_penalty_weights: shiftPenaltyWeights,
      preferred_shifts: {},
      days: dateMap,
      previous_schedule: {}
    };

    return payload;
  } catch (error) {
    logger.error('Error preparing schedule payload:', error);
    throw error;
  }
}
