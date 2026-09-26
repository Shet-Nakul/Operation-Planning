import { PrismaClient } from '@prisma/client';

// Departments
export async function seedDepartments(prisma: PrismaClient): Promise<void> {
  await prisma.department.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Surgery" } },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "name": "Surgery",
      "description": null,
      "status": "ACTIVE"
    },
  });

  await prisma.department.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Anesthesiology" } },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "name": "Anesthesiology",
      "description": null,
      "status": "ACTIVE"
    },
  });

  await prisma.department.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Critical Care" } },
    update: {},
    create: {
      "id": 3,
      "organization_id": 1,
      "name": "Critical Care",
      "description": null,
      "status": "ACTIVE"
    },
  });
}
