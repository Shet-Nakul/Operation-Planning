import { PrismaClient } from '@prisma/client';

// Resource units
export async function seedResourceUnits(prisma: PrismaClient): Promise<void> {
  await prisma.resourceUnit.upsert({
    where: { unit_id: "OR-01" },
    update: {},
    create: {
      "id": 1,
      "pool_id": 1,
      "unit_id": "OR-01",
      "status": "AVAILABLE",
      "status_till": null,
      "variant": "STANDARD",
      "attributes": {},
      "block_bookings": [],
      "assigned_to": null,
      "assigned_at": null,
      "estimated_release": null,
      "last_released_at": null
    },
  });

  await prisma.resourceUnit.upsert({
    where: { unit_id: "ICU-01" },
    update: {},
    create: {
      "id": 2,
      "pool_id": 2,
      "unit_id": "ICU-01",
      "status": "AVAILABLE",
      "status_till": null,
      "variant": "STANDARD",
      "attributes": {},
      "block_bookings": [],
      "assigned_to": null,
      "assigned_at": null,
      "estimated_release": null,
      "last_released_at": null
    },
  });

  await prisma.resourceUnit.upsert({
    where: { unit_id: "ICU-02" },
    update: {},
    create: {
      "id": 3,
      "pool_id": 2,
      "unit_id": "ICU-02",
      "status": "AVAILABLE",
      "status_till": null,
      "variant": "STANDARD",
      "attributes": {},
      "block_bookings": [],
      "assigned_to": null,
      "assigned_at": null,
      "estimated_release": null,
      "last_released_at": null
    },
  });

  await prisma.resourceUnit.upsert({
    where: { unit_id: "MON-01" },
    update: {},
    create: {
      "id": 4,
      "pool_id": 3,
      "unit_id": "MON-01",
      "status": "AVAILABLE",
      "status_till": null,
      "variant": "STANDARD",
      "attributes": {},
      "block_bookings": [],
      "assigned_to": null,
      "assigned_at": null,
      "estimated_release": null,
      "last_released_at": null
    },
  });
}
