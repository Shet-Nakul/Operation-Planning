import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Snapshot of the current database (as of seed generation).
 * Idempotent upserts preserve existing rows on re-run.
 * Session refresh tokens and user activity logs are omitted.
 */
async function main() {
  // Roles
  await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      "id": 1,
      "name": "ADMIN",
      "description": "Administrator"
    },
  });

  await prisma.role.upsert({
    where: { name: "USER" },
    update: {},
    create: {
      "id": 2,
      "name": "USER",
      "description": "Standard User"
    },
  });

  // Organization
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

  // Users (password hashes preserved; session tokens omitted)
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

  // Global settings
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

  // Staff tags
  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Surgeon" } },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "name": "Surgeon",
      "color": "#4F46E5",
      "status": "ACTIVE"
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Anesthesiologist" } },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "name": "Anesthesiologist",
      "color": "#4F46E5",
      "status": "ACTIVE"
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: 1, name: "OR Nurse" } },
    update: {},
    create: {
      "id": 3,
      "organization_id": 1,
      "name": "OR Nurse",
      "color": "#4F46E5",
      "status": "ACTIVE"
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Senior Staff Nurse" } },
    update: {},
    create: {
      "id": 8,
      "organization_id": 1,
      "name": "Senior Staff Nurse",
      "color": "#4F46E5",
      "status": "ACTIVE"
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Charge Nurse" } },
    update: {},
    create: {
      "id": 9,
      "organization_id": 1,
      "name": "Charge Nurse",
      "color": "#4F46E5",
      "status": "ACTIVE"
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Operation Room" } },
    update: {},
    create: {
      "id": 10,
      "organization_id": 1,
      "name": "Operation Room",
      "color": "#4F46E5",
      "status": "ACTIVE"
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: 1, name: "PACU Bed" } },
    update: {},
    create: {
      "id": 11,
      "organization_id": 1,
      "name": "PACU Bed",
      "color": "#4F46E5",
      "status": "ACTIVE"
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: 1, name: "ICU Bed" } },
    update: {},
    create: {
      "id": 12,
      "organization_id": 1,
      "name": "ICU Bed",
      "color": "#4F46E5",
      "status": "ACTIVE"
    },
  });

  await prisma.staffTag.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Monitoring Equipment" } },
    update: {},
    create: {
      "id": 13,
      "organization_id": 1,
      "name": "Monitoring Equipment",
      "color": "#4F46E5",
      "status": "ACTIVE"
    },
  });

  // Specializations
  await prisma.specialization.upsert({
    where: { organization_id_name: { organization_id: 1, name: "General Surgery" } },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "name": "General Surgery",
      "description": null,
      "status": "ACTIVE"
    },
  });

  await prisma.specialization.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Orthopedics" } },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "name": "Orthopedics",
      "description": null,
      "status": "ACTIVE"
    },
  });

  // Departments
  await prisma.department.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Surgery" } },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "name": "Surgery",
      "description": null,
      "status": "ACTIVE"
    },
  });

  await prisma.department.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Anesthesiology" } },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "name": "Anesthesiology",
      "description": null,
      "status": "ACTIVE"
    },
  });

  await prisma.department.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Critical Care" } },
    update: {},
    create: {
      "id": 3,
      "organization_id": 1,
      "name": "Critical Care",
      "description": null,
      "status": "ACTIVE"
    },
  });

  // Skills
  await prisma.skill.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Patient Assessment" } },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "name": "Patient Assessment",
      "description": null,
      "status": "ACTIVE"
    },
  });

  await prisma.skill.upsert({
    where: { organization_id_name: { organization_id: 1, name: "ACLS" } },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "name": "ACLS",
      "description": null,
      "status": "ACTIVE"
    },
  });

  await prisma.skill.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Ventilator Management" } },
    update: {},
    create: {
      "id": 3,
      "organization_id": 1,
      "name": "Ventilator Management",
      "description": null,
      "status": "ACTIVE"
    },
  });

  // Resource types
  await prisma.resourceType.upsert({
    where: { organization_id_name: { organization_id: 1, name: "BED" } },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "name": "BED",
      "status": "ACTIVE"
    },
  });

  await prisma.resourceType.upsert({
    where: { organization_id_name: { organization_id: 1, name: "ROOM" } },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "name": "ROOM",
      "status": "ACTIVE"
    },
  });

  await prisma.resourceType.upsert({
    where: { organization_id_name: { organization_id: 1, name: "EQUIPMENT" } },
    update: {},
    create: {
      "id": 3,
      "organization_id": 1,
      "name": "EQUIPMENT",
      "status": "ACTIVE"
    },
  });

  // Shifts
  await prisma.shift.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Day" } },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "name": "Day",
      "alias": "D",
      "start_time": "08:00",
      "end_time": "16:00",
      "description": null,
      "status": "ACTIVE"
    },
  });

  await prisma.shift.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Early" } },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "name": "Early",
      "alias": "E",
      "start_time": "05:00",
      "end_time": "13:00",
      "description": null,
      "status": "ACTIVE"
    },
  });

  await prisma.shift.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Late" } },
    update: {},
    create: {
      "id": 3,
      "organization_id": 1,
      "name": "Late",
      "alias": "L",
      "start_time": "14:00",
      "end_time": "22:00",
      "description": null,
      "status": "ACTIVE"
    },
  });

  await prisma.shift.upsert({
    where: { organization_id_name: { organization_id: 1, name: "Night" } },
    update: {},
    create: {
      "id": 4,
      "organization_id": 1,
      "name": "Night",
      "alias": "N",
      "start_time": "21:00",
      "end_time": "05:00",
      "description": null,
      "status": "ACTIVE"
    },
  });

  // Forbidden patterns
  await prisma.forbiddenPattern.upsert({
    where: { id: 9 },
    update: {},
    create: {
      "id": 9,
      "organization_id": 1,
      "scope": "GLOBAL",
      "applies_to": "ALL_CONTRACT_TYPES",
      "forbidden_patterns": [
        {
          "id": "late-day",
          "hard": false,
          "name": "late_followed_day",
          "label": "Late → Day",
          "active": true,
          "reason": "Avoid back-to-back late then day shift",
          "weight": 14,
          "enabled": true,
          "pattern": [
            "L",
            "D"
          ],
          "description": "Avoid back-to-back late then day shift"
        },
        {
          "id": "day-early-day",
          "hard": false,
          "name": "day_followed_early_followed_day",
          "label": "Day → Early → Day",
          "active": true,
          "reason": "Avoid irregular day-early-day sequence",
          "weight": 12,
          "enabled": true,
          "pattern": [
            "D",
            "E",
            "D"
          ],
          "description": "Avoid irregular day-early-day sequence"
        },
        {
          "id": "fri-off-weekend",
          "hard": false,
          "name": "friday_off_before_weekend",
          "label": "Friday Off Before Weekend",
          "active": true,
          "reason": "Prefer no shift on Friday before weekend work",
          "weight": 10,
          "enabled": true,
          "description": "Prefer no shift on Friday before weekend work"
        },
        {
          "id": "late-early",
          "hard": false,
          "name": "late_followed_early",
          "label": "Late → Early",
          "active": true,
          "reason": "Avoid short turnaround between late and early shift",
          "weight": 28,
          "enabled": true,
          "pattern": [
            "L",
            "E"
          ],
          "description": "Avoid short turnaround between late and early shift"
        },
        {
          "id": "late-night",
          "hard": false,
          "name": "late_followed_night",
          "label": "Late → Night",
          "active": true,
          "reason": "Avoid a night shift immediately after a late shift",
          "weight": 28,
          "enabled": true,
          "pattern": [
            "L",
            "N"
          ],
          "description": "Avoid a night shift immediately after a late shift"
        },
        {
          "id": "day-night",
          "hard": false,
          "name": "day_followed_night",
          "label": "Day → Night",
          "active": true,
          "reason": "Avoid switching from day to night shift",
          "weight": 22,
          "enabled": true,
          "pattern": [
            "D",
            "N"
          ],
          "description": "Avoid switching from day to night shift"
        },
        {
          "id": "night-day",
          "hard": false,
          "name": "night_followed_day",
          "label": "Night → Day",
          "active": true,
          "reason": "Avoid switching from night to day shift",
          "weight": 35,
          "enabled": true,
          "pattern": [
            "N",
            "D"
          ],
          "description": "Avoid switching from night to day shift"
        },
        {
          "id": "night-early",
          "hard": false,
          "name": "night_followed_early",
          "label": "Night → Early",
          "active": true,
          "reason": "Avoid switching from night to early shift",
          "weight": 35,
          "enabled": true,
          "pattern": [
            "N",
            "E"
          ],
          "description": "Avoid switching from night to early shift"
        }
      ],
      "metadata": {}
    },
  });

  await prisma.forbiddenPattern.upsert({
    where: { id: 10 },
    update: {},
    create: {
      "id": 10,
      "organization_id": 1,
      "scope": "GLOBAL",
      "applies_to": "ALL_CONTRACT_TYPES",
      "forbidden_patterns": [
        {
          "id": "late-day",
          "hard": false,
          "name": "late_followed_day",
          "label": "Late → Day",
          "active": true,
          "reason": "Avoid back-to-back late then day shift",
          "weight": 14,
          "enabled": true,
          "pattern": [
            "L",
            "D"
          ],
          "description": "Avoid back-to-back late then day shift"
        },
        {
          "id": "day-early-day",
          "hard": false,
          "name": "day_followed_early_followed_day",
          "label": "Day → Early → Day",
          "active": true,
          "reason": "Avoid irregular day-early-day sequence",
          "weight": 12,
          "enabled": true,
          "pattern": [
            "D",
            "E",
            "D"
          ],
          "description": "Avoid irregular day-early-day sequence"
        },
        {
          "id": "fri-off-weekend",
          "hard": false,
          "name": "friday_off_before_weekend",
          "label": "Friday Off Before Weekend",
          "active": true,
          "reason": "Prefer no shift on Friday before weekend work",
          "weight": 10,
          "enabled": true,
          "description": "Prefer no shift on Friday before weekend work"
        },
        {
          "id": "late-early",
          "hard": false,
          "name": "late_followed_early",
          "label": "Late → Early",
          "active": true,
          "reason": "Avoid short turnaround between late and early shift",
          "weight": 28,
          "enabled": true,
          "pattern": [
            "L",
            "E"
          ],
          "description": "Avoid short turnaround between late and early shift"
        },
        {
          "id": "late-night",
          "hard": false,
          "name": "late_followed_night",
          "label": "Late → Night",
          "active": true,
          "reason": "Avoid a night shift immediately after a late shift",
          "weight": 28,
          "enabled": true,
          "pattern": [
            "L",
            "N"
          ],
          "description": "Avoid a night shift immediately after a late shift"
        },
        {
          "id": "day-night",
          "hard": false,
          "name": "day_followed_night",
          "label": "Day → Night",
          "active": true,
          "reason": "Avoid switching from day to night shift",
          "weight": 22,
          "enabled": true,
          "pattern": [
            "D",
            "N"
          ],
          "description": "Avoid switching from day to night shift"
        },
        {
          "id": "night-day",
          "hard": false,
          "name": "night_followed_day",
          "label": "Night → Day",
          "active": true,
          "reason": "Avoid switching from night to day shift",
          "weight": 35,
          "enabled": true,
          "pattern": [
            "N",
            "D"
          ],
          "description": "Avoid switching from night to day shift"
        },
        {
          "id": "night-early",
          "hard": false,
          "name": "night_followed_early",
          "label": "Night → Early",
          "active": true,
          "reason": "Avoid switching from night to early shift",
          "weight": 35,
          "enabled": true,
          "pattern": [
            "N",
            "E"
          ],
          "description": "Avoid switching from night to early shift"
        }
      ],
      "metadata": {}
    },
  });

  // Contracts
  await prisma.contract.upsert({
    where: { contract_id: "DYN-0001" },
    update: {},
    create: {
      "id": 1,
      "contract_id": "DYN-0001",
      "organization_id": 1,
      "name": "Nurse Dynamic Framework",
      "type": "DYNAMIC",
      "status": "Active",
      "staff_tags": [
        "OR Nurse",
        "Senior Staff Nurse"
      ],
      "configuration": {
        "schedulingRules": {
          "complete_weekends": {
            "mode": "HARD",
            "active": false
          },
          "no_free_day_before_working_weekend": {
            "mode": "HARD",
            "active": true
          },
          "no_night_shift_before_free_weekend": {
            "mode": "HARD",
            "active": true
          },
          "identical_shift_types_during_weekend": {
            "mode": "HARD",
            "active": true
          }
        },
        "assignmentLimits": {
          "max_num_assignments": {
            "mode": "HARD",
            "value": 22,
            "active": true
          },
          "min_num_assignments": {
            "mode": "HARD",
            "value": 18,
            "active": true
          },
          "max_consecutive_free_days": {
            "mode": "HARD",
            "value": 4,
            "active": true
          },
          "min_consecutive_free_days": {
            "mode": "HARD",
            "value": 1,
            "active": true
          },
          "max_consecutive_working_days": {
            "mode": "HARD",
            "value": 5,
            "active": true
          },
          "min_consecutive_working_days": {
            "mode": "HARD",
            "value": 2,
            "active": true
          },
          "max_consecutive_working_weekends": {
            "mode": "HARD",
            "value": 8,
            "active": true
          },
          "min_consecutive_working_weekends": {
            "mode": "HARD",
            "value": 1,
            "active": true
          }
        },
        "annualEntitlements": {
          "yearlyEntitledLeaves": 25,
          "yearlyEntitledPreferredShifts": 12
        }
      },
      "global_settings": {
        "forbiddenPatternsSource": "GLOBAL_PATTERN_REGISTRY",
        "inheritsForbiddenPatterns": true
      },
      "metadata": {}
    },
  });

  await prisma.contract.upsert({
    where: { contract_id: "STA-0001" },
    update: {},
    create: {
      "id": 2,
      "contract_id": "STA-0001",
      "organization_id": 1,
      "name": "Surgeon Static 40h",
      "type": "STATIC",
      "status": "Active",
      "staff_tags": [
        "Surgeon"
      ],
      "configuration": {
        "weeklyHours": 40,
        "weeklyBreakHours": 5,
        "activeDaysPerWeek": 5,
        "annualEntitlements": {
          "yearlyLeaves": 28,
          "preferredShiftsPerYear": 12
        }
      },
      "global_settings": {},
      "metadata": {}
    },
  });

  await prisma.contract.upsert({
    where: { contract_id: "DYN-0002" },
    update: {},
    create: {
      "id": 3,
      "contract_id": "DYN-0002",
      "organization_id": 1,
      "name": "Nurse Full Time",
      "type": "DYNAMIC",
      "status": "Active",
      "staff_tags": [
        "Charge Nurse",
        "Senior Staff Nurse",
        "OR Nurse"
      ],
      "configuration": {
        "schedulingRules": {
          "complete_weekends": {
            "mode": "HARD",
            "active": true
          },
          "no_free_day_before_working_weekend": {
            "mode": "HARD",
            "active": true
          },
          "no_night_shift_before_free_weekend": {
            "mode": "HARD",
            "active": true
          },
          "identical_shift_types_during_weekend": {
            "mode": "HARD",
            "active": true
          }
        },
        "assignmentLimits": {
          "max_num_assignments": {
            "mode": "HARD",
            "value": 22,
            "active": true
          },
          "min_num_assignments": {
            "mode": "HARD",
            "value": 18,
            "active": true
          },
          "max_consecutive_free_days": {
            "mode": "HARD",
            "value": 5,
            "active": true
          },
          "min_consecutive_free_days": {
            "mode": "HARD",
            "value": 2,
            "active": true
          },
          "max_consecutive_working_days": {
            "mode": "HARD",
            "value": 5,
            "active": true
          },
          "min_consecutive_working_days": {
            "mode": "HARD",
            "value": 3,
            "active": true
          },
          "max_consecutive_working_weekends": {
            "mode": "HARD",
            "value": 5,
            "active": true
          },
          "min_consecutive_working_weekends": {
            "mode": "HARD",
            "value": 2,
            "active": true
          }
        },
        "annualEntitlements": {
          "yearlyEntitledLeaves": 25,
          "yearlyEntitledPreferredShifts": 12
        }
      },
      "global_settings": {
        "forbiddenPatternsSource": "GLOBAL_PATTERN_REGISTRY",
        "inheritsForbiddenPatterns": true
      },
      "metadata": {
        "createdAt": new Date("2026-04-23T00:00:00Z"),
        "createdBy": "hr_system@hospital.org",
        "updatedAt": new Date("2026-04-23T00:00:00Z"),
        "department": "Surgery",
        "effectiveTo": new Date("2027-04-30T23:59:59Z"),
        "approvalDate": new Date("2026-04-22T15:30:00Z"),
        "effectiveFrom": new Date("2026-05-01T00:00:00Z"),
        "lastModifiedBy": "admin@hospital.org",
        "specialization": "General Surgery",
        "complianceLevel": "HEALTHCARE_STANDARD",
        "contractVersion": "2.0",
        "supervisionLevel": "SUPERVISED",
        "validationStatus": "VALIDATED"
      }
    },
  });

  // Staff
  await prisma.staff.upsert({
    where: { staff_id: "STAFF-NA-0001" },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "staff_id": "STAFF-NA-0001",
      "name": "Nurse Ava Chen",
      "address": null,
      "phone": null,
      "email": "ava.chen@hospital.test",
      "profile_picture": null,
      "department_id": 1,
      "department": "Surgery",
      "designation": "Charge Nurse",
      "contract_id": "DYN-0001",
      "supervisor": "Hospital Admin",
      "skills": [
        "OR Nurse"
      ],
      "certifications": [],
      "roles": [
        "OR Nurse"
      ],
      "role_distribution": {
        "OR Nurse": 1
      },
      "weekly_template": {},
      "pool_assignments": [
        {
          "pool_id": "OR-NUR-0001",
          "pool_name": "OR Nursing Pool"
        }
      ]
    },
  });

  await prisma.staff.upsert({
    where: { staff_id: "STAFF-NB-0002" },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "staff_id": "STAFF-NB-0002",
      "name": "Nurse Ben Ortiz",
      "address": null,
      "phone": null,
      "email": "ben.ortiz@hospital.test",
      "profile_picture": null,
      "department_id": 1,
      "department": "Surgery",
      "designation": "Charge Nurse",
      "contract_id": "DYN-0001",
      "supervisor": "Hospital Admin",
      "skills": [
        "OR Nurse"
      ],
      "certifications": [],
      "roles": [
        "OR Nurse"
      ],
      "role_distribution": {
        "OR Nurse": 1
      },
      "weekly_template": {},
      "pool_assignments": [
        {
          "pool_id": "OR-NUR-0001",
          "pool_name": "OR Nursing Pool"
        }
      ]
    },
  });

  await prisma.staff.upsert({
    where: { staff_id: "STAFF-DS-0003" },
    update: {},
    create: {
      "id": 3,
      "organization_id": 1,
      "staff_id": "STAFF-DS-0003",
      "name": "Dr. Sam Rivera",
      "address": null,
      "phone": null,
      "email": "sam.rivera@hospital.test",
      "profile_picture": null,
      "department_id": 1,
      "department": "Surgery",
      "designation": "Chief Surgeon",
      "contract_id": "STA-0001",
      "supervisor": "Hospital Admin",
      "skills": [
        "Surgeon"
      ],
      "certifications": [],
      "roles": [
        "Surgeon"
      ],
      "role_distribution": {
        "Surgeon": 1
      },
      "weekly_template": {
        "friday": [
          {
            "end": "12:00",
            "role": "Surgeon",
            "start": "08:00"
          }
        ],
        "monday": [
          {
            "end": "12:00",
            "role": "Surgeon",
            "start": "08:00"
          }
        ],
        "tuesday": [
          {
            "end": "12:00",
            "role": "Surgeon",
            "start": "08:00"
          }
        ],
        "thursday": [
          {
            "end": "12:00",
            "role": "Surgeon",
            "start": "08:00"
          }
        ],
        "wednesday": [
          {
            "end": "12:00",
            "role": "Surgeon",
            "start": "08:00"
          }
        ]
      },
      "pool_assignments": []
    },
  });

  await prisma.staff.upsert({
    where: { staff_id: "STAFF-0001" },
    update: {},
    create: {
      "id": 4,
      "organization_id": 1,
      "staff_id": "STAFF-0001",
      "name": "Sarah Johnson",
      "address": "1247 Maple Avenue, Vancouver, BC V6B 2K3",
      "phone": "+1-604-555-0128",
      "email": "sarah.dynamic@hospital.ca",
      "profile_picture": "https://example.com/profiles/sarah_johnson.jpg",
      "department_id": 3,
      "department": "Critical Care",
      "designation": "Senior Staff Nurse",
      "contract_id": "DYN-0001",
      "supervisor": "Dr. Emily Thompson",
      "skills": [
        "ACLS",
        "Critical Care Nursing",
        "Ventilator Management",
        "Patient Assessment"
      ],
      "certifications": [
        "Registered Nurse (RN) - BC",
        "ACLS Certified",
        "CCRN"
      ],
      "roles": [
        "Senior Staff Nurse",
        "Charge Nurse"
      ],
      "role_distribution": {
        "Charge Nurse": 0.25,
        "Senior Staff Nurse": 0.75
      },
      "weekly_template": {},
      "pool_assignments": [
        {
          "pool_id": "SEN-NUR-0001",
          "pool_name": "Senior Staff Nurse Pool"
        },
        {
          "pool_id": "CHA-NUR-0005",
          "pool_name": "Charge Nurse Pool"
        }
      ]
    },
  });

  await prisma.staff.upsert({
    where: { staff_id: "STAFF-0002" },
    update: {},
    create: {
      "id": 5,
      "organization_id": 1,
      "staff_id": "STAFF-0002",
      "name": "John Doe",
      "address": "5678 Oak Street, Vancouver, BC V6B 3L4",
      "phone": "+1-604-555-0199",
      "email": "john.dynamic@hospital.ca",
      "profile_picture": "https://example.com/profiles/sarah_johnson.jpg",
      "department_id": 3,
      "department": "Critical Care",
      "designation": "Senior Staff Nurse",
      "contract_id": "DYN-0001",
      "supervisor": "Dr. Emily Thompson",
      "skills": [
        "ACLS",
        "Critical Care Nursing",
        "Ventilator Management",
        "Patient Assessment"
      ],
      "certifications": [
        "Registered Nurse (RN) - BC",
        "ACLS Certified",
        "CCRN"
      ],
      "roles": [
        "Senior Staff Nurse",
        "Charge Nurse"
      ],
      "role_distribution": {
        "Charge Nurse": 0.25,
        "Senior Staff Nurse": 0.75
      },
      "weekly_template": {},
      "pool_assignments": [
        {
          "pool_id": "SEN-NUR-0001",
          "pool_name": "Senior Staff Nurse Pool"
        },
        {
          "pool_id": "CHR-NUR-0001",
          "pool_name": "Charge Nurse Pool"
        }
      ]
    },
  });

  await prisma.staff.upsert({
    where: { staff_id: "STAFF-0003" },
    update: {},
    create: {
      "id": 6,
      "organization_id": 1,
      "staff_id": "STAFF-0003",
      "name": "Taylor Smith",
      "address": "1247 Maple Avenue, Vancouver, BC V6B 2K3",
      "phone": "+1-604-555-0128",
      "email": "taylor.dynamic@hospital.ca",
      "profile_picture": "https://example.com/profiles/sarah_johnson.jpg",
      "department_id": 3,
      "department": "Critical Care",
      "designation": "Senior Staff Nurse",
      "contract_id": "DYN-0001",
      "supervisor": "Dr. Emily Thompson",
      "skills": [
        "ACLS",
        "Critical Care Nursing",
        "Ventilator Management",
        "Patient Assessment"
      ],
      "certifications": [
        "Registered Nurse (RN) - BC",
        "ACLS Certified",
        "CCRN"
      ],
      "roles": [
        "Senior Staff Nurse",
        "Charge Nurse"
      ],
      "role_distribution": {
        "Charge Nurse": 0.25,
        "Senior Staff Nurse": 0.75
      },
      "weekly_template": {},
      "pool_assignments": [
        {
          "pool_id": "SEN-NUR-0001",
          "pool_name": "Senior Staff Nurse Pool"
        },
        {
          "pool_id": "CHR-NUR-0001",
          "pool_name": "Charge Nurse Pool"
        }
      ]
    },
  });

  await prisma.staff.upsert({
    where: { staff_id: "STAFF-0004" },
    update: {},
    create: {
      "id": 7,
      "organization_id": 1,
      "staff_id": "STAFF-0004",
      "name": "Jordan Lee",
      "address": "1250 Oak Street, Vancouver, BC V6B 3K4",
      "phone": "+1-604-555-0130",
      "email": "jordan.dynamic@hospital.ca",
      "profile_picture": "https://example.com/profiles/sarah_johnson.jpg",
      "department_id": 3,
      "department": "Critical Care",
      "designation": "Senior Staff Nurse",
      "contract_id": "DYN-0001",
      "supervisor": "Dr. Emily Thompson",
      "skills": [
        "ACLS",
        "Critical Care Nursing",
        "Ventilator Management",
        "Patient Assessment"
      ],
      "certifications": [
        "Registered Nurse (RN) - BC",
        "ACLS Certified",
        "CCRN"
      ],
      "roles": [
        "Senior Staff Nurse",
        "Charge Nurse"
      ],
      "role_distribution": {
        "Charge Nurse": 0.25,
        "Senior Staff Nurse": 0.75
      },
      "weekly_template": {},
      "pool_assignments": [
        {
          "pool_id": "SEN-NUR-0001",
          "pool_name": "Senior Staff Nurse Pool"
        },
        {
          "pool_id": "CHR-NUR-0001",
          "pool_name": "Charge Nurse Pool"
        }
      ]
    },
  });

  await prisma.staff.upsert({
    where: { staff_id: "STAFF-0005" },
    update: {},
    create: {
      "id": 8,
      "organization_id": 1,
      "staff_id": "STAFF-0005",
      "name": "Alex Kim",
      "address": "1260 Pine Street, Vancouver, BC V6B 4L5",
      "phone": "+1-604-555-0131",
      "email": "alex.dynamic@hospital.ca",
      "profile_picture": "https://example.com/profiles/sarah_johnson.jpg",
      "department_id": 3,
      "department": "Critical Care",
      "designation": "Senior Staff Nurse",
      "contract_id": "DYN-0001",
      "supervisor": "Dr. Emily Thompson",
      "skills": [
        "ACLS",
        "Critical Care Nursing",
        "Ventilator Management",
        "Patient Assessment"
      ],
      "certifications": [
        "Registered Nurse (RN) - BC",
        "ACLS Certified",
        "CCRN"
      ],
      "roles": [
        "Senior Staff Nurse",
        "Charge Nurse"
      ],
      "role_distribution": {
        "Charge Nurse": 0.25,
        "Senior Staff Nurse": 0.75
      },
      "weekly_template": {},
      "pool_assignments": [
        {
          "pool_id": "SEN-NUR-0001",
          "pool_name": "Senior Staff Nurse Pool"
        },
        {
          "pool_id": "CHR-NUR-0001",
          "pool_name": "Charge Nurse Pool"
        }
      ]
    },
  });

  await prisma.staff.upsert({
    where: { staff_id: "STAFF-0006" },
    update: {},
    create: {
      "id": 9,
      "organization_id": 1,
      "staff_id": "STAFF-0006",
      "name": "Chris Lee",
      "address": "1247 Maple Avenue, Vancouver, BC V6B 2K3",
      "phone": "+1-604-555-0128",
      "email": "chris.dynamic@hospital.ca",
      "profile_picture": "https://example.com/profiles/sarah_johnson.jpg",
      "department_id": 3,
      "department": "Critical Care",
      "designation": "Senior Staff Nurse",
      "contract_id": "DYN-0001",
      "supervisor": "Dr. Emily Thompson",
      "skills": [
        "ACLS",
        "Critical Care Nursing",
        "Ventilator Management",
        "Patient Assessment"
      ],
      "certifications": [
        "Registered Nurse (RN) - BC",
        "ACLS Certified",
        "CCRN"
      ],
      "roles": [
        "Senior Staff Nurse",
        "Charge Nurse"
      ],
      "role_distribution": {
        "Charge Nurse": 0.5,
        "Senior Staff Nurse": 0.5
      },
      "weekly_template": {},
      "pool_assignments": [
        {
          "pool_id": "SEN-NUR-0001",
          "pool_name": "Senior Staff Nurse Pool"
        },
        {
          "pool_id": "CHR-NUR-0001",
          "pool_name": "Charge Nurse Pool"
        }
      ]
    },
  });

  await prisma.staff.upsert({
    where: { staff_id: "STAFF-0007" },
    update: {},
    create: {
      "id": 10,
      "organization_id": 1,
      "staff_id": "STAFF-0007",
      "name": "Morgan Brown",
      "address": "5678 Oak Street, Vancouver, BC V6B 3L4",
      "phone": "+1-604-555-0199",
      "email": "morgan.dynamic@hospital.ca",
      "profile_picture": "https://example.com/profiles/sarah_johnson.jpg",
      "department_id": 3,
      "department": "Critical Care",
      "designation": "Senior Staff Nurse",
      "contract_id": "DYN-0001",
      "supervisor": "Dr. Emily Thompson",
      "skills": [
        "ACLS",
        "Critical Care Nursing",
        "Ventilator Management",
        "Patient Assessment"
      ],
      "certifications": [
        "Registered Nurse (RN) - BC",
        "ACLS Certified",
        "CCRN"
      ],
      "roles": [
        "Senior Staff Nurse",
        "Charge Nurse"
      ],
      "role_distribution": {
        "Charge Nurse": 0.5,
        "Senior Staff Nurse": 0.5
      },
      "weekly_template": {},
      "pool_assignments": [
        {
          "pool_id": "SEN-NUR-0001",
          "pool_name": "Senior Staff Nurse Pool"
        },
        {
          "pool_id": "CHR-NUR-0001",
          "pool_name": "Charge Nurse Pool"
        }
      ]
    },
  });

  await prisma.staff.upsert({
    where: { staff_id: "STAFF-0008" },
    update: {},
    create: {
      "id": 11,
      "organization_id": 1,
      "staff_id": "STAFF-0008",
      "name": "Kim Taylor",
      "address": "1247 Maple Avenue, Vancouver, BC V6B 2K3",
      "phone": "+1-604-555-0128",
      "email": "kim.taylor@hospital.ca",
      "profile_picture": "https://example.com/profiles/sarah_johnson.jpg",
      "department_id": 3,
      "department": "Critical Care",
      "designation": "Senior Staff Nurse",
      "contract_id": "DYN-0001",
      "supervisor": "Dr. Emily Thompson",
      "skills": [
        "ACLS",
        "Critical Care Nursing",
        "Ventilator Management",
        "Patient Assessment"
      ],
      "certifications": [
        "Registered Nurse (RN) - BC",
        "ACLS Certified",
        "CCRN"
      ],
      "roles": [
        "Senior Staff Nurse",
        "Charge Nurse"
      ],
      "role_distribution": {
        "Charge Nurse": 0.75,
        "Senior Staff Nurse": 0.25
      },
      "weekly_template": {},
      "pool_assignments": [
        {
          "pool_id": "SEN-NUR-0001",
          "pool_name": "Senior Staff Nurse Pool"
        },
        {
          "pool_id": "CHR-NUR-0001",
          "pool_name": "Charge Nurse Pool"
        }
      ]
    },
  });

  await prisma.staff.upsert({
    where: { staff_id: "STAFF-0009" },
    update: {},
    create: {
      "id": 12,
      "organization_id": 1,
      "staff_id": "STAFF-0009",
      "name": "Leonard White",
      "address": "1250 Oak Street, Vancouver, BC V6B 3K4",
      "phone": "+1-604-555-0130",
      "email": "leonard.white@hospital.ca",
      "profile_picture": "https://example.com/profiles/sarah_johnson.jpg",
      "department_id": 3,
      "department": "Critical Care",
      "designation": "Senior Staff Nurse",
      "contract_id": "DYN-0001",
      "supervisor": "Dr. Emily Thompson",
      "skills": [
        "ACLS",
        "Critical Care Nursing",
        "Ventilator Management",
        "Patient Assessment"
      ],
      "certifications": [
        "Registered Nurse (RN) - BC",
        "ACLS Certified",
        "CCRN"
      ],
      "roles": [
        "Senior Staff Nurse",
        "Charge Nurse"
      ],
      "role_distribution": {
        "Charge Nurse": 0.75,
        "Senior Staff Nurse": 0.25
      },
      "weekly_template": {},
      "pool_assignments": [
        {
          "pool_id": "SEN-NUR-0001",
          "pool_name": "Senior Staff Nurse Pool"
        },
        {
          "pool_id": "CHR-NUR-0001",
          "pool_name": "Charge Nurse Pool"
        }
      ]
    },
  });

  await prisma.staff.upsert({
    where: { staff_id: "STAFF-0010" },
    update: {},
    create: {
      "id": 13,
      "organization_id": 1,
      "staff_id": "STAFF-0010",
      "name": "Samantha Green",
      "address": "1260 Pine Street, Vancouver, BC V6B 4L5",
      "phone": "+1-604-555-0131",
      "email": "samantha.green@hospital.ca",
      "profile_picture": "https://example.com/profiles/sarah_johnson.jpg",
      "department_id": 3,
      "department": "Critical Care",
      "designation": "Senior Staff Nurse",
      "contract_id": "DYN-0001",
      "supervisor": "Dr. Emily Thompson",
      "skills": [
        "ACLS",
        "Critical Care Nursing",
        "Ventilator Management",
        "Patient Assessment"
      ],
      "certifications": [
        "Registered Nurse (RN) - BC",
        "ACLS Certified",
        "CCRN"
      ],
      "roles": [
        "Senior Staff Nurse",
        "Charge Nurse"
      ],
      "role_distribution": {
        "Charge Nurse": 0.75,
        "Senior Staff Nurse": 0.25
      },
      "weekly_template": {},
      "pool_assignments": [
        {
          "pool_id": "SEN-NUR-0001",
          "pool_name": "Senior Staff Nurse Pool"
        },
        {
          "pool_id": "CHR-NUR-0001",
          "pool_name": "Charge Nurse Pool"
        }
      ]
    },
  });

  // Resource pools
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

  // Pool demand configs
  await prisma.poolDemandConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      "id": 1,
      "pool_id": 1,
      "effective_from": new Date("2026-08-15T06:25:52.200Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "fri": 1,
          "mon": 1,
          "sat": 0,
          "sun": 0,
          "thu": 1,
          "tue": 1,
          "wed": 1,
          "shift": "Day"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Early"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Late"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Night"
        }
      ],
      "weekly_hours": 40
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 2 },
    update: {},
    create: {
      "id": 2,
      "pool_id": 1,
      "effective_from": new Date("2026-08-15T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "fri": 1,
          "mon": 1,
          "sat": 1,
          "sun": 0,
          "thu": 1,
          "tue": 1,
          "wed": 1,
          "shift": "Day"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Early"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Late"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Night"
        }
      ],
      "weekly_hours": 48
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 3 },
    update: {},
    create: {
      "id": 3,
      "pool_id": 1,
      "effective_from": new Date("2026-08-15T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "fri": 1,
          "mon": 1,
          "sat": 1,
          "sun": 0,
          "thu": 1,
          "tue": 1,
          "wed": 1,
          "shift": "Day"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Early"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Late"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Night"
        }
      ],
      "weekly_hours": 48
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 4 },
    update: {},
    create: {
      "id": 4,
      "pool_id": 1,
      "effective_from": new Date("2026-08-31T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "fri": 1,
          "mon": 1,
          "sat": 1,
          "sun": 0,
          "thu": 1,
          "tue": 1,
          "wed": 1,
          "shift": "Day"
        },
        {
          "fri": 1,
          "mon": 1,
          "sat": 0,
          "sun": 0,
          "thu": 1,
          "tue": 1,
          "wed": 1,
          "shift": "Early"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Late"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Night"
        }
      ],
      "weekly_hours": 88
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 5 },
    update: {},
    create: {
      "id": 5,
      "pool_id": 1,
      "effective_from": new Date("2026-08-31T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "fri": 1,
          "mon": 1,
          "sat": 1,
          "sun": 0,
          "thu": 1,
          "tue": 1,
          "wed": 1,
          "shift": "Day"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Early"
        },
        {
          "fri": 1,
          "mon": 1,
          "sat": 1,
          "sun": 0,
          "thu": 1,
          "tue": 1,
          "wed": 1,
          "shift": "Late"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Night"
        }
      ],
      "weekly_hours": 96
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 6 },
    update: {},
    create: {
      "id": 6,
      "pool_id": 1,
      "effective_from": new Date("2026-08-31T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "fri": 1,
          "mon": 1,
          "sat": 1,
          "sun": 0,
          "thu": 1,
          "tue": 1,
          "wed": 1,
          "shift": "Day"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Early"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Late"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Night"
        }
      ],
      "weekly_hours": 48
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 7 },
    update: {},
    create: {
      "id": 7,
      "pool_id": 1,
      "effective_from": new Date("2026-08-31T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "fri": 1,
          "mon": 1,
          "sat": 1,
          "sun": 0,
          "thu": 1,
          "tue": 1,
          "wed": 1,
          "shift": "Day"
        },
        {
          "fri": 1,
          "mon": 1,
          "sat": 1,
          "sun": 0,
          "thu": 1,
          "tue": 1,
          "wed": 1,
          "shift": "Early"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Late"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Night"
        }
      ],
      "weekly_hours": 96
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 8 },
    update: {},
    create: {
      "id": 8,
      "pool_id": 1,
      "effective_from": new Date("2026-08-31T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "fri": 1,
          "mon": 1,
          "sat": 1,
          "sun": 0,
          "thu": 1,
          "tue": 1,
          "wed": 1,
          "shift": "Day"
        },
        {
          "fri": 1,
          "mon": 1,
          "sat": 1,
          "sun": 0,
          "thu": 1,
          "tue": 1,
          "wed": 1,
          "shift": "Early"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Late"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Night"
        }
      ],
      "weekly_hours": 96
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 9 },
    update: {},
    create: {
      "id": 9,
      "pool_id": 1,
      "effective_from": new Date("2026-08-31T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Day"
        },
        {
          "fri": 1,
          "mon": 1,
          "sat": 1,
          "sun": 0,
          "thu": 1,
          "tue": 1,
          "wed": 1,
          "shift": "Early"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Late"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Night"
        }
      ],
      "weekly_hours": 48
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 10 },
    update: {},
    create: {
      "id": 10,
      "pool_id": 1,
      "effective_from": new Date("2026-08-31T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Early",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Late",
          "friday": 1,
          "monday": 1,
          "sunday": 0,
          "tuesday": 1,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Night",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        }
      ],
      "weekly_hours": 48
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 11 },
    update: {},
    create: {
      "id": 11,
      "pool_id": 1,
      "effective_from": new Date("2026-08-31T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 1,
          "monday": 1,
          "sunday": 0,
          "tuesday": 1,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Early",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Late",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Night",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        }
      ],
      "weekly_hours": 48
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 12 },
    update: {},
    create: {
      "id": 12,
      "pool_id": 1,
      "effective_from": new Date("2026-08-31T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 1,
          "monday": 1,
          "sunday": 0,
          "tuesday": 1,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Early",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Late",
          "friday": 1,
          "monday": 1,
          "sunday": 0,
          "tuesday": 1,
          "saturday": 0,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Night",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        }
      ],
      "weekly_hours": 88
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 13 },
    update: {},
    create: {
      "id": 13,
      "pool_id": 1,
      "effective_from": new Date("2026-08-31T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 1,
          "monday": 1,
          "sunday": 0,
          "tuesday": 1,
          "saturday": 0,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Early",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Late",
          "friday": 1,
          "monday": 1,
          "sunday": 0,
          "tuesday": 1,
          "saturday": 0,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Night",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        }
      ],
      "weekly_hours": 80
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 14 },
    update: {},
    create: {
      "id": 14,
      "pool_id": 1,
      "effective_from": new Date("2026-08-31T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 1,
          "monday": 1,
          "sunday": 0,
          "tuesday": 1,
          "saturday": 0,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Early",
          "friday": 1,
          "monday": 1,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 1
        },
        {
          "shift": "Late",
          "friday": 1,
          "monday": 1,
          "sunday": 0,
          "tuesday": 1,
          "saturday": 0,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Night",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        }
      ],
      "weekly_hours": 104
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 15 },
    update: {},
    create: {
      "id": 15,
      "pool_id": 1,
      "effective_from": new Date("2026-08-31T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Day"
        },
        {
          "fri": 1,
          "mon": 1,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 1,
          "shift": "Early"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 1,
          "tue": 1,
          "wed": 0,
          "shift": "Late"
        },
        {
          "fri": 0,
          "mon": 0,
          "sat": 0,
          "sun": 0,
          "thu": 0,
          "tue": 0,
          "wed": 0,
          "shift": "Night"
        }
      ],
      "weekly_hours": 40
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 16 },
    update: {},
    create: {
      "id": 16,
      "pool_id": 1,
      "effective_from": new Date("2026-09-01T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Early",
          "friday": 1,
          "monday": 1,
          "sunday": 0,
          "tuesday": 1,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Late",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Night",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        }
      ],
      "weekly_hours": 48
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 17 },
    update: {},
    create: {
      "id": 17,
      "pool_id": 1,
      "effective_from": new Date("2026-09-01T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 1,
          "monday": 1,
          "sunday": 0,
          "tuesday": 1,
          "saturday": 0,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Early",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Late",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Night",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        }
      ],
      "weekly_hours": 40
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 18 },
    update: {},
    create: {
      "id": 18,
      "pool_id": 1,
      "effective_from": new Date("2026-09-01T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Early",
          "friday": 1,
          "monday": 1,
          "sunday": 0,
          "tuesday": 1,
          "saturday": 0,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Late",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Night",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        }
      ],
      "weekly_hours": 40
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 19 },
    update: {},
    create: {
      "id": 19,
      "pool_id": 1,
      "effective_from": new Date("2026-09-01T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Early",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Late",
          "friday": 1,
          "monday": 1,
          "sunday": 0,
          "tuesday": 1,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Night",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        }
      ],
      "weekly_hours": 48
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 20 },
    update: {},
    create: {
      "id": 20,
      "pool_id": 1,
      "effective_from": new Date("2026-09-01T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Early",
          "friday": 1,
          "monday": 1,
          "sunday": 0,
          "tuesday": 1,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Late",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Night",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        }
      ],
      "weekly_hours": 48
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 21 },
    update: {},
    create: {
      "id": 21,
      "pool_id": 1,
      "effective_from": new Date("2026-09-01T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 1,
          "monday": 1,
          "sunday": 0,
          "tuesday": 1,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Early",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Late",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Night",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        }
      ],
      "weekly_hours": 48
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 22 },
    update: {},
    create: {
      "id": 22,
      "pool_id": 2,
      "effective_from": new Date("2026-05-25T00:00:00.000Z"),
      "effective_to": new Date("2026-06-01T00:00:00.000Z"),
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 2,
          "monday": 2,
          "sunday": 1,
          "tuesday": 2,
          "saturday": 1,
          "thursday": 2,
          "wednesday": 2
        },
        {
          "shift": "Early",
          "friday": 2,
          "monday": 2,
          "sunday": 1,
          "tuesday": 2,
          "saturday": 1,
          "thursday": 2,
          "wednesday": 2
        },
        {
          "shift": "Late",
          "friday": 1,
          "monday": 1,
          "sunday": 1,
          "tuesday": 1,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Night",
          "friday": 1,
          "monday": 1,
          "sunday": 1,
          "tuesday": 1,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        }
      ],
      "weekly_hours": 80
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 23 },
    update: {},
    create: {
      "id": 23,
      "pool_id": 3,
      "effective_from": new Date("2026-05-25T00:00:00.000Z"),
      "effective_to": new Date("2026-06-01T00:00:00.000Z"),
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 2,
          "monday": 2,
          "sunday": 0,
          "tuesday": 2,
          "saturday": 0,
          "thursday": 2,
          "wednesday": 2
        }
      ],
      "weekly_hours": 80
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 24 },
    update: {},
    create: {
      "id": 24,
      "pool_id": 2,
      "effective_from": new Date("2026-09-01T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 2,
          "monday": 2,
          "sunday": 1,
          "tuesday": 2,
          "saturday": 1,
          "thursday": 2,
          "wednesday": 2
        },
        {
          "shift": "Early",
          "friday": 2,
          "monday": 2,
          "sunday": 1,
          "tuesday": 2,
          "saturday": 1,
          "thursday": 2,
          "wednesday": 2
        },
        {
          "shift": "Late",
          "friday": 1,
          "monday": 1,
          "sunday": 1,
          "tuesday": 1,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Night",
          "friday": 1,
          "monday": 1,
          "sunday": 1,
          "tuesday": 1,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        }
      ],
      "weekly_hours": 304
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 25 },
    update: {},
    create: {
      "id": 25,
      "pool_id": 3,
      "effective_from": new Date("2026-09-01T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 2,
          "monday": 2,
          "sunday": 0,
          "tuesday": 2,
          "saturday": 0,
          "thursday": 2,
          "wednesday": 2
        }
      ],
      "weekly_hours": 80
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 26 },
    update: {},
    create: {
      "id": 26,
      "pool_id": 2,
      "effective_from": new Date("2026-09-01T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 2,
          "monday": 2,
          "sunday": 1,
          "tuesday": 2,
          "saturday": 1,
          "thursday": 2,
          "wednesday": 2
        },
        {
          "shift": "Early",
          "friday": 2,
          "monday": 2,
          "sunday": 1,
          "tuesday": 2,
          "saturday": 1,
          "thursday": 2,
          "wednesday": 2
        },
        {
          "shift": "Late",
          "friday": 1,
          "monday": 2,
          "sunday": 1,
          "tuesday": 1,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Night",
          "friday": 1,
          "monday": 1,
          "sunday": 1,
          "tuesday": 1,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        }
      ],
      "weekly_hours": 312
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 27 },
    update: {},
    create: {
      "id": 27,
      "pool_id": 2,
      "effective_from": new Date("2026-09-01T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 2,
          "monday": 2,
          "sunday": 1,
          "tuesday": 2,
          "saturday": 1,
          "thursday": 2,
          "wednesday": 2
        },
        {
          "shift": "Early",
          "friday": 2,
          "monday": 2,
          "sunday": 1,
          "tuesday": 2,
          "saturday": 1,
          "thursday": 2,
          "wednesday": 2
        },
        {
          "shift": "Late",
          "friday": 1,
          "monday": 2,
          "sunday": 1,
          "tuesday": 1,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Night",
          "friday": 1,
          "monday": 1,
          "sunday": 1,
          "tuesday": 1,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        }
      ],
      "weekly_hours": 312
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 28 },
    update: {},
    create: {
      "id": 28,
      "pool_id": 1,
      "effective_from": new Date("2026-09-01T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 1,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Early",
          "friday": 0,
          "monday": 1,
          "sunday": 0,
          "tuesday": 1,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Late",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Night",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        }
      ],
      "weekly_hours": 48
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 29 },
    update: {},
    create: {
      "id": 29,
      "pool_id": 1,
      "effective_from": new Date("2026-09-01T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 1,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Early",
          "friday": 0,
          "monday": 1,
          "sunday": 0,
          "tuesday": 1,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Late",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        },
        {
          "shift": "Night",
          "friday": 0,
          "monday": 0,
          "sunday": 0,
          "tuesday": 0,
          "saturday": 0,
          "thursday": 0,
          "wednesday": 0
        }
      ],
      "weekly_hours": 48
    },
  });

  await prisma.poolDemandConfig.upsert({
    where: { id: 30 },
    update: {},
    create: {
      "id": 30,
      "pool_id": 2,
      "effective_from": new Date("2026-09-01T00:00:00.000Z"),
      "effective_to": null,
      "demand_matrix": [
        {
          "shift": "Day",
          "friday": 2,
          "monday": 2,
          "sunday": 1,
          "tuesday": 2,
          "saturday": 1,
          "thursday": 2,
          "wednesday": 2
        },
        {
          "shift": "Early",
          "friday": 2,
          "monday": 2,
          "sunday": 1,
          "tuesday": 2,
          "saturday": 1,
          "thursday": 2,
          "wednesday": 2
        },
        {
          "shift": "Late",
          "friday": 1,
          "monday": 2,
          "sunday": 1,
          "tuesday": 1,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        },
        {
          "shift": "Night",
          "friday": 1,
          "monday": 1,
          "sunday": 1,
          "tuesday": 1,
          "saturday": 1,
          "thursday": 1,
          "wednesday": 1
        }
      ],
      "weekly_hours": 312
    },
  });

  // Renewable resource pools
  await prisma.renewableResourcePool.upsert({
    where: { pool_id: "OR-ROOM-273" },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "pool_id": "OR-ROOM-273",
      "pool_name": "Operation Room Pool",
      "resource_type": "ROOM",
      "department": "Surgery",
      "location": null,
      "total_capacity": 1,
      "status": "OPERATIONAL",
      "weekly_template": {
        "friday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "monday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "sunday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "tuesday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "saturday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "thursday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "wednesday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        }
      },
      "reservations": [],
      "metadata": {
        "unit_prefix": "OR",
        "default_variant": "STANDARD",
        "default_attributes": {}
      }
    },
  });

  await prisma.renewableResourcePool.upsert({
    where: { pool_id: "ICU-BED-735" },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "pool_id": "ICU-BED-735",
      "pool_name": "ICU Bed Pool",
      "resource_type": "BED",
      "department": "Critical Care",
      "location": null,
      "total_capacity": 2,
      "status": "OPERATIONAL",
      "weekly_template": {
        "friday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "monday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "sunday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "tuesday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "saturday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "thursday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "wednesday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        }
      },
      "reservations": [],
      "metadata": {
        "unit_prefix": "ICU",
        "default_variant": "STANDARD",
        "default_attributes": {}
      }
    },
  });

  await prisma.renewableResourcePool.upsert({
    where: { pool_id: "MON-EQUIPMENT-391" },
    update: {},
    create: {
      "id": 3,
      "organization_id": 1,
      "pool_id": "MON-EQUIPMENT-391",
      "pool_name": "Monitoring Equipment Pool",
      "resource_type": "EQUIPMENT",
      "department": "Surgery",
      "location": null,
      "total_capacity": 1,
      "status": "OPERATIONAL",
      "weekly_template": {
        "friday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "monday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "sunday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "tuesday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "saturday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "thursday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        },
        "wednesday": {
          "hours": [
            [
              "08:00",
              "18:00"
            ]
          ]
        }
      },
      "reservations": [],
      "metadata": {
        "unit_prefix": "MON",
        "default_variant": "STANDARD",
        "default_attributes": {}
      }
    },
  });

  // Resource units
  await prisma.resourceUnit.upsert({
    where: { unit_id: "OR-01" },
    update: {},
    create: {
      "id": 1,
      "pool_id": 1,
      "unit_id": "OR-01",
      "status": "AVAILABLE",
      "status_till": null,
      "variant": "STANDARD",
      "attributes": {},
      "block_bookings": [],
      "assigned_to": null,
      "assigned_at": null,
      "estimated_release": null,
      "last_released_at": null
    },
  });

  await prisma.resourceUnit.upsert({
    where: { unit_id: "ICU-01" },
    update: {},
    create: {
      "id": 2,
      "pool_id": 2,
      "unit_id": "ICU-01",
      "status": "AVAILABLE",
      "status_till": null,
      "variant": "STANDARD",
      "attributes": {},
      "block_bookings": [],
      "assigned_to": null,
      "assigned_at": null,
      "estimated_release": null,
      "last_released_at": null
    },
  });

  await prisma.resourceUnit.upsert({
    where: { unit_id: "ICU-02" },
    update: {},
    create: {
      "id": 3,
      "pool_id": 2,
      "unit_id": "ICU-02",
      "status": "AVAILABLE",
      "status_till": null,
      "variant": "STANDARD",
      "attributes": {},
      "block_bookings": [],
      "assigned_to": null,
      "assigned_at": null,
      "estimated_release": null,
      "last_released_at": null
    },
  });

  await prisma.resourceUnit.upsert({
    where: { unit_id: "MON-01" },
    update: {},
    create: {
      "id": 4,
      "pool_id": 3,
      "unit_id": "MON-01",
      "status": "AVAILABLE",
      "status_till": null,
      "variant": "STANDARD",
      "attributes": {},
      "block_bookings": [],
      "assigned_to": null,
      "assigned_at": null,
      "estimated_release": null,
      "last_released_at": null
    },
  });

  // Operation types
  await prisma.operationType.upsert({
    where: { organization_id_category_name: { organization_id: 1, category: "Neuro", name: "Craniotomy" } },
    update: {},
    create: {
      "id": 25,
      "organization_id": 1,
      "category": "Neuro",
      "name": "Craniotomy",
      "status": "ACTIVE"
    },
  });

  await prisma.operationType.upsert({
    where: { organization_id_category_name: { organization_id: 1, category: "Ortho", name: "Hip Replacement" } },
    update: {},
    create: {
      "id": 26,
      "organization_id": 1,
      "category": "Ortho",
      "name": "Hip Replacement",
      "status": "ACTIVE"
    },
  });

  await prisma.operationType.upsert({
    where: { organization_id_category_name: { organization_id: 1, category: "Ortho", name: "Knee Replacement" } },
    update: {},
    create: {
      "id": 27,
      "organization_id": 1,
      "category": "Ortho",
      "name": "Knee Replacement",
      "status": "ACTIVE"
    },
  });

  await prisma.operationType.upsert({
    where: { organization_id_category_name: { organization_id: 1, category: "General", name: "Appendectomy" } },
    update: {},
    create: {
      "id": 28,
      "organization_id": 1,
      "category": "General",
      "name": "Appendectomy",
      "status": "ACTIVE"
    },
  });

  await prisma.operationType.upsert({
    where: { organization_id_category_name: { organization_id: 1, category: "General", name: "Cholecystectomy" } },
    update: {},
    create: {
      "id": 29,
      "organization_id": 1,
      "category": "General",
      "name": "Cholecystectomy",
      "status": "ACTIVE"
    },
  });

  await prisma.operationType.upsert({
    where: { organization_id_category_name: { organization_id: 1, category: "Neuro", name: "Spinal Fusion" } },
    update: {},
    create: {
      "id": 30,
      "organization_id": 1,
      "category": "Neuro",
      "name": "Spinal Fusion",
      "status": "ACTIVE"
    },
  });

  // Phase resources
  await prisma.phaseResource.upsert({
    where: { id: 1 },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "type": "preOp",
      "name": "Anesthesiologist",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 2 },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "type": "preOp",
      "name": "Vitals Nurse",
      "default_count": 2,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 3 },
    update: {},
    create: {
      "id": 3,
      "organization_id": 1,
      "type": "preOp",
      "name": "Pre-Op Technician",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 4 },
    update: {},
    create: {
      "id": 4,
      "organization_id": 1,
      "type": "preOp",
      "name": "IV Pump",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 5 },
    update: {},
    create: {
      "id": 5,
      "organization_id": 1,
      "type": "operative",
      "name": "Operating Room",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 6 },
    update: {},
    create: {
      "id": 6,
      "organization_id": 1,
      "type": "operative",
      "name": "Lead Surgeon",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 7 },
    update: {},
    create: {
      "id": 7,
      "organization_id": 1,
      "type": "operative",
      "name": "Surgeon",
      "default_count": 1,
      "roles": [
        "Surgeon"
      ],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 8 },
    update: {},
    create: {
      "id": 8,
      "organization_id": 1,
      "type": "operative",
      "name": "OR Nurse",
      "default_count": 1,
      "roles": [
        "OR Nurse"
      ],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 9 },
    update: {},
    create: {
      "id": 9,
      "organization_id": 1,
      "type": "operative",
      "name": "Circulating Nurse",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 10 },
    update: {},
    create: {
      "id": 10,
      "organization_id": 1,
      "type": "operative",
      "name": "Anesthesia Technician",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 11 },
    update: {},
    create: {
      "id": 11,
      "organization_id": 1,
      "type": "operative",
      "name": "Anesthesiologist",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 12 },
    update: {},
    create: {
      "id": 12,
      "organization_id": 1,
      "type": "operative",
      "name": "Surgical Kit",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 13 },
    update: {},
    create: {
      "id": 13,
      "organization_id": 1,
      "type": "operative",
      "name": "Operating Room",
      "default_count": 1,
      "roles": [
        "Operation Room"
      ],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 14 },
    update: {},
    create: {
      "id": 14,
      "organization_id": 1,
      "type": "postOp",
      "name": "PACU Bed",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 15 },
    update: {},
    create: {
      "id": 15,
      "organization_id": 1,
      "type": "postOp",
      "name": "Anesthesiologist",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 16 },
    update: {},
    create: {
      "id": 16,
      "organization_id": 1,
      "type": "postOp",
      "name": "Recovery Nurse",
      "default_count": 2,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 17 },
    update: {},
    create: {
      "id": 17,
      "organization_id": 1,
      "type": "postOp",
      "name": "Monitor Station",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 18 },
    update: {},
    create: {
      "id": 18,
      "organization_id": 1,
      "type": "sterilization",
      "name": "Cleaning Crew",
      "default_count": 2,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 19 },
    update: {},
    create: {
      "id": 19,
      "organization_id": 1,
      "type": "sterilization",
      "name": "Sterilization Tech",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 20 },
    update: {},
    create: {
      "id": 20,
      "organization_id": 1,
      "type": "sterilization",
      "name": "Sterilizer Machine",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 21 },
    update: {},
    create: {
      "id": 21,
      "organization_id": 1,
      "type": "recovery",
      "name": "ICU Bed",
      "default_count": 1,
      "roles": [
        "ICU Bed"
      ],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 22 },
    update: {},
    create: {
      "id": 22,
      "organization_id": 1,
      "type": "recovery",
      "name": "ICU Nurse",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 23 },
    update: {},
    create: {
      "id": 23,
      "organization_id": 1,
      "type": "recovery",
      "name": "Respiratory Therapist",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 24 },
    update: {},
    create: {
      "id": 24,
      "organization_id": 1,
      "type": "recovery",
      "name": "Monitoring Equipment",
      "default_count": 1,
      "roles": [
        "Monitoring Equipment"
      ],
      "status": "ACTIVE"
    },
  });

  // Rostering snapshot
  await prisma.rostering.upsert({
    where: { organization_id_year_month: { organization_id: 1, year: 2026, month: 9 } },
    update: {},
    create: {
      "id": 7,
      "organization_id": 1,
      "year": 2026,
      "month": 9,
      "employee_centric": {
        "STAFF-0001": {
          "2026-09-01": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-02": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-03": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-04": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-05": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-06": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-07": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-08": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-09": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-10": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-11": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-12": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-13": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-14": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-15": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-16": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-17": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-18": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-19": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-20": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-21": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-22": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-23": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-24": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-25": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-26": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-27": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-28": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-29": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-30": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          }
        },
        "STAFF-0002": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-03": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-04": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-05": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-06": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-07": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-08": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-09": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-10": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-11": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-12": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-13": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-14": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-15": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-16": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-17": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-18": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-19": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-20": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-21": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-22": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-23": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-24": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-25": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-26": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-27": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-28": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-29": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-30": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          }
        },
        "STAFF-0003": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-03": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-04": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-05": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-06": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-07": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-08": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-09": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-10": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-11": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-12": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-13": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-14": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-15": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-16": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-17": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-18": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-19": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-20": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-21": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-22": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-23": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-24": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-25": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-26": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-27": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-28": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-29": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-30": {
            "pool": null,
            "shift": "O"
          }
        },
        "STAFF-0004": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-03": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-04": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-05": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-06": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-07": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-08": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-09": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-10": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-11": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-12": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-13": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-14": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-15": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-16": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-17": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-18": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-19": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-20": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-21": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-22": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-23": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-24": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-25": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-26": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-27": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-28": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-29": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-30": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          }
        },
        "STAFF-0005": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-03": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-04": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-05": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-06": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-07": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-08": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-09": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-10": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-11": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-12": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-13": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-14": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-15": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-16": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-17": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-18": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-19": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-20": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-21": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-22": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-23": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-24": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-25": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-26": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-27": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-28": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-29": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-30": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          }
        },
        "STAFF-0006": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-03": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-04": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-05": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-06": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-07": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-08": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-09": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-10": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-11": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-12": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-13": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-14": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-15": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-16": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-17": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-18": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-19": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-20": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-21": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-22": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-23": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-24": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-25": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-26": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-27": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-28": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-29": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-30": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          }
        },
        "STAFF-0007": {
          "2026-09-01": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-02": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-03": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-04": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-05": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-06": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-07": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-08": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-09": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-10": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-11": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-12": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-13": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-14": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-15": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-16": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-17": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-18": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-19": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-20": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-21": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-22": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-23": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-24": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-25": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-26": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-27": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-28": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-29": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-30": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          }
        },
        "STAFF-0008": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-03": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-04": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-05": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-06": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-07": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-08": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-09": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-10": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-11": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-12": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-13": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-14": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-15": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-16": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-17": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-18": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-19": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-20": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-21": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-22": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-23": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-24": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-25": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-26": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-27": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-28": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-29": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-30": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          }
        },
        "STAFF-0009": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-03": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-04": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-05": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-06": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-07": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-08": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-09": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-10": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-11": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-12": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-13": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-14": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-15": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-16": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-17": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-18": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-19": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-20": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-21": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-22": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-23": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-24": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-25": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-26": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-27": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-28": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-29": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-30": {
            "pool": null,
            "shift": "O"
          }
        },
        "STAFF-0010": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-03": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-04": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-05": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-06": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-07": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-08": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-09": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-10": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-11": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-12": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-13": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-14": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-15": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-16": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-17": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-18": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-19": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-20": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-21": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-22": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-23": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-24": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-25": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-26": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-27": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-28": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-29": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-30": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          }
        },
        "STAFF-NA-0001": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "OR-NUR-0001",
            "shift": "N"
          },
          "2026-09-03": {
            "pool": "OR-NUR-0001",
            "shift": "L"
          },
          "2026-09-04": {
            "pool": "OR-NUR-0001",
            "shift": "L"
          },
          "2026-09-05": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-06": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-07": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-08": {
            "pool": "OR-NUR-0001",
            "shift": "N"
          },
          "2026-09-09": {
            "pool": "OR-NUR-0001",
            "shift": "N"
          },
          "2026-09-10": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-11": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-12": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-13": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-14": {
            "pool": "OR-NUR-0001",
            "shift": "L"
          },
          "2026-09-15": {
            "pool": "OR-NUR-0001",
            "shift": "L"
          },
          "2026-09-16": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-17": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-18": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-19": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-20": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-21": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-22": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-23": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-24": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-25": {
            "pool": "OR-NUR-0001",
            "shift": "L"
          },
          "2026-09-26": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-27": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-28": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-29": {
            "pool": "OR-NUR-0001",
            "shift": "N"
          },
          "2026-09-30": {
            "pool": "OR-NUR-0001",
            "shift": "N"
          }
        },
        "STAFF-NB-0002": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-03": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-04": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-05": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-06": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-07": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-08": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-09": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-10": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-11": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-12": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-13": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-14": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-15": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-16": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-17": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-18": {
            "pool": "OR-NUR-0001",
            "shift": "L"
          },
          "2026-09-19": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-20": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-21": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-22": {
            "pool": "OR-NUR-0001",
            "shift": "N"
          },
          "2026-09-23": {
            "pool": "OR-NUR-0001",
            "shift": "L"
          },
          "2026-09-24": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-25": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-26": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-27": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-28": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-29": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-30": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          }
        }
      },
      "pool_centric": {
        "OR-NUR-0001": {
          "2026-09-02": {
            "D": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-03": {
            "D": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-04": {
            "D": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-05": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-06": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-07": {
            "E": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-08": {
            "E": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-09": {
            "D": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-10": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-11": {
            "D": [
              "STAFF-NB-0002"
            ],
            "E": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-12": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-13": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-14": {
            "E": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-15": {
            "E": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-16": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-17": {
            "D": [
              "STAFF-NB-0002"
            ],
            "E": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-18": {
            "D": [
              "STAFF-NA-0001"
            ],
            "L": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-19": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-20": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-21": {
            "E": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-22": {
            "E": [
              "STAFF-NA-0001"
            ],
            "N": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-23": {
            "D": [
              "STAFF-NA-0001"
            ],
            "L": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-24": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-25": {
            "D": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-26": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-27": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-28": {
            "E": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-29": {
            "E": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-30": {
            "D": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          }
        },
        "CHR-NUR-0001": {
          "2026-09-01": {
            "N": [
              "STAFF-0007"
            ]
          },
          "2026-09-02": {
            "D": [
              "STAFF-0004",
              "STAFF-0006"
            ],
            "E": [
              "STAFF-0009",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0003"
            ],
            "N": [
              "STAFF-0008"
            ]
          },
          "2026-09-03": {
            "D": [
              "STAFF-0004",
              "STAFF-0005"
            ],
            "E": [
              "STAFF-0002",
              "STAFF-0009"
            ],
            "L": [
              "STAFF-0003"
            ],
            "N": [
              "STAFF-0008"
            ]
          },
          "2026-09-04": {
            "D": [
              "STAFF-0007",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0004",
              "STAFF-0006"
            ],
            "L": [
              "STAFF-0003"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "2026-09-05": {
            "D": [
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0002"
            ],
            "L": [
              "STAFF-0007"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "2026-09-06": {
            "D": [
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0002"
            ],
            "L": [
              "STAFF-0007"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "2026-09-07": {
            "D": [
              "STAFF-0004",
              "STAFF-0005"
            ],
            "E": [
              "STAFF-0006",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0007",
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0003"
            ]
          },
          "2026-09-08": {
            "D": [
              "STAFF-0002",
              "STAFF-0006"
            ],
            "E": [
              "STAFF-0005",
              "STAFF-0009"
            ],
            "L": [
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0003"
            ]
          },
          "2026-09-09": {
            "D": [
              "STAFF-0006",
              "STAFF-0007"
            ],
            "E": [
              "STAFF-0005",
              "STAFF-0009"
            ],
            "L": [
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0003"
            ]
          },
          "2026-09-10": {
            "D": [
              "STAFF-0004",
              "STAFF-0007"
            ],
            "E": [
              "STAFF-0002",
              "STAFF-0005"
            ],
            "L": [
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0010"
            ]
          },
          "2026-09-11": {
            "D": [
              "STAFF-0003",
              "STAFF-0004"
            ],
            "E": [
              "STAFF-0005",
              "STAFF-0007"
            ],
            "L": [
              "STAFF-0006",
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0010"
            ]
          },
          "2026-09-12": {
            "D": [
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0003"
            ],
            "L": [
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0010"
            ]
          },
          "2026-09-13": {
            "D": [
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0003"
            ],
            "L": [
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0010"
            ]
          },
          "2026-09-14": {
            "D": [
              "STAFF-0006",
              "STAFF-0007"
            ],
            "E": [
              "STAFF-0002",
              "STAFF-0004"
            ],
            "L": [
              "STAFF-0009",
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0005"
            ]
          },
          "2026-09-15": {
            "D": [
              "STAFF-0007",
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0004",
              "STAFF-0006"
            ],
            "L": [
              "STAFF-0005"
            ],
            "N": [
              "STAFF-0002"
            ]
          },
          "2026-09-16": {
            "D": [
              "STAFF-0007",
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0004",
              "STAFF-0009"
            ],
            "L": [
              "STAFF-0006"
            ],
            "N": [
              "STAFF-0002"
            ]
          },
          "2026-09-17": {
            "D": [
              "STAFF-0008",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0003",
              "STAFF-0004"
            ],
            "L": [
              "STAFF-0007"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "2026-09-18": {
            "D": [
              "STAFF-0004",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0003",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0009"
            ],
            "N": [
              "STAFF-0006"
            ]
          },
          "2026-09-19": {
            "D": [
              "STAFF-0002"
            ],
            "E": [
              "STAFF-0007"
            ],
            "L": [
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0006"
            ]
          },
          "2026-09-20": {
            "D": [
              "STAFF-0002"
            ],
            "E": [
              "STAFF-0007"
            ],
            "L": [
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0006"
            ]
          },
          "2026-09-21": {
            "D": [
              "STAFF-0003",
              "STAFF-0004"
            ],
            "E": [
              "STAFF-0007",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0002",
              "STAFF-0006"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "2026-09-22": {
            "D": [
              "STAFF-0005",
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0007",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0006"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "2026-09-23": {
            "D": [
              "STAFF-0005",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0004",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0009"
            ],
            "N": [
              "STAFF-0002"
            ]
          },
          "2026-09-24": {
            "D": [
              "STAFF-0006",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0007",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0002"
            ],
            "N": [
              "STAFF-0004"
            ]
          },
          "2026-09-25": {
            "D": [
              "STAFF-0008",
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0006",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0002"
            ],
            "N": [
              "STAFF-0007"
            ]
          },
          "2026-09-26": {
            "D": [
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0003"
            ],
            "L": [
              "STAFF-0004"
            ],
            "N": [
              "STAFF-0007"
            ]
          },
          "2026-09-27": {
            "D": [
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0003"
            ],
            "L": [
              "STAFF-0004"
            ],
            "N": [
              "STAFF-0007"
            ]
          },
          "2026-09-28": {
            "D": [
              "STAFF-0002",
              "STAFF-0003"
            ],
            "E": [
              "STAFF-0006",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0004",
              "STAFF-0009"
            ],
            "N": [
              "STAFF-0008"
            ]
          },
          "2026-09-29": {
            "D": [
              "STAFF-0003",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0006",
              "STAFF-0007"
            ],
            "L": [
              "STAFF-0004",
              "STAFF-0009"
            ],
            "N": [
              "STAFF-0008"
            ]
          },
          "2026-09-30": {
            "D": [
              "STAFF-0002",
              "STAFF-0007"
            ],
            "E": [
              "STAFF-0005",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0004"
            ],
            "N": [
              "STAFF-0008"
            ]
          }
        },
        "SEN-NUR-0001": {
          "2026-09-01": {
            "D": [
              "STAFF-0001"
            ]
          },
          "2026-09-02": {
            "D": [
              "STAFF-0002",
              "STAFF-0005"
            ]
          },
          "2026-09-03": {
            "D": [
              "STAFF-0001",
              "STAFF-0006",
              "STAFF-0010"
            ]
          },
          "2026-09-04": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          },
          "2026-09-07": {
            "D": [
              "STAFF-0001",
              "STAFF-0002"
            ]
          },
          "2026-09-08": {
            "D": [
              "STAFF-0001",
              "STAFF-0004"
            ]
          },
          "2026-09-09": {
            "D": [
              "STAFF-0001",
              "STAFF-0004"
            ]
          },
          "2026-09-10": {
            "D": [
              "STAFF-0001",
              "STAFF-0006"
            ]
          },
          "2026-09-11": {
            "D": [
              "STAFF-0002",
              "STAFF-0009"
            ]
          },
          "2026-09-14": {
            "D": [
              "STAFF-0001",
              "STAFF-0003"
            ]
          },
          "2026-09-15": {
            "D": [
              "STAFF-0001",
              "STAFF-0003"
            ]
          },
          "2026-09-16": {
            "D": [
              "STAFF-0001",
              "STAFF-0010"
            ]
          },
          "2026-09-17": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          },
          "2026-09-18": {
            "D": [
              "STAFF-0002",
              "STAFF-0005"
            ]
          },
          "2026-09-19": {
            "D": [
              "STAFF-0001"
            ]
          },
          "2026-09-20": {
            "D": [
              "STAFF-0001"
            ]
          },
          "2026-09-21": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          },
          "2026-09-22": {
            "D": [
              "STAFF-0003",
              "STAFF-0004"
            ]
          },
          "2026-09-23": {
            "D": [
              "STAFF-0001",
              "STAFF-0003"
            ]
          },
          "2026-09-24": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          },
          "2026-09-25": {
            "D": [
              "STAFF-0001",
              "STAFF-0003"
            ]
          },
          "2026-09-28": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          },
          "2026-09-29": {
            "D": [
              "STAFF-0001",
              "STAFF-0002",
              "STAFF-0005"
            ]
          },
          "2026-09-30": {
            "D": [
              "STAFF-0001",
              "STAFF-0006"
            ]
          }
        }
      },
      "date_centric": {
        "2026-09-01": {
          "CHR-NUR-0001": {
            "N": [
              "STAFF-0007"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001"
            ]
          }
        },
        "2026-09-02": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0004",
              "STAFF-0006"
            ],
            "E": [
              "STAFF-0009",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0003"
            ],
            "N": [
              "STAFF-0008"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0002",
              "STAFF-0005"
            ]
          }
        },
        "2026-09-03": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0004",
              "STAFF-0005"
            ],
            "E": [
              "STAFF-0002",
              "STAFF-0009"
            ],
            "L": [
              "STAFF-0003"
            ],
            "N": [
              "STAFF-0008"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0006",
              "STAFF-0010"
            ]
          }
        },
        "2026-09-04": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0007",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0004",
              "STAFF-0006"
            ],
            "L": [
              "STAFF-0003"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          }
        },
        "2026-09-05": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0002"
            ],
            "L": [
              "STAFF-0007"
            ],
            "N": [
              "STAFF-0009"
            ]
          }
        },
        "2026-09-06": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0002"
            ],
            "L": [
              "STAFF-0007"
            ],
            "N": [
              "STAFF-0009"
            ]
          }
        },
        "2026-09-07": {
          "OR-NUR-0001": {
            "E": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0004",
              "STAFF-0005"
            ],
            "E": [
              "STAFF-0006",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0007",
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0003"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0002"
            ]
          }
        },
        "2026-09-08": {
          "OR-NUR-0001": {
            "E": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0002",
              "STAFF-0006"
            ],
            "E": [
              "STAFF-0005",
              "STAFF-0009"
            ],
            "L": [
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0003"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0004"
            ]
          }
        },
        "2026-09-09": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0006",
              "STAFF-0007"
            ],
            "E": [
              "STAFF-0005",
              "STAFF-0009"
            ],
            "L": [
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0003"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0004"
            ]
          }
        },
        "2026-09-10": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0004",
              "STAFF-0007"
            ],
            "E": [
              "STAFF-0002",
              "STAFF-0005"
            ],
            "L": [
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0010"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0006"
            ]
          }
        },
        "2026-09-11": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ],
            "E": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0003",
              "STAFF-0004"
            ],
            "E": [
              "STAFF-0005",
              "STAFF-0007"
            ],
            "L": [
              "STAFF-0006",
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0010"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0002",
              "STAFF-0009"
            ]
          }
        },
        "2026-09-12": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0003"
            ],
            "L": [
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0010"
            ]
          }
        },
        "2026-09-13": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0003"
            ],
            "L": [
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0010"
            ]
          }
        },
        "2026-09-14": {
          "OR-NUR-0001": {
            "E": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0006",
              "STAFF-0007"
            ],
            "E": [
              "STAFF-0002",
              "STAFF-0004"
            ],
            "L": [
              "STAFF-0009",
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0005"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0003"
            ]
          }
        },
        "2026-09-15": {
          "OR-NUR-0001": {
            "E": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0007",
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0004",
              "STAFF-0006"
            ],
            "L": [
              "STAFF-0005"
            ],
            "N": [
              "STAFF-0002"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0003"
            ]
          }
        },
        "2026-09-16": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0007",
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0004",
              "STAFF-0009"
            ],
            "L": [
              "STAFF-0006"
            ],
            "N": [
              "STAFF-0002"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0010"
            ]
          }
        },
        "2026-09-17": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ],
            "E": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0008",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0003",
              "STAFF-0004"
            ],
            "L": [
              "STAFF-0007"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          }
        },
        "2026-09-18": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NA-0001"
            ],
            "L": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0004",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0003",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0009"
            ],
            "N": [
              "STAFF-0006"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0002",
              "STAFF-0005"
            ]
          }
        },
        "2026-09-19": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0002"
            ],
            "E": [
              "STAFF-0007"
            ],
            "L": [
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0006"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001"
            ]
          }
        },
        "2026-09-20": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0002"
            ],
            "E": [
              "STAFF-0007"
            ],
            "L": [
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0006"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001"
            ]
          }
        },
        "2026-09-21": {
          "OR-NUR-0001": {
            "E": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0003",
              "STAFF-0004"
            ],
            "E": [
              "STAFF-0007",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0002",
              "STAFF-0006"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          }
        },
        "2026-09-22": {
          "OR-NUR-0001": {
            "E": [
              "STAFF-NA-0001"
            ],
            "N": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0005",
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0007",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0006"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0003",
              "STAFF-0004"
            ]
          }
        },
        "2026-09-23": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NA-0001"
            ],
            "L": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0005",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0004",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0009"
            ],
            "N": [
              "STAFF-0002"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0003"
            ]
          }
        },
        "2026-09-24": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0006",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0007",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0002"
            ],
            "N": [
              "STAFF-0004"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          }
        },
        "2026-09-25": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0008",
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0006",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0002"
            ],
            "N": [
              "STAFF-0007"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0003"
            ]
          }
        },
        "2026-09-26": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0003"
            ],
            "L": [
              "STAFF-0004"
            ],
            "N": [
              "STAFF-0007"
            ]
          }
        },
        "2026-09-27": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0003"
            ],
            "L": [
              "STAFF-0004"
            ],
            "N": [
              "STAFF-0007"
            ]
          }
        },
        "2026-09-28": {
          "OR-NUR-0001": {
            "E": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0002",
              "STAFF-0003"
            ],
            "E": [
              "STAFF-0006",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0004",
              "STAFF-0009"
            ],
            "N": [
              "STAFF-0008"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          }
        },
        "2026-09-29": {
          "OR-NUR-0001": {
            "E": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0003",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0006",
              "STAFF-0007"
            ],
            "L": [
              "STAFF-0004",
              "STAFF-0009"
            ],
            "N": [
              "STAFF-0008"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0002",
              "STAFF-0005"
            ]
          }
        },
        "2026-09-30": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0002",
              "STAFF-0007"
            ],
            "E": [
              "STAFF-0005",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0004"
            ],
            "N": [
              "STAFF-0008"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0006"
            ]
          }
        }
      },
      "stats": {
        "iterations": 100000,
        "best_penalty": 660038.4751308004,
        "improvements": 2161,
        "mode_switches": 94,
        "elapsed_seconds": 18.28263902664185
      }
    },
  });

  // Surgeries
  await prisma.surgery.upsert({
    where: { surgery_id: "SURG-MAR-0001" },
    update: {},
    create: {
      "id": 9,
      "organization_id": 1,
      "surgery_id": "SURG-MAR-0001",
      "name": "Mark Manson",
      "type": "mandatory",
      "infection_type": 0,
      "department_id": 1,
      "department": "Surgery",
      "status": "PLANNED",
      "time_windows": {
        "latest_date": "2026-09-02T23:59",
        "earliest_date": "2026-08-31T00:00",
        "planned_start": "2026-09-02 08:00:00"
      },
      "stages": {
        "pre_op": [],
        "post_op": [],
        "recovery": [],
        "operative": [
          {
            "role": "Surgeon",
            "count": 1,
            "duration": [
              0,
              210
            ]
          },
          {
            "role": "OR Nurse",
            "count": 1,
            "duration": [
              0,
              210
            ]
          }
        ],
        "sterilization": []
      }
    },
  });

  // Surgery plan results
  await prisma.surgeryPlanResult.upsert({
    where: { surgery_id: "SURG-TES-0001" },
    update: {},
    create: {
      "id": 1,
      "surgery_id": "SURG-TES-0001",
      "organization_id": 1,
      "department": "Surgery",
      "result": {
        "id": "SURG-TES-0001",
        "planned_start": "2026-08-17 08:00:00",
        "resources_assigned": {
          "operative": [
            {
              "role": "Surgeon",
              "assigned": "surgeon-staff-ds-0003",
              "time_range": [
                "2026-08-17 08:00:00",
                "2026-08-17 11:30:00"
              ]
            },
            {
              "role": "Operation Room",
              "assigned": "OR-01",
              "time_range": [
                "2026-08-17 08:00:00",
                "2026-08-17 11:30:00"
              ]
            },
            {
              "role": "OR Nurse",
              "assigned": "STAFF-NB-0002",
              "time_range": [
                "2026-08-17 08:00:00",
                "2026-08-17 11:30:00"
              ]
            }
          ]
        }
      }
    },
  });

  await prisma.surgeryPlanResult.upsert({
    where: { surgery_id: "SURG-MAR-0001" },
    update: {},
    create: {
      "id": 2,
      "surgery_id": "SURG-MAR-0001",
      "organization_id": 1,
      "department": "Surgery",
      "result": {
        "id": "SURG-MAR-0001",
        "planned_start": "2026-09-02 08:00:00",
        "resources_assigned": {
          "operative": [
            {
              "role": "Surgeon",
              "assigned": "surgeon-staff-ds-0003",
              "time_range": [
                "2026-09-02 08:00:00",
                "2026-09-02 11:30:00"
              ]
            },
            {
              "role": "OR Nurse",
              "assigned": "STAFF-NA-0001",
              "time_range": [
                "2026-09-02 08:00:00",
                "2026-09-02 11:30:00"
              ]
            }
          ]
        }
      }
    },
  });

  // Keep serial IDs in sync with inserted primary keys
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE((SELECT MAX(id) FROM roles), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('organizations', 'id'), COALESCE((SELECT MAX(id) FROM organizations), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('global_settings', 'id'), COALESCE((SELECT MAX(id) FROM global_settings), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('staff_tags', 'id'), COALESCE((SELECT MAX(id) FROM staff_tags), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('specializations', 'id'), COALESCE((SELECT MAX(id) FROM specializations), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('departments', 'id'), COALESCE((SELECT MAX(id) FROM departments), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('skills', 'id'), COALESCE((SELECT MAX(id) FROM skills), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('resource_types', 'id'), COALESCE((SELECT MAX(id) FROM resource_types), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('shifts', 'id'), COALESCE((SELECT MAX(id) FROM shifts), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('forbidden_patterns', 'id'), COALESCE((SELECT MAX(id) FROM forbidden_patterns), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('contracts', 'id'), COALESCE((SELECT MAX(id) FROM contracts), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('staff', 'id'), COALESCE((SELECT MAX(id) FROM staff), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('resource_pools', 'id'), COALESCE((SELECT MAX(id) FROM resource_pools), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('pool_demand_configs', 'id'), COALESCE((SELECT MAX(id) FROM pool_demand_configs), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('renewable_resource_pools', 'id'), COALESCE((SELECT MAX(id) FROM renewable_resource_pools), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('resource_units', 'id'), COALESCE((SELECT MAX(id) FROM resource_units), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('operation_types', 'id'), COALESCE((SELECT MAX(id) FROM operation_types), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('phase_resources', 'id'), COALESCE((SELECT MAX(id) FROM phase_resources), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('rosterings', 'id'), COALESCE((SELECT MAX(id) FROM rosterings), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('surgeries', 'id'), COALESCE((SELECT MAX(id) FROM surgeries), 1))"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('surgery_plan_results', 'id'), COALESCE((SELECT MAX(id) FROM surgery_plan_results), 1))"
  );

  console.log('db-starter-seed: current database snapshot upserted');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
