import { PrismaClient } from '@prisma/client';

// Resource pools
export async function seedResourcePools(prisma: PrismaClient): Promise<void> {
  await prisma.resourcePool.upsert({
    where: { pool_id: "OR-NUR-0001" },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "pool_id": "OR-NUR-0001",
      "pool_name": "OR Nursing Pool",
      "department_id": 1,
      "department": "Surgery",
      "location": "Main OR",
      "primary_role": "OR Nurse",
      "static_pct": 50,
      "dynamic_pct": 50,
      "metadata": {
        "icon": "Users",
        "color": "blue",
        "status": "active"
      }
    },
  });

  await prisma.resourcePool.upsert({
    where: { pool_id: "CHR-NUR-0001" },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "pool_id": "CHR-NUR-0001",
      "pool_name": "Charge Nurse Pool",
      "department_id": 3,
      "department": "Critical Care",
      "location": "East Wing, Floor 4",
      "primary_role": "Charge Nurse",
      "static_pct": 60,
      "dynamic_pct": 40,
      "metadata": {
        "createdAt": new Date("2026-03-15T09:00:00Z"),
        "createdBy": "HR_SYSTEM",
        "updatedAt": new Date("2026-05-20T14:30:00Z"),
        "effectiveTo": new Date("2027-03-14T23:59:59Z"),
        "approvalDate": new Date("2026-03-14T15:30:00Z"),
        "effectiveFrom": new Date("2026-03-15T00:00:00Z"),
        "lastModifiedBy": "admin@hospital.org",
        "complianceLevel": "HEALTHCARE_STANDARD",
        "validationStatus": "VALIDATED"
      }
    },
  });

  await prisma.resourcePool.upsert({
    where: { pool_id: "SEN-NUR-0001" },
    update: {},
    create: {
      "id": 3,
      "organization_id": 1,
      "pool_id": "SEN-NUR-0001",
      "pool_name": "Senior Staff Nurse Pool",
      "department_id": 3,
      "department": "Critical Care",
      "location": "East Wing, Floor 4",
      "primary_role": "Senior Staff Nurse",
      "static_pct": 60,
      "dynamic_pct": 40,
      "metadata": {
        "createdAt": new Date("2026-03-15T09:00:00Z"),
        "createdBy": "HR_SYSTEM",
        "updatedAt": new Date("2026-05-20T14:30:00Z"),
        "effectiveTo": new Date("2027-03-14T23:59:59Z"),
        "approvalDate": new Date("2026-03-14T15:30:00Z"),
        "effectiveFrom": new Date("2026-03-15T00:00:00Z"),
        "lastModifiedBy": "admin@hospital.org",
        "complianceLevel": "HEALTHCARE_STANDARD",
        "validationStatus": "VALIDATED"
      }
    },
  });

  // Environmental Services Pool
  await prisma.resourcePool.upsert({
    where: { pool_id: "ENV-POOL-0001" },
    update: {},
    create: {
      id: 4,
      organization_id: 1,
      pool_id: "ENV-POOL-0001",
      pool_name: "Environmental Services Pool",
      department_id: 3,
      department: "Critical Care",
      location: "East Wing, Floor 4",
      primary_role: "Environmental Services Worker",
      static_pct: 60,
      dynamic_pct: 40,
      metadata: {
        createdAt: "2026-03-15T09:00:00Z",
        updatedAt: "2026-05-20T14:30:00Z",
        createdBy: "HR_SYSTEM",
        complianceLevel: "HEALTHCARE_STANDARD",
        validationStatus: "VALIDATED",
        effectiveFrom: "2026-03-15T00:00:00Z",
        effectiveTo: "2027-03-14T23:59:59Z",
        lastModifiedBy: "admin@hospital.org",
        approvalDate: "2026-03-14T15:30:00Z",
      },
    },
  });

  // Scrub Nurse Pool
  await prisma.resourcePool.upsert({
    where: { pool_id: "SCRUB-NUR-0001" },
    update: {},
    create: {
      id: 5,
      organization_id: 1,
      pool_id: "SCRUB-NUR-0001",
      pool_name: "Scrub Nurse Pool",
      department_id: 3,
      department: "Critical Care",
      location: "East Wing, Floor 4",
      primary_role: "Scrub Nurse",
      static_pct: 60,
      dynamic_pct: 40,
      metadata: {
        createdAt: "2026-03-15T09:00:00Z",
        updatedAt: "2026-05-20T14:30:00Z",
        createdBy: "HR_SYSTEM",
        complianceLevel: "HEALTHCARE_STANDARD",
        validationStatus: "VALIDATED",
        effectiveFrom: "2026-03-15T00:00:00Z",
        effectiveTo: "2027-03-14T23:59:59Z",
        lastModifiedBy: "admin@hospital.org",
        approvalDate: "2026-03-14T15:30:00Z",
      },
    },
  });

  // Anesthesiologist Pool
  await prisma.resourcePool.upsert({
    where: { pool_id: "ANES-POOL-0001" },
    update: {},
    create: {
      id: 6,
      organization_id: 1,
      pool_id: "ANES-POOL-0001",
      pool_name: "Anesthesiologist Pool",
      department_id: 3,
      department: "Critical Care",
      location: "East Wing, Floor 4",
      primary_role: "Anesthesiologist",
      static_pct: 60,
      dynamic_pct: 40,
      metadata: {
        createdAt: "2026-03-15T09:00:00Z",
        updatedAt: "2026-05-20T14:30:00Z",
        createdBy: "HR_SYSTEM",
        complianceLevel: "HEALTHCARE_STANDARD",
        validationStatus: "VALIDATED",
        effectiveFrom: "2026-03-15T00:00:00Z",
        effectiveTo: "2027-03-14T23:59:59Z",
        lastModifiedBy: "admin@hospital.org",
        approvalDate: "2026-03-14T15:30:00Z",
      },
    },
  });

  // Senior Anesthesiologist Pool
  await prisma.resourcePool.upsert({
    where: { pool_id: "ANES-POOL-0002" },
    update: {},
    create: {
      id: 7,
      organization_id: 1,
      pool_id: "ANES-POOL-0002",
      pool_name: "Senior Anesthesiologist Pool",
      department_id: 3,
      department: "Critical Care",
      location: "East Wing, Floor 4",
      primary_role: "Senior Anesthesiologist",
      static_pct: 60,
      dynamic_pct: 40,
      metadata: {
        createdAt: "2026-03-15T09:00:00Z",
        updatedAt: "2026-05-20T14:30:00Z",
        createdBy: "HR_SYSTEM",
        complianceLevel: "HEALTHCARE_STANDARD",
        validationStatus: "VALIDATED",
        effectiveFrom: "2026-03-15T00:00:00Z",
        effectiveTo: "2027-03-14T23:59:59Z",
        lastModifiedBy: "admin@hospital.org",
        approvalDate: "2026-03-14T15:30:00Z",
      },
    },
  });
}
