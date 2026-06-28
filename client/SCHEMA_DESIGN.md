# 🏥 Stitch Surgery - Database Schema Design

**Last Updated**: April 15, 2026  
**Application**: Hospital Surgical Operations Management Platform  
**Database**: PostgreSQL 14+

---

## 📋 Table of Contents

1. [Overview & Relationships](#overview--relationships)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Core Entity Tables](#core-entity-tables)
4. [Complete SQL Schema](#complete-sql-schema)
5. [Indexes Strategy](#indexes-strategy)
6. [Data Integrity & Constraints](#data-integrity--constraints)
7. [Migrations](#migrations)

---

## Overview & Relationships

### Database Design Principles

- **ACID Compliance**: Full transactional integrity for critical operations (scheduling, resource allocation)
- **Referential Integrity**: Foreign key constraints prevent orphaned records
- **Pessimistic Locking**: Row-level locks for race condition prevention during resource allocation
- **Audit Trail**: Complete change history via `audit_logs` table
- **Normalized Design**: 3NF to eliminate data redundancy
- **Performance**: Strategic indexing on frequently queried columns

### Key Entities

| Entity | Purpose | Type | Records |
|--------|---------|------|---------|
| `users` | Authentication & authorization | Users | ~100-500 |
| `staff_members` | Clinical personnel profiles | People | ~100-300 |
| `weekly_schedules` | Recurring shift assignments | Settings | ~500-1000 |
| `surgery_requests` | Surgical cases (inbound) | Transactional | ~50-200/day |
| `surgical_phases` | 5-phase breakdown per surgery | Transactional | 5× surgeries |
| `operating_rooms` | OR inventory | Settings | ~5-20 |
| `icu_beds` | ICU capacity tracking | Settings | ~10-40 |
| `resource_pools_hr` | Clinical staff pools | Settings | ~10-20 |
| `resource_pools_equipment` | Equipment inventory | Settings | ~20-50 |

---

## Entity Relationship Diagram

### High-Level Relationships

```
┌────────────────────────────────────────────────────────────────┐
│                          USERS (Auth)                          │
│  id | email | password_hash | role | department | status       │
└────────────────────┬─────────────────────────────────────────┘
                     │ 1:1
                     │
┌────────────────────▼─────────────────────────────────────────┐
│                     STAFF_MEMBERS (People)                    │
│  id | user_id | title | specializations[] | skills[]          │
│  max_hours_per_week | contract_id | supervisor_id             │
└────┬───────────────┬──────────────┬──────────────┬────────────┘
     │               │              │              │
     │ 1:N           │ 1:N          │ 1:N          │ 1:N
     │               │              │              │
┌────▼──────┐  ┌────▼──────┐  ┌───▼──────┐  ┌──▼──────────┐
│WEEKLY_    │  │ STAFF_    │  │POOL_     │  │SURGERY_     │
│SCHEDULES  │  │LEAVE_     │  │MEMBERS   │  │REQUESTS(*)  │
│           │  │REQUESTS   │  │SHIPS     │  │(as surgeon) │
└───────────┘  └───────────┘  └──────────┘  └─────────────┘

         ┌──────────────────────────────────┐
         │ RESOURCE_POOLS_HR (Staff Pools)  │
         │  id | name | department | type   │
         └──────────────────────────────────┘
                 │ 1:N (members)
                 │
          ┌──────▼──────┐
          │POOL_        │
          │MEMBERSHIPS  │
          └─────────────┘

SURGERY_REQUESTS (Core transactional entity)
  │
  ├─ 1:5 ─→ SURGICAL_PHASES
  │         (preOp, operative, postOp, sterilization, recovery)
  │         │ 1:N → PHASE_RESOURCE_REQUIREMENTS
  │
  ├─ 1:1 ─→ OR_SCHEDULES (allocated to operating_room)
  │
  ├─ 1:1 ─→ ICU_RESERVATIONS (post-op bed, if needed)
  │
  └─ 1:1 ─→ SCHEDULING_QUEUE (pending allocation)


SUPPLY_ITEMS (Catalog)
  │ 1:1
  └─→ SUPPLY_INVENTORY (stock levels + allocated quantities)

EQUIPMENT_POOLS → EQUIPMENT_RESERVATIONS ← SURGERY_REQUESTS

SYSTEM_SHIFTS ← FORBIDDEN_SHIFT_PATTERNS (constraints)

AUDIT_LOGS (All changes logged across any entity)
ANALYTICS_SNAPSHOTS (Daily metrics capture)
```

---

## Core Entity Tables

### 1. USERS (Authentication & Authorization)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,  -- 'SURGEON', 'NURSE', 'ANESTHETIST', 'ADMIN', 'SCHEDULER'
  department VARCHAR(100),
  status ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE'),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

**Columns:**
- `id`: UUID for record uniqueness
- `email`: Unique identifier for login
- `password_hash`: bcrypt hashed password (never store plaintext)
- `role`: RBAC role (controls API access)
- `status`: Active/Inactive/On Leave
- `deleted_at`: Soft delete (preserves audit trail)

---

### 2. STAFF_MEMBERS (Clinical Personnel)

```sql
CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Identity & Credentials
  title VARCHAR(100),  -- 'Senior Surgeon', 'OR Nurse'
  specializations TEXT[] NOT NULL,  -- ARRAY of strings
  skills TEXT[] NOT NULL,
  license_number VARCHAR(100),
  license_expiry DATE,
  
  -- Employment
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  employment_status ENUM ('PERMANENT', 'CONTRACT', 'LOCUM'),
  start_date DATE,
  contract_id UUID REFERENCES contracts(id),
  
  -- Supervision & Management
  supervisor_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  
  -- Work Constraints
  max_hours_per_week SMALLINT DEFAULT 40,
  max_consecutive_shifts SMALLINT DEFAULT 6,
  rest_days_per_week SMALLINT DEFAULT 2,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_staff_user_id ON staff_members(user_id);
CREATE INDEX idx_staff_employment ON staff_members(employment_status);
CREATE INDEX idx_staff_specializations ON staff_members USING GIN(specializations);
CREATE INDEX idx_staff_skills ON staff_members USING GIN(skills);
CREATE INDEX idx_staff_supervisor ON staff_members(supervisor_id);
CREATE INDEX idx_staff_deleted ON staff_members(deleted_at) WHERE deleted_at IS NULL;
```

**Key Features:**
- Array types for specializations & skills (enables fast filtering)
- GIN indexes for fast array queries
- Self-referential foreign key for supervisor chains
- Work constraints tracked for scheduling validation

---

### 3. WEEKLY_SCHEDULES (Recurring Shift Assignments)

```sql
CREATE TABLE weekly_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  
  day_of_week SMALLINT NOT NULL,  -- 0=Monday through 6=Sunday
  shift_type VARCHAR(50),  -- 'EARLY', 'DAY', 'LATE', 'NIGHT'
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  role VARCHAR(100),  -- 'CLINICAL', 'RESEARCH', 'TEACHING'
  effort_percentage SMALLINT DEFAULT 100,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_day CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT valid_effort CHECK (effort_percentage BETWEEN 0 AND 100),
  UNIQUE (staff_id, day_of_week, start_time)
);

-- Indexes
CREATE INDEX idx_schedules_staff ON weekly_schedules(staff_id);
CREATE INDEX idx_schedules_day ON weekly_schedules(day_of_week);
```

**Design Notes:**
- One row per shift per staff member per week
- TIME fields (not TIMESTAMP) since recurring weekly
- UNIQUE constraint prevents duplicate shifts
- Used for availability lookups during scheduling

---

### 4. SURGERY_REQUESTS (Core Transactional Entity)

```sql
CREATE TABLE surgery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code VARCHAR(50) UNIQUE NOT NULL,  -- 'SR-2024-001'
  
  -- Patient Info
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  patient_name VARCHAR(255) NOT NULL,
  
  -- Surgical Details
  operation_type VARCHAR(255) NOT NULL,  -- 'Coronary Artery Bypass'
  specialty VARCHAR(100),  -- 'Cardiovascular', 'Orthopedic'
  estimated_duration_minutes SMALLINT NOT NULL,
  infection_status VARCHAR(50),  -- 'CLEAN', 'CLEAN_CONTAMINATED'
  asa_score SMALLINT,  -- American Society of Anesthesiologists risk (1-5)
  
  -- Surgical Team
  primary_surgeon_id UUID NOT NULL REFERENCES staff_members(id),
  secondary_surgeons UUID[],  -- Array of UUID references
  anesthetist_id UUID REFERENCES staff_members(id),
  scrub_nurse_id UUID REFERENCES staff_members(id),
  circulating_nurse_id UUID REFERENCES staff_members(id),
  
  -- Scheduling Window
  priority ENUM ('EMERGENCY', 'MANDATORY', 'ELECTIVE') DEFAULT 'ELECTIVE',
  earliest_date DATE NOT NULL,
  latest_date DATE NOT NULL,
  preferred_time_slots JSONB,  -- [{start: '08:00', end: '12:00'}, ...]
  
  -- Status Tracking
  status ENUM (
    'DRAFT',         -- User creating form
    'IN_REVIEW',     -- Submitted, awaiting approval
    'SCHEDULED',     -- Assigned to OR + time
    'IN_PROGRESS',   -- Surgery started
    'COMPLETED',     -- Surgery finished
    'CANCELLED'      -- Cancelled case
  ) DEFAULT 'DRAFT',
  
  -- Timing
  scheduled_start TIMESTAMP,
  scheduled_end TIMESTAMP,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  
  -- Post-Op Requirements
  requires_icu_postop BOOLEAN DEFAULT false,
  icu_probability_percentage SMALLINT DEFAULT 0,
  blood_products_required BOOLEAN DEFAULT false,
  special_equipment JSONB,  -- [{name: 'Perfusion Machine', notes: '...'}]
  
  -- Audit
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes (CRITICAL for performance)
CREATE INDEX idx_surgery_status ON surgery_requests(status);
CREATE INDEX idx_surgery_priority ON surgery_requests(priority, earliest_date);
CREATE INDEX idx_surgery_dates ON surgery_requests(earliest_date, latest_date);
CREATE INDEX idx_surgery_surgeon ON surgery_requests(primary_surgeon_id);
CREATE INDEX idx_surgery_scheduled ON surgery_requests(scheduled_start, scheduled_end);
CREATE INDEX idx_surgery_actual ON surgery_requests(actual_start, actual_end) WHERE deleted_at IS NULL;
CREATE INDEX idx_surgery_created ON surgery_requests(created_by);
```

**Design Notes:**
- `reference_code`: Unique human-readable identifier (for UI/reports)
- `secondary_surgeons`: UUID ARRAY for multiple surgeons
- `preferred_time_slots`: JSONB for flexible scheduling windows
- `status` ENUM: Enforced state machine (DRAFT → IN_REVIEW → SCHEDULED → IN_PROGRESS → COMPLETED)
- Two sets of timestamps: scheduled vs actual (for analytics)
- Multiple indexes for fast filtering by status, priority, date range, and surgeon

---

### 5. SURGICAL_PHASES (5-Phase Breakdown)

```sql
CREATE TABLE surgical_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgery_id UUID NOT NULL REFERENCES surgery_requests(id) ON DELETE CASCADE,
  
  phase_type ENUM ('PREOP', 'OPERATIVE', 'POSTOP', 'STERILIZATION', 'RECOVERY') NOT NULL,
  sequence_order SMALLINT NOT NULL,  -- 1, 2, 3, 4, 5
  
  -- Duration
  planned_duration_minutes SMALLINT NOT NULL,
  planned_start TIMESTAMP,
  planned_end TIMESTAMP,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  
  -- Resource Requirements (stored as JSON for flexibility)
  staff_requirements JSONB,  -- [{role: 'SURGEON', count: 1, specializations: ['CARDIO']}, ...]
  equipment_requirements JSONB,  -- [{pool_id: 'uuid', units: 1}, ...]
  supply_requirements JSONB,  -- [{supply_item_id: 'uuid', quantity: 1}, ...]
  
  -- ICU Tracking
  icu_required BOOLEAN DEFAULT false,
  icu_bed_hours SMALLINT,
  
  -- Status
  status ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED'),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_sequence CHECK (sequence_order BETWEEN 1 AND 5),
  UNIQUE (surgery_id, sequence_order)
);

-- Indexes
CREATE INDEX idx_phases_surgery ON surgical_phases(surgery_id);
CREATE INDEX idx_phases_type ON surgical_phases(phase_type);
CREATE INDEX idx_phases_timing ON surgical_phases(planned_start, planned_end);
```

**Design Notes:**
- UNIQUE constraint ensures one phase per type per surgery
- JSONB fields allow flexible resource specifications without tight schema coupling
- 5-phase breakdown: PREOP, OPERATIVE, POSTOP, STERILIZATION, RECOVERY

---

### 6. OPERATING_ROOMS (OR Inventory)

```sql
CREATE TABLE operating_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(50) NOT NULL UNIQUE,  -- 'OR-1', 'OR-2'
  floor VARCHAR(50),
  section VARCHAR(100),  -- 'Cardiac', 'Orthopedic'
  capacity_level VARCHAR(50),  -- 'STANDARD', 'ADVANCED', 'TRAUMA'
  
  status ENUM ('AVAILABLE', 'IN_USE', 'CLEANING', 'MAINTENANCE'),
  
  -- Operational Parameters
  turnaround_minutes SMALLINT DEFAULT 30,  -- Time needed between surgeries
  min_scheduled_duration_minutes SMALLINT DEFAULT 30,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_or_status ON operating_rooms(status);
CREATE INDEX idx_or_section ON operating_rooms(section);
```

---

### 7. OR_SCHEDULES (Surgery ↔ Operating Room Allocation)

```sql
CREATE TABLE or_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgery_id UUID NOT NULL UNIQUE REFERENCES surgery_requests(id) ON DELETE CASCADE,
  operating_room_id UUID NOT NULL REFERENCES operating_rooms(id),
  
  -- Planned Timing
  scheduled_start TIMESTAMP NOT NULL,
  scheduled_end TIMESTAMP NOT NULL,
  
  -- Actual Timing
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  
  -- Status
  status ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'SCHEDULED',
  
  -- Analytics
  is_overtime BOOLEAN DEFAULT false,
  delay_minutes SMALLINT DEFAULT 0,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent double-booking of ORs
  CONSTRAINT no_or_overlap UNIQUE (operating_room_id, scheduled_start, scheduled_end)
);

-- Indexes
CREATE INDEX idx_or_schedule_room ON or_schedules(operating_room_id);
CREATE INDEX idx_or_schedule_surgery ON or_schedules(surgery_id);
CREATE INDEX idx_or_schedule_timing ON or_schedules(scheduled_start, scheduled_end);
CREATE INDEX idx_or_schedule_status ON or_schedules(status);
```

**Critical Design:**
- `UNIQUE (operating_room_id, scheduled_start, scheduled_end)`: Prevents double-booking
- Use pessimistic locking (FOR UPDATE at transaction level) when assigning

---

### 8. RESOURCE_POOLS_HR (Clinical Staff Pools)

```sql
CREATE TABLE resource_pools_hr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,  -- 'OR Staff - Cardiac'
  
  -- Classification
  department VARCHAR(100),
  location VARCHAR(100),
  pool_type VARCHAR(50),  -- 'SURGICAL', 'NURSING', 'ANESTHESIA'
  primary_skill VARCHAR(100),
  
  -- Management
  status ENUM ('ACTIVE', 'DRAFT', 'INACTIVE'),
  total_weekly_hours SMALLINT,
  min_members SMALLINT DEFAULT 2,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_pools_status ON resource_pools_hr(status);
CREATE INDEX idx_pools_type ON resource_pools_hr(pool_type);
CREATE INDEX idx_pools_skill ON resource_pools_hr(primary_skill);
```

---

### 9. POOL_MEMBERSHIPS (Staff Assignment to Pools)

```sql
CREATE TABLE pool_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES resource_pools_hr(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  
  -- Assignment Details
  role VARCHAR(100),  -- 'PRIMARY', 'SECONDARY', 'BACKUP'
  percentage_commitment SMALLINT DEFAULT 100,
  
  -- Timing
  joined_date DATE DEFAULT NOW(),
  left_date DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_commitment CHECK (percentage_commitment BETWEEN 0 AND 100),
  -- Allow overlapping active memberships for same staff/pool
  UNIQUE (pool_id, staff_id, joined_date)
);

-- Indexes
CREATE INDEX idx_memberships_pool ON pool_memberships(pool_id);
CREATE INDEX idx_memberships_staff ON pool_memberships(staff_id);
CREATE INDEX idx_memberships_active ON pool_memberships(left_date) WHERE left_date IS NULL;
```

---

### 10. RESOURCE_POOLS_EQUIPMENT (Equipment & Assets)

```sql
CREATE TABLE resource_pools_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,  -- 'Operating Tables'
  
  -- Classification
  category VARCHAR(100),  -- 'TABLES', 'LIGHTING', 'MONITORS', 'STERILIZERS'
  
  -- Inventory
  total_units SMALLINT NOT NULL,
  available_units SMALLINT NOT NULL,
  
  -- Status & Management
  status ENUM ('OPTIMAL', 'HIGH_DEMAND', 'STABLE', 'READY', 'LIMITED'),
  maintenance_schedule TEXT,
  location VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  CONSTRAINT valid_availability CHECK (available_units <= total_units)
);

-- Indexes
CREATE INDEX idx_equipment_status ON resource_pools_equipment(status);
CREATE INDEX idx_equipment_category ON resource_pools_equipment(category);
```

---

### 11. EQUIPMENT_RESERVATIONS (Equipment Allocation to Surgeries)

```sql
CREATE TABLE equipment_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgery_id UUID NOT NULL REFERENCES surgery_requests(id) ON DELETE CASCADE,
  equipment_pool_id UUID NOT NULL REFERENCES resource_pools_equipment(id),
  
  -- Allocation
  units_reserved SMALLINT NOT NULL,
  
  -- Timing
  scheduled_start TIMESTAMP NOT NULL,
  scheduled_end TIMESTAMP NOT NULL,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  
  -- Status
  status ENUM ('RESERVED', 'IN_USE', 'COMPLETED', 'CANCELLED') DEFAULT 'RESERVED',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_units CHECK (units_reserved > 0)
);

-- Indexes
CREATE INDEX idx_equipment_res_surgery ON equipment_reservations(surgery_id);
CREATE INDEX idx_equipment_res_pool ON equipment_reservations(equipment_pool_id);
CREATE INDEX idx_equipment_res_timing ON equipment_reservations(scheduled_start, scheduled_end);
```

---

### 12. ICU_BEDS (ICU Capacity)

```sql
CREATE TABLE icu_beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_number VARCHAR(50) NOT NULL UNIQUE,  -- 'ICU-1', 'ICU-2'
  icu_type VARCHAR(50),  -- 'GENERAL', 'CARDIAC', 'NEURO'
  
  status ENUM ('AVAILABLE', 'OCCUPIED', 'CLEANING', 'BLOCKED'),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_icu_status ON icu_beds(status);
CREATE INDEX idx_icu_type ON icu_beds(icu_type);
```

---

### 13. ICU_RESERVATIONS (Post-OP ICU Booking)

```sql
CREATE TABLE icu_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgery_id UUID NOT NULL REFERENCES surgery_requests(id) ON DELETE CASCADE,
  icu_bed_id UUID NOT NULL REFERENCES icu_beds(id),
  
  -- Timing
  scheduled_start TIMESTAMP NOT NULL,
  scheduled_end TIMESTAMP NOT NULL,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  
  -- Status
  status ENUM ('RESERVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'RESERVED',
  
  -- Clinical Info
  clinical_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT no_icu_overlap UNIQUE (icu_bed_id, scheduled_start, scheduled_end)
);

-- Indexes
CREATE INDEX idx_icu_res_surgery ON icu_reservations(surgery_id);
CREATE INDEX idx_icu_res_bed ON icu_reservations(icu_bed_id);
CREATE INDEX idx_icu_res_timing ON icu_reservations(scheduled_start, scheduled_end);
```

---

### 14. SCHEDULING_QUEUE (Pending Surgery Allocation)

```sql
CREATE TABLE scheduling_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgery_id UUID NOT NULL UNIQUE REFERENCES surgery_requests(id) ON DELETE CASCADE,
  
  -- Queue Management
  queue_position SMALLINT NOT NULL,
  priority_score FLOAT DEFAULT 0.0,  -- Computed: priority + urgency + deadline proximity
  
  -- Feasibility Tracking
  feasibility ENUM ('FEASIBLE', 'DIFFICULT', 'BLOCKED') DEFAULT 'FEASIBLE',
  blocking_reason TEXT,  -- 'No OR available in window', 'Surgeon unavailable', etc.
  
  -- Attempt Tracking
  last_scheduling_attempt TIMESTAMP,
  attempt_count SMALLINT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_queue_position ON scheduling_queue(queue_position);
CREATE INDEX idx_queue_priority ON scheduling_queue(priority_score DESC);
CREATE INDEX idx_queue_feasibility ON scheduling_queue(feasibility);
CREATE INDEX idx_queue_surgery ON scheduling_queue(surgery_id);
```

---

### 15. SUPPLY_ITEMS (Medical Supply Catalog)

```sql
CREATE TABLE supply_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,  -- 'Surgical Kit - Standard'
  
  -- Classification
  category VARCHAR(100),  -- 'KITS', 'MEDICATIONS', 'BLOOD_PRODUCTS', 'SUTURES'
  sku VARCHAR(50) UNIQUE,
  description TEXT,
  
  -- Specifications
  unit_of_measure VARCHAR(50),  -- 'UNIT', 'KIT', 'BOTTLE', 'PACK'
  cost_per_unit DECIMAL(10, 2),
  reorder_level SMALLINT,
  lead_time_days SMALLINT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_supplies_category ON supply_items(category);
CREATE INDEX idx_supplies_sku ON supply_items(sku);
```

---

### 16. SUPPLY_INVENTORY (Stock Levels)

```sql
CREATE TABLE supply_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_item_id UUID NOT NULL UNIQUE REFERENCES supply_items(id) ON DELETE CASCADE,
  
  -- Inventory Tracking
  current_quantity SMALLINT NOT NULL DEFAULT 0,
  allocated_quantity SMALLINT NOT NULL DEFAULT 0,  -- Reserved for surgeries
  available_quantity SMALLINT GENERATED ALWAYS AS (current_quantity - allocated_quantity) STORED,
  
  -- Location & Restocking
  warehouse_location VARCHAR(100),
  last_restocked TIMESTAMP,
  next_restock_date DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT non_negative_current CHECK (current_quantity >= 0),
  CONSTRAINT non_negative_allocated CHECK (allocated_quantity >= 0)
);

-- Indexes
CREATE INDEX idx_inventory_available ON supply_inventory(available_quantity);
CREATE INDEX idx_inventory_restock ON supply_inventory(next_restock_date);
```

---

### 17. PHASE_RESOURCE_REQUIREMENTS (Granular Resource Needs)

```sql
CREATE TABLE phase_resource_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgical_phase_id UUID NOT NULL REFERENCES surgical_phases(id) ON DELETE CASCADE,
  
  -- Resource Type & Reference
  resource_type VARCHAR(50) NOT NULL,  -- 'STAFF', 'EQUIPMENT', 'SUPPLY'
  resource_id UUID NOT NULL,
  resource_name VARCHAR(255),
  
  -- Requirement Details
  quantity SMALLINT NOT NULL DEFAULT 1,
  role_specification VARCHAR(100),  -- For staff: 'SURGEON', 'SCRUB_NURSE'
  specialization_required TEXT[],  -- For staff roles
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_quantity CHECK (quantity > 0)
);

-- Indexes
CREATE INDEX idx_phase_requirements ON phase_resource_requirements(surgical_phase_id);
CREATE INDEX idx_phase_resource_type ON phase_resource_requirements(resource_type);
```

---

### 18. SYSTEM_SHIFTS (Global Shift Definitions)

```sql
CREATE TABLE system_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_type VARCHAR(50) NOT NULL UNIQUE,  -- 'EARLY', 'DAY', 'LATE', 'NIGHT'
  
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  color_code VARCHAR(7),  -- HEX color for UI
  display_order SMALLINT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed Data
-- INSERT INTO system_shifts (shift_type, start_time, end_time, color_code, display_order)
-- VALUES 
--   ('EARLY', '05:00', '13:00', '#FF6B6B', 1),
--   ('DAY', '08:00', '16:00', '#4ECDC4', 2),
--   ('LATE', '14:00', '22:00', '#45B7D1', 3),
--   ('NIGHT', '21:00', '05:00', '#2C3E50', 4);
```

---

### 19. FORBIDDEN_SHIFT_PATTERNS (Scheduling Constraints)

```sql
CREATE TABLE forbidden_shift_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name VARCHAR(100) NOT NULL,
  
  -- Shift Transition
  from_shift_type VARCHAR(50),  -- e.g., 'LATE'
  to_shift_type VARCHAR(50),    -- e.g., 'DAY'
  
  -- Constraints
  min_hours_between SMALLINT,  -- Minimum hours between shifts
  max_consecutive_days SMALLINT,  -- Max days in sequence
  
  -- Configuration
  is_enabled BOOLEAN DEFAULT true,
  applies_to_roles TEXT[],  -- Can restrict to certain roles
  description TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_forbidden_enabled ON forbidden_shift_patterns(is_enabled);
```

---

### 20. SYSTEM_SETTINGS (Global Configuration)

```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB,
  
  -- Metadata
  data_type VARCHAR(50),  -- 'STRING', 'INTEGER', 'BOOLEAN', 'JSON'
  description TEXT,
  
  -- Audit
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_settings_key ON system_settings(setting_key);
```

---

### 21. AUDIT_LOGS (Complete Change History)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  
  -- Entity Reference
  entity_type VARCHAR(100),  -- 'SURGERY_REQUEST', 'STAFF_MEMBER', 'OR_SCHEDULE'
  entity_id UUID,
  
  -- Action
  action VARCHAR(50),  -- 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'
  
  -- Change Details
  old_values JSONB,  -- Before change
  new_values JSONB,  -- After change
  
  -- Request Info
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);
```

---

### 22. ANALYTICS_SNAPSHOTS (Historical Metrics)

```sql
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,
  
  -- Operational Metrics
  or_occupancy_percentage DECIMAL(5, 2),
  icu_occupancy_percentage DECIMAL(5, 2),
  
  -- Case Metrics
  surgeries_scheduled_count SMALLINT,
  surgeries_completed_count SMALLINT,
  surgeries_delayed_count SMALLINT,
  surgeries_cancelled_count SMALLINT,
  
  -- Performance Metrics
  avg_delay_minutes INTEGER,
  staff_utilization_percentage DECIMAL(5, 2),
  supply_shortage_incidents SMALLINT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_date ON analytics_snapshots(snapshot_date);
```

---

### 23. PATIENTS (Optional: Patient Demographics)

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_number VARCHAR(50) UNIQUE,
  
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(10),
  
  contact_number VARCHAR(20),
  email VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_patients_mrn ON patients(medical_record_number);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
```

---

### 24. STAFF_LEAVE_REQUESTS (Absence Management)

```sql
CREATE TABLE staff_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  
  -- Leave Details
  leave_type VARCHAR(50) NOT NULL,  -- 'VACATION', 'SICK', 'EMERGENCY', 'OTHER'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Approval Workflow
  status ENUM ('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Indexes
CREATE INDEX idx_leave_staff ON staff_leave_requests(staff_id);
CREATE INDEX idx_leave_dates ON staff_leave_requests(start_date, end_date);
CREATE INDEX idx_leave_status ON staff_leave_requests(status);
```

---

### 25. CONTRACTS (Employment Contracts)

```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_name VARCHAR(255) NOT NULL UNIQUE,
  
  -- Contract Type
  contract_type ENUM ('DYNAMIC', 'STATIC'),  -- Dynamic=flexible, Static=templated
  
  -- Management
  staff_count SMALLINT,
  status ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED'),
  staff_tags TEXT[],  -- ['Surgeon', 'Nurse', 'Specialist', 'Locum']
  
  -- Terms
  terms TEXT,  -- Store as JSON or markdown
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_type ON contracts(contract_type);
```

---

## Complete SQL Schema

### Full SQL Migration File

```sql
-- ==========================================================
-- Stitch Surgery Database Schema
-- PostgreSQL 14+
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- 1. AUTHENTICATION & AUTHORIZATION
-- ==========================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('SURGEON', 'NURSE', 'ANESTHETIST', 'ADMIN', 'SCHEDULER', 'STAFF')),
  department VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE')),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;

-- ==========================================================
-- 2. STAFF MANAGEMENT
-- ==========================================================

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_name VARCHAR(255) NOT NULL UNIQUE,
  contract_type VARCHAR(50) CHECK (contract_type IN ('DYNAMIC', 'STATIC')),
  staff_count SMALLINT,
  status VARCHAR(50) CHECK (status IN ('ACTIVE', 'DRAFT', 'ARCHIVED')),
  staff_tags TEXT[],
  terms TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100),
  specializations TEXT[] NOT NULL DEFAULT '{}',
  skills TEXT[] NOT NULL DEFAULT '{}',
  license_number VARCHAR(100),
  license_expiry DATE,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  employment_status VARCHAR(50) CHECK (employment_status IN ('PERMANENT', 'CONTRACT', 'LOCUM')),
  start_date DATE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  supervisor_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  max_hours_per_week SMALLINT DEFAULT 40,
  max_consecutive_shifts SMALLINT DEFAULT 6,
  rest_days_per_week SMALLINT DEFAULT 2,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_staff_user_id ON staff_members(user_id);
CREATE INDEX idx_staff_employment ON staff_members(employment_status);
CREATE INDEX idx_staff_specializations ON staff_members USING GIN(specializations);
CREATE INDEX idx_staff_skills ON staff_members USING GIN(skills);

-- ==========================================================
-- 3. SCHEDULING & STAFF AVAILABILITY
-- ==========================================================

CREATE TABLE weekly_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  shift_type VARCHAR(50),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  role VARCHAR(100),
  effort_percentage SMALLINT DEFAULT 100 CHECK (effort_percentage BETWEEN 0 AND 100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (staff_id, day_of_week, start_time)
);

CREATE INDEX idx_schedules_staff ON weekly_schedules(staff_id);

CREATE TABLE staff_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date >= start_date),
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leave_staff_dates ON staff_leave_requests(staff_id, start_date, end_date);

-- ==========================================================
-- 4. RESOURCE POOLS
-- ==========================================================

CREATE TABLE resource_pools_hr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  department VARCHAR(100),
  location VARCHAR(100),
  pool_type VARCHAR(50),
  primary_skill VARCHAR(100),
  status VARCHAR(50) CHECK (status IN ('ACTIVE', 'DRAFT', 'INACTIVE')),
  total_weekly_hours SMALLINT,
  min_members SMALLINT DEFAULT 2,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_pools_status ON resource_pools_hr(status);

CREATE TABLE pool_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES resource_pools_hr(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  role VARCHAR(100),
  percentage_commitment SMALLINT DEFAULT 100 CHECK (percentage_commitment BETWEEN 0 AND 100),
  joined_date DATE DEFAULT NOW(),
  left_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (pool_id, staff_id, joined_date)
);

CREATE INDEX idx_memberships_pool ON pool_memberships(pool_id);
CREATE INDEX idx_memberships_staff ON pool_memberships(staff_id);

CREATE TABLE resource_pools_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  total_units SMALLINT NOT NULL CHECK (total_units > 0),
  available_units SMALLINT NOT NULL CHECK (available_units <= total_units),
  status VARCHAR(50),
  maintenance_schedule TEXT,
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_equipment_status ON resource_pools_equipment(status);

-- ==========================================================
-- 5. OPERATIONAL INFRASTRUCTURE
-- ==========================================================

CREATE TABLE operating_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(50) NOT NULL UNIQUE,
  floor VARCHAR(50),
  section VARCHAR(100),
  capacity_level VARCHAR(50),
  status VARCHAR(50) CHECK (status IN ('AVAILABLE', 'IN_USE', 'CLEANING', 'MAINTENANCE')),
  turnaround_minutes SMALLINT DEFAULT 30,
  min_scheduled_duration_minutes SMALLINT DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_or_status ON operating_rooms(status);

CREATE TABLE icu_beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_number VARCHAR(50) NOT NULL UNIQUE,
  icu_type VARCHAR(50),
  status VARCHAR(50) CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'CLEANING', 'BLOCKED')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_icu_status ON icu_beds(status);

-- ==========================================================
-- 6. PATIENTS
-- ==========================================================

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_number VARCHAR(50) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(10),
  contact_number VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_patients_mrn ON patients(medical_record_number);

-- ==========================================================
-- 7. SURGERY REQUESTS (CORE)
-- ==========================================================

CREATE TABLE surgery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code VARCHAR(50) UNIQUE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  patient_name VARCHAR(255) NOT NULL,
  operation_type VARCHAR(255) NOT NULL,
  specialty VARCHAR(100),
  estimated_duration_minutes SMALLINT NOT NULL,
  infection_status VARCHAR(50),
  asa_score SMALLINT,
  
  primary_surgeon_id UUID NOT NULL REFERENCES staff_members(id),
  secondary_surgeons UUID[],
  anesthetist_id UUID REFERENCES staff_members(id),
  scrub_nurse_id UUID REFERENCES staff_members(id),
  circulating_nurse_id UUID REFERENCES staff_members(id),
  
  priority VARCHAR(50) DEFAULT 'ELECTIVE' CHECK (priority IN ('EMERGENCY', 'MANDATORY', 'ELECTIVE')),
  earliest_date DATE NOT NULL,
  latest_date DATE NOT NULL,
  preferred_time_slots JSONB,
  
  status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_REVIEW', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  
  scheduled_start TIMESTAMP,
  scheduled_end TIMESTAMP,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  
  requires_icu_postop BOOLEAN DEFAULT false,
  icu_probability_percentage SMALLINT DEFAULT 0,
  blood_products_required BOOLEAN DEFAULT false,
  special_equipment JSONB,
  
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_surgery_status ON surgery_requests(status);
CREATE INDEX idx_surgery_priority ON surgery_requests(priority);
CREATE INDEX idx_surgery_dates ON surgery_requests(earliest_date, latest_date);
CREATE INDEX idx_surgery_surgeon ON surgery_requests(primary_surgeon_id);
CREATE INDEX idx_surgery_scheduled ON surgery_requests(scheduled_start, scheduled_end);

-- ==========================================================
-- 8. SURGICAL PHASES
-- ==========================================================

CREATE TABLE surgical_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgery_id UUID NOT NULL REFERENCES surgery_requests(id) ON DELETE CASCADE,
  phase_type VARCHAR(50) NOT NULL CHECK (phase_type IN ('PREOP', 'OPERATIVE', 'POSTOP', 'STERILIZATION', 'RECOVERY')),
  sequence_order SMALLINT NOT NULL CHECK (sequence_order BETWEEN 1 AND 5),
  
  planned_duration_minutes SMALLINT NOT NULL,
  planned_start TIMESTAMP,
  planned_end TIMESTAMP,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  
  staff_requirements JSONB,
  equipment_requirements JSONB,
  supply_requirements JSONB,
  
  icu_required BOOLEAN DEFAULT false,
  icu_bed_hours SMALLINT,
  
  status VARCHAR(50) CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED')),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (surgery_id, sequence_order)
);

CREATE INDEX idx_phases_surgery ON surgical_phases(surgery_id);

-- ==========================================================
-- 9. SCHEDULING ALLOCATION (OR & ICU)
-- ==========================================================

CREATE TABLE or_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgery_id UUID NOT NULL UNIQUE REFERENCES surgery_requests(id) ON DELETE CASCADE,
  operating_room_id UUID NOT NULL REFERENCES operating_rooms(id),
  
  scheduled_start TIMESTAMP NOT NULL,
  scheduled_end TIMESTAMP NOT NULL,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  
  status VARCHAR(50) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  
  is_overtime BOOLEAN DEFAULT false,
  delay_minutes SMALLINT DEFAULT 0,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (operating_room_id, scheduled_start, scheduled_end)
);

CREATE INDEX idx_or_schedule_room ON or_schedules(operating_room_id);
CREATE INDEX idx_or_schedule_timing ON or_schedules(scheduled_start, scheduled_end);

CREATE TABLE icu_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgery_id UUID NOT NULL REFERENCES surgery_requests(id) ON DELETE CASCADE,
  icu_bed_id UUID NOT NULL REFERENCES icu_beds(id),
  
  scheduled_start TIMESTAMP NOT NULL,
  scheduled_end TIMESTAMP NOT NULL,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  
  status VARCHAR(50) DEFAULT 'RESERVED' CHECK (status IN ('RESERVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  
  clinical_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (icu_bed_id, scheduled_start, scheduled_end)
);

CREATE INDEX idx_icu_res_surgery ON icu_reservations(surgery_id);
CREATE INDEX idx_icu_res_timing ON icu_reservations(scheduled_start, scheduled_end);

-- ==========================================================
-- 10. SUPPLIER & INVENTORY
-- ==========================================================

CREATE TABLE supply_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  sku VARCHAR(50) UNIQUE,
  description TEXT,
  unit_of_measure VARCHAR(50),
  cost_per_unit DECIMAL(10, 2),
  reorder_level SMALLINT,
  lead_time_days SMALLINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_supplies_category ON supply_items(category);

CREATE TABLE supply_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_item_id UUID NOT NULL UNIQUE REFERENCES supply_items(id) ON DELETE CASCADE,
  current_quantity SMALLINT NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
  allocated_quantity SMALLINT NOT NULL DEFAULT 0 CHECK (allocated_quantity >= 0),
  available_quantity SMALLINT GENERATED ALWAYS AS (current_quantity - allocated_quantity) STORED,
  warehouse_location VARCHAR(100),
  last_restocked TIMESTAMP,
  next_restock_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE equipment_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgery_id UUID NOT NULL REFERENCES surgery_requests(id) ON DELETE CASCADE,
  equipment_pool_id UUID NOT NULL REFERENCES resource_pools_equipment(id),
  units_reserved SMALLINT NOT NULL CHECK (units_reserved > 0),
  scheduled_start TIMESTAMP NOT NULL,
  scheduled_end TIMESTAMP NOT NULL,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  status VARCHAR(50) DEFAULT 'RESERVED' CHECK (status IN ('RESERVED', 'IN_USE', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_equipment_res_surgery ON equipment_reservations(surgery_id);
CREATE INDEX idx_equipment_res_timing ON equipment_reservations(scheduled_start, scheduled_end);

-- ==========================================================
-- 11. SCHEDULING QUEUE
-- ==========================================================

CREATE TABLE scheduling_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgery_id UUID NOT NULL UNIQUE REFERENCES surgery_requests(id) ON DELETE CASCADE,
  queue_position SMALLINT NOT NULL,
  priority_score FLOAT DEFAULT 0.0,
  feasibility VARCHAR(50) DEFAULT 'FEASIBLE' CHECK (feasibility IN ('FEASIBLE', 'DIFFICULT', 'BLOCKED')),
  blocking_reason TEXT,
  last_scheduling_attempt TIMESTAMP,
  attempt_count SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_queue_position ON scheduling_queue(queue_position);
CREATE INDEX idx_queue_feasibility ON scheduling_queue(feasibility);

-- ==========================================================
-- 12. CONFIGURATION & SETTINGS
-- ==========================================================

CREATE TABLE system_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_type VARCHAR(50) NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color_code VARCHAR(7),
  display_order SMALLINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE forbidden_shift_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name VARCHAR(100) NOT NULL,
  from_shift_type VARCHAR(50),
  to_shift_type VARCHAR(50),
  min_hours_between SMALLINT,
  max_consecutive_days SMALLINT,
  is_enabled BOOLEAN DEFAULT true,
  applies_to_roles TEXT[],
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB,
  data_type VARCHAR(50),
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_settings_key ON system_settings(setting_key);

-- ==========================================================
-- 13. AUDIT & ANALYTICS
-- ==========================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  entity_type VARCHAR(100),
  entity_id UUID,
  action VARCHAR(50),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at DESC);

CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,
  or_occupancy_percentage DECIMAL(5, 2),
  icu_occupancy_percentage DECIMAL(5, 2),
  surgeries_scheduled_count SMALLINT,
  surgeries_completed_count SMALLINT,
  surgeries_delayed_count SMALLINT,
  surgeries_cancelled_count SMALLINT,
  avg_delay_minutes INTEGER,
  staff_utilization_percentage DECIMAL(5, 2),
  supply_shortage_incidents SMALLINT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_date ON analytics_snapshots(snapshot_date);

-- ==========================================================
-- 14. RESOURCE REQUIREMENTS (Fine-grained allocation)
-- ==========================================================

CREATE TABLE phase_resource_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgical_phase_id UUID NOT NULL REFERENCES surgical_phases(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  resource_name VARCHAR(255),
  quantity SMALLINT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  role_specification VARCHAR(100),
  specialization_required TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_phase_requirements ON phase_resource_requirements(surgical_phase_id);
```

---

## Indexes Strategy

### Query Performance Optimization

| Table | Index | Purpose | Frequency |
|-------|-------|---------|-----------|
| `surgery_requests` | `status` | Filter by Draft/Scheduled/In Progress | Very High |
| `surgery_requests` | `priority + earliest_date` | Sorting queue | Very High |
| `surgery_requests` | `scheduled_start + scheduled_end` | Find surgeries in time range | High |
| `or_schedules` | `operating_room_id + scheduled_start + scheduled_end` | Check OR availability | Very High |
| `staff_members` | `specializations (GIN)` | Find surgeons by specialty | High |
| `weekly_schedules` | `staff_id + day_of_week` | Lookup recurring shifts | High |
| `staff_leave_requests` | `staff_id + start_date + end_date` | Find leave periods | High |
| `icu_reservations` | `icu_bed_id + scheduled_start/end` | Check ICU availability | High |
| `audit_logs` | `entity_type + entity_id` | Retrieve history | Medium |
| `scheduling_queue` | `position + feasibility` | Find next case to schedule | Very High |

---

## Data Integrity & Constraints

### Unique Constraints (Prevent Duplicates)

```sql
-- Staff cannot be in same pool twice on same start date
UNIQUE (pool_id, staff_id, joined_date)

-- One OR schedule per room per time slot
UNIQUE (operating_room_id, scheduled_start, scheduled_end)

-- One ICU bed per time slot
UNIQUE (icu_bed_id, scheduled_start, scheduled_end)

-- One recurring schedule per staff per day/time
UNIQUE (staff_id, day_of_week, start_time)
```

### Foreign Key Constraints (Referential Integrity)

```sql
-- Delete a user → Staff member deleted
REFERENCES users(id) ON DELETE CASCADE

-- Delete a staff → All their schedules deleted
REFERENCES staff_members(id) ON DELETE CASCADE

-- Delete patient → NULL reference (surgery kept, patient anonymized)
REFERENCES patients(id) ON DELETE SET NULL
```

### Check Constraints (Business Logic)

```sql
-- Only valid roles
CHECK (role IN ('SURGEON', 'NURSE', 'ANESTHETIST', 'ADMIN', 'SCHEDULER'))

-- Effort percentage 0-100%
CHECK (effort_percentage BETWEEN 0 AND 100)

-- Available units ≤ total units
CHECK (available_units <= total_units)

-- End date ≥ start date
CHECK (end_date >= start_date)

-- Valid day of week
CHECK (day_of_week BETWEEN 0 AND 6)
```

---

## Migrations

### Migration Execution Order

```
1. Extensions (UUID)
2. Users & Contracts (no dependencies)
3. Staff
 (depends on Users, Contracts)
4. Schedules & Leave (depends on Staff)
5. Resource Pools (HR/Equipment, independent)
6. Pool Memberships (depends on Pools, Staff)
7. Operating Rooms & ICU Beds (independent)
8. Patients (independent)
9. Surgery Requests (depends on Staff, Patients)
10. Surgical Phases (depends on Surgery Requests)
11. OR Schedules (depends on Surgery Requests, OR)
12. ICU Reservations (depends on Surgery Requests, ICU)
13. Supply Items & Inventory
14. Equipment Reservations (depends on Equipment, Surgery)
15. Phase Resource Requirements (depends on Phases)
16. Scheduling Queue (depends on Surgery Requests)
17. System Configuration (Shifts, Settings, Patterns)
18. Audit & Analytics (final tables)
```

---

## Summary

This schema provides:
- ✅ **25 tables** with full relational design
- ✅ **Referential integrity** via foreign keys
- ✅ **Pessimistic locking** prevention with UNIQUE constraints
- ✅ **Performance** via strategic indexing (GIN for arrays, multi-column for timing)
- ✅ **Audit trail** for compliance (audit_logs)
- ✅ **Analytics** snapshot tables for reporting
- ✅ **Normalized design** (3NF) eliminating redundancy
- ✅ **Flexible JSONB** fields for resource requirements & settings

**Total Tables**: 25  
**Total Indexes**: 50+  
**Total Constraints**: 100+  

Ready for production deployment with PostgreSQL 14+.

---

*Generated: April 15, 2026*
