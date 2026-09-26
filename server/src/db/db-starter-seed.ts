import { PrismaClient } from '@prisma/client';
import { seedRoles } from './db-starter-seed/roles';
import { seedOrganization } from './db-starter-seed/organization';
import { seedUsers } from './db-starter-seed/users';
import { seedGlobalSettings } from './db-starter-seed/global-settings';
import { seedStaffTags } from './db-starter-seed/staff-tags';
import { seedSpecializations } from './db-starter-seed/specializations';
import { seedDepartments } from './db-starter-seed/departments';
import { seedSkills } from './db-starter-seed/skills';
import { seedResourceTypes } from './db-starter-seed/resource-types';
import { seedShifts } from './db-starter-seed/shifts';
import { seedForbiddenPatterns } from './db-starter-seed/forbidden-patterns';
import { seedContracts } from './db-starter-seed/contracts';
import { seedStaff } from './db-starter-seed/staff';
import { seedResourcePools } from './db-starter-seed/resource-pools';
import { seedPoolDemandConfigs } from './db-starter-seed/pool-demand-configs';
import { seedRenewableResourcePools } from './db-starter-seed/renewable-resource-pools';
import { seedResourceUnits } from './db-starter-seed/resource-units';
import { seedOperationTypes } from './db-starter-seed/operation-types';
import { seedPhaseResources } from './db-starter-seed/phase-resources';
import { seedRosteringSnapshot } from './db-starter-seed/rostering-snapshot';
import { seedSurgeries } from './db-starter-seed/surgeries';
import { seedSurgeryPlanResults } from './db-starter-seed/surgery-plan-results';
import { seedSerialSequences } from './db-starter-seed/serial-sequences';

const prisma = new PrismaClient();

export async function main(): Promise<void> {
  try {
    await seedRoles(prisma);
    await seedOrganization(prisma);
    await seedUsers(prisma);
    await seedGlobalSettings(prisma);
    await seedStaffTags(prisma);
    await seedSpecializations(prisma);
    await seedDepartments(prisma);
    await seedSkills(prisma);
    await seedResourceTypes(prisma);
    await seedShifts(prisma);
    await seedForbiddenPatterns(prisma);
    await seedContracts(prisma);
    await seedStaff(prisma);
    await seedResourcePools(prisma);
    await seedPoolDemandConfigs(prisma);
    await seedRenewableResourcePools(prisma);
    await seedResourceUnits(prisma);
    await seedOperationTypes(prisma);
    await seedPhaseResources(prisma);
    await seedRosteringSnapshot(prisma);
    await seedSurgeries(prisma);
    await seedSurgeryPlanResults(prisma);
    await seedSerialSequences(prisma);
    console.log('db-starter-seed: current database snapshot upserted');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
