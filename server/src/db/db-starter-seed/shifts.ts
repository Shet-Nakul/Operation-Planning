import { PrismaClient } from '@prisma/client';

// Shifts
export async function seedShifts(prisma: PrismaClient): Promise<void> {
  await prisma.shift.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Day" } },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "name": "Day",
      "alias": "D",
      "start_time": "08:00",
      "end_time": "16:00",
      "description": null,
      "status": "ACTIVE"
    },
  });

  await prisma.shift.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Early" } },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "name": "Early",
      "alias": "E",
      "start_time": "05:00",
      "end_time": "13:00",
      "description": null,
      "status": "ACTIVE"
    },
  });

  await prisma.shift.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Late" } },
    update: {},
    create: {
      "id": 3,
      "organization_id": 1,
      "name": "Late",
      "alias": "L",
      "start_time": "14:00",
      "end_time": "22:00",
      "description": null,
      "status": "ACTIVE"
    },
  });

  await prisma.shift.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Night" } },
    update: {},
    create: {
      "id": 4,
      "organization_id": 1,
      "name": "Night",
      "alias": "N",
      "start_time": "21:00",
      "end_time": "05:00",
      "description": null,
      "status": "ACTIVE"
    },
  });
}
