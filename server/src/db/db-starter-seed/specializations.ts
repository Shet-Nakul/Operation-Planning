import { PrismaClient } from '@prisma/client';

// Specializations
export async function seedSpecializations(prisma: PrismaClient): Promise<void> {
  await prisma.specialization.upsert({
    where: { organization_id_name: { organization_id: 1, name: "General Surgery" } },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "name": "General Surgery",
      "description": null,
      "status": "ACTIVE"
    },
  });

  await prisma.specialization.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Orthopedics" } },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "name": "Orthopedics",
      "description": null,
      "status": "ACTIVE"
    },
  });
}
