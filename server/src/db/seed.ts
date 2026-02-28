import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Seed roles
  await prisma.roles.createMany({
    data: [
      { name: 'SUPER_ADMIN' },
      { name: 'ADMIN' },
      { name: 'USER' }
    ],
    skipDuplicates: true
  });

  // Seed sample users
  const password = await bcrypt.hash('password123', 10);
  await prisma.users.createMany({
    data: [
      { email: 'superadmin@example.com', password_hash: password, role_id: 1, first_name: 'Super', last_name: 'Admin' },
      { email: 'admin@example.com', password_hash: password, role_id: 2, first_name: 'Admin', last_name: 'User' },
      { email: 'user@example.com', password_hash: password, role_id: 3, first_name: 'Normal', last_name: 'User' }
    ],
    skipDuplicates: true
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
