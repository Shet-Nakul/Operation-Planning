import { PrismaClient, ContractType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generatePoolId } from '../utils/generatePoolId';

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
  const surgeonTag = await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Surgeon" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Surgeon",
      color: "#4F46E5",
    },
  });

  // Add more staff tags
  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Nurse" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Nurse",
      color: "#10B981",
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Head Nurse" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Head Nurse",
      color: "#059669",
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Senior Staff Nurse" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Senior Staff Nurse",
      color: "#34D399",
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Charge Nurse" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Charge Nurse",
      color: "#0D9488",
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Preceptor" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Preceptor",
      color: "#14B8A6",
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Anesthesiologist" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Anesthesiologist",
      color: "#7C3AED",
    },
  });

  // Additional role/resource tags referenced by surgery stage requirements (see Surgery.stages below)
  const surgeryStageTags = [
    { name: "OR Nurse", color: "#0EA5E9" },
    { name: "Operation Room", color: "#64748B" },
    { name: "ICU Bed", color: "#F59E0B" },
    { name: "PACU Bed", color: "#FB923C" },
    { name: "Envs", color: "#84CC16" },
    { name: "Respiratory Therapist", color: "#06B6D4" },
    { name: "Monitoring Equipment", color: "#A855F7" },
  ];
  for (const tag of surgeryStageTags) {
    await prisma.staffTag.upsert({
      where: { organization_id_name: { organization_id: org.id, name: tag.name } },
      update: {},
      create: {
        organization_id: org.id,
        name: tag.name,
        color: tag.color,
      },
    });
  }

  // 6. Seed Specializations
  await prisma.specialization.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Oncology" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Oncology",
      description: "Cancer-related surgical procedures",
    },
  });

  // 7. Seed Skills
  await prisma.skill.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Robotic Surgery" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Robotic Surgery",
      description: "Certification for Da Vinci surgical systems",
    },
  });

  // 7.1. Seed Resource Types
  const resourceTypeNames = ["BED", "EQUIPMENT", "ROOM", "DEVICE", "VEHICLE"];
  for (const name of resourceTypeNames) {
    await prisma.resourceType.upsert({
      where: { organization_id_name: { organization_id: org.id, name } },
      update: {},
      create: {
        organization_id: org.id,
        name,
      },
    });
  }

  // 7.5. Seed Departments
  const surgeryDept = await prisma.department.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Surgery" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Surgery",
      description: "Surgical services and operating rooms",
      status: "ACTIVE",
    }
  });

  const criticalCareDept = await prisma.department.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Critical Care" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Critical Care",
      description: "Intensive care and critical care services",
      status: "ACTIVE",
    }
  });

  const anesthesiologyDept = await prisma.department.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Anesthesiology" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Anesthesiology",
      description: "Anesthesia and perioperative care",
      status: "ACTIVE",
    }
  });

  const nursingAdminDept = await prisma.department.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Nursing Administration" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Nursing Administration",
      description: "Nursing leadership and administration",
      status: "ACTIVE",
    }
  });

  const emergencyDept = await prisma.department.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Emergency Medicine" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Emergency Medicine",
      description: "Emergency and urgent care services",
      status: "ACTIVE",
    }
  });

  const medEdDept = await prisma.department.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Medical Education" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Medical Education",
      description: "Residency and medical training programs",
      status: "ACTIVE",
    }
  });

  const radiologyDept = await prisma.department.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Radiology" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Radiology",
      description: "Diagnostic imaging and radiological services",
      status: "ACTIVE",
    }
  });

  const crossDept = await prisma.department.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Cross Department" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Cross Department",
      description: "Cross-departmental and float services",
      status: "ACTIVE",
    }
  });

  const internalMedicineDept = await prisma.department.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Internal Medicine" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Internal Medicine",
      description: "General internal medicine and ward services",
      status: "ACTIVE",
    }
  });

  const multiSpecialtyDept = await prisma.department.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Multi Specialty" } },
    update: {},
    create: {
      organization_id: org.id,
      name: "Multi Specialty",
      description: "Cross-specialty clinical services",
      status: "ACTIVE",
    }
  });

  // 8. Seed Shifts
  const shifts = [
    {
      id: 1,
      name: "Day",
      alias: "D",
      start_time: "8:00",
      end_time: "16:00",
      description: "Standard Day Shift",
      created_at: new Date("2026-05-13T17:18:48.311Z"),
      updated_at: new Date("2026-05-13T17:18:48.311Z"),
    },
    {
      id: 2,
      name: "Early",
      alias: "E",
      start_time: "6:00",
      end_time: "14:00",
      description: "Standard Early Shift",
      created_at: new Date("2026-05-13T17:18:48.311Z"),
      updated_at: new Date("2026-05-13T17:18:48.311Z"),
    },
    {
      id: 3,
      name: "Late",
      alias: "L",
      start_time: "14:00",
      end_time: "22:00",
      description: "Standard Late Shift",
      created_at: new Date("2026-05-13T17:18:48.311Z"),
      updated_at: new Date("2026-05-13T17:18:48.311Z"),
    },
    {
      id: 4,
      name: "Night",
      alias: "N",
      start_time: "22:00",
      end_time: "6:00",
      description: "Standard Night Shift",
      created_at: new Date("2026-05-13T17:18:48.311Z"),
      updated_at: new Date("2026-05-13T17:18:48.311Z"),
    },
  ];

  for (const shift of shifts) {
    await prisma.shift.upsert({
      where: { id: shift.id },
      update: {
        name: shift.name,
        alias: shift.alias,
        start_time: shift.start_time,
        end_time: shift.end_time,
        description: shift.description,
        updated_at: shift.updated_at,
      },
      create: {
        id: shift.id,
        organization_id: org.id,
        name: shift.name,
        alias: shift.alias,
        start_time: shift.start_time,
        end_time: shift.end_time,
        description: shift.description,
        created_at: shift.created_at,
        updated_at: shift.updated_at,
      },
    });
  }

  // 9. Seed Constraints (Forbidden Patterns)
  const existingConstraint = await prisma.forbiddenPattern.findFirst({
    where: { organization_id: org.id, scope: "GLOBAL" }
  });

  const constraints = [
    {
      name: "identical_shift_types_during_weekend",
      active: true,
      hard: false,
      weight: 8,
      reason: "Employees should work the same shift type on both Saturday and Sunday to maintain consistency"
    },
    {
      name: "complete_weekends",
      active: true,
      hard: false,
      weight: 15,
      reason: "Employees should work either both weekend days or neither, avoiding split weekends"
    },
    {
      name: "no_night_shift_before_free_weekend",
      active: true,
      hard: false,
      weight: 14,
      reason: "Avoid scheduling a night shift on Friday before a free weekend to ensure proper rest transition"
    },
    {
      name: "no_free_day_before_working_weekend",
      active: true,
      hard: false,
      weight: 14,
      reason: "Avoid a free Friday immediately before a working weekend to maintain work continuity"
    },
    {
      name: "max_num_assignments",
      active: true,
      hard: false,
      weight: 12,
      value: 24,
      reason: "Limit total working days to prevent employee overload and ensure fair workload distribution"
    },
    {
      name: "min_num_assignments",
      active: true,
      hard: false,
      weight: 10,
      value: 8,
      reason: "Ensure a minimum number of working days to meet contractual obligations"
    },
    {
      name: "max_consecutive_working_days",
      active: true,
      hard: false,
      weight: 25,
      value: 5,
      reason: "Prevent long working stretches without rest to protect employee wellbeing"
    },
    {
      name: "min_consecutive_working_days",
      active: true,
      hard: false,
      weight: 5,
      value: 3,
      reason: "Avoid isolated single working days by requiring a minimum stretch length"
    },
    {
      name: "max_consecutive_free_days",
      active: true,
      hard: false,
      weight: 5,
      value: 4,
      reason: "Limit consecutive days off to avoid long absences that disrupt team coverage"
    },
    {
      name: "min_consecutive_free_days",
      active: true,
      hard: false,
      weight: 10,
      value: 2,
      reason: "Ensure rest periods are long enough for meaningful recovery between work stretches"
    },
    {
      name: "max_consecutive_working_weekends",
      active: true,
      hard: false,
      weight: 12,
      value: 4,
      reason: "Limit consecutive working weekends to ensure fair weekend distribution among staff"
    },
    {
      name: "min_consecutive_working_weekends",
      active: true,
      hard: false,
      weight: 3,
      value: 2,
      reason: "Avoid isolated single working weekends by grouping them for scheduling predictability"
    },
    {
      name: "late_followed_day",
      active: true,
      hard: false,
      weight: 14,
      pattern: [
        "L",
        "D"
      ],
      reason: "Avoid a day shift immediately after a late shift due to insufficient rest time"
    },
    {
      name: "day_followed_early_followed_day",
      active: true,
      hard: false,
      weight: 12,
      pattern: [
        "D",
        "E",
        "D"
      ],
      reason: "Avoid sandwiching an early shift between two day shifts causing disruptive schedule changes"
    },
    {
      name: "late_followed_early",
      active: true,
      hard: false,
      weight: 28,
      pattern: [
        "L",
        "E"
      ],
      reason: "Prevent an early shift after a late shift as the turnaround time is too short for adequate rest"
    },
    {
      name: "late_followed_night",
      active: true,
      hard: false,
      weight: 28,
      pattern: [
        "L",
        "N"
      ],
      reason: "Prevent a night shift after a late shift due to insufficient recovery time between shifts"
    },
    {
      name: "day_followed_night",
      active: true,
      hard: false,
      weight: 22,
      pattern: [
        "D",
        "N"
      ],
      reason: "Avoid transitioning from a day shift directly to a night shift without a rest day"
    },
    {
      name: "night_followed_day",
      active: true,
      hard: false,
      weight: 35,
      pattern: [
        "N",
        "D"
      ],
      reason: "Prevent a day shift immediately after a night shift as the employee needs recovery time"
    },
    {
      name: "night_followed_early",
      active: true,
      hard: false,
      weight: 35,
      pattern: [
        "N",
        "E"
      ],
      reason: "Prevent an early shift after a night shift as the turnaround is critically short"
    }
  ];

  if (!existingConstraint) {
    await prisma.forbiddenPattern.create({
      data: {
        id: 1,
        organization_id: org.id,
        scope: "GLOBAL",
        applies_to: "ALL_CONTRACT_TYPES",
        forbidden_patterns: constraints,
        metadata: {
          version: "2.0",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    });
  } else {
    await prisma.forbiddenPattern.update({
      where: { id: existingConstraint.id },
      data: {
        forbidden_patterns: constraints,
        metadata: {
          version: "2.0",
          createdAt: existingConstraint.created_at,
          updatedAt: new Date().toISOString()
        }
      }
    });
  }

  // 10. Seed Contracts (Static + Dynamic from req.md)
  
  // Static Contract
  await prisma.contract.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Senior Surgeon Standard 40h" } },
    update: {},
    create: {
      organization_id: org.id,
      contract_id: "STA-0001",
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
  await prisma.contract.upsert({
    where: { organization_id_name: { organization_id: org.id, name: "Resident Doctor Flexible Q3" } },
    update: {},
    create: {
      organization_id: org.id,
      contract_id: "DYN-0001",
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

  // 11. Seed Staff (from user input)
  // Example 1: Dynamic Role Distribution (No weekly template)
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0001' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0001",
      name: "Sarah Johnson (Dynamic)",
      address: "1247 Maple Avenue, Vancouver, BC V6B 2K3",
      phone: "+1-604-555-0128",
      email: "sarah.dynamic@hospital.ca",
      profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
      department_id: criticalCareDept.id,
      department: "Critical Care",
      designation: "Senior Staff Nurse",
      contract_id: "DYN-0001",
      supervisor: "Dr. Emily Thompson",
      skills: ["ACLS", "Critical Care Nursing", "Ventilator Management", "Patient Assessment"],
      certifications: ["Registered Nurse (RN) - BC", "ACLS Certified", "CCRN"],
      roles: ["Senior Staff Nurse", "Charge Nurse", "Preceptor"],
      role_distribution: {
        "Senior Staff Nurse": 0.65,
        "Charge Nurse": 0.25,
        "Preceptor": 0.10
      },
      weekly_template: {}, // No specific weekly template provided for dynamic scheduling
      pool_assignments: [
        { "pool_name": "Senior Staff Nurse Pool", "pool_id": "SSN-0001" },
        { "pool_name": "Charge Nurse Pool", "pool_id": "CHA-NUR-0005" }
      ]
    }
  });

  // Example 2: Static/Template-based (With weekly template)
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0002' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0002",
      name: "Sarah Johnson (Template)",
      address: "1247 Maple Avenue, Vancouver, BC V6B 2K3",
      phone: "+1-604-555-0128",
      email: "sarah.template@hospital.ca",
      profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
      department_id: criticalCareDept.id,
      department: "Critical Care",
      designation: "Senior Staff Nurse",
      contract_id: "STA-0001",
      supervisor: "Dr. Emily Thompson",
      skills: ["ACLS", "Critical Care Nursing", "Ventilator Management", "Patient Assessment"],
      certifications: ["Registered Nurse (RN) - BC", "ACLS Certified", "CCRN"],
      roles: ["Senior Staff Nurse", "Charge Nurse", "Preceptor"],
      role_distribution: {
        "Senior Staff Nurse": 0.65,
        "Charge Nurse": 0.25,
        "Preceptor": 0.10
      },
      weekly_template: {
        "monday": { "pool": "TRA-SUR-0001", "shift": "D" },
        "tuesday": { "pool": "TRA-SUR-0001", "shift": "D" },
        "wednesday": { "pool": "CHA-NUR-0005", "shift": "D" },
        "thursday": { "pool": "CHA-NUR-0005", "shift": "D" },
        "friday": { "pool": "TRA-SUR-0001", "shift": "D" },
        "saturday": { "pool": "CHA-NUR-0005", "shift": "D" },
        "sunday": { "pool": null, "shift": "O" }
      },
      pool_assignments: [
        { "pool_name": "Senior Staff Nurse Pool", "pool_id": "SSN-0001" },
        { "pool_name": "Charge Nurse Pool", "pool_id": "CHA-NUR-0005" },
        { "pool_name": "Trauma Surgical Team", "pool_id": "TRA-SUR-0001" }
      ]
    }
  });

  // 12. Seed Renewable Resource Pools
  const icuBedPool = await prisma.renewableResourcePool.upsert({
    where: { pool_id: 'ICU-BED-0001' },
    update: {},
    create: {
      organization_id: org.id,
      pool_id: 'ICU-BED-0001',
      pool_name: 'ICU Bed Pool',
      resource_type: 'BED',
      department: 'Critical Care',
      location: 'North Tower, Floor 2',
      total_capacity: 40,
      status: 'OPERATIONAL',
      metadata: {
        createdBy: 'dr.aris.thorne@hospital.org',
        complianceLevel: 'CLINICAL_PROTOCOL_V2.4',
        validationStatus: 'VERIFIED',
        syncStatus: 'LIVE'
      }
    }
  });

  // Add units for ICU pool
  for (let i = 1; i <= 5; i++) {
    const unitId = `ICU-${i.toString().padStart(2, '0')}`;
    let status = 'AVAILABLE';
    let assignedTo = null;
    let assignedAt = null;
    let estimatedRelease = null;

    if (i === 3) {
      status = 'IN_USE';
      assignedTo = 'PAT-20458';
      assignedAt = new Date('2026-05-23T09:15:00Z');
      estimatedRelease = new Date('2026-05-27T10:00:00Z');
    }

    await prisma.resourceUnit.upsert({
      where: { unit_id: unitId },
      update: {
        status,
        assigned_to: assignedTo,
        assigned_at: assignedAt,
        estimated_release: estimatedRelease,
        last_released_at: i === 1 ? new Date('2026-05-25T12:30:00Z') : (i === 3 ? new Date('2026-05-23T08:00:00Z') : null)
      },
      create: {
        pool_id: icuBedPool.id,
        unit_id: unitId,
        status,
        variant: 'STANDARD_ICU',
        attributes: i === 3 ? { ventilator: true, cardiac_monitor: true, infusion_pump: true, dialysis_machine: true } : { ventilator: true, cardiac_monitor: true, infusion_pump: true },
        assigned_to: assignedTo,
        assigned_at: assignedAt,
        estimated_release: estimatedRelease,
        last_released_at: i === 1 ? new Date('2026-05-25T12:30:00Z') : (i === 3 ? new Date('2026-05-23T08:00:00Z') : null)
      }
    });
  }

  const ventilatorPool = await prisma.renewableResourcePool.upsert({
    where: { pool_id: 'OR-VENT-0013' },
    update: {},
    create: {
      organization_id: org.id,
      pool_id: 'OR-VENT-0013',
      pool_name: 'OR Ventilator Pool',
      resource_type: 'EQUIPMENT',
      department: 'Perioperative Services',
      location: 'Main Building, Floor 3',
      total_capacity: 15,
      status: 'OPERATIONAL',
      metadata: {
        createdBy: 'FACILITY_SYSTEM',
        lastModifiedBy: 'biomedical.eng@hospital.org',
        complianceLevel: 'CLINICAL_PROTOCOL_V2.4',
        validationStatus: 'VERIFIED',
        syncStatus: 'LIVE'
      }
    }
  });

  // Add units for Ventilator pool
  for (let i = 1; i <= 3; i++) {
    await prisma.resourceUnit.upsert({
      where: { unit_id: `VENT-${i.toString().padStart(2, '0')}` },
      update: {},
      create: {
        pool_id: ventilatorPool.id,
        unit_id: `VENT-${i.toString().padStart(2, '0')}`,
        status: i === 3 ? 'MAINTENANCE' : 'AVAILABLE',
        variant: 'HIGH_FLOW',
        attributes: { portable: true, battery_backup: true }
      }
    });
  }

  // 13. Seed Resource Pools (from user input)
  // TRA-SUR-0001: Trauma Surgical Team
  const ssnPool = await prisma.resourcePool.upsert({
    where: { pool_id: 'TRA-SUR-0001' },
    update: {},
    create: {
      organization_id: org.id,
      pool_id: 'TRA-SUR-0001',
      pool_name: 'Trauma Surgical Team',
      department_id: surgeryDept.id,
      department: "Surgery",
      location: 'East Wing, Floor 4',
      primary_role: 'Senior Surgeon',
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
        approvalDate: "2026-03-14T15:30:00Z"
      }
    }
  });

  await prisma.poolDemandConfig.create({
    data: {
      pool_id: ssnPool.id,
      effective_from: new Date('2026-05-25'),
      effective_to: new Date('2026-06-01'),
      weekly_hours: 840,
      demand_matrix: [
        { shift: "Day",   monday: 4, tuesday: 4, wednesday: 4, thursday: 4, friday: 3, saturday: 2, sunday: 2 },
        { shift: "Early", monday: 3, tuesday: 3, wednesday: 3, thursday: 3, friday: 3, saturday: 2, sunday: 2 },
        { shift: "Late",  monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 1, sunday: 1 },
        { shift: "Night", monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 1, sunday: 1 }
      ]
    }
  });

  // CRI-RES-0002: Critical Response Nurses
  const crnPool = await prisma.resourcePool.upsert({
    where: { pool_id: 'CRI-RES-0002' },
    update: {},
    create: {
      organization_id: org.id,
      pool_id: 'CRI-RES-0002',
      pool_name: 'Critical Response Nurses',
      department_id: criticalCareDept.id,
      department: "Critical Care",
      location: 'North Tower, Floor 2',
      primary_role: 'Critical Care Nurse',
      static_pct: 45,
      dynamic_pct: 55,
      metadata: {
        createdAt: "2026-02-10T11:00:00Z",
        updatedAt: "2026-05-18T09:15:00Z",
        createdBy: "HR_SYSTEM",
        complianceLevel: "HEALTHCARE_STANDARD",
        validationStatus: "VALIDATED",
        effectiveFrom: "2026-02-10T00:00:00Z",
        effectiveTo: "2027-02-09T23:59:59Z",
        lastModifiedBy: "admin@hospital.org",
        approvalDate: "2026-02-09T10:00:00Z"
      }
    }
  });

  await prisma.poolDemandConfig.create({
    data: {
      pool_id: crnPool.id,
      effective_from: new Date('2026-02-10'),
      weekly_hours: 1680,
      demand_matrix: [
        { shift: "Day",   monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 4, sunday: 4 },
        { shift: "Early", monday: 6, tuesday: 6, wednesday: 6, thursday: 6, friday: 6, saturday: 4, sunday: 4 },
        { shift: "Late",  monday: 4, tuesday: 4, wednesday: 4, thursday: 4, friday: 4, saturday: 4, sunday: 4 },
        { shift: "Night", monday: 4, tuesday: 4, wednesday: 4, thursday: 4, friday: 4, saturday: 4, sunday: 4 }
      ]
    }
  });

  // GEN-ANE-0003: General Anesthetics Pool
  const gapPool = await prisma.resourcePool.upsert({
    where: { pool_id: 'GEN-ANE-0003' },
    update: {},
    create: {
      organization_id: org.id,
      pool_id: 'GEN-ANE-0003',
      pool_name: 'General Anesthetics Pool',
      department_id: anesthesiologyDept.id,
      department: "Anesthesiology",
      location: 'Main Building, Floor 3',
      primary_role: 'Anesthesiologist',
      static_pct: 50,
      dynamic_pct: 50,
      metadata: {
        createdAt: "2026-05-23T00:00:00Z",
        updatedAt: "2026-05-23T00:00:00Z",
        createdBy: "HR_SYSTEM",
        complianceLevel: "HEALTHCARE_STANDARD",
        validationStatus: "VALIDATED",
        effectiveFrom: "2026-05-23T00:00:00Z",
        effectiveTo: "2027-05-22T23:59:59Z",
        lastModifiedBy: "admin@hospital.org",
        approvalDate: "2026-05-22T15:30:00Z"
      }
    }
  });

  await prisma.poolDemandConfig.create({
    data: {
      pool_id: gapPool.id,
      effective_from: new Date('2026-05-23'),
      weekly_hours: 336,
      demand_matrix: [
        { shift: "Day",   monday: 3, tuesday: 3, wednesday: 3, thursday: 3, friday: 2, saturday: 1, sunday: 1 },
        { shift: "Early", monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 1, sunday: 1 },
        { shift: "Late",  monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 1, sunday: 1 },
        { shift: "Night", monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 1, sunday: 1 }
      ]
    }
  });

  // CHA-NUR-0005 Charge Nurse Pool
  const cnPool = await prisma.resourcePool.upsert({
    where: { pool_id: "CHA-NUR-0005" },
    update: {},
    create: {
      organization_id: org.id,
      pool_id: "CHA-NUR-0005",
      pool_name: "Charge Nurse Pool",
      department_id: nursingAdminDept.id,
      department: "Nursing Administration",
      location: "Central Hospital",
      primary_role: "Charge Nurse",
      static_pct: 50,
      dynamic_pct: 50
    }
  });

  await prisma.poolDemandConfig.create({
    data: {
      pool_id: cnPool.id,
      effective_from: new Date('2026-05-23'),
      weekly_hours: 280,
      demand_matrix: [
        { shift: "Day",   monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 1, sunday: 1 },
        { shift: "Early", monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 1, sunday: 1 },
        { shift: "Late",  monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 0, sunday: 0 },
        { shift: "Night", monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 0, sunday: 0 }
      ]
    }
  });

  // ICU-0007 ICU Pool
  const icuPool = await prisma.resourcePool.upsert({
    where: { pool_id: "ICU-0007" },
    update: {},
    create: {
      organization_id: org.id,
      pool_id: "ICU-0007",
      pool_name: "ICU Pool",
      department_id: criticalCareDept.id,
      department: "Critical Care",
      location: "North Tower",
      primary_role: "ICU Nurse",
      static_pct: 40,
      dynamic_pct: 60
    }
  });

  await prisma.poolDemandConfig.create({
    data: {
      pool_id: icuPool.id,
      effective_from: new Date('2026-05-23'),
      weekly_hours: 1344,
      demand_matrix: [
        { shift: "Day",   monday: 4, tuesday: 4, wednesday: 4, thursday: 4, friday: 4, saturday: 1, sunday: 0 },
        { shift: "Early", monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 1, sunday: 0 },
        { shift: "Late",  monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 0, sunday: 0 },
        { shift: "Night", monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 0, sunday: 0 }
      ]
    }
  });

  // SUR-0011 Surgery Pool
  const surPool = await prisma.resourcePool.upsert({
    where: { pool_id: "SUR-0011" },
    update: {},
    create: {
      organization_id: org.id,
      pool_id: "SUR-0011",
      pool_name: "Surgery Pool",
      department_id: surgeryDept.id,
      department: "Surgery",
      location: "East Wing",
      primary_role: "Surgeon",
      static_pct: 60,
      dynamic_pct: 40
    }
  });

  await prisma.poolDemandConfig.create({
    data: {
      pool_id: surPool.id,
      effective_from: new Date('2026-05-23'),
      weekly_hours: 672,
      demand_matrix: [
        { shift: "Day",   monday: 4, tuesday: 4, wednesday: 4, thursday: 4, friday: 4, saturday: 2, sunday: 1 },
        { shift: "Early", monday: 3, tuesday: 3, wednesday: 3, thursday: 3, friday: 3, saturday: 1, sunday: 1 },
      ]
    }
  });

  // FLO-POO-0010 Float Pool
  const floatPool = await prisma.resourcePool.upsert({
    where: { pool_id: "FLO-POO-0010" },
    update: {},
    create: {
      organization_id: org.id,
      pool_id: "FLO-POO-0010",
      pool_name: "Float Pool",
      department_id: crossDept.id,
      department: "Cross Department",
      location: "Hospital Wide",
      primary_role: "Float Nurse",
      static_pct: 20,
      dynamic_pct: 80
    }
  });

  await prisma.poolDemandConfig.create({
    data: {
      pool_id: floatPool.id,
      effective_from: new Date('2026-05-23'),
      weekly_hours: 560,
      demand_matrix: [
        { shift: "Day",   monday: 3, tuesday: 3, wednesday: 3, thursday: 3, friday: 3, saturday: 2, sunday: 2 },
        { shift: "Early", monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 2, sunday: 2 },
        { shift: "Late",  monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 1, sunday: 1 },
        { shift: "Night", monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 1, sunday: 1 }
      ]
    }
  });
  // ER-PHY-0004 ER Physician Pool
  const erPool = await prisma.resourcePool.upsert({
    where: { pool_id: "ER-PHY-0004" },
    update: {},
    create: {
      organization_id: org.id,
      pool_id: "ER-PHY-0004",
      pool_name: "ER Physician Pool",
      department_id: emergencyDept.id,
      department: "Emergency Medicine",
      location: "Emergency Department",
      primary_role: "Emergency Physician",
      static_pct: 50,
      dynamic_pct: 50
    }
  });

  await prisma.poolDemandConfig.create({
    data: {
      pool_id: erPool.id,
      effective_from: new Date('2026-05-23'),
      weekly_hours: 840,
      demand_matrix: [
        { shift: "Day",   monday: 4, tuesday: 4, wednesday: 4, thursday: 4, friday: 4, saturday: 3, sunday: 3 },
        { shift: "Early", monday: 3, tuesday: 3, wednesday: 3, thursday: 3, friday: 3, saturday: 2, sunday: 2 },
        { shift: "Late",  monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 2, sunday: 2 },
        { shift: "Night", monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 2, sunday: 2 }
      ]
    }
  });

  // RES-0006 Resident Pool
  const residentPool = await prisma.resourcePool.upsert({
    where: { pool_id: "RES-0006" },
    update: {},
    create: {
      organization_id: org.id,
      pool_id: "RES-0006",
      pool_name: "Resident Pool",
      department_id: medEdDept.id,
      department: "Medical Education",
      location: "Hospital Wide",
      primary_role: "Resident Doctor",
      static_pct: 30,
      dynamic_pct: 70
    }
  });

  await prisma.poolDemandConfig.create({
    data: {
      pool_id: residentPool.id,
      effective_from: new Date('2026-05-23'),
      weekly_hours: 1008,
      demand_matrix: [
        { shift: "Day",   monday: 5, tuesday: 5, wednesday: 5, thursday: 5, friday: 5, saturday: 3, sunday: 3 },
        { shift: "Early", monday: 4, tuesday: 4, wednesday: 4, thursday: 4, friday: 4, saturday: 2, sunday: 2 },
        { shift: "Late",  monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 2, sunday: 2 },
        { shift: "Night", monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 2, sunday: 2 }
      ]
    }
  });

  // OPE-THE-0008 Operating Theatre Pool
  const otPool = await prisma.resourcePool.upsert({
    where: { pool_id: "OPE-THE-0008" },
    update: {},
    create: {
      organization_id: org.id,
      pool_id: "OPE-THE-0008",
      pool_name: "Operating Theatre Pool",
      department_id: surgeryDept.id,
      department: "Surgery",
      location: "Operating Theatres",
      primary_role: "OR Nurse",
      static_pct: 60,
      dynamic_pct: 40
    }
  });

  await prisma.poolDemandConfig.create({
    data: {
      pool_id: otPool.id,
      effective_from: new Date('2026-05-23'),
      weekly_hours: 504,
      demand_matrix: [
        { shift: "Day",   monday: 6, tuesday: 6, wednesday: 6, thursday: 6, friday: 6, saturday: 5, sunday: 5 },
        { shift: "Early", monday: 5, tuesday: 5, wednesday: 5, thursday: 5, friday: 5, saturday: 4, sunday: 4 },
        { shift: "Late",  monday: 4, tuesday: 4, wednesday: 4, thursday: 4, friday: 4, saturday: 4, sunday: 4 },
        { shift: "Night", monday: 4, tuesday: 4, wednesday: 4, thursday: 4, friday: 4, saturday: 4, sunday: 4 }
      ]
    }
  });

  // RAD-0009 Radiology Pool
  const radPool = await prisma.resourcePool.upsert({
    where: { pool_id: "RAD-0009" },
    update: {},
    create: {
      organization_id: org.id,
      pool_id: "RAD-0009",
      pool_name: "Radiology Pool",
      department_id: radiologyDept.id,
      department: "Radiology",
      location: "Diagnostic Center",
      primary_role: "Radiographer",
      static_pct: 50,
      dynamic_pct: 50
    }
  }); 

  await prisma.poolDemandConfig.create({
    data: {
      pool_id: radPool.id,
      effective_from: new Date('2026-05-23'),
      weekly_hours: 336,
      demand_matrix: [
        { shift: "Day",   monday: 3, tuesday: 3, wednesday: 3, thursday: 3, friday: 3, saturday: 1, sunday: 0 },
        { shift: "Early", monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 0, sunday: 0 },
        { shift: "Late",  monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 },
        { shift: "Night", monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 }
      ]
    }
  });

  // 14. Seed Staff for these Pools
  // STAFF-0001: Dr. Sarah Mitchell (Senior Trauma Surgeon, STATIC) - assigned to SSN-0001
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0001' },
    update: {
      name: "Dr. Sarah Mitchell",
      designation: "Senior Trauma Surgeon",
      contract_id: "DYN-0001",
      pool_assignments: [{ "pool_name": "Trauma Surgical Team", "pool_id": "TRA-SUR-0001" }]
    },
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0001",
      name: "Dr. Sarah Mitchell",
      email: "sarah.mitchell@hospital.ca",
      department_id: surgeryDept.id,
      department: "Surgery",
      designation: "Senior Trauma Surgeon",
      contract_id: "DYN-0001",
      pool_assignments: [{ "pool_name": "Trauma Surgical Team", "pool_id": "TRA-SUR-0001" }]
    }
  });

  // STAFF-0014: James O'Brien (Trauma Nurse Specialist, DYNAMIC) - assigned to SSN-0001
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0014' },
    update: {
      roles: ["Nurse", "Senior Staff Nurse"],
      role_distribution: { "Nurse": 0.5, "Senior Staff Nurse": 0.5 },
    },
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0014",
      name: "James O'Brien",
      email: "james.obrien@hospital.ca",
      department_id: surgeryDept.id,
      department: "Surgery",
      designation: "Trauma Nurse Specialist",
      contract_id: "DYN-0001",
      roles: ["Nurse", "Senior Staff Nurse"],
      role_distribution: { "Nurse": 0.5, "Senior Staff Nurse": 0.5 },
      pool_assignments: [{ "pool_name": "Trauma Surgical Team", "pool_id": "TRA-SUR-0001" }]
    }
  });
  // STAFF-0003: Dr. Kevin Park (Anesthesiologist, STATIC) - assigned to GEN-ANE-0003
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0003' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0003",
      name: "Dr. Kevin Park",
      email: "kevin.park@hospital.ca",
      department_id: anesthesiologyDept.id,
      department: "Anesthesiology",
      designation: "Anesthesiologist",
      contract_id: "STA-0001",
      weekly_template: {
        "monday": { "pool": "GEN-ANE-0003", "shift": "D" },
        "tuesday": { "pool": "GEN-ANE-0003", "shift": "D" },
        "wednesday": { "pool": "GEN-ANE-0003", "shift": "D" },
        "thursday": { "pool": "GEN-ANE-0003", "shift": "D" },
        "friday": { "pool": "GEN-ANE-0003", "shift": "D" },
        "saturday": { "pool": null, "shift": "O" },
        "sunday": { "pool": null, "shift": "O" }
      },
      pool_assignments: [{ "pool_name": "General Anesthetics Pool", "pool_id": "GEN-ANE-0003" }]
    }
  });

  // STAFF-0007: Dr. Lisa Chen (Anesthesiologist, STATIC) - assigned to GEN-ANE-0003
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0007' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0007",
      name: "Dr. Lisa Chen",
      email: "lisa.chen@hospital.ca",
      department_id: anesthesiologyDept.id,
      department: "Anesthesiology",
      designation: "Anesthesiologist",
      contract_id: "STA-0001",
      weekly_template: {
        "monday": { "pool": "GEN-ANE-0003", "shift": "E" },
        "tuesday": { "pool": "GEN-ANE-0003", "shift": "E" },
        "wednesday": { "pool": "GEN-ANE-0003", "shift": "E" },
        "thursday": { "pool": "GEN-ANE-0003", "shift": "E" },
        "friday": { "pool": "GEN-ANE-0003", "shift": "E" },
        "saturday": { "pool": "GEN-ANE-0003", "shift": "D" },
        "sunday": { "pool": null, "shift": "O" }
      },
      pool_assignments: [{ "pool_name": "General Anesthetics Pool", "pool_id": "GEN-ANE-0003" }]
    }
  });
  // STAFF-0012: Mark Sullivan (Anesthesia Technician, DYNAMIC) - assigned to GEN-ANE-0003
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0012' },
    update: {
      roles: ["Nurse"],
      role_distribution: { "Nurse": 1.0 },
    },
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0012",
      name: "Mark Sullivan",
      email: "mark.sullivan@hospital.ca",
      department_id: anesthesiologyDept.id,
      department: "Anesthesiology",
      designation: "Anesthesia Technician",
      contract_id: "DYN-0001",
      roles: ["Nurse"],
      role_distribution: { "Nurse": 1.0 },
      pool_assignments: [{ "pool_name": "General Anesthetics Pool", "pool_id": "GEN-ANE-0003" }]
    }
  });

  // STAFF-0019: Rachel Adams (Anesthesia Nurse, DYNAMIC) - assigned to GEN-ANE-0003
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0019' },
    update: {
      roles: ["Nurse", "Head Nurse"],
      role_distribution: { "Nurse": 0.5, "Head Nurse": 0.5 },
    },
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0019",
      name: "Rachel Adams",
      email: "rachel.adams@hospital.ca",
      department_id: anesthesiologyDept.id,
      department: "Anesthesiology",
      designation: "Anesthesia Nurse",
      contract_id: "DYN-0001",
      roles: ["Nurse", "Head Nurse"],
      role_distribution: { "Nurse": 0.5, "Head Nurse": 0.5 },
      pool_assignments: [{ "pool_name": "General Anesthetics Pool", "pool_id": "GEN-ANE-0003" }]
    }
  });

  // STAFF-020: ICU Nurse
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0020' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0020",
      name: "Jessica Moore",
      email: "jessica.moore@hospital.ca",
      department_id: criticalCareDept.id,
      department: "Critical Care",
      designation: "ICU Nurse",
      contract_id: "DYN-0001",
      roles: ["ICU Nurse"],
      role_distribution: {
        "ICU Nurse": 1.0
      },
      weekly_template: {},
      pool_assignments: [
        { pool_name: "ICU Pool", pool_id: "ICU-0007" }
      ]
    }
  });

  // STAFF-0021: Surgeon + Consultant
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0021' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0021",
      name: "Dr. Michael Carter",
      email: "michael.carter@hospital.ca",
      department_id: surgeryDept.id,
      department: "Surgery",
      designation: "General Surgeon",
      contract_id: "DYN-0001",
      roles: ["Surgeon", "Consultant"],
      role_distribution: {
        Surgeon: 0.8,
        Consultant: 0.2
      },
      weekly_template: {},
      pool_assignments: [
        { pool_name: "Surgery Pool", pool_id: "SUR-0011" }
      ]
    }
  });

  // STAFF-0022: Floating Nurse
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0022' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0022",
      name: "Emma Wilson",
      email: "emma.wilson@hospital.ca",
      department_id: crossDept.id,
      department: "Cross Department",
      designation: "Float Nurse",
      contract_id: "DYN-0001",
      roles: ["Ward Nurse", "ICU Nurse", "ER Nurse"],
      role_distribution: {
        "Ward Nurse": 0.4,
        "ICU Nurse": 0.3,
        "ER Nurse": 0.3
      },
      weekly_template: {},
      pool_assignments: [
        { pool_name: "Float Pool", pool_id: "FLO-POO-0010" }
      ]
    }
  });

  // STAFF-0023: Emergency Physician
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0023' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0023",
      name: "Dr. Daniel Harris",
      email: "daniel.harris@hospital.ca",
      department_id: emergencyDept.id,
      department: "Emergency Medicine",
      designation: "Emergency Physician",
      contract_id: "DYN-0001",
      roles: ["Emergency Physician"],
      role_distribution: {
        "Emergency Physician": 1.0
      },
      weekly_template: {},
      pool_assignments: [
        { pool_name: "ER Physician Pool", pool_id: "ER-PHY-0004" }
      ]
    }
  });

  // STAFF-0024: Resident Doctor
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0024' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0024",
      name: "Dr. Olivia Martinez",
      email: "olivia.martinez@hospital.ca",
      department_id: internalMedicineDept.id,
      department: "Internal Medicine",
      designation: "Resident Doctor",
      contract_id: "DYN-0001",
      roles: ["Resident Doctor", "Ward Physician"],
      role_distribution: {
        "Resident Doctor": 0.7,
        "Ward Physician": 0.3
      },
      weekly_template: {},
      pool_assignments: [
        { pool_name: "Resident Pool", pool_id: "RES-0006" }
      ]
    }
  });

  // STAFF-0025: Anesthesia Specialist
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0025' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0025",
      name: "Dr. Kevin Roberts",
      email: "kevin.roberts@hospital.ca",
      department_id: anesthesiologyDept.id,
      department: "Anesthesiology",
      designation: "Consultant Anesthesiologist",
      contract_id: "DYN-0001",
      roles: ["Anesthesiologist", "Pain Specialist"],
      role_distribution: {
        Anesthesiologist: 0.85,
        "Pain Specialist": 0.15
      },
      weekly_template: {},
      pool_assignments: [
        { pool_name: "General Anesthetics Pool", pool_id: "GEN-ANE-0003" }
      ]
    }
  });

  // STAFF-0026: Operating Room Nurse
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0026' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0026",
      name: "Sophia Turner",
      email: "sophia.turner@hospital.ca",
      department_id: surgeryDept.id,
      department: "Surgery",
      designation: "OR Nurse",
      contract_id: "DYN-0001",
      roles: ["OR Nurse", "Scrub Nurse"],
      role_distribution: {
        "OR Nurse": 0.6,
        "Scrub Nurse": 0.4
      },
      weekly_template: {},
      pool_assignments: [
        { pool_name: "Operating Theatre Pool", pool_id: "OPE-THE-0008" }
      ]
    }
  });

  // STAFF-0027: Cross-trained Staff
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0027' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0027",
      name: "Nathan Clark",
      email: "nathan.clark@hospital.ca",
      department_id: multiSpecialtyDept.id,
      department: "Multi Specialty",
      designation: "Clinical Specialist",
      contract_id: "DYN-0001",
      roles: ["ICU Nurse", "ER Nurse", "Charge Nurse"],
      role_distribution: {
        "ICU Nurse": 0.4,
        "ER Nurse": 0.3,
        "Charge Nurse": 0.3
      },
      weekly_template: {},
      pool_assignments: [
        { pool_name: "Float Pool", pool_id: "FLO-POO-0010" },
        { pool_name: "ICU Pool", pool_id: "ICU-0007" }
      ]
    }
  });

  // STAFF-0028: Pure Single Role
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0028' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0028",
      name: "Andrew Scott",
      email: "andrew.scott@hospital.ca",
      department_id: radiologyDept.id,
      department: "Radiology",
      designation: "Radiographer",
      contract_id: "DYN-0001",
      roles: ["Radiographer"],
      role_distribution: {
        Radiographer: 1.0
      },
      weekly_template: {},
      pool_assignments: [
        { pool_name: "Radiology Pool", pool_id: "RAD-0009" }
      ]
    }
  });

  // 14.1 Additional staff so every pool has >=2 employees with a static/dynamic mix
  // (CHA-NUR-0005 ends up static-only, ICU-0007 ends up dynamic-only)

  // STAFF-0004: David Reyes (Critical Care Nurse, STATIC) - assigned to CRI-RES-0002
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0004' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0004",
      name: "David Reyes",
      email: "david.reyes@hospital.ca",
      department_id: criticalCareDept.id,
      department: "Critical Care",
      designation: "Critical Care Nurse",
      contract_id: "STA-0001",
      roles: ["Critical Care Nurse"],
      role_distribution: { "Critical Care Nurse": 1.0 },
      weekly_template: {
        "monday": { "pool": "CRI-RES-0002", "shift": "D" },
        "tuesday": { "pool": "CRI-RES-0002", "shift": "D" },
        "wednesday": { "pool": "CRI-RES-0002", "shift": "D" },
        "thursday": { "pool": "CRI-RES-0002", "shift": "D" },
        "friday": { "pool": "CRI-RES-0002", "shift": "D" },
        "saturday": { "pool": null, "shift": "O" },
        "sunday": { "pool": null, "shift": "O" }
      },
      pool_assignments: [
        { pool_name: "Critical Response Nurses", pool_id: "CRI-RES-0002" }
      ]
    }
  });

  // STAFF-0005: Megan Foster (Critical Care Nurse, DYNAMIC) - assigned to CRI-RES-0002
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0005' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0005",
      name: "Megan Foster",
      email: "megan.foster@hospital.ca",
      department_id: criticalCareDept.id,
      department: "Critical Care",
      designation: "Critical Care Nurse",
      contract_id: "DYN-0001",
      roles: ["Critical Care Nurse"],
      role_distribution: { "Critical Care Nurse": 1.0 },
      weekly_template: {},
      pool_assignments: [
        { pool_name: "Critical Response Nurses", pool_id: "CRI-RES-0002" }
      ]
    }
  });

  // STAFF-0006: Laura Bennett (Charge Nurse, STATIC) - assigned to CHA-NUR-0005 (pairs with STAFF-0002, static-only pool)
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0006' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0006",
      name: "Laura Bennett",
      email: "laura.bennett@hospital.ca",
      department_id: nursingAdminDept.id,
      department: "Nursing Administration",
      designation: "Charge Nurse",
      contract_id: "STA-0001",
      roles: ["Charge Nurse"],
      role_distribution: { "Charge Nurse": 1.0 },
      weekly_template: {
        "monday": { "pool": "CHA-NUR-0005", "shift": "D" },
        "tuesday": { "pool": "CHA-NUR-0005", "shift": "D" },
        "wednesday": { "pool": "CHA-NUR-0005", "shift": "D" },
        "thursday": { "pool": "CHA-NUR-0005", "shift": "D" },
        "friday": { "pool": "CHA-NUR-0005", "shift": "D" },
        "saturday": { "pool": null, "shift": "O" },
        "sunday": { "pool": null, "shift": "O" }
      },
      pool_assignments: [
        { pool_name: "Charge Nurse Pool", pool_id: "CHA-NUR-0005" }
      ]
    }
  });

  // STAFF-0008: Dr. Robert Hayes (Surgeon, STATIC) - assigned to SUR-0011
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0008' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0008",
      name: "Dr. Robert Hayes",
      email: "robert.hayes@hospital.ca",
      department_id: surgeryDept.id,
      department: "Surgery",
      designation: "Surgeon",
      contract_id: "STA-0001",
      roles: ["Surgeon"],
      role_distribution: { "Surgeon": 1.0 },
      weekly_template: {
        "monday": { "pool": "SUR-0011", "shift": "D" },
        "tuesday": { "pool": "SUR-0011", "shift": "D" },
        "wednesday": { "pool": "SUR-0011", "shift": "D" },
        "thursday": { "pool": "SUR-0011", "shift": "D" },
        "friday": { "pool": "SUR-0011", "shift": "D" },
        "saturday": { "pool": "SUR-0011", "shift": "D" },
        "sunday": { "pool": null, "shift": "O" }
      },
      pool_assignments: [
        { pool_name: "Surgery Pool", pool_id: "SUR-0011" }
      ]
    }
  });

  // STAFF-0009: Christine Walsh (Float Nurse, STATIC) - assigned to FLO-POO-0010
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0009' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0009",
      name: "Christine Walsh",
      email: "christine.walsh@hospital.ca",
      department_id: crossDept.id,
      department: "Cross Department",
      designation: "Float Nurse",
      contract_id: "STA-0001",
      roles: ["Float Nurse"],
      role_distribution: { "Float Nurse": 1.0 },
      weekly_template: {
        "monday": { "pool": "FLO-POO-0010", "shift": "D" },
        "tuesday": { "pool": "FLO-POO-0010", "shift": "D" },
        "wednesday": { "pool": "FLO-POO-0010", "shift": "D" },
        "thursday": { "pool": "FLO-POO-0010", "shift": "D" },
        "friday": { "pool": "FLO-POO-0010", "shift": "D" },
        "saturday": { "pool": null, "shift": "O" },
        "sunday": { "pool": null, "shift": "O" }
      },
      pool_assignments: [
        { pool_name: "Float Pool", pool_id: "FLO-POO-0010" }
      ]
    }
  });

  // STAFF-0010: Dr. Brian Cooper (Emergency Physician, STATIC) - assigned to ER-PHY-0004
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0010' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0010",
      name: "Dr. Brian Cooper",
      email: "brian.cooper@hospital.ca",
      department_id: emergencyDept.id,
      department: "Emergency Medicine",
      designation: "Emergency Physician",
      contract_id: "STA-0001",
      roles: ["Emergency Physician"],
      role_distribution: { "Emergency Physician": 1.0 },
      weekly_template: {
        "monday": { "pool": "ER-PHY-0004", "shift": "N" },
        "tuesday": { "pool": "ER-PHY-0004", "shift": "N" },
        "wednesday": { "pool": null, "shift": "O" },
        "thursday": { "pool": "ER-PHY-0004", "shift": "N" },
        "friday": { "pool": "ER-PHY-0004", "shift": "N" },
        "saturday": { "pool": "ER-PHY-0004", "shift": "N" },
        "sunday": { "pool": null, "shift": "O" }
      },
      pool_assignments: [
        { pool_name: "ER Physician Pool", pool_id: "ER-PHY-0004" }
      ]
    }
  });

  // STAFF-0011: Dr. Amanda Russo (Resident Doctor, STATIC) - assigned to RES-0006
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0011' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0011",
      name: "Dr. Amanda Russo",
      email: "amanda.russo@hospital.ca",
      department_id: medEdDept.id,
      department: "Medical Education",
      designation: "Resident Doctor",
      contract_id: "STA-0001",
      roles: ["Resident Doctor"],
      role_distribution: { "Resident Doctor": 1.0 },
      weekly_template: {
        "monday": { "pool": "RES-0006", "shift": "D" },
        "tuesday": { "pool": "RES-0006", "shift": "D" },
        "wednesday": { "pool": "RES-0006", "shift": "D" },
        "thursday": { "pool": "RES-0006", "shift": "D" },
        "friday": { "pool": "RES-0006", "shift": "D" },
        "saturday": { "pool": null, "shift": "O" },
        "sunday": { "pool": null, "shift": "O" }
      },
      pool_assignments: [
        { pool_name: "Resident Pool", pool_id: "RES-0006" }
      ]
    }
  });

  // STAFF-0013: Patricia Yang (OR Nurse, STATIC) - assigned to OPE-THE-0008
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0013' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0013",
      name: "Patricia Yang",
      email: "patricia.yang@hospital.ca",
      department_id: surgeryDept.id,
      department: "Surgery",
      designation: "OR Nurse",
      contract_id: "STA-0001",
      roles: ["OR Nurse"],
      role_distribution: { "OR Nurse": 1.0 },
      weekly_template: {
        "monday": { "pool": "OPE-THE-0008", "shift": "D" },
        "tuesday": { "pool": "OPE-THE-0008", "shift": "D" },
        "wednesday": { "pool": "OPE-THE-0008", "shift": "D" },
        "thursday": { "pool": "OPE-THE-0008", "shift": "D" },
        "friday": { "pool": "OPE-THE-0008", "shift": "D" },
        "saturday": { "pool": "OPE-THE-0008", "shift": "D" },
        "sunday": { "pool": null, "shift": "O" }
      },
      pool_assignments: [
        { pool_name: "Operating Theatre Pool", pool_id: "OPE-THE-0008" }
      ]
    }
  });

  // STAFF-0015: Samuel Ortiz (Radiographer, STATIC) - assigned to RAD-0009
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0015' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0015",
      name: "Samuel Ortiz",
      email: "samuel.ortiz@hospital.ca",
      department_id: radiologyDept.id,
      department: "Radiology",
      designation: "Radiographer",
      contract_id: "STA-0001",
      roles: ["Radiographer"],
      role_distribution: { "Radiographer": 1.0 },
      weekly_template: {
        "monday": { "pool": "RAD-0009", "shift": "D" },
        "tuesday": { "pool": "RAD-0009", "shift": "D" },
        "wednesday": { "pool": "RAD-0009", "shift": "D" },
        "thursday": { "pool": "RAD-0009", "shift": "D" },
        "friday": { "pool": "RAD-0009", "shift": "D" },
        "saturday": { "pool": "RAD-0009", "shift": "D" },
        "sunday": { "pool": null, "shift": "O" }
      },
      pool_assignments: [
        { pool_name: "Radiology Pool", pool_id: "RAD-0009" }
      ]
    }
  });

  // 14.2 Role-based static staff (no pool assigned - weekly_template uses the legacy {start, end, role} array shape)

  // STAFF-0016: Sophia Martin (Senior Staff Nurse / Charge Nurse / Preceptor, STATIC) - no pool assigned
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0016' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0016",
      name: "Sophia Martin",
      email: "sophia.martin@hospital.ca",
      department_id: criticalCareDept.id,
      department: "Critical Care",
      designation: "Senior Staff Nurse",
      contract_id: "STA-0001",
      roles: ["Senior Staff Nurse", "Charge Nurse", "Preceptor"],
      role_distribution: {
        "Senior Staff Nurse": 0.65,
        "Charge Nurse": 0.25,
        "Preceptor": 0.10
      },
      weekly_template: {
        "monday": [{ "start": "7:00", "end": "15:00", "role": "Senior Staff Nurse" }],
        "tuesday": [{ "start": "7:00", "end": "15:00", "role": "Senior Staff Nurse" }],
        "wednesday": [{ "start": "7:00", "end": "15:00", "role": "Senior Staff Nurse" }],
        "thursday": [{ "start": "7:00", "end": "15:00", "role": "Charge Nurse" }],
        "friday": [{ "start": "7:00", "end": "15:00", "role": "Senior Staff Nurse" }],
        "saturday": [{ "start": "7:00", "end": "15:00", "role": "Preceptor" }],
        "sunday": []
      }
    }
  });

  // STAFF-0017: Dr. Henry Walsh (Surgeon / Consultant, STATIC) - no pool assigned
  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0017' },
    update: {},
    create: {
      organization_id: org.id,
      staff_id: "STAFF-0017",
      name: "Dr. Henry Walsh",
      email: "henry.walsh@hospital.ca",
      department_id: surgeryDept.id,
      department: "Surgery",
      designation: "Surgeon",
      contract_id: "STA-0001",
      roles: ["Surgeon", "Consultant"],
      role_distribution: {
        Surgeon: 0.8,
        Consultant: 0.2
      },
      weekly_template: {
        "monday": [{ "start": "8:00", "end": "16:00", "role": "Surgeon" }],
        "tuesday": [{ "start": "8:00", "end": "16:00", "role": "Surgeon" }],
        "wednesday": [{ "start": "8:00", "end": "16:00", "role": "Surgeon" }],
        "thursday": [{ "start": "8:00", "end": "16:00", "role": "Consultant" }],
        "friday": [{ "start": "8:00", "end": "16:00", "role": "Surgeon" }],
        "saturday": [],
        "sunday": []
      }
    }
  });

  // 15. Seed Non-Renewable Resources
  // NR-1004: Blood Unit O-Negative (Shortage)
  await prisma.nonRenewableResource.upsert({
    where: { resource_id: 'NR-1004' },
    update: {},
    create: {
      organization_id: org.id,
      resource_id: 'NR-1004',
      name: 'Blood Unit: O-Negative',
      spec: '450ml Standard Bag',
      category: 'BLOOD_PRODUCT',
      uom: 'UNIT',
      stockpile_qty: 2,
      min_required_qty: 4,
      status: 'SHORTAGE'
    }
  });

  // NR-1005: Blood Unit A-Positive (Available)
  await prisma.nonRenewableResource.upsert({
    where: { resource_id: 'NR-1005' },
    update: {},
    create: {
      organization_id: org.id,
      resource_id: 'NR-1005',
      name: 'Blood Unit: A-Positive',
      spec: '450ml Standard Bag',
      category: 'BLOOD_PRODUCT',
      uom: 'UNIT',
      stockpile_qty: 12,
      min_required_qty: 6,
      status: 'AVAILABLE'
    }
  });

  // 16. Seed Operation Types
  const operationTypes = [
    { id: 1, category: "Neuro", name: "Spinal Fusion" },
    { id: 2, category: "Neuro", name: "Craniotomy" },
    { id: 3, category: "Ortho", name: "Hip Replacement" },
    { id: 4, category: "General", name: "Appendectomy" },
    { id: 5, category: "Cardio", name: "Bypass (CABG)" },
    { id: 6, category: "Ortho", name: "Knee Replacement" },
    { id: 7, category: "General", name: "Cholecystectomy" }
  ];

  for (const ot of operationTypes) {
    await prisma.operationType.upsert({
      where: { id: ot.id },
      update: {},
      create: {
        id: ot.id,
        organization_id: org.id,
        category: ot.category,
        name: ot.name,
        created_at: new Date("2026-05-14T18:09:47.099Z"),
        updated_at: new Date("2026-05-14T18:09:47.099Z")
      }
    });
  }

  // 17. Seed Phase Resources
  const phaseResources = [
    { id: 1, type: "Pre-operative", name: "ICU Bed", default_count: 2 },
    { id: 2, type: "Pre-operative", name: "ICU Nurse", default_count: 3 },
    { id: 3, type: "Operative", name: "Respiratory Therapist", default_count: 1 },
    { id: 4, type: "Operative", name: "Monitoring Equipment", default_count: 4 },
    { id: 5, type: "Post-operative", name: "ICU Bed", default_count: 5 },
    { id: 6, type: "Sterilization", name: "Monitoring Equipment", default_count: 2 }
  ];

  for (const pr of phaseResources) {
    await prisma.phaseResource.upsert({
      where: { id: pr.id },
      update: {},
      create: {
        id: pr.id,
        organization_id: org.id,
        type: pr.type,
        name: pr.name,
        default_count: pr.default_count,
        created_at: new Date("2026-05-14T18:09:47.099Z"),
        updated_at: new Date("2026-05-14T18:09:47.099Z")
      }
    });
  }

  // 18. Seed Surgeries
  // Roles in `stages` mirror existing seeded resources/designations:
  // anesthesiologist/surgeon/or_nurse -> Staff designations, operation_room -> ResourceType ROOM,
  // icu_bed/pacu_bed -> PhaseResource "ICU Bed" (BED), monitoring_equipment/respiratory_therapist -> PhaseResource entries, envs -> Sterilization phase.
  const surgeries = [
    {
      surgery_id: "SURG-ROB-0001",
      name: "Robert J. McAllister",
      type: "mandatory",
      infection_type: 0,
      time_windows: {
        earliest_date: "2026-02-12T00:00",
        latest_date: "2026-02-14T23:59",
        planned_start: null,
        planned_by: null
      },
      stages: {
        pre_op: [
          { role: "anesthesiologist", assigned: null, count: 1, duration: [0, 15] }
        ],
        operative: [
          { role: "operation_room", assigned: null, count: 1, duration: [30, 120] },
          { role: "anesthesiologist", assigned: null, count: 1, duration: [30, 120] },
          { role: "or_nurse", assigned: null, count: 2, duration: [30, 120] },
          { role: "surgeon", assigned: "surgeon_1", count: 1, duration: [30, 120] }
        ],
        post_op: [
          { role: "anesthesiologist", assigned: null, count: 1, duration: [120, 135] },
          { role: "pacu_bed", assigned: null, count: 1, duration: [120, 165] }
        ],
        sterilization: [
          { role: "envs", assigned: null, count: 1, duration: [120, 150] },
          { role: "operation_room", assigned: null, count: 1, duration: [120, 150] }
        ],
        recovery: [
          { role: "icu_bed", assigned: null, probability: 0.08, count: 1, duration: [165, 510] }
        ]
      }
    },
    {
      // Hip Replacement (Ortho)
      surgery_id: "SURG-MAR-0002",
      name: "Maria Santos",
      type: "elective",
      infection_type: 0,
      time_windows: {
        earliest_date: "2026-02-16T00:00",
        latest_date: "2026-02-20T23:59",
        planned_start: null,
        planned_by: null
      },
      stages: {
        pre_op: [
          { role: "anesthesiologist", assigned: null, count: 1, duration: [0, 20] }
        ],
        operative: [
          { role: "operation_room", assigned: null, count: 1, duration: [20, 140] },
          { role: "anesthesiologist", assigned: null, count: 1, duration: [20, 140] },
          { role: "or_nurse", assigned: null, count: 2, duration: [20, 140] },
          { role: "surgeon", assigned: null, count: 1, duration: [20, 140] }
        ],
        post_op: [
          { role: "anesthesiologist", assigned: null, count: 1, duration: [140, 155] },
          { role: "pacu_bed", assigned: null, count: 1, duration: [140, 200] }
        ],
        sterilization: [
          { role: "envs", assigned: null, count: 1, duration: [140, 170] },
          { role: "operation_room", assigned: null, count: 1, duration: [140, 170] }
        ],
        recovery: [
          { role: "icu_bed", assigned: null, probability: 0.05, count: 1, duration: [200, 500] }
        ]
      }
    },
    {
      // Appendectomy (General) - mandatory with elevated infection risk
      surgery_id: "SURG-JAM-0003",
      name: "James Okafor",
      type: "mandatory",
      infection_type: 1,
      time_windows: {
        earliest_date: "2026-02-13T00:00",
        latest_date: "2026-02-13T23:59",
        planned_start: null,
        planned_by: null
      },
      stages: {
        pre_op: [
          { role: "anesthesiologist", assigned: null, count: 1, duration: [0, 10] }
        ],
        operative: [
          { role: "operation_room", assigned: null, count: 1, duration: [10, 70] },
          { role: "anesthesiologist", assigned: null, count: 1, duration: [10, 70] },
          { role: "or_nurse", assigned: null, count: 1, duration: [10, 70] },
          { role: "surgeon", assigned: null, count: 1, duration: [10, 70] }
        ],
        post_op: [
          { role: "anesthesiologist", assigned: null, count: 1, duration: [70, 85] },
          { role: "pacu_bed", assigned: null, count: 1, duration: [70, 110] }
        ],
        sterilization: [
          { role: "envs", assigned: null, count: 1, duration: [70, 90] },
          { role: "operation_room", assigned: null, count: 1, duration: [70, 90] }
        ],
        recovery: [
          { role: "icu_bed", assigned: null, probability: 0.03, count: 1, duration: [110, 300] }
        ]
      }
    },
    {
      // Bypass CABG (Cardio) - long, resource-heavy
      surgery_id: "SURG-ELE-0004",
      name: "Elena Petrova",
      type: "mandatory",
      infection_type: 0,
      time_windows: {
        earliest_date: "2026-02-18T00:00",
        latest_date: "2026-02-19T23:59",
        planned_start: null,
        planned_by: null
      },
      stages: {
        pre_op: [
          { role: "anesthesiologist", assigned: null, count: 1, duration: [0, 30] }
        ],
        operative: [
          { role: "operation_room", assigned: null, count: 1, duration: [30, 270] },
          { role: "anesthesiologist", assigned: null, count: 2, duration: [30, 270] },
          { role: "or_nurse", assigned: null, count: 2, duration: [30, 270] },
          { role: "surgeon", assigned: null, count: 1, duration: [30, 270] },
          { role: "respiratory_therapist", assigned: null, count: 1, duration: [30, 270] },
          { role: "monitoring_equipment", assigned: null, count: 2, duration: [30, 270] }
        ],
        post_op: [
          { role: "anesthesiologist", assigned: null, count: 1, duration: [270, 300] },
          { role: "icu_bed", assigned: null, count: 1, duration: [270, 500] }
        ],
        sterilization: [
          { role: "envs", assigned: null, count: 1, duration: [270, 300] },
          { role: "operation_room", assigned: null, count: 1, duration: [270, 300] }
        ],
        recovery: [
          { role: "icu_bed", assigned: null, probability: 0.15, count: 1, duration: [500, 1200] }
        ]
      }
    },
    {
      // Spinal Fusion (Neuro)
      surgery_id: "SURG-DAV-0005",
      name: "David Kim",
      type: "elective",
      infection_type: 0,
      time_windows: {
        earliest_date: "2026-02-23T00:00",
        latest_date: "2026-02-27T23:59",
        planned_start: null,
        planned_by: null
      },
      stages: {
        pre_op: [
          { role: "anesthesiologist", assigned: null, count: 1, duration: [0, 20] }
        ],
        operative: [
          { role: "operation_room", assigned: null, count: 1, duration: [20, 200] },
          { role: "anesthesiologist", assigned: null, count: 1, duration: [20, 200] },
          { role: "or_nurse", assigned: null, count: 2, duration: [20, 200] },
          { role: "surgeon", assigned: null, count: 1, duration: [20, 200] },
          { role: "monitoring_equipment", assigned: null, count: 1, duration: [20, 200] }
        ],
        post_op: [
          { role: "anesthesiologist", assigned: null, count: 1, duration: [200, 220] },
          { role: "pacu_bed", assigned: null, count: 1, duration: [200, 260] }
        ],
        sterilization: [
          { role: "envs", assigned: null, count: 1, duration: [200, 230] },
          { role: "operation_room", assigned: null, count: 1, duration: [200, 230] }
        ],
        recovery: [
          { role: "icu_bed", assigned: null, probability: 0.10, count: 1, duration: [260, 650] }
        ]
      }
    }
  ];

  for (const surgery of surgeries) {
    await prisma.surgery.upsert({
      where: { surgery_id: surgery.surgery_id },
      update: {},
      create: {
        organization_id: org.id,
        surgery_id: surgery.surgery_id,
        name: surgery.name,
        type: surgery.type,
        infection_type: surgery.infection_type,
        department_id: surgeryDept.id,
        department: "Surgery",
        time_windows: surgery.time_windows,
        stages: surgery.stages,
      }
    });
  }

  console.log('Seed data updated with Resource Pools, assigned Staff, Non-Renewable Resources, Operation Types, Phase Resources, and Surgeries');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
