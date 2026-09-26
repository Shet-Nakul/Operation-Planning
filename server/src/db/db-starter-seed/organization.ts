import { PrismaClient } from '@prisma/client';

// Organization
export async function seedOrganization(prisma: PrismaClient): Promise<void> {
  await prisma.organization.upsert({
    where: { id: 1 },
    update: {},
    create: {
      "id": 1,
      "name": "Central Hospital",
      "contact_number": "123456789",
      "contact_email": "admin@centralhospital.com",
      "status": "ACTIVE"
    },
  });
}
