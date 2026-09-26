import { PrismaClient } from '@prisma/client';

// Users (password hashes preserved; session tokens omitted)
export async function seedUsers(prisma: PrismaClient): Promise<void> {
  await prisma.user.upsert({
    where: { email: "admin@centralhospital.com" },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "role_id": 1,
      "first_name": "Admin",
      "last_name": "User",
      "email": "admin@centralhospital.com",
      "password_hash": "$2b$10$8uZjpKVuV/TpdIA1MnN76Owj1t9Ui.hw5bEtWf.zS8KcBLjC55lgy",
      "is_active": true
    },
  });

  await prisma.user.upsert({
    where: { email: "tomholland@gmail.com" },
    update: {},
    create: {
      "id": 2,
      "organization_id": null,
      "role_id": 1,
      "first_name": "Tom",
      "last_name": "Holland",
      "email": "tomholland@gmail.com",
      "password_hash": "$2b$10$YwJNXxWHEpfQGtvZUJraKOMGfQjvofWw5YkaSVfyywYBLbvkCJd0W",
      "is_active": true
    },
  });

  await prisma.user.upsert({
    where: { email: "mmanson@gmail.com" },
    update: {},
    create: {
      "id": 3,
      "organization_id": 1,
      "role_id": 1,
      "first_name": "Mark",
      "last_name": "Manson",
      "email": "mmanson@gmail.com",
      "password_hash": "$2b$10$wvkO919iZH0RE/s7CKm9NuR57OPUMMOl6NFQI2ba9tce0vCGpatrS",
      "is_active": true
    },
  });
}
