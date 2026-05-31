import prisma from '../models/prisma';
import logger from '../config/logger';

export async function prepareSchedulePayload(organizationId: number): Promise<any> {
  try {
    // Get staff data
    const staff = await prisma.staff.findMany({
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

    // Generate dates for the next 14 days
    const startDate = new Date();
    const numDays = 14;
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
          shiftRequirements[role.name][dateStr][shift.name.charAt(0)] = 1; // Default to 1
        }
      }
    }

    // Prepare employee profiles
    const employeeProfiles: Record<string, any> = {};
    const rolesSet: string[] = [];
    
    staff.forEach((employee: any, index: number) => {
      const empKey = `emp_${index}`;
      
      // Extract roles directly from employee
      const employeeRoles = employee.roles as string[] || [];
      employeeRoles.forEach((role: string) => {
        if (!rolesSet.includes(role)) {
          rolesSet.push(role);
        }
      });
      
      // Prepare shifts and roles distribution
      const roleDistribution = employee.role_distribution as Record<string, number> || {};
      const shiftsDist: Record<string, number> = {};
      const rolesDist: Record<string, number> = {};
      
      shifts.forEach(shift => {
        shiftsDist[shift.name.charAt(0)] = 1 / shifts.length;
      });
      
      employeeRoles.forEach((role: string) => {
        rolesDist[role] = roleDistribution[role] || (1 / employeeRoles.length);
      });
      
      employeeProfiles[empKey] = {
        shifts: shiftsDist,
        roles: rolesDist,
        contract: employee.contract_id || 'default'
      };
    });

        // Prepare contracts
        const contractsMap: Record<string, any> = {};
        contracts.forEach(contract => {
            contractsMap[contract.name] = [
                {
                    name: "identical_shift_types_during_weekend",
                    active: true,
                    hard: false,
                    weight: 8,
                    reason: "test"
                },
                {
                    name: "complete_weekends",
                    active: true,
                    hard: false,
                    weight: 15,
                    reason: "test"
                },
                {
                    name: "no_night_shift_before_free_weekend",
                    active: true,
                    hard: false,
                    weight: 14,
                    reason: "test"
                }
            ];
        });

        // Prepare shift penalty weights
        const shiftPenaltyWeights: Record<string, Record<string, number>> = {};
        rolesSet.forEach(role => {
            shiftPenaltyWeights[role] = {};
            shifts.forEach(shift => {
                shiftPenaltyWeights[role][shift.name.charAt(0)] = 100;
            });
        });

        // Determine start day of week (Sunday = 0, Monday = 1, etc.)
        const startDayIndex = startDate.getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const startDay = dayNames[startDayIndex];

        const payload = {
            start_date: startDate.toISOString().split('T')[0],
            num_days: numDays,
            num_employees: staff.length,
            start_day: startDay,
            roles: rolesSet,
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
