"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
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
    const password = await bcrypt_1.default.hash('password123', 10);
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
    // 8. Seed Shifts
    await prisma.shift.upsert({
        where: { organization_id_name: { organization_id: org.id, name: "Day" } },
        update: {},
        create: {
            organization_id: org.id,
            name: "Day",
            start_time: "8:00",
            end_time: "16:00",
            description: "Standard Day Shift",
        },
    });
    // 9. Seed Forbidden Patterns (All from req.md)
    // Since ForbiddenPattern doesn't have a unique constraint besides ID, 
    // we can check if any exists for the organization or just use a specific ID if we had one.
    // For simplicity and idempotency, let's clear and recreate or just check if any exists.
    const existingPattern = await prisma.forbiddenPattern.findFirst({
        where: { organization_id: org.id, scope: "GLOBAL" }
    });
    if (!existingPattern) {
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
    }
    // 10. Seed Contracts (Static + Dynamic from req.md)
    // Static Contract
    await prisma.contract.upsert({
        where: { organization_id_name: { organization_id: org.id, name: "Senior Surgeon Standard 40h" } },
        update: {},
        create: {
            organization_id: org.id,
            name: "Senior Surgeon Standard 40h",
            type: client_1.ContractType.STATIC,
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
            name: "Resident Doctor Flexible Q3",
            type: client_1.ContractType.DYNAMIC,
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
    // 11. Seed Staff (from user input)
    // Example 1: Dynamic Role Distribution (No weekly template)
    await prisma.staff.upsert({
        where: { staff_id: 'STAFF-001' },
        update: {},
        create: {
            organization_id: org.id,
            staff_id: "STAFF-001",
            name: "Sarah Johnson (Dynamic)",
            address: "1247 Maple Avenue, Vancouver, BC V6B 2K3",
            phone: "+1-604-555-0128",
            email: "sarah.dynamic@hospital.ca",
            profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
            department: "Critical Care Unit",
            designation: "Senior Staff Nurse",
            contract_id: "DYA-001",
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
                { "pool_name": "Senior Staff Nurse Pool", "pool_id": "SSN-001" },
                { "pool_name": "Charge Nurse Pool", "pool_id": "CN-001" }
            ]
        }
    });
    // Example 2: Static/Template-based (With weekly template)
    await prisma.staff.upsert({
        where: { staff_id: 'STAFF-002' },
        update: {},
        create: {
            organization_id: org.id,
            staff_id: "STAFF-002",
            name: "Sarah Johnson (Template)",
            address: "1247 Maple Avenue, Vancouver, BC V6B 2K3",
            phone: "+1-604-555-0128",
            email: "sarah.template@hospital.ca",
            profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
            department: "Critical Care Unit",
            designation: "Senior Staff Nurse",
            contract_id: "STA-001",
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
                "monday": [{ "start": "7:00", "end": "15:00", "role": "Senior Staff Nurse" }],
                "tuesday": [{ "start": "7:00", "end": "15:00", "role": "Senior Staff Nurse" }],
                "wednesday": [{ "start": "7:00", "end": "15:00", "role": "Senior Staff Nurse" }],
                "thursday": [{ "start": "7:00", "end": "15:00", "role": "Charge Nurse" }],
                "friday": [{ "start": "7:00", "end": "15:00", "role": "Senior Staff Nurse" }],
                "saturday": [{ "start": "7:00", "end": "15:00", "role": "Preceptor" }],
                "sunday": []
            },
            pool_assignments: [
                { "pool_name": "Senior Staff Nurse Pool", "pool_id": "SSN-001" },
                { "pool_name": "Charge Nurse Pool", "pool_id": "CN-001" }
            ]
        }
    });
    // 12. Seed Renewable Resource Pools
    const icuBedPool = await prisma.renewableResourcePool.upsert({
        where: { pool_id: 'ICU-BED-001' },
        update: {},
        create: {
            organization_id: org.id,
            pool_id: 'ICU-BED-001',
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
        where: { pool_id: 'OR-VENT-001' },
        update: {},
        create: {
            organization_id: org.id,
            pool_id: 'OR-VENT-001',
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
    // SSN-001: Trauma Surgical Team
    const ssnPool = await prisma.resourcePool.upsert({
        where: { pool_id: 'SSN-001' },
        update: {},
        create: {
            organization_id: org.id,
            pool_id: 'SSN-001',
            pool_name: 'Trauma Surgical Team',
            department: 'Surgery Department',
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
                { "shift": "Morning", "mon": 4, "tue": 4, "wed": 4, "thu": 4, "fri": 3, "sat": 2, "sun": 2 },
                { "shift": "Afternoon", "mon": 3, "tue": 3, "wed": 3, "thu": 3, "fri": 3, "sat": 2, "sun": 2 },
                { "shift": "Night", "mon": 2, "tue": 2, "wed": 2, "thu": 2, "fri": 2, "sat": 1, "sun": 1 }
            ]
        }
    });
    // CRN-002: Critical Response Nurses
    const crnPool = await prisma.resourcePool.upsert({
        where: { pool_id: 'CRN-002' },
        update: {},
        create: {
            organization_id: org.id,
            pool_id: 'CRN-002',
            pool_name: 'Critical Response Nurses',
            department: 'ICU Intensive Care',
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
                { "shift": "Morning", "mon": 8, "tue": 8, "wed": 8, "thu": 8, "fri": 8, "sat": 4, "sun": 4 },
                { "shift": "Afternoon", "mon": 6, "tue": 6, "wed": 6, "thu": 6, "fri": 6, "sat": 4, "sun": 4 },
                { "shift": "Night", "mon": 4, "tue": 4, "wed": 4, "thu": 4, "fri": 4, "sat": 4, "sun": 4 }
            ]
        }
    });
    // GAP-003: General Anesthetics Pool
    const gapPool = await prisma.resourcePool.upsert({
        where: { pool_id: 'GAP-003' },
        update: {},
        create: {
            organization_id: org.id,
            pool_id: 'GAP-003',
            pool_name: 'General Anesthetics Pool',
            department: 'Anesthesiology',
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
                { "shift": "Morning", "mon": 3, "tue": 3, "wed": 3, "thu": 3, "fri": 2, "sat": 1, "sun": 1 },
                { "shift": "Afternoon", "mon": 2, "tue": 2, "wed": 2, "thu": 2, "fri": 2, "sat": 1, "sun": 1 },
                { "shift": "Night", "mon": 1, "tue": 1, "wed": 1, "thu": 1, "fri": 1, "sat": 1, "sun": 1 }
            ]
        }
    });
    // 14. Seed Staff for these Pools
    // STAFF-001: Dr. Sarah Mitchell (Senior Trauma Surgeon, STATIC) - assigned to SSN-001
    await prisma.staff.upsert({
        where: { staff_id: 'STAFF-001' },
        update: {
            name: "Dr. Sarah Mitchell",
            designation: "Senior Trauma Surgeon",
            contract_id: "STA-001",
            pool_assignments: [{ "pool_name": "Trauma Surgical Team", "pool_id": "SSN-001" }]
        },
        create: {
            organization_id: org.id,
            staff_id: "STAFF-001",
            name: "Dr. Sarah Mitchell",
            email: "sarah.mitchell@hospital.ca",
            department: "Surgery Department",
            designation: "Senior Trauma Surgeon",
            contract_id: "STA-001",
            pool_assignments: [{ "pool_name": "Trauma Surgical Team", "pool_id": "SSN-001" }]
        }
    });
    // STAFF-014: James O'Brien (Trauma Nurse Specialist, DYNAMIC) - assigned to SSN-001
    await prisma.staff.upsert({
        where: { staff_id: 'STAFF-014' },
        update: {},
        create: {
            organization_id: org.id,
            staff_id: "STAFF-014",
            name: "James O'Brien",
            email: "james.obrien@hospital.ca",
            department: "Surgery Department",
            designation: "Trauma Nurse Specialist",
            contract_id: "DYA-001",
            pool_assignments: [{ "pool_name": "Trauma Surgical Team", "pool_id": "SSN-001" }]
        }
    });
    // STAFF-003: Dr. Kevin Park (Anesthesiologist, STATIC) - assigned to GAP-003
    await prisma.staff.upsert({
        where: { staff_id: 'STAFF-003' },
        update: {},
        create: {
            organization_id: org.id,
            staff_id: "STAFF-003",
            name: "Dr. Kevin Park",
            email: "kevin.park@hospital.ca",
            department: "Anesthesiology",
            designation: "Anesthesiologist",
            contract_id: "STA-001",
            pool_assignments: [{ "pool_name": "General Anesthetics Pool", "pool_id": "GAP-003" }]
        }
    });
    // STAFF-007: Dr. Lisa Chen (Anesthesiologist, STATIC) - assigned to GAP-003
    await prisma.staff.upsert({
        where: { staff_id: 'STAFF-007' },
        update: {},
        create: {
            organization_id: org.id,
            staff_id: "STAFF-007",
            name: "Dr. Lisa Chen",
            email: "lisa.chen@hospital.ca",
            department: "Anesthesiology",
            designation: "Anesthesiologist",
            contract_id: "STA-001",
            pool_assignments: [{ "pool_name": "General Anesthetics Pool", "pool_id": "GAP-003" }]
        }
    });
    // STAFF-012: Mark Sullivan (Anesthesia Technician, DYNAMIC) - assigned to GAP-003
    await prisma.staff.upsert({
        where: { staff_id: 'STAFF-012' },
        update: {},
        create: {
            organization_id: org.id,
            staff_id: "STAFF-012",
            name: "Mark Sullivan",
            email: "mark.sullivan@hospital.ca",
            department: "Anesthesiology",
            designation: "Anesthesia Technician",
            contract_id: "DYA-001",
            pool_assignments: [{ "pool_name": "General Anesthetics Pool", "pool_id": "GAP-003" }]
        }
    });
    // STAFF-019: Rachel Adams (Anesthesia Nurse, DYNAMIC) - assigned to GAP-003
    await prisma.staff.upsert({
        where: { staff_id: 'STAFF-019' },
        update: {},
        create: {
            organization_id: org.id,
            staff_id: "STAFF-019",
            name: "Rachel Adams",
            email: "rachel.adams@hospital.ca",
            department: "Anesthesiology",
            designation: "Anesthesia Nurse",
            contract_id: "DYA-001",
            pool_assignments: [{ "pool_name": "General Anesthetics Pool", "pool_id": "GAP-003" }]
        }
    });
    console.log('Seed data updated with Resource Pools and assigned Staff');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
