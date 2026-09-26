import { PrismaClient } from '@prisma/client';

// Renewable resource pools
export async function seedRenewableResourcePools(prisma: PrismaClient): Promise<void> {
  await prisma.renewableResourcePool.upsert({
    where: { pool_id: "OR-ROOM-273" },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "pool_id": "OR-ROOM-273",
      "pool_name": "Operation Room Pool",
      "resource_type": "ROOM",
      "department": "Surgery",
      "location": null,
      "total_capacity": 1,
      "status": "OPERATIONAL",
      "weekly_template": {
        "friday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "monday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "sunday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "tuesday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "saturday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "thursday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "wednesday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        }
      },
      "reservations": [],
      "metadata": {
        "unit_prefix": "OR",
        "default_variant": "STANDARD",
        "default_attributes": {}
      }
    },
  });

  await prisma.renewableResourcePool.upsert({
    where: { pool_id: "ICU-BED-735" },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "pool_id": "ICU-BED-735",
      "pool_name": "ICU Bed Pool",
      "resource_type": "BED",
      "department": "Critical Care",
      "location": null,
      "total_capacity": 2,
      "status": "OPERATIONAL",
      "weekly_template": {
        "friday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "monday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "sunday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "tuesday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "saturday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "thursday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "wednesday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        }
      },
      "reservations": [],
      "metadata": {
        "unit_prefix": "ICU",
        "default_variant": "STANDARD",
        "default_attributes": {}
      }
    },
  });

  await prisma.renewableResourcePool.upsert({
    where: { pool_id: "MON-EQUIPMENT-391" },
    update: {},
    create: {
      "id": 3,
      "organization_id": 1,
      "pool_id": "MON-EQUIPMENT-391",
      "pool_name": "Monitoring Equipment Pool",
      "resource_type": "EQUIPMENT",
      "department": "Surgery",
      "location": null,
      "total_capacity": 1,
      "status": "OPERATIONAL",
      "weekly_template": {
        "friday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "monday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "sunday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "tuesday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "saturday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "thursday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "wednesday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        }
      },
      "reservations": [],
      "metadata": {
        "unit_prefix": "MON",
        "default_variant": "STANDARD",
        "default_attributes": {}
      }
    },
  });
}
