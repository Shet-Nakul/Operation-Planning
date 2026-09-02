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

  const ssnPool = await prisma.resourcePool.upsert({
    where: { pool_id: 'CHR-NUR-0001' },
    update: {},
    create: {
      organization_id: org.id,
      pool_id: 'CHR-NUR-0001',
      pool_name: 'Charge Nurse Pool',
      department_id: 3,
      department: "Critical Care",
      location: 'East Wing, Floor 4',
      primary_role: 'Charge Nurse',
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
      weekly_hours: 80,
      demand_matrix: [
        { shift: "Day",   monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 1, sunday: 1 },
        { shift: "Early", monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 1, sunday: 1 },
        { shift: "Late",  monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 1, sunday: 1 },
        { shift: "Night", monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 1, sunday: 1 }
      ]
    }
  });

  // Pool for Senior Staff Nurse
  const ssrPool = await prisma.resourcePool.upsert({
    where: { pool_id: 'SEN-NUR-0001' },
    update: {},
    create: {
      organization_id: org.id,
      pool_id: 'SEN-NUR-0001',
      pool_name: 'Senior Staff Nurse Pool',
      department_id: 3,
      department: "Critical Care",
      location: 'East Wing, Floor 4',
      primary_role: 'Senior Staff Nurse',
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
      pool_id: ssrPool.id,
      effective_from: new Date('2026-05-25'),
      effective_to: new Date('2026-06-01'),
      weekly_hours: 80,
      demand_matrix: [
        { shift: "Day",   monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 0, sunday: 0}
      ]
    }
  });

  await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0001' },
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
      skills: ["ACLS", "Critical Care Nursing", "Ventilator Management", "Patient Assessment"],
      certifications: ["Registered Nurse (RN) - BC", "ACLS Certified", "CCRN"],
      roles: ["Senior Staff Nurse", "Charge Nurse"],
      role_distribution: {
        "Senior Staff Nurse": 0.75,
        "Charge Nurse": 0.25
      },
      weekly_template: {},
      pool_assignments: [
        { "pool_name": "Senior Staff Nurse Pool", "pool_id": "SEN-NUR-0001" },
        { "pool_name": "Charge Nurse Pool", "pool_id": "CHA-NUR-0005" }
      ]
    }
  });


await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0002' },
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
      skills: ["ACLS", "Critical Care Nursing", "Ventilator Management", "Patient Assessment"],
      certifications: ["Registered Nurse (RN) - BC", "ACLS Certified", "CCRN"],
      roles: ["Senior Staff Nurse", "Charge Nurse"],
      role_distribution: {
        "Senior Staff Nurse": 0.75,
        "Charge Nurse": 0.25
      },
      weekly_template: {},
      pool_assignments: [
        { "pool_name": "Senior Staff Nurse Pool", "pool_id": "SEN-NUR-0001" },
        { "pool_name": "Charge Nurse Pool", "pool_id": "CHR-NUR-0001" }
      ]
    }
  });


await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0003' },
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
      skills: ["ACLS", "Critical Care Nursing", "Ventilator Management", "Patient Assessment"],
      certifications: ["Registered Nurse (RN) - BC", "ACLS Certified", "CCRN"],
      roles: ["Senior Staff Nurse", "Charge Nurse"],
      role_distribution: {
        "Senior Staff Nurse": 0.75,
        "Charge Nurse": 0.25
      },
      weekly_template: {},
      pool_assignments: [
        { "pool_name": "Senior Staff Nurse Pool", "pool_id": "SEN-NUR-0001" },
        { "pool_name": "Charge Nurse Pool", "pool_id": "CHR-NUR-0001" }
      ]
    }
  });


await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0004' },
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
      skills: ["ACLS", "Critical Care Nursing", "Ventilator Management", "Patient Assessment"],
      certifications: ["Registered Nurse (RN) - BC", "ACLS Certified", "CCRN"],
      roles: ["Senior Staff Nurse", "Charge Nurse"],
      role_distribution: {
        "Senior Staff Nurse": 0.75,
        "Charge Nurse": 0.25
      },
      weekly_template: {},
      pool_assignments: [
        { "pool_name": "Senior Staff Nurse Pool", "pool_id": "SEN-NUR-0001" },
        { "pool_name": "Charge Nurse Pool", "pool_id": "CHR-NUR-0001" }
      ]
    }
  });


