import { PrismaClient } from '@prisma/client';

// Global settings
export async function seedGlobalSettings(prisma: PrismaClient): Promise<void> {
  await prisma.globalSettings.upsert({
    where: { organization_id: 1 },
    update: {},
    create: {
      "id": 5,
      "organization_id": 1,
      "operation_hours_start": "08:00",
      "operation_hours_end": "18:00",
      "surgery_planning_horizon": 3,
      "roster_planning_horizon": 28,
      "surgery_planning_resolution": 15,
      "schedule_date": 1
    },
  });
}
