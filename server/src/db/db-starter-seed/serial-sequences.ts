import { PrismaClient } from '@prisma/client';

// Keep serial IDs in sync with inserted primary keys
export async function seedSerialSequences(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE((SELECT MAX(id) FROM roles), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('organizations', 'id'), COALESCE((SELECT MAX(id) FROM organizations), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('global_settings', 'id'), COALESCE((SELECT MAX(id) FROM global_settings), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('staff_tags', 'id'), COALESCE((SELECT MAX(id) FROM staff_tags), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('specializations', 'id'), COALESCE((SELECT MAX(id) FROM specializations), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('departments', 'id'), COALESCE((SELECT MAX(id) FROM departments), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('skills', 'id'), COALESCE((SELECT MAX(id) FROM skills), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('resource_types', 'id'), COALESCE((SELECT MAX(id) FROM resource_types), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('shifts', 'id'), COALESCE((SELECT MAX(id) FROM shifts), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('forbidden_patterns', 'id'), COALESCE((SELECT MAX(id) FROM forbidden_patterns), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('contracts', 'id'), COALESCE((SELECT MAX(id) FROM contracts), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('staff', 'id'), COALESCE((SELECT MAX(id) FROM staff), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('resource_pools', 'id'), COALESCE((SELECT MAX(id) FROM resource_pools), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('pool_demand_configs', 'id'), COALESCE((SELECT MAX(id) FROM pool_demand_configs), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('renewable_resource_pools', 'id'), COALESCE((SELECT MAX(id) FROM renewable_resource_pools), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('resource_units', 'id'), COALESCE((SELECT MAX(id) FROM resource_units), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('operation_types', 'id'), COALESCE((SELECT MAX(id) FROM operation_types), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('phase_resources', 'id'), COALESCE((SELECT MAX(id) FROM phase_resources), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('rosterings', 'id'), COALESCE((SELECT MAX(id) FROM rosterings), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('surgeries', 'id'), COALESCE((SELECT MAX(id) FROM surgeries), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('surgery_plan_results', 'id'), COALESCE((SELECT MAX(id) FROM surgery_plan_results), 1))"
  );
}
