import { PrismaClient } from '@prisma/client';

// Skills
export async function seedSkills(prisma: PrismaClient): Promise<void> {
  await prisma.skill.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Patient Assessment" } },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "name": "Patient Assessment",
      "description": null,
      "status": "ACTIVE"
    },
  });

  await prisma.skill.upsert({
    where: { organization_id_name: { organization_id: 1, name: "ACLS" } },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "name": "ACLS",
      "description": null,
      "status": "ACTIVE"
    },
  });

  await prisma.skill.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Ventilator Management" } },
    update: {},
    create: {
      "id": 3,
      "organization_id": 1,
      "name": "Ventilator Management",
      "description": null,
      "status": "ACTIVE"
    },
  });
}
