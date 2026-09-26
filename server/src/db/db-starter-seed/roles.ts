import { PrismaClient } from '@prisma/client';

// Roles
export async function seedRoles(prisma: PrismaClient): Promise<void> {
  await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      "id": 1,
      "name": "ADMIN",
      "description": "Administrator"
    },
  });

  await prisma.role.upsert({
    where: { name: "USER" },
    update: {},
    create: {
      "id": 2,
      "name": "USER",
      "description": "Standard User"
    },
  });
}
