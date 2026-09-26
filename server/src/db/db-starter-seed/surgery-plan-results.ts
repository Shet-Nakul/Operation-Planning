import { PrismaClient } from '@prisma/client';

// Surgery plan results
export async function seedSurgeryPlanResults(prisma: PrismaClient): Promise<void> {
  await prisma.surgeryPlanResult.upsert({
    where: { surgery_id: "SURG-TES-0001" },
    update: {},
    create: {
      "id": 1,
      "surgery_id": "SURG-TES-0001",
      "organization_id": 1,
      "department": "Surgery",
      "result": {
        "id": "SURG-TES-0001",
        "planned_start": "2026-08-17 08:00:00",
        "resources_assigned": {
          "operative": [
            {
              "role": "Surgeon",
              "assigned": "surgeon-staff-ds-0003",
              "time_range": [
                "2026-08-17 08:00:00",
                "2026-08-17 11:30:00"
              ]
            },
            {
              "role": "Operation Room",
              "assigned": "OR-01",
              "time_range": [
                "2026-08-17 08:00:00",
                "2026-08-17 11:30:00"
              ]
            },
            {
              "role": "OR Nurse",
              "assigned": "STAFF-NB-0002",
              "time_range": [
                "2026-08-17 08:00:00",
                "2026-08-17 11:30:00"
              ]
            }
          ]
        }
      }
    },
  });

  await prisma.surgeryPlanResult.upsert({
    where: { surgery_id: "SURG-MAR-0001" },
    update: {},
    create: {
      "id": 2,
      "surgery_id": "SURG-MAR-0001",
      "organization_id": 1,
      "department": "Surgery",
      "result": {
        "id": "SURG-MAR-0001",
        "planned_start": "2026-09-02 08:00:00",
        "resources_assigned": {
          "operative": [
            {
              "role": "Surgeon",
              "assigned": "surgeon-staff-ds-0003",
              "time_range": [
                "2026-09-02 08:00:00",
                "2026-09-02 11:30:00"
              ]
            },
            {
              "role": "OR Nurse",
              "assigned": "STAFF-NA-0001",
              "time_range": [
                "2026-09-02 08:00:00",
                "2026-09-02 11:30:00"
              ]
            }
          ]
        }
      }
    },
  });
}
