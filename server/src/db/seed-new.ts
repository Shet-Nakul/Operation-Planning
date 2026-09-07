import { PrismaClient, ContractType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {

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
  
  // Dynamic Contract
  await prisma.contract.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Nurse Full Time" } },
    update: {},
    create: {
      organization_id: org.id,
      contract_id: "DYN-0002",
      name: "Nurse Full Time",
      type: ContractType.DYNAMIC,
      status: "Active",
      staff_tags: ["Charge Nurse", "Senior Staff Nurse", "OR Nurse"],
      configuration: {
        annualEntitlements: {
          yearlyEntitledLeaves: 25,
          yearlyEntitledPreferredShifts: 12
        },
        schedulingRules: {
          complete_weekends: { mode: "HARD", active: true },
          identical_shift_types_during_weekend: { mode: "HARD", active: true },
          no_night_shift_before_free_weekend: { mode: "HARD", active: true },
          no_free_day_before_working_weekend: { mode: "HARD", active: true }
        },
        assignmentLimits: {
          max_num_assignments: { value: 22, mode: "HARD", active: true },
          min_num_assignments: { value: 18, mode: "HARD", active: true },
          max_consecutive_working_days: { value: 5, mode: "HARD", active: true },
          min_consecutive_working_days: { value: 3, mode: "HARD", active: true },
          max_consecutive_free_days: { value: 5, mode: "HARD", active: true },
          min_consecutive_free_days: { value: 2, mode: "HARD", active: true },
          max_consecutive_working_weekends: { value: 5, mode: "HARD", active: true },
          min_consecutive_working_weekends: { value: 2, mode: "HARD", active: true }
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

  // Pool for Charge Nurse
  await prisma.$transaction([
    // ============================================================
    // CHARGE NURSE POOL
    // ============================================================
    prisma.resourcePool.upsert({
      where: { pool_id: "CHR-NUR-0001" },
      update: {},
      create: {
        organization_id: org.id,
        pool_id: "CHR-NUR-0001",
        pool_name: "Charge Nurse Pool",
        department_id: 3,
        department: "Critical Care",
        location: "East Wing, Floor 4",
        primary_role: "Charge Nurse",
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
    }),

    // ============================================================
    // SENIOR STAFF NURSE POOL
    // ============================================================
    prisma.resourcePool.upsert({
      where: { pool_id: "SEN-NUR-0001" },
      update: {},
      create: {
        organization_id: org.id,
        pool_id: "SEN-NUR-0001",
        pool_name: "Senior Staff Nurse Pool",
        department_id: 3,
        department: "Critical Care",
        location: "East Wing, Floor 4",
        primary_role: "Senior Staff Nurse",
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
    }),

    // ============================================================
    // ENVIRONMENTAL SERVICES POOL
    // ============================================================
    prisma.resourcePool.upsert({
      where: { pool_id: "ENV-POOL-0001" },
      update: {},
      create: {
        organization_id: org.id,
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
    }),

    // ============================================================
    // OR NURSE POOL
    // ============================================================
    prisma.resourcePool.upsert({
      where: { pool_id: "OR-NUR-0001" },
      update: {},
      create: {
        organization_id: org.id,
        pool_id: "OR-NUR-0001",
        pool_name: "OR Nurse Pool",
        department_id: 3,
        department: "Critical Care",
        location: "East Wing, Floor 4",
        primary_role: "Operating Room Nurse",
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
    }),

    // ============================================================
    // SCRUB NURSE POOL
    // ============================================================
    prisma.resourcePool.upsert({
      where: { pool_id: "SCRUB-NUR-0001" },
      update: {},
      create: {
        organization_id: org.id,
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
    }),

    // ============================================================
    // ANESTHESIOLOGIST POOL
    // ============================================================
    prisma.resourcePool.upsert({
      where: { pool_id: "ANES-POOL-0001" },
      update: {},
      create: {
        organization_id: org.id,
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
    }),

    // ============================================================
    // SENIOR ANESTHESIOLOGIST POOL
    // ============================================================
    prisma.resourcePool.upsert({
      where: { pool_id: "ANES-POOL-0002" },
      update: {},
      create: {
        organization_id: org.id,
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
    }),
  ]);

  // Fetch the created pools to get their integer IDs for the Demand Configs
  const orNurPool = await prisma.resourcePool.findUniqueOrThrow({ where: { pool_id: "OR-NUR-0001" } });
  const scrubNurPool = await prisma.resourcePool.findUniqueOrThrow({ where: { pool_id: "SCRUB-NUR-0001" } });
  const envPool = await prisma.resourcePool.findUniqueOrThrow({ where: { pool_id: "ENV-POOL-0001" } });
  const anesPool1 = await prisma.resourcePool.findUniqueOrThrow({ where: { pool_id: "ANES-POOL-0001" } });
  const anesPool2 = await prisma.resourcePool.findUniqueOrThrow({ where: { pool_id: "ANES-POOL-0002" } });


  // OR Nurse Pool
  await prisma.poolDemandConfig.create({
    data: {
      pool_id: orNurPool.id,
      effective_from: new Date('2026-05-25'),
      effective_to: new Date('2026-06-01'),
      weekly_hours: 80,
      demand_matrix: [
        { shift: "Day",   monday: 3, tuesday: 3, wednesday: 3, thursday: 3, friday: 3, saturday: 1, sunday: 1 },
        { shift: "Early", monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 1, sunday: 1 },
        { shift: "Late",  monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 1, sunday: 1 }
      ]
    }
  });

  // Scrub Nurse Pool
  await prisma.poolDemandConfig.create({
    data: {
      pool_id: scrubNurPool.id,
      effective_from: new Date('2026-05-25'),
      effective_to: new Date('2026-06-01'),
      weekly_hours: 80,
      demand_matrix: [
        { shift: "Day",   monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 1, sunday: 1 },
        { shift: "Early", monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 1, sunday: 1 },
        { shift: "Late",  monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 1, sunday: 1 }
      ]
    }
  });

  // Environmental Services Pool
  await prisma.poolDemandConfig.create({
    data: {
      pool_id: envPool.id,
      effective_from: new Date('2026-05-25'),
      effective_to: new Date('2026-06-01'),
      weekly_hours: 80,
      demand_matrix: [
        { shift: "Day",   monday: 4, tuesday: 4, wednesday: 4, thursday: 4, friday: 3, saturday: 2, sunday: 2 },
        { shift: "Early", monday: 3, tuesday: 3, wednesday: 3, thursday: 3, friday: 3, saturday: 2, sunday: 2 },
        { shift: "Late",  monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 1, saturday: 1, sunday: 1 }
      ]
    }
  });

  // Anesthesiologist Pool
  await prisma.poolDemandConfig.create({
    data: {
      pool_id: anesPool1.id,
      effective_from: new Date('2026-05-25'),
      effective_to: new Date('2026-06-01'),
      weekly_hours: 80,
      demand_matrix: [
        { shift: "Day",   monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 1, sunday: 1 },
        { shift: "Early", monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 1, sunday: 1 },
        { shift: "Late",  monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 1, sunday: 1 }
      ]
    }
  });

  // Senior Anesthesiologist Pool
  await prisma.poolDemandConfig.create({
    data: {
      pool_id: anesPool2.id,
      effective_from: new Date('2026-05-25'),
      effective_to: new Date('2026-06-01'),
      weekly_hours: 80,
      demand_matrix: [
        { shift: "Day",   monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 0, sunday: 0 },
        { shift: "Early", monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 0, sunday: 0 }
      ]
    }
  });

  await prisma.$transaction([
    // ============================================================
    // STAFF-0001
    // ============================================================
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0001" },
      update: {},
      create: {
        organization_id: org.id,
        staff_id: "STAFF-0001",
        name: "Sarah Johnson",
        address: "1247 Maple Avenue, Vancouver, BC V6B 2K3",
        phone: "+1-604-555-0128",
        email: "sarah.dynamic@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.75,
          "Charge Nurse": 0.25,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHA-NUR-0005",
          },
        ],
      },
    }),

    // ============================================================
    // STAFF-0002
    // ============================================================
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0002" },
      update: {},
      create: {
        organization_id: org.id,
        staff_id: "STAFF-0002",
        name: "John Doe",
        address: "5678 Oak Street, Vancouver, BC V6B 3L4",
        phone: "+1-604-555-0199",
        email: "john.dynamic@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.75,
          "Charge Nurse": 0.25,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHR-NUR-0001",
          },
        ],
      },
    }),

    // ============================================================
    // STAFF-0003
    // ============================================================
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0003" },
      update: {},
      create: {
        organization_id: org.id,
        staff_id: "STAFF-0003",
        name: "Taylor Smith",
        address: "1247 Maple Avenue, Vancouver, BC V6B 2K3",
        phone: "+1-604-555-0128",
        email: "taylor.dynamic@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.75,
          "Charge Nurse": 0.25,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHR-NUR-0001",
          },
        ],
      },
    }),

    // ============================================================
    // STAFF-0004
    // ============================================================
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0004" },
      update: {},
      create: {
        organization_id: org.id,
        staff_id: "STAFF-0004",
        name: "Jordan Lee",
        address: "1250 Oak Street, Vancouver, BC V6B 3K4",
        phone: "+1-604-555-0130",
        email: "jordan.dynamic@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.75,
          "Charge Nurse": 0.25,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHR-NUR-0001",
          },
        ],
      },
    }),

    // ============================================================
    // STAFF-0005
    // ============================================================
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0005" },
      update: {},
      create: {
        organization_id: org.id,
        staff_id: "STAFF-0005",
        name: "Alex Kim",
        address: "1260 Pine Street, Vancouver, BC V6B 4L5",
        phone: "+1-604-555-0131",
        email: "alex.dynamic@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.75,
          "Charge Nurse": 0.25,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHR-NUR-0001",
          },
        ],
      },
    }),

    // ============================================================
    // STAFF-0006
    // ============================================================
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0006" },
      update: {},
      create: {
        organization_id: org.id,
        staff_id: "STAFF-0006",
        name: "Chris Lee",
        address: "1247 Maple Avenue, Vancouver, BC V6B 2K3",
        phone: "+1-604-555-0128",
        email: "chris.dynamic@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.5,
          "Charge Nurse": 0.5,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHR-NUR-0001",
          },
        ],
      },
    }),

    // ============================================================
    // STAFF-0007
    // ============================================================
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0007" },
      update: {},
      create: {
        organization_id: org.id,
        staff_id: "STAFF-0007",
        name: "Morgan Brown",
        address: "5678 Oak Street, Vancouver, BC V6B 3L4",
        phone: "+1-604-555-0199",
        email: "morgan.dynamic@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.5,
          "Charge Nurse": 0.5,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHR-NUR-0001",
          },
        ],
      },
    }),

    // ============================================================
    // STAFF-0008
    // ============================================================
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0008" },
      update: {},
      create: {
        organization_id: org.id,
        staff_id: "STAFF-0008",
        name: "Kim Taylor",
        address: "1247 Maple Avenue, Vancouver, BC V6B 2K3",
        phone: "+1-604-555-0128",
        email: "kim.taylor@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.25,
          "Charge Nurse": 0.75,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHR-NUR-0001",
          },
        ],
      },
    }),

    // ============================================================
    // STAFF-0009
    // ============================================================
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0009" },
      update: {},
      create: {
        organization_id: org.id,
        staff_id: "STAFF-0009",
        name: "Leonard White",
        address: "1250 Oak Street, Vancouver, BC V6B 3K4",
        phone: "+1-604-555-0130",
        email: "leonard.white@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.25,
          "Charge Nurse": 0.75,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHR-NUR-0001",
          },
        ],
      },
    }),

    // ============================================================
    // STAFF-0010
    // ============================================================
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0010" },
      update: {},
      create: {
        organization_id: org.id,
        staff_id: "STAFF-0010",
        name: "Samantha Green",
        address: "1260 Pine Street, Vancouver, BC V6B 4L5",
        phone: "+1-604-555-0131",
        email: "samantha.green@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.25,
          "Charge Nurse": 0.75,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHR-NUR-0001",
          },
        ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0100" },
      update: {},
      create: {
        organization_id: org.id,
        staff_id: "STAFF-0100",
        name: "Dr. Michael Anderson",
        address: "825 West 12th Avenue, Vancouver, BC V5Z 1M9",
        phone: "+1-604-555-0184",
        email: "michael.anderson@hospital.ca",
        profile_picture: "https://example.com/profiles/michael_anderson.jpg",

        department_id: 3,
        department: "Critical Care",
        designation: "Consultant Anesthesiologist",

        contract_id: "DYN-0001",
        supervisor: "Dr. Robert Williams",

        skills: [
          "General Anesthesia",
          "Regional Anesthesia",
          "Airway Management",
          "Critical Care",
          "Pain Management",
          "Preoperative Assessment",
          "Intraoperative Monitoring",
          "Emergency Anesthesia",
        ],

        certifications: [
          "Medical License - BC",
          "Royal College Certified - Anesthesiology",
          "Advanced Cardiac Life Support (ACLS)",
          "Advanced Trauma Life Support (ATLS)",
        ],

        roles: [
          "Senior Anesthesiologist",
          "Anesthesiologist",
        ],

        role_distribution: {
          "Senior Anesthesiologist": 0.8,
          "Anesthesiologist": 0.2,
        },

        weekly_template: {},

        pool_assignments: [
          {
          pool_name: "Senior Anesthesiologist Pool",
          pool_id: "ANES-POOL-0001",
          },
          {
          pool_name: "Anesthesiologist Pool",
          pool_id: "ANES-POOL-0002",
          },
        ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0101" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0101",
      name: "Dr. Lisa Chen",
      address: "825 West 12th Avenue, Vancouver, BC V5Z 1M9",
      phone: "+1-604-555-0184",
      email: "lisa.chen@hospital.ca",
      profile_picture: "https://example.com/profiles/lisa_chen.jpg",

      department_id: 3,
      department: "Critical Care",
      designation: "Consultant Anesthesiologist",

      contract_id: "DYN-0001",
      supervisor: "Dr. Robert Williams",

      skills: [
          "General Anesthesia",
          "Regional Anesthesia",
          "Airway Management",
          "Critical Care",
          "Pain Management",
          "Preoperative Assessment",
          "Intraoperative Monitoring",
          "Emergency Anesthesia",
      ],

      certifications: [
          "Medical License - BC",
          "Royal College Certified - Anesthesiology",
          "Advanced Cardiac Life Support (ACLS)",
          "Advanced Trauma Life Support (ATLS)",
      ],

      roles: [
          "Senior Anesthesiologist",
          "Anesthesiologist",
      ],

      role_distribution: {
          "Senior Anesthesiologist": 0.8,
          "Anesthesiologist": 0.2,
      },

      weekly_template: {},

      pool_assignments: [
          {
          pool_name: "Senior Anesthesiologist Pool",
          pool_id: "ANES-POOL-0001",
          },
          {
          pool_name: "Anesthesiologist Pool",
          pool_id: "ANES-POOL-0002",
          },
      ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0102" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0102",
      name: "Dr. Michael Brown",
      address: "123 East 8th Street, Vancouver, BC V5K 2L3",
      phone: "+1-604-555-0199",
      email: "michael.brown@hospital.ca",
      profile_picture: "https://example.com/profiles/michael_brown.jpg",

      department_id: 3,
      department: "Critical Care",
      designation: "Consultant Anesthesiologist",

      contract_id: "DYN-0001",
      supervisor: "Dr. Robert Williams",

      skills: [
          "General Anesthesia",
          "Regional Anesthesia",
          "Airway Management",
          "Critical Care",
          "Pain Management",
          "Preoperative Assessment",
          "Intraoperative Monitoring",
          "Emergency Anesthesia",
      ],

      certifications: [
          "Medical License - BC",
          "Royal College Certified - Anesthesiology",
          "Advanced Cardiac Life Support (ACLS)",
          "Advanced Trauma Life Support (ATLS)",
      ],

      roles: [
          "Senior Anesthesiologist",
          "Anesthesiologist",
      ],

      role_distribution: {
          "Senior Anesthesiologist": 0.8,
          "Anesthesiologist": 0.2,
      },

      weekly_template: {},

      pool_assignments: [
          {
          pool_name: "Senior Anesthesiologist Pool",
          pool_id: "ANES-POOL-0001",
          },
          {
          pool_name: "Anesthesiologist Pool",
          pool_id: "ANES-POOL-0002",
          },
      ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0103" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0103",
      name: "Dr. Emily Davis",
      address: "123 East 8th Street, Vancouver, BC V5K 2L3",
      phone: "+1-604-555-0199",
      email: "emily.davis@hospital.ca",
      profile_picture: "https://example.com/profiles/emily_davis.jpg",

      department_id: 3,
      department: "Critical Care",
      designation: "Consultant Anesthesiologist",

      contract_id: "DYN-0001",
      supervisor: "Dr. Robert Williams",

      skills: [
          "General Anesthesia",
          "Regional Anesthesia",
          "Airway Management",
          "Critical Care",
          "Pain Management",
          "Preoperative Assessment",
          "Intraoperative Monitoring",
          "Emergency Anesthesia",
      ],

      certifications: [
          "Medical License - BC",
          "Royal College Certified - Anesthesiology",
          "Advanced Cardiac Life Support (ACLS)",
          "Advanced Trauma Life Support (ATLS)",
      ],

      roles: [
          "Senior Anesthesiologist",
          "Anesthesiologist",
      ],

      role_distribution: {
          "Senior Anesthesiologist": 0.8,
          "Anesthesiologist": 0.2,
      },

      weekly_template: {},

      pool_assignments: [
          {
          pool_name: "Senior Anesthesiologist Pool",
          pool_id: "ANES-POOL-0001",
          },
          {
          pool_name: "Anesthesiologist Pool",
          pool_id: "ANES-POOL-0002",
          },
      ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0104" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0104",
      name: "Dr. John Smith",
      address: "123 East 8th Street, Vancouver, BC V5K 2L3",
      phone: "+1-604-555-0199",
      email: "john.smith@hospital.ca",
      profile_picture: "https://example.com/profiles/john_smith.jpg",

      department_id: 3,
      department: "Critical Care",
      designation: "Consultant Anesthesiologist",

      contract_id: "DYN-0001",
      supervisor: "Dr. Robert Williams",

      skills: [
          "General Anesthesia",
          "Regional Anesthesia",
          "Airway Management",
          "Critical Care",
          "Pain Management",
          "Preoperative Assessment",
          "Intraoperative Monitoring",
          "Emergency Anesthesia",
      ],

      certifications: [
          "Medical License - BC",
          "Royal College Certified - Anesthesiology",
          "Advanced Cardiac Life Support (ACLS)",
          "Advanced Trauma Life Support (ATLS)",
      ],

      roles: [
          "Senior Anesthesiologist",
          "Anesthesiologist",
      ],

      role_distribution: {
          "Senior Anesthesiologist": 0.8,
          "Anesthesiologist": 0.2,
      },

      weekly_template: {},

      pool_assignments: [
          {
          pool_name: "Senior Anesthesiologist Pool",
          pool_id: "ANES-POOL-0001",
          },
          {
          pool_name: "Anesthesiologist Pool",
          pool_id: "ANES-POOL-0002",
          },
      ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0105" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0105",
      name: "Dr. Sophia Patel",
      address: "123 East 8th Street, Vancouver, BC V5K 2L3",
      phone: "+1-604-555-0199",
      email: "sophia.patel@hospital.ca",
      profile_picture: "https://example.com/profiles/sophia_patel.jpg",

      department_id: 3,
      department: "Critical Care",
      designation: "Consultant Anesthesiologist",

      contract_id: "DYN-0001",
      supervisor: "Dr. Robert Williams",

      skills: [
          "General Anesthesia",
          "Regional Anesthesia",
          "Airway Management",
          "Critical Care",
          "Pain Management",
          "Preoperative Assessment",
          "Intraoperative Monitoring",
          "Emergency Anesthesia",
      ],

      certifications: [
          "Medical License - BC",
          "Royal College Certified - Anesthesiology",
          "Advanced Cardiac Life Support (ACLS)",
          "Advanced Trauma Life Support (ATLS)",
      ],

      roles: [
          "Senior Anesthesiologist",
          "Anesthesiologist",
      ],

      role_distribution: {
          "Senior Anesthesiologist": 0.8,
          "Anesthesiologist": 0.2,
      },

      weekly_template: {},

      pool_assignments: [
          {
          pool_name: "Senior Anesthesiologist Pool",
          pool_id: "ANES-POOL-0001",
          },
          {
          pool_name: "Anesthesiologist Pool",
          pool_id: "ANES-POOL-0002",
          },
      ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0106" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0106",
      name: "Dr. Sophia Patel",
      address: "825 West 12th Avenue, Vancouver, BC V5Z 1M9",
      phone: "+1-604-555-0184",
      email: "sophia.patel@hospital.ca",
      profile_picture: "https://example.com/profiles/sophia_patel.jpg",

      department_id: 3,
      department: "Critical Care",
      designation: "Consultant Anesthesiologist",

      contract_id: "DYN-0001",
      supervisor: "Dr. Robert Williams",

      skills: [
          "General Anesthesia",
          "Regional Anesthesia",
          "Airway Management",
          "Critical Care",
          "Pain Management",
          "Preoperative Assessment",
          "Intraoperative Monitoring",
          "Emergency Anesthesia",
      ],

      certifications: [
          "Medical License - BC",
          "Royal College Certified - Anesthesiology",
          "Advanced Cardiac Life Support (ACLS)",
          "Advanced Trauma Life Support (ATLS)",
      ],

      roles: [
          "Senior Anesthesiologist",
          "Anesthesiologist",
      ],

      role_distribution: {
          "Senior Anesthesiologist": 0.8,
          "Anesthesiologist": 0.2,
      },

      weekly_template: {},

      pool_assignments: [
          {
          pool_name: "Senior Anesthesiologist Pool",
          pool_id: "ANES-POOL-0001",
          },
          {
          pool_name: "Anesthesiologist Pool",
          pool_id: "ANES-POOL-0002",
          },
      ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0107" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0107",
      name: "Dr. James Wilson",
      address: "825 West 12th Avenue, Vancouver, BC V5Z 1M9",
      phone: "+1-604-555-0184",
      email: "james.wilson@hospital.ca",
      profile_picture: "https://example.com/profiles/james_wilson.jpg",

      department_id: 3,
      department: "Critical Care",
      designation: "Consultant Anesthesiologist",

      contract_id: "DYN-0001",
      supervisor: "Dr. Robert Williams",

      skills: [
          "General Anesthesia",
          "Regional Anesthesia",
          "Airway Management",
          "Critical Care",
          "Pain Management",
          "Preoperative Assessment",
          "Intraoperative Monitoring",
          "Emergency Anesthesia",
      ],

      certifications: [
          "Medical License - BC",
          "Royal College Certified - Anesthesiology",
          "Advanced Cardiac Life Support (ACLS)",
          "Advanced Trauma Life Support (ATLS)",
      ],

      roles: [
          "Senior Anesthesiologist",
          "Anesthesiologist",
      ],

      role_distribution: {
          "Senior Anesthesiologist": 0.8,
          "Anesthesiologist": 0.2,
      },

      weekly_template: {},

      pool_assignments: [
          {
          pool_name: "Senior Anesthesiologist Pool",
          pool_id: "ANES-POOL-0001",
          },
          {
          pool_name: "Anesthesiologist Pool",
          pool_id: "ANES-POOL-0002",
          },
      ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0108" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0108",
      name: "Dr. Emily Clark",
      address: "123 East 8th Street, Vancouver, BC V5K 2L3",
      phone: "+1-604-555-0199",
      email: "emily.clark@hospital.ca",
      profile_picture: "https://example.com/profiles/emily_clark.jpg",

      department_id: 3,
      department: "Critical Care",
      designation: "Consultant Anesthesiologist",

      contract_id: "DYN-0001",
      supervisor: "Dr. Robert Williams",

      skills: [
          "General Anesthesia",
          "Regional Anesthesia",
          "Airway Management",
          "Critical Care",
          "Pain Management",
          "Preoperative Assessment",
          "Intraoperative Monitoring",
          "Emergency Anesthesia",
      ],

      certifications: [
          "Medical License - BC",
          "Royal College Certified - Anesthesiology",
          "Advanced Cardiac Life Support (ACLS)",
          "Advanced Trauma Life Support (ATLS)",
      ],

      roles: [
          "Senior Anesthesiologist",
          "Anesthesiologist",
      ],

      role_distribution: {
          "Senior Anesthesiologist": 0.8,
          "Anesthesiologist": 0.2,
      },

      weekly_template: {},

      pool_assignments: [
          {
          pool_name: "Senior Anesthesiologist Pool",
          pool_id: "ANES-POOL-0001",
          },
          {
          pool_name: "Anesthesiologist Pool",
          pool_id: "ANES-POOL-0002",
          },
      ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0200" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0200",
      name: "Maria Rodriguez",
      address: "1450 Oak Street, Vancouver, BC V6H 2N2",
      phone: "+1-604-555-0142",
      email: "maria.rodriguez@hospital.ca",
      profile_picture: "https://example.com/profiles/maria_rodriguez.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
    },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0201" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0201",
      name: "James Wilson",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "james.wilson@hospital.ca",
      profile_picture: "https://example.com/profiles/james_wilson.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0202" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0202",
      name: "Linda Thompson",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "linda.thompson@hospital.ca",
      profile_picture: "https://example.com/profiles/linda_thompson.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0203" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0203",
      name: "Robert Martinez",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "john.smith@hospital.ca",
      profile_picture: "https://example.com/profiles/john_smith.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
        "Hospital Cleaning",
        "Infection Control",
        "Waste Management",
        "Disinfection",
      ],
      certifications: [
        "WHMIS Certified",
        "Infection Prevention and Control",
      ],
      roles: [
        "Environmental Services Worker",
      ],
      role_distribution: {
        "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0204" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0204",
      name: "Angela Davis",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "jane.doe@hospital.ca",
      profile_picture: "https://example.com/profiles/jane_doe.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    prisma.staff.upsert({

      where: { staff_id: "STAFF-0205" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0205",
      name: "Michael Brown",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "john.smith@hospital.ca",
      profile_picture: "https://example.com/profiles/john_smith.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0206" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0206",
      name: "Jennifer Garcia",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "john.smith@hospital.ca",
      profile_picture: "https://example.com/profiles/john_smith.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0207" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0207",
      name: "David Anderson",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "john.smith@hospital.ca",
      profile_picture: "https://example.com/profiles/john_smith.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0208" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0208",
      name: "Patricia Miller",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "john.smith@hospital.ca",
      profile_picture: "https://example.com/profiles/john_smith.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0209" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0209",
      name: "Daniel Taylor",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "daniel.taylor@hospital.ca",
      profile_picture: "https://example.com/profiles/daniel_taylor.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0210" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0210",
      name: "Susan Johnson",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "susan.johnson@hospital.ca",
      profile_picture: "https://example.com/profiles/susan_johnson.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0212" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0212",
      name: "Carlos Hernandez",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "carlos.hernandez@hospital.ca",
      profile_picture: "https://example.com/profiles/carlos_hernandez.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),

    prisma.staff.upsert({
      where: { staff_id: "STAFF-0300" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0300",
      name: "Jessica Williams",
      address: "782 West 10th Avenue, Vancouver, BC V5Z 1L7",
      phone: "+1-604-555-0163",
      email: "jessica.williams@hospital.ca",
      profile_picture: "https://example.com/profiles/jessica_williams.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Operating Room Nurse",
      contract_id: "DYN-0001",
      supervisor: "Dr. Michael Anderson",
      skills: [
          "Operating Room Nursing",
          "Surgical Assistance",
          "Sterile Technique",
          "Patient Monitoring",
          "Preoperative Preparation",
          "Postoperative Care",
          "Instrument Handling",
      ],
      certifications: [
          "Registered Nurse (RN) - BC",
          "Basic Life Support (BLS)",
          "Advanced Cardiac Life Support (ACLS)",
          "Perioperative Nursing Certification",
      ],
      roles: [
          "Operating Room Nurse",
          "Scrub Nurse",
      ],
      role_distribution: {
          "Operating Room Nurse": 0.7,
          "Scrub Nurse": 0.3,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "OR Nurse Pool",
          pool_id: "OR-NUR-0001",
          },
          {
          pool_name: "Scrub Nurse Pool",
          pool_id: "SCRUB-NUR-0001",
          },
      ],
      },
    }),
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0301" },
      update: {},
      create: {
      organization_id: org.id,
      staff_id: "STAFF-0301",
      name: "Emily Carter",
      address: "782 West 10th Avenue, Vancouver, BC V5Z 1L7",
      phone: "+1-604-555-0163",
      email: "emily.carter@hospital.ca",
      profile_picture: "https://example.com/profiles/emily_carter.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Operating Room Nurse",
      contract_id: "DYN-0001",
      supervisor: "Dr. Michael Anderson",
      skills: [
          "Operating Room Nursing",
          "Surgical Assistance",
          "Sterile Technique",
          "Patient Monitoring",
          "Preoperative Preparation",
          "Postoperative Care",
          "Instrument Handling",
      ],
      certifications: [
          "Registered Nurse (RN) - BC",
          "Basic Life Support (BLS)",
          "Advanced Cardiac Life Support (ACLS)",
          "Perioperative Nursing Certification",
      ],
      roles: [
          "Operating Room Nurse",
          "Scrub Nurse",
      ],
      role_distribution: {
          "Operating Room Nurse": 0.7,
          "Scrub Nurse": 0.3,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "OR Nurse Pool",
          pool_id: "OR-NUR-0001",
          },
          {
          pool_name: "Scrub Nurse Pool",
          pool_id: "SCRUB-NUR-0001",
          },
      ],
      },
    }),

    prisma.staff.upsert({
        where: { staff_id: "STAFF-0302" },
        update: {},
        create: {
        organization_id: org.id,
        staff_id: "STAFF-0302",
        name: "Olivia Bennett",
        address: "782 West 10th Avenue, Vancouver, BC V5Z 1L7",
        phone: "+1-604-555-0163",
        email: "olivia.bennett@hospital.ca",
        profile_picture: "https://example.com/profiles/olivia_bennett.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    prisma.staff.upsert({
        where: { staff_id: "STAFF-0303" },
        update: {},
        create: {
        organization_id: org.id,
        staff_id: "STAFF-0303",
        name: "Sophia Mitchell",
        address: "782 West 10th Avenue, Vancouver, BC V5Z 1L7",
        phone: "+1-604-555-0163",
        email: "sophia.mitchell@hospital.ca",
        profile_picture: "https://example.com/profiles/sophia_mitchell.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    prisma.staff.upsert({
        where: { staff_id: "STAFF-0304" },
        update: {},
        create: {
        organization_id: org.id,
        staff_id: "STAFF-0304",
        name: "Hannah Anderson",
        address: "782 West 10th Avenue, Vancouver, BC V5Z 1L7",
        phone: "+1-604-555-0163",
        email: "hannah.anderson@hospital.ca",
        profile_picture: "https://example.com/profiles/hannah_anderson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    prisma.staff.upsert({
        where: { staff_id: "STAFF-0305" },
        update: {},
        create: {
        organization_id: org.id,
        staff_id: "STAFF-0305",
        name: "Rachel Thompson",
        address: "782 West 10th Avenue, Vancouver, BC V5Z 1L7",
        phone: "+1-604-555-0163",
        email: "rachel.thompson@hospital.ca",
        profile_picture: "https://example.com/profiles/rachel_thompson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    prisma.staff.upsert({
        where: { staff_id: "STAFF-0306" },
        update: {},
        create: {
        organization_id: org.id,
        staff_id: "STAFF-0306",
        name: "Lauren Parker",
        address: "782 West 10th Avenue, Vancouver, BC V5Z 1L7",
        phone: "+1-604-555-0163",
        email: "lauren.parker@hospital.ca",
        profile_picture: "https://example.com/profiles/lauren_parker.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    prisma.staff.upsert({
        where: { staff_id: "STAFF-0307" },
        update: {},
        create: {
        organization_id: org.id,
        staff_id: "STAFF-0307",
        name: "Rachel Thompson",
        address: "782 West 10th Avenue, Vancouver, BC V5Z 1L7",
        phone: "+1-604-555-0163",
        email: "rachel.thompson@hospital.ca",
        profile_picture: "https://example.com/profiles/rachel_thompson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    prisma.staff.upsert({
        where: { staff_id: "STAFF-0308" },
        update: {},
        create: {
        organization_id: org.id,
        staff_id: "STAFF-0308",
        name: "Lauren Parker",
        address: "123 East 5th Street, Vancouver, BC V5Z 2K8",
        phone: "+1-604-555-0199",
        email: "lauren.parker@hospital.ca",
        profile_picture: "https://example.com/profiles/lauren_parker.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    prisma.staff.upsert({
        where: { staff_id: "STAFF-0309" },
        update: {},
        create: {
        organization_id: org.id,
        staff_id: "STAFF-0309",
        name: "Amanda Collins",
        address: "123 East 5th Street, Vancouver, BC V5Z 2K8",
        phone: "+1-604-555-0199",
        email: "amanda.collins@hospital.ca",
        profile_picture: "https://example.com/profiles/amanda_collins.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    prisma.staff.upsert({
        where: { staff_id: "STAFF-0310" },
        update: {},
        create: {
        organization_id: org.id,
        staff_id: "STAFF-0310",
        name: "Megan Roberts",
        address: "123 East 5th Street, Vancouver, BC V5Z 2K8",
        phone: "+1-604-555-0199",
        email: "megan.roberts@hospital.ca",
        profile_picture: "https://example.com/profiles/megan_roberts.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    prisma.staff.upsert({
        where: { staff_id: "STAFF-0311" },
        update: {},
        create: {
        organization_id: org.id,
        staff_id: "STAFF-0311",
        name: "Natalie Wilson",
        address: "123 East 5th Street, Vancouver, BC V5Z 2K8",
        phone: "+1-604-555-0199",
        email: "natalie.wilson@hospital.ca",
        profile_picture: "https://example.com/profiles/natalie_wilson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    prisma.staff.upsert({
        where: { staff_id: "STAFF-0312" },
        update: {},
        create: {
        organization_id: org.id,
        staff_id: "STAFF-0312",
        name: "Ashley Martinez",
        address: "123 East 5th Street, Vancouver, BC V5Z 2K8",
        phone: "+1-604-555-0199",
        email: "ashley.martinez@hospital.ca",
        profile_picture: "https://example.com/profiles/ashley_martinez.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    })
  ]);
  console.log('Seed-new: organization and Nurse Full Time contract upserted');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });