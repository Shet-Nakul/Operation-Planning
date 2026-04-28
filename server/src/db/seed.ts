import { PrismaClient, ContractType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 0. Clear existing data to avoid conflicts on unique fields (optional, but cleaner for a full re-seed)
  // await prisma.userActivityLog.deleteMany({});
  // await prisma.contract.deleteMany({});
  // await prisma.forbiddenPattern.deleteMany({});
  // await prisma.user.deleteMany({});
  // await prisma.organization.deleteMany({});
  // await prisma.role.deleteMany({});

  // 1. Seed Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Administrator' },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER', description: 'Standard User' },
  });

  // 2. Seed Organization
  const org = await prisma.organization.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Central Hospital',
      contact_number: '123456789',
      contact_email: 'admin@centralhospital.com',
    },
  });

  // 3. Seed Users
  const password = await bcrypt.hash('password123', 10);
  
  // Default Admin
  await prisma.user.upsert({
    where: { email: 'admin@centralhospital.com' },
    update: {},
    create: {
      organization_id: org.id,
      role_id: adminRole.id,
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@centralhospital.com',
      password_hash: password,
    },
  });

  // HR_SYSTEM User
  await prisma.user.upsert({
    where: { email: 'hr_system@hospital.org' },
    update: {},
    create: {
      organization_id: org.id,
      role_id: userRole.id,
      first_name: 'HR',
      last_name: 'System',
      email: 'hr_system@hospital.org',
      password_hash: password,
    },
  });

  // admin@hospital.org User
  await prisma.user.upsert({
    where: { email: 'admin@hospital.org' },
    update: {},
    create: {
      organization_id: org.id,
      role_id: adminRole.id,
      first_name: 'Org',
      last_name: 'Admin',
      email: 'admin@hospital.org',
      password_hash: password,
    },
  });

  // 4. Seed Global Settings
  await prisma.globalSettings.upsert({
    where: { organization_id: org.id },
    update: {},
    create: {
      organization_id: org.id,
      business_hours_start: "8:00",
      business_hours_end: "18:00",
      surgery_planning_horizon: 3,
      roster_planning_horizon: 28,
      surgery_planning_resolution: 15,
    },
  });

  // 5. Seed Staff Tags (Roles)
  const surgeonTag = await prisma.staffTag.create({
    data: {
      organization_id: org.id,
      name: "Surgeon",
      color: "#4F46E5",
    },
  });

  // 6. Seed Specializations
  await prisma.specialization.create({
    data: {
      organization_id: org.id,
      name: "Oncology",
      description: "Cancer-related surgical procedures",
    },
  });

  // 7. Seed Skills
  await prisma.skill.create({
    data: {
      organization_id: org.id,
      name: "Robotic Surgery",
      description: "Certification for Da Vinci surgical systems",
    },
  });

  // 8. Seed Shifts
  await prisma.shift.create({
    data: {
      organization_id: org.id,
      name: "Day",
      start_time: "8:00",
      end_time: "16:00",
      description: "Standard Day Shift",
    },
  });

  // 9. Seed Forbidden Patterns (All from req.md)
  await prisma.forbiddenPattern.create({
    data: {
      organization_id: org.id,
      scope: "GLOBAL",
      applies_to: "ALL_CONTRACT_TYPES",
      forbidden_patterns: [
        {
          id: "late_followed_day",
          name: "Late Followed by Day",
          description: "Prevents late shift directly followed by day shift - applies to all contracts",
          active: false,
          mode: "HARD",
          weight: 10,
          pattern: ["L", "D"],
          violationType: "SHIFT_SEQUENCE",
          category: "FATIGUE_PREVENTION"
        },
        {
          id: "day_followed_early_followed_day",
          name: "Day-Early-Day Pattern",
          description: "Prevents day-early-day three-shift sequence - applies to all contracts",
          active: false,
          mode: "HARD",
          weight: 10,
          pattern: ["D", "E", "D"],
          violationType: "SHIFT_SEQUENCE",
          category: "FATIGUE_PREVENTION"
        },
        {
          id: "late_followed_early",
          name: "Late Followed by Early",
          description: "Prevents late shift directly followed by early shift - applies to all contracts",
          active: false,
          mode: "HARD",
          weight: 10,
          pattern: ["L", "E"],
          violationType: "SHIFT_SEQUENCE",
          category: "INSUFFICIENT_REST"
        },
        {
          id: "late_followed_night",
          name: "Late Followed by Night",
          description: "Prevents late shift directly followed by night shift - applies to all contracts",
          active: false,
          mode: "HARD",
          weight: 10,
          pattern: ["L", "N"],
          violationType: "SHIFT_SEQUENCE",
          category: "FATIGUE_PREVENTION"
        },
        {
          id: "day_followed_night",
          name: "Day Followed by Night",
          description: "Prevents day shift directly followed by night shift - applies to all contracts",
          active: false,
          mode: "HARD",
          weight: 10,
          pattern: ["D", "N"],
          violationType: "SHIFT_SEQUENCE",
          category: "FATIGUE_PREVENTION"
        },
        {
          id: "night_followed_day",
          name: "Night Followed by Day",
          description: "Prevents night shift directly followed by day shift - applies to all contracts",
          active: false,
          mode: "HARD",
          weight: 10,
          pattern: ["N", "D"],
          violationType: "SHIFT_SEQUENCE",
          category: "INSUFFICIENT_REST"
        },
        {
          id: "night_followed_early",
          name: "Night Followed by Early",
          description: "Prevents night shift directly followed by early shift - applies to all contracts",
          active: false,
          mode: "HARD",
          weight: 10,
          pattern: ["N", "E"],
          violationType: "SHIFT_SEQUENCE",
          category: "INSUFFICIENT_REST"
        }
      ],
      metadata: {
        version: "1.0",
        createdAt: "2026-04-23T00:00:00Z",
        updatedAt: "2026-04-23T00:00:00Z",
        enforceMode: "GLOBAL_OPTIMIZATION",
        contractType: "DYNAMIC",
        priority: "HIGH"
      }
    },
  });

  // 10. Seed Contracts (Static + Dynamic from req.md)
  
  // Static Contract
  await prisma.contract.create({
    data: {
      organization_id: org.id,
      name: "Senior Surgeon Standard 40h",
      type: ContractType.STATIC,
      status: "Active",
      staff_tags: ["tag_surgeon"],
      configuration: {
        annualEntitlements: { yearlyLeaves: 28, preferredShiftsPerYear: 12 },
        weeklyHours: 40.0,
        weeklyBreakMinutes: 300,
        activeDaysPerWeek: 5
      }
    },
  });

  // Dynamic Contract
  await prisma.contract.create({
    data: {
      organization_id: org.id,
      name: "Resident Doctor Flexible Q3",
      type: ContractType.DYNAMIC,
      status: "Active",
      staff_tags: ["tag_surgeon", "tag_resident"],
      configuration: {
        annualEntitlements: {
          yearlyEntitledLeaves: 25,
          yearlyEntitledPreferredShifts: 12
        },
        schedulingRules: {
          completeWeekends: { mode: "HARD", active: true },
          identicalShiftTypesDuringWeekend: { mode: "HARD", active: true },
          noNightShiftBeforeFreeWeekend: { mode: "HARD", active: true },
          noFreeDayBeforeWorkingWeekend: { mode: "HARD", active: true }
        },
        assignmentLimits: {
          maxNumAssignments: { value: 22, mode: "HARD", active: true },
          minNumAssignments: { value: 18, mode: "HARD", active: true },
          maxConsecutiveWorkingDays: { value: 5, mode: "HARD", active: true },
          minConsecutiveWorkingDays: { value: 3, mode: "HARD", active: true },
          maxConsecutiveFreeDays: { value: 5, mode: "HARD", active: true },
          minConsecutiveFreeDays: { value: 2, mode: "HARD", active: true },
          maxConsecutiveWorkingWeekends: { value: 5, mode: "HARD", active: true },
          minConsecutiveWorkingWeekends: { value: 2, mode: "HARD", active: true }
        }
      },
      global_settings: {
        inheritsForbiddenPatterns: true,
        forbiddenPatternsSource: "GLOBAL_PATTERN_REGISTRY"
      },
      metadata: {
        contractVersion: "2.0",
        createdAt: "2026-04-23T00:00:00Z",
        updatedAt: "2026-04-23T00:00:00Z",
        createdBy: "hr_system@hospital.org",
        department: "Surgery",
        specialization: "General Surgery",
        supervisionLevel: "SUPERVISED",
        complianceLevel: "HEALTHCARE_STANDARD",
        validationStatus: "VALIDATED",
        effectiveFrom: "2026-05-01T00:00:00Z",
        effectiveTo: "2027-04-30T23:59:59Z",
        lastModifiedBy: "admin@hospital.org",
        approvalDate: "2026-04-22T15:30:00Z"
      }
    },
  });

  console.log('Seed data updated with full Forbidden Patterns and Dynamic Contract from req.md');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
