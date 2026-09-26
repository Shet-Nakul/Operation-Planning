import { PrismaClient } from '@prisma/client';

// Staff tags
export async function seedStaffTags(prisma: PrismaClient): Promise<void> {
  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Surgeon" } },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "name": "Surgeon",
      "color": "#4F46E5",
      "status": "ACTIVE"
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Anesthesiologist" } },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "name": "Anesthesiologist",
      "color": "#4F46E5",
      "status": "ACTIVE"
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: 1, name: "OR Nurse" } },
    update: {},
    create: {
      "id": 3,
      "organization_id": 1,
      "name": "OR Nurse",
      "color": "#4F46E5",
      "status": "ACTIVE"
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Senior Staff Nurse" } },
    update: {},
    create: {
      "id": 8,
      "organization_id": 1,
      "name": "Senior Staff Nurse",
      "color": "#4F46E5",
      "status": "ACTIVE"
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Charge Nurse" } },
    update: {},
    create: {
      "id": 9,
      "organization_id": 1,
      "name": "Charge Nurse",
      "color": "#4F46E5",
      "status": "ACTIVE"
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Operation Room" } },
    update: {},
    create: {
      "id": 10,
      "organization_id": 1,
      "name": "Operation Room",
      "color": "#4F46E5",
      "status": "ACTIVE"
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: 1, name: "PACU Bed" } },
    update: {},
    create: {
      "id": 11,
      "organization_id": 1,
      "name": "PACU Bed",
      "color": "#4F46E5",
      "status": "ACTIVE"
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: 1, name: "ICU Bed" } },
    update: {},
    create: {
      "id": 12,
      "organization_id": 1,
      "name": "ICU Bed",
      "color": "#4F46E5",
      "status": "ACTIVE"
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Monitoring Equipment" } },
    update: {},
    create: {
      "id": 13,
      "organization_id": 1,
      "name": "Monitoring Equipment",
      "color": "#4F46E5",
      "status": "ACTIVE"
    },
  });
}
