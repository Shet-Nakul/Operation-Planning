import { Prisma, PrismaClient } from '@prisma/client';

// Pool demand configs
export async function seedPoolDemandConfigs(prisma: PrismaClient): Promise<void> {
  // Fetch the created pools to get their integer IDs for the Demand Configs.
  const orNurPool = await prisma.resourcePool.findUniqueOrThrow({
    where: { pool_id: "OR-NUR-0001" },
  });
  const scrubNurPool = await prisma.resourcePool.findUniqueOrThrow({
    where: { pool_id: "SCRUB-NUR-0001" },
  });
  const envPool = await prisma.resourcePool.findUniqueOrThrow({
    where: { pool_id: "ENV-POOL-0001" },
  });
  const anesPool1 = await prisma.resourcePool.findUniqueOrThrow({
    where: { pool_id: "ANES-POOL-0001" },
  });
  const anesPool2 = await prisma.resourcePool.findUniqueOrThrow({
    where: { pool_id: "ANES-POOL-0002" },
  });

  const saveDemandConfig = async (
    data: Prisma.PoolDemandConfigUncheckedCreateInput,
  ): Promise<void> => {
    const existing = await prisma.poolDemandConfig.findFirst({
      where: {
        pool_id: data.pool_id,
        effective_from: data.effective_from,
        effective_to: data.effective_to,
      },
    });

    if (existing) {
      await prisma.poolDemandConfig.update({
        where: { id: existing.id },
        data,
      });
      return;
    }

    await prisma.poolDemandConfig.create({ data });
  };

  // OR Nurse Pool
  await saveDemandConfig({
    pool_id: orNurPool.id,
    effective_from: new Date('2026-05-25'),
    effective_to: new Date('2026-06-01'),
    weekly_hours: 80,
    demand_matrix: [
      { shift: "Day", monday: 3, tuesday: 3, wednesday: 3, thursday: 3, friday: 3, saturday: 1, sunday: 1 },
      { shift: "Early", monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 1, sunday: 1 },
      { shift: "Late", monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 1, sunday: 1 },
    ],
  });

  // Scrub Nurse Pool
  await saveDemandConfig({
    pool_id: scrubNurPool.id,
    effective_from: new Date('2026-05-25'),
    effective_to: new Date('2026-06-01'),
    weekly_hours: 80,
    demand_matrix: [
      { shift: "Day", monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 1, sunday: 1 },
      { shift: "Early", monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 1, sunday: 1 },
      { shift: "Late", monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 1, sunday: 1 },
    ],
  });

  // Environmental Services Pool
  await saveDemandConfig({
    pool_id: envPool.id,
    effective_from: new Date('2026-05-25'),
    effective_to: new Date('2026-06-01'),
    weekly_hours: 80,
    demand_matrix: [
      { shift: "Day", monday: 4, tuesday: 4, wednesday: 4, thursday: 4, friday: 3, saturday: 2, sunday: 2 },
      { shift: "Early", monday: 3, tuesday: 3, wednesday: 3, thursday: 3, friday: 3, saturday: 2, sunday: 2 },
      { shift: "Late", monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 1, saturday: 1, sunday: 1 },
    ],
  });

  // Anesthesiologist Pool
  await saveDemandConfig({
    pool_id: anesPool1.id,
    effective_from: new Date('2026-05-25'),
    effective_to: new Date('2026-06-01'),
    weekly_hours: 80,
    demand_matrix: [
      { shift: "Day", monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 1, sunday: 1 },
      { shift: "Early", monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 1, sunday: 1 },
      { shift: "Late", monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 1, sunday: 1 },
    ],
  });

  // Senior Anesthesiologist Pool
  await saveDemandConfig({
    pool_id: anesPool2.id,
    effective_from: new Date('2026-05-25'),
    effective_to: new Date('2026-06-01'),
    weekly_hours: 80,
    demand_matrix: [
      { shift: "Day", monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 0, sunday: 0 },
      { shift: "Early", monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 0, sunday: 0 },
    ],
  });
}
