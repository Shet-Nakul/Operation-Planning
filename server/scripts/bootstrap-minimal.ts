import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Administrator' },
  });
  await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER', description: 'Standard User' },
  });

  const org = await prisma.organization.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Central Hospital',
      contact_number: '123456789',
      contact_email: 'admin@centralhospital.com',
    },
  });

  const password = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@centralhospital.com' },
    update: {
      password_hash: password,
      is_active: true,
      organization_id: org.id,
      role_id: adminRole.id,
    },
    create: {
      organization_id: org.id,
      role_id: adminRole.id,
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@centralhospital.com',
      password_hash: password,
    },
  });

  await prisma.globalSettings.upsert({
    where: { organization_id: org.id },
    update: {},
    create: {
      organization_id: org.id,
      operation_hours_start: '08:00',
      operation_hours_end: '18:00',
      surgery_planning_horizon: 3,
      roster_planning_horizon: 28,
      surgery_planning_resolution: 15,
    },
  });

  console.log('Bootstrap OK: org=1 admin@centralhospital.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
