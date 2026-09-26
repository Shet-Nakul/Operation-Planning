import { PrismaClient } from '@prisma/client';

// Resource types
export async function seedResourceTypes(prisma: PrismaClient): Promise<void> {
  await prisma.resourceType.upsert({
    where: { organization_id_name: { organization_id: 1, name: "BED" } },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "name": "BED",
      "status": "ACTIVE"
    },
  });

  await prisma.resourceType.upsert({
    where: { organization_id_name: { organization_id: 1, name: "ROOM" } },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "name": "ROOM",
      "status": "ACTIVE"
    },
  });

  await prisma.resourceType.upsert({
    where: { organization_id_name: { organization_id: 1, name: "EQUIPMENT" } },
    update: {},
    create: {
      "id": 3,
      "organization_id": 1,
      "name": "EQUIPMENT",
      "status": "ACTIVE"
    },
  });
}
