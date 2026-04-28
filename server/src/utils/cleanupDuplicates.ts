import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('Cleaning up duplicate staff tags...');
  
  // Find all duplicates
  const tags = await prisma.staffTag.findMany({
    orderBy: { id: 'asc' }
  });

  const seen = new Set();
  const duplicates = [];

  for (const tag of tags) {
    const key = `${tag.organization_id}-${tag.name}`;
    if (seen.has(key)) {
      duplicates.push(tag.id);
    } else {
      seen.add(key);
    }
  }

  if (duplicates.length > 0) {
    await prisma.staffTag.deleteMany({
      where: {
        id: { in: duplicates }
      }
    });
    console.log(`Deleted ${duplicates.length} duplicate staff tags.`);
  } else {
    console.log('No duplicates found.');
  }

  // Also clean up other catalogs just in case
  const models = ['specialization', 'skill', 'shift', 'contract'];
  for (const model of models) {
    const items = await (prisma as any)[model].findMany({ orderBy: { id: 'asc' } });
    const modelSeen = new Set();
    const modelDuplicates = [];
    for (const item of items) {
      const key = `${item.organization_id}-${item.name}`;
      if (modelSeen.has(key)) {
        modelDuplicates.push(item.id);
      } else {
        modelSeen.add(key);
      }
    }
    if (modelDuplicates.length > 0) {
      await (prisma as any)[model].deleteMany({ where: { id: { in: modelDuplicates } } });
      console.log(`Deleted ${modelDuplicates.length} duplicate ${model}s.`);
    }
  }
}

cleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
