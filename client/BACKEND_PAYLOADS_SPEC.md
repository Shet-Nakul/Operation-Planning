# 🏥 Stitch Surgery - Backend Request Payloads Specification

This document defines the structured payloads for backend API requests, organized by creation dependency. Entities must be created in the order presented to ensure all relational data is available.

---

## **Phase 1: Foundation (Catalog & Configuration)**

Before creating contracts or staff, the foundational catalogs and resource pools must be defined.

### **1.1. Specializations Catalog**
**Endpoint**: `POST /api/catalogs/specializations`
```json
{
  "id": "spec_oncology",
  "name": "Oncology",
  "description": "Cancer-related surgical procedures"
}
```

### **1.2. Skills Catalog**
**Endpoint**: `POST /api/catalogs/skills`
```json
{
  "id": "skill_robotic_surgery",
  "name": "Robotic Surgery",
  "description": "Certification for Da Vinci surgical systems"
}
```

### **1.3. Staff Tags**
Used to categorize contracts and staff types.
**Endpoint**: `POST /api/catalogs/staff-tags`
```json
{
  "id": "tag_surgeon",
  "name": "Surgeon",
  "color": "#4F46E5"
}
```

### **1.4. Resource Pools (HR)**
**Endpoint**: `POST /api/resource-pools/hr`
```json
{
  "name": "Surgical Team A - Cardiac",
  "department": "Cardiology",
  "location": "Wing B, Level 4",
  "totalMembers": 12,
  "weeklyHours": 480,
  "contractSplit": "60/40",
  "primarySkill": "Cardiac Surgery",
  "status": "active",
  "icon": "Heart",
  "color": "rose"
}
```

### **1.5. Equipment Pools**
**Endpoint**: `POST /api/resource-pools/equipment`
```json
{
  "name": "Operating Tables - Advanced",
  "category": "TABLES",
  "total_units": 10,
  "available_units": 10,
  "status": "OPTIMAL",
  "location": "Central Sterilization",
  "maintenance_schedule": "Monthly - First Monday"
}
```

### **1.6. Medical Supplies (Catalog)**
**Endpoint**: `POST /api/supplies/catalog`
```json
{
  "name": "Propofol 20ml Vial",
  "category": "MEDICATIONS",
  "sku": "MED-PROP-020",
  "description": "Short-acting intravenous anesthetic agent",
  "unit_of_measure": "VIAL",
  "cost_per_unit": 12.50,
  "reorder_level": 100,
  "lead_time_days": 3
}
```

### **1.7. Supply Inventory (Stock Management)**
**Endpoint**: `POST /api/supplies/inventory`
```json
{
  "supply_item_id": "uuid_from_catalog",
  "current_quantity": 500,
  "warehouse_location": "Pharmacy - Cold Storage A",
  "next_restock_date": "2026-05-15"
}
```

### **1.8. ICU Beds**
**Endpoint**: `POST /api/icu/beds`
```json
{
  "bed_number": "ICU-B01",
  "icu_type": "CARDIAC",
  "status": "AVAILABLE"
}
```

---

## **Phase 2: Contracts**

Contracts define the rules and entitlements for staff. They depend on `Staff Tags`.

### **2.1. Static Contract**
**Endpoint**: `POST /api/contracts`
```json
{
  "name": "Senior Surgeon Standard 40h",
  "type": "STATIC",
  "status": "Active",
  "staffTags": ["tag_surgeon"],
  "configuration": {
    "yearlyLeaves": 28,
    "preferredShiftsPerMonth": 12,
    "weeklyHours": 40.0,
    "weeklyBreakMinutes": 300,
    "activeDaysPerWeek": 5
  }
}
```

### **2.2. Dynamic Framework**
**Endpoint**: `POST /api/contracts`
```json
{
  "name": "Resident Doctor Flexible Q3",
  "type": "DYNAMIC",
  "status": "Active",
  "staffTags": ["tag_surgeon", "tag_resident"],
  "configuration": {
    "annualEntitlements": { "leaves": 25, "credits": 12 },
    "schedulingRules": {
      "completeWeekends": false,
      "identicalShiftsInStreak": true,
      "unwantedPatterns": ["NIGHT-DAY", "LATE-EARLY"]
    },
    "assignmentLimits": {
      "monthly": { "min": 18, "max": 22, "mode": "HARD" },
      "workingStreak": { "min": 2, "max": 5, "mode": "HARD" }
    }
  }
}
```

---

## **Phase 3: Staff Creation**

Depends on `Specializations`, `Skills`, `Contracts`, and `Resource Pools`.

**Endpoint**: `POST /api/staff`
```json
{
  "name": "Dr. Julianne Mercer",
  "title": "Senior Surgeon",
  "email": "j.mercer@hospital.org",
  "employeeId": "#ST-842931",
  "specialization": ["spec_oncology"],
  "skills": ["skill_robotic_surgery"],
  "contractId": "S-9234",
  "supervisor": "Dr. Alan Sterling",
  "status": "Active",
  "effortRoles": [
    { "type": "CLINICAL", "percentage": 60, "description": "Patient Care" },
    { "type": "RESEARCH", "percentage": 40, "description": "Clinical Trials" }
  ],
  "pools": ["Surgical Team A - Cardiac"],
  "weeklySchedule": [
    { "day": "Monday", "startTime": "08:00", "endTime": "12:00", "role": "Clinic" }
  ]
}
```

---

## **Phase 4: Surgery Requests**

The final transactional entity. Depends on `Staff Members` (Surgeons) and `Resource Pools` (for equipment/supplies).

**Endpoint**: `POST /api/surgery-requests`
```json
{
  "data": {
    "patientName": "Arthur Morgan",
    "operationType": "Coronary Bypass",
    "primarySurgeon": "Dr. Julianne Mercer",
    "infectionStatus": "Standard Precautions",
    "priority": "mandatory",
    "earliestDate": "2026-05-01",
    "endDate": "2026-05-07",
    "phases": {
      "preOp": { 
        "duration": "45m", 
        "resources": [
          { "name": "Pre-Op Nurse", "count": 1, "icon": "User" }
        ] 
      },
      "operative": { 
        "duration": "180m", 
        "resources": [
          { "name": "Chief Surgeon", "count": 1, "icon": "Shield" },
          { "name": "Operating Table", "count": 1, "icon": "Monitor", "resource_id": "uuid_from_equipment_pool" }
        ] 
      },
      "postOp": { "duration": "60m", "resources": [] },
      "sterilization": { "duration": "30m", "resources": [] },
      "recovery": { 
        "duration": "120m", 
        "resources": [
          { "name": "ICU Bed", "count": 1, "icon": "Bed", "resource_id": "uuid_from_icu_beds" }
        ], 
        "icuProbability": 0.15 
      }
    },
    "resources": [
      { 
        "id": "res_anaesthetic", 
        "name": "Propofol 20ml", 
        "type": "Medication", 
        "required": 2, 
        "stockpile": 50,
        "catalog_id": "MED-PROP-020" 
      }
    ]
  }
}
```