await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0005' },
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
      skills: ["ACLS", "Critical Care Nursing", "Ventilator Management", "Patient Assessment"],
      certifications: ["Registered Nurse (RN) - BC", "ACLS Certified", "CCRN"],
      roles: ["Senior Staff Nurse", "Charge Nurse"],
      role_distribution: {
        "Senior Staff Nurse": 0.75,
        "Charge Nurse": 0.25
      },
      weekly_template: {},
      pool_assignments: [
        { "pool_name": "Senior Staff Nurse Pool", "pool_id": "SEN-NUR-0001" },
        { "pool_name": "Charge Nurse Pool", "pool_id": "CHR-NUR-0001"}
      ]
    }
  });




await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0006' },
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
      skills: ["ACLS", "Critical Care Nursing", "Ventilator Management", "Patient Assessment"],
      certifications: ["Registered Nurse (RN) - BC", "ACLS Certified", "CCRN"],
      roles: ["Senior Staff Nurse", "Charge Nurse"],
      role_distribution: {
        "Senior Staff Nurse": 0.5,
        "Charge Nurse": 0.5
      },
      weekly_template: {},
      pool_assignments: [
        { "pool_name": "Senior Staff Nurse Pool", "pool_id": "SEN-NUR-0001" },
        { "pool_name": "Charge Nurse Pool", "pool_id": "CHR-NUR-0001" }
      ]
    }
  });


await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0007' },
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
      skills: ["ACLS", "Critical Care Nursing", "Ventilator Management", "Patient Assessment"],
      certifications: ["Registered Nurse (RN) - BC", "ACLS Certified", "CCRN"],
      roles: ["Senior Staff Nurse", "Charge Nurse"],
      role_distribution: {
        "Senior Staff Nurse": 0.5,
        "Charge Nurse": 0.5
      },
      weekly_template: {},
      pool_assignments: [
        { "pool_name": "Senior Staff Nurse Pool", "pool_id": "SEN-NUR-0001" },
        { "pool_name": "Charge Nurse Pool", "pool_id": "CHR-NUR-0001" }
      ]
    }
  });


await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0008' },
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
      skills: ["ACLS", "Critical Care Nursing", "Ventilator Management", "Patient Assessment"],
      certifications: ["Registered Nurse (RN) - BC", "ACLS Certified", "CCRN"],
      roles: ["Senior Staff Nurse", "Charge Nurse"],
      role_distribution: {
        "Senior Staff Nurse": 0.25,
        "Charge Nurse": 0.75
      },
      weekly_template: {},
      pool_assignments: [
        { "pool_name": "Senior Staff Nurse Pool", "pool_id": "SEN-NUR-0001" },
        { "pool_name": "Charge Nurse Pool", "pool_id": "CHR-NUR-0001" }
      ]
    }
  });



await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0009' },
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
      skills: ["ACLS", "Critical Care Nursing", "Ventilator Management", "Patient Assessment"],
      certifications: ["Registered Nurse (RN) - BC", "ACLS Certified", "CCRN"],
      roles: ["Senior Staff Nurse", "Charge Nurse"],
      role_distribution: {
        "Senior Staff Nurse": 0.25,
        "Charge Nurse": 0.75
      },
      weekly_template: {},
      pool_assignments: [
        { "pool_name": "Senior Staff Nurse Pool", "pool_id": "SEN-NUR-0001" },
        { "pool_name": "Charge Nurse Pool", "pool_id": "CHR-NUR-0001" }
      ]
    }
  });


await prisma.staff.upsert({
    where: { staff_id: 'STAFF-0010' },
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
      skills: ["ACLS", "Critical Care Nursing", "Ventilator Management", "Patient Assessment"],
      certifications: ["Registered Nurse (RN) - BC", "ACLS Certified", "CCRN"],
      roles: ["Senior Staff Nurse", "Charge Nurse"],
      role_distribution: {
        "Senior Staff Nurse": 0.25,
        "Charge Nurse": 0.75
      },
      weekly_template: {},
      pool_assignments: [
        { "pool_name": "Senior Staff Nurse Pool", "pool_id": "SEN-NUR-0001" },
        { "pool_name": "Charge Nurse Pool", "pool_id": "CHR-NUR-0001" }
      ]
    }
  });

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
