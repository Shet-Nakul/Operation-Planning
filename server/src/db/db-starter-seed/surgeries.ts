import { PrismaClient } from '@prisma/client';

// Surgeries
export async function seedSurgeries(prisma: PrismaClient): Promise<void> {
  await prisma.surgery.upsert({
    where: { surgery_id: "SURG-MAR-0001" },
    update: {},
    create: {
      "id": 9,
      "organization_id": 1,
      "surgery_id": "SURG-MAR-0001",
      "name": "Mark Manson",
      "type": "mandatory",
      "infection_type": 0,
      "department_id": 1,
      "department": "Surgery",
      "status": "PLANNED",
      "time_windows": {
        "latest_date": "2026-09-02T23:59",
        "earliest_date": "2026-08-31T00:00",
        "planned_start": "2026-09-02 08:00:00"
      },
      "stages": {
        "pre_op": [],
        "post_op": [],
        "recovery": [],
        "operative": [
          {
            "role": "Surgeon",
            "count": 1,
            "duration": [
              0,
              210
            ]
          },
          {
            "role": "OR Nurse",
            "count": 1,
            "duration": [
              0,
              210
            ]
          }
        ],
        "sterilization": []
      }
    },
  });
}
