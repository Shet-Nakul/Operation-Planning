import { PrismaClient } from '@prisma/client';

// Operation types
export async function seedOperationTypes(prisma: PrismaClient): Promise<void> {
  await prisma.operationType.upsert({
    where: { organization_id_category_name: { organization_id: 1, category: "Neuro", name: "Craniotomy" } },
    update: {},
    create: {
      "id": 25,
      "organization_id": 1,
      "category": "Neuro",
      "name": "Craniotomy",
      "status": "ACTIVE"
    },
  });

  await prisma.operationType.upsert({
    where: { organization_id_category_name: { organization_id: 1, category: "Ortho", name: "Hip Replacement" } },
    update: {},
    create: {
      "id": 26,
      "organization_id": 1,
      "category": "Ortho",
      "name": "Hip Replacement",
      "status": "ACTIVE"
    },
  });

  await prisma.operationType.upsert({
    where: { organization_id_category_name: { organization_id: 1, category: "Ortho", name: "Knee Replacement" } },
    update: {},
    create: {
      "id": 27,
      "organization_id": 1,
      "category": "Ortho",
      "name": "Knee Replacement",
      "status": "ACTIVE"
    },
  });

  await prisma.operationType.upsert({
    where: { organization_id_category_name: { organization_id: 1, category: "General", name: "Appendectomy" } },
    update: {},
    create: {
      "id": 28,
      "organization_id": 1,
      "category": "General",
      "name": "Appendectomy",
      "status": "ACTIVE"
    },
  });

  await prisma.operationType.upsert({
    where: { organization_id_category_name: { organization_id: 1, category: "General", name: "Cholecystectomy" } },
    update: {},
    create: {
      "id": 29,
      "organization_id": 1,
      "category": "General",
      "name": "Cholecystectomy",
      "status": "ACTIVE"
    },
  });

  await prisma.operationType.upsert({
    where: { organization_id_category_name: { organization_id: 1, category: "Neuro", name: "Spinal Fusion" } },
    update: {},
    create: {
      "id": 30,
      "organization_id": 1,
      "category": "Neuro",
      "name": "Spinal Fusion",
      "status": "ACTIVE"
    },
  });
}
