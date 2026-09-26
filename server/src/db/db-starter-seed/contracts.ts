import { PrismaClient } from '@prisma/client';

// Contracts
export async function seedContracts(prisma: PrismaClient): Promise<void> {
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
}
