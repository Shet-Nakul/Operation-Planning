# Backend Request Payloads Specification

This document defines the structured payloads for backend API requests, organized by creation dependency. Entities must be created in the order presented to ensure all relational data is available.

---

Step 1: Open PostgreSQL CLI

If you installed PostgreSQL locally, run:  psql postgres

If that fails, try: psql -U postgres

(Use your system password if prompted)

✅ Step 2: Create Database

Inside psql, run:  CREATE DATABASE hospital_scheduling;

✅ Step 3: Create Proper User (IMPORTANT)

Right now Prisma is trying to use: user

That’s likely not a valid DB user or lacks permissions.

Create a proper one:

CREATE USER hospital_user WITH PASSWORD 'optimize';
✅ Step 4: Grant Permissions : ALTER ROLE hospital_user CREATEDB;

GRANT ALL PRIVILEGES ON DATABASE hospital_scheduling TO hospital_user;

✅ Step 5: Run Migration
npx prisma migrate dev --name init

Use this to get auth token 
```json
{
  "email": "admin@centralhospital.com",
  "password": "password123"
}
```

## **Phase 1: Foundation (Catalog & Configuration)**

Before creating contracts or staff, the foundational catalogs and resource pools must be defined.

### **0.1. Meta Data** 
**Endpoint**: `POST /api/catalogs/global_settings` # roles (Software developer)
```json
{
  "business hours start": "8:00",
  "business hours end": "18:00",
  "surgery planning horizon" : 3,
  "roster planning horizon" : 28,
  "surgery planning resolution" : 15,
}


### **1.1. Staff Tags** (role are used to identify the role for which the contract can be assigned to..)
Used to categorize contracts and staff types.
**Endpoint**: `POST /api/catalogs/roles` # roles (Software developer)
```json
{
  "id": "uuid", 
  "name": "Surgeon",
  "color": "#4F46E5"
}
```

### **1.2. Specializations Catalog**
**Endpoint**: `POST /api/catalogs/specializations` (Front end, Backend, Devops)
```json
{
  "id": "01",
  "name": "Oncology",
  "description": "Cancer-related surgical procedures"
}
```

### **1.3. Skills Catalog**
**Endpoint**: `POST /api/catalogs/skills` (Language, collabortaion, react,....)
```json
{
  "id": "01",
  "name": "Robotic Surgery",
  "description": "Certification for Da Vinci surgical systems"
}
```
### **1.4. shifts Catalog**
**Endpoint**: `POST /api/catalogs/shift` (Language, collabortaion, react,....)
```json
{
  "id": "01",
  "name": "Day",
  "start_time" : "8:00",
  "end_time" :  "16:00",
  "description": "Certification for Da Vinci surgical systems"
}
```

### **1.5. Forbidden pattern**
**Endpoint**: `POST /api/catalogs/pattern` # "late->day": ["L", "D"],
        "day->early->day": ["D", "E", "D"],
```
global_forbidden_patterns_payload = {
    "scope": "GLOBAL",
    "appliesTo": "ALL_CONTRACT_TYPES", 
    "forbiddenPatterns": [
        {
            "id": "late_followed_day",
            "name": "Late Followed by Day",
            "description": "Prevents late shift directly followed by day shift - applies to all contracts",
            "active": False,
            "mode": "HARD",
            "weight": 10,
            "pattern": ["L", "D"],
            "violationType": "SHIFT_SEQUENCE",
            "category": "FATIGUE_PREVENTION"
        },
        {
            "id": "day_followed_early_followed_day", 
            "name": "Day-Early-Day Pattern",
            "description": "Prevents day-early-day three-shift sequence - applies to all contracts",
            "active": False,
            "mode": "HARD",
            "weight": 10,
            "pattern": ["D", "E", "D"],
            "violationType": "SHIFT_SEQUENCE",
            "category": "FATIGUE_PREVENTION"
        },
        {
            "id": "late_followed_early",
            "name": "Late Followed by Early", 
            "description": "Prevents late shift directly followed by early shift - applies to all contracts",
            "active": False,
            "mode": "HARD",
            "weight": 10,
            "pattern": ["L", "E"],
            "violationType": "SHIFT_SEQUENCE",
            "category": "INSUFFICIENT_REST"
        },
        {
            "id": "late_followed_night",
            "name": "Late Followed by Night",
            "description": "Prevents late shift directly followed by night shift - applies to all contracts", 
            "active": False,
            "mode": "HARD",
            "weight": 10,
            "pattern": ["L", "N"],
            "violationType": "SHIFT_SEQUENCE", 
            "category": "FATIGUE_PREVENTION"
        },
        {
            "id": "day_followed_night",
            "name": "Day Followed by Night",
            "description": "Prevents day shift directly followed by night shift - applies to all contracts",
            "active": False,
            "mode": "HARD",
            "weight": 10,
            "pattern": ["D", "N"],
            "violationType": "SHIFT_SEQUENCE",
            "category": "FATIGUE_PREVENTION"
        },
        {
            "id": "night_followed_day", 
            "name": "Night Followed by Day",
            "description": "Prevents night shift directly followed by day shift - applies to all contracts",
            "active": False,
            "mode": "HARD",
            "weight": 10,
            "pattern": ["N", "D"],
            "violationType": "SHIFT_SEQUENCE",
            "category": "INSUFFICIENT_REST"
        },
        {
            "id": "night_followed_early",
            "name": "Night Followed by Early",
            "description": "Prevents night shift directly followed by early shift - applies to all contracts", 
            "active": False,
            "mode": "HARD",
            "weight": 10,
            "pattern": ["N", "E"],
            "violationType": "SHIFT_SEQUENCE",
            "category": "INSUFFICIENT_REST"
        }
    ],
    "metadata": {
        "version": "1.0",
        "createdAt": "2026-04-23T00:00:00Z",
        "updatedAt": "2026-04-23T00:00:00Z",
        "enforceMode": "GLOBAL_OPTIMIZATION",
        "contractType":"DYNAMIC",
        "priority": "HIGH"
    }
}
```


## **1.6: Contracts**

Contracts define the rules and entitlements for staff. They depend on `Staff Tags`.


**Endpoint**: `POST /api/contracts`
### **1.6.1 Static Contract**
```json
{
  "name": "Senior Surgeon Standard 40h",
  "type": "STATIC",
  "status": "Active",
  "id" : "STA-01",
  "staffTags": ["tag_surgeon"], # read for roles
  "configuration": {
    "annualEntitlements":  {"yearlyLeaves": 28, "preferredShiftsPerYear": 12},
    "weeklyHours": 40.0,
    "weeklyBreakMinutes": 300,
    "activeDaysPerWeek": 5
  }
}
```
### **1.6.2 Dynamic Contract**
```json
{    "name": "Resident Doctor Flexible Q3",
    "id": "DYN-001",
    "type": "DYNAMIC", 
    "status": "Active",
    "roleTags": ["tag_surgeon", "tag_resident"],
    "configuration": {
        "annualEntitlements": {
            "yearlyEntitledLeaves": 25, 
            "yearlyEntitledPreferredShifts": 12
        },
        "schedulingRules": {
            "completeWeekends": { "mode": "HARD", "active": True},
            "identicalShiftTypesDuringWeekend": { "mode": "HARD", "active": True},
            "noNightShiftBeforeFreeWeekend": { "mode": "HARD", "active": True},
            "noFreeDayBeforeWorkingWeekend": { "mode": "HARD", "active": True}
        },
        "assignmentLimits": {
            "maxNumAssignments": {"value": 22, "mode": "HARD", "active": True},
            "minNumAssignments": {"value": 18, "mode": "HARD", "active": True},
            "maxConsecutiveWorkingDays": {"value": 5, "mode": "HARD", "active": True},
            "minConsecutiveWorkingDays": {"value": 3, "mode": "HARD", "active": True},
            "maxConsecutiveFreeDays": {"value": 5, "mode": "HARD", "active": True},
            "minConsecutiveFreeDays": {"value": 2, "mode": "HARD", "active": True},
            "maxConsecutiveWorkingWeekends": {"value": 5, "mode": "HARD", "active": True},
            "minConsecutiveWorkingWeekends": {"value": 2, "mode": "HARD", "active": True}
        }
    },
    "globalSettings": {
        "inheritsForbiddenPatterns": True,
        "forbiddenPatternsSource": "GLOBAL_PATTERN_REGISTRY"
    },
    "metadata": {
        "contractVersion": "2.0",
        "createdAt": "2026-04-23T00:00:00Z",
        "updatedAt": "2026-04-23T00:00:00Z",
        "createdBy": "HR_SYSTEM",
        "department": "Surgery",
        "specialization": "General Surgery", 
        "supervisionLevel": "SUPERVISED",
        "complianceLevel": "HEALTHCARE_STANDARD",
        "validationStatus": "VALIDATED",
        "effectiveFrom": "2026-05-01T00:00:00Z",
        "effectiveTo": "2027-04-30T23:59:59Z",
        "lastModifiedBy": "admin@hospital.org",
        "approvalDate": "2026-04-22T15:30:00Z"
    }
}
```