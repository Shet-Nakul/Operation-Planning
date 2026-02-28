## organizations

```sql
CREATE TABLE organizations (
    id              SERIAL PRIMARY KEY,

    name            VARCHAR(255) NOT NULL,
    contact_number  VARCHAR(20),
    contact_email   VARCHAR(255),

    status          VARCHAR(50) DEFAULT 'ACTIVE',  -- ACTIVE / INACTIVE
    
    created_by          INTEGER NOT NULL
                        REFERENCES users(id) ON DELETE RESTRICT,

    updated_by          INTEGER
                        REFERENCES users(id) ON DELETE SET NULL,
    license         VARCHAR(512),

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## planning_global_config

```sql
CREATE TABLE planning_global_config (
    id                      SERIAL PRIMARY KEY,

    -- Link to organization (hospital / tenant)
    organization_id         INTEGER NOT NULL
                                REFERENCES organizations(id)
                                ON DELETE CASCADE,

    -- Operating theatre working window
    operating_start_time    TIME NOT NULL DEFAULT '06:00',
    operating_end_time      TIME NOT NULL DEFAULT '18:00',

    -- Slot granularity (in minutes)
    interval_minutes        INTEGER NOT NULL CHECK (interval_minutes > 5 <= 30),

    -- How many future days solver considers
    planning_horizon_days   INTEGER NOT NULL CHECK (planning_horizon_days > 0),

    -- Metadata
    is_active               BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_by          INTEGER NOT NULL
                        REFERENCES users(id) ON DELETE RESTRICT,

    updated_by          INTEGER
                        REFERENCES users(id) ON DELETE SET NULL,

    -- Ensure only ONE active config per organization
    CONSTRAINT one_active_config_per_org
        UNIQUE (organization_id)
);

```

```sql
CREATE UNIQUE INDEX one_active_config
ON planning_global_config (is_active)
WHERE is_active = TRUE;
```

---

### resources

```sql
CREATE TABLE resources (
    id                  SERIAL PRIMARY KEY,

    organization_id     INTEGER NOT NULL
                        REFERENCES organizations(id) ON DELETE CASCADE,

    code                VARCHAR(100) NOT NULL,
    -- Unique identifier used in JSON & solver (e.g., S1, OR1, ICU_BED_POOL)

    name                VARCHAR(150) NOT NULL,
    -- Human friendly name for UI

    resource_type       VARCHAR(30) NOT NULL,
    -- INDIVIDUAL → specific person or unique asset
    -- POOL       → group capacity resource (beds, nurse pool, etc.)
    -- NON_RENEWABLE → one-time use resource (e.g., blood unit, PPE kit)

    default_capacity    INTEGER DEFAULT 0,
    -- For POOL resources (e.g., PACU beds = 5)

    is_active           BOOLEAN DEFAULT TRUE,
    
    created_by          INTEGER NOT NULL
                        REFERENCES users(id) ON DELETE RESTRICT,

    updated_by          INTEGER
                        REFERENCES users(id) ON DELETE SET NULL,

    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (organization_id, code)
);
```

### resource_daily_capacity

```sql
CREATE TABLE resource_daily_capacity (
    id                SERIAL PRIMARY KEY,

    organization_id   INTEGER NOT NULL
                      REFERENCES organizations(id) ON DELETE CASCADE,

    resource_id       INTEGER NOT NULL
                      REFERENCES resources(id) ON DELETE CASCADE,
    -- Now properly linked to resources table

    day_number        INTEGER NOT NULL CHECK (day_number > 0),
    -- 1 = Day 1 of planning horizon

    capacity          INTEGER NOT NULL DEFAULT 0 CHECK (capacity >= 0),

    UNIQUE (organization_id, resource_id)
);
```

### resource_availability_windows

```sql
CREATE TABLE resource_availability_windows (
    id                     SERIAL PRIMARY KEY,
    daily_capacity_id      INTEGER NOT NULL REFERENCES resource_daily_capacity(id) ON DELETE CASCADE,

    start_time             TIME NOT NULL,
    end_time               TIME NOT NULL,

    is_extended            BOOLEAN DEFAULT FALSE,  -- false = normal, true = extended_hours

    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Final Optimized Index Set**

```sql
CREATE INDEX idx_rdc_org ON resource_daily_capacity (organization_id);
CREATE INDEX idx_rdc_org_day ON resource_daily_capacity (organization_id, day_number);
CREATE INDEX idx_rdc_resource ON resource_daily_capacity (resource_id);
-- UNIQUE already creates:
-- (organization_id, resource_id, day_number)
CREATE INDEX idx_raw_daily_capacity_id ON resource_availability_windows (daily_capacity_id);
CREATE INDEX idx_raw_time_range ON resource_availability_windows (start_time, end_time);
CREATE INDEX idx_raw_extended ON resource_availability_windows (is_extended);
```

| Operation | Index Used | Result |
| --- | --- | --- |
| Filter by organization | `idx_rdc_org` | Avoids full table scan |
| Join windows | `idx_raw_daily_capacity_id` | Fast nested loop / hash join |
| Day-based planning | `idx_rdc_org_day` | Fast daily schedule fetch |
| Time conflict checks | `idx_raw_time_range` | Faster overlap detection |
| Extended hours filter | `idx_raw_extended` | No full scan when isolating overtime |

### **How Your JSON Maps (for refference)**

```sql
{
  "id": "S2",
  "day": 2,
  "capacity": 1,
  "available_hours": [["09:00","11:00"],["13:00","15:00"]],
  "extended_hours": []
}

-- Step 1: Insert daily capacity
INSERT INTO resource_daily_capacity (organization_id, resource_id, day_number, capacity)
VALUES ('HOSPITAL_A', 'S2', 2, 1)
RETURNING id;

-- Step 2: Insert availability windows
INSERT INTO resource_availability_windows (daily_capacity_id, start_time, end_time)
VALUES
(42, '09:00', '11:00'),
(42, '13:00', '15:00');
```

### Example Query (Get all availability for Day 2)

---

### Surgery Phases

```sql
CREATE TABLE phase_requirements (
    id                  SERIAL PRIMARY KEY,
    
    organization_id   INTEGER NOT NULL
                      REFERENCES organizations(id) ON DELETE CASCADE,

    name                VARCHAR(150) NOT NULL,
    -- Human readable label for UI

    description         TEXT,

    phase_type          VARCHAR(50) NOT NULL,
    -- PRE_OP / INTRA_OP / POST_OP / RECOVERY / ICU / ADMIN

    resource_type       VARCHAR(30) NOT NULL,
    -- INDIVIDUAL  → assigned = specific person/resource
    -- POOL        → candidates = resource group/pool

    is_active           BOOLEAN DEFAULT TRUE,
    
    created_by          INTEGER NOT NULL
                        REFERENCES users(id) ON DELETE RESTRICT,

    updated_by          INTEGER
                        REFERENCES users(id) ON DELETE SET NULL,

    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (organization_id)
);
```

---

## Operations

```sql
CREATE TABLE operations (
    id                  SERIAL PRIMARY KEY,

    organization_id     INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    operation_code      VARCHAR(50) NOT NULL,  -- e.g., M1, M2, O3 
    operation_type      INTEGER NOT NULL REFERENCES operation_types(id),-- 1 = Major, 2 = Minor (configurable)      
    infection_type      INTEGER NOT NULL REFERENCES infection_types(id),

    earliest_day        date NOT NULL,
    latest_day          date NOT NULL,

    status              VARCHAR(30) DEFAULT 'DRAFT',  
    -- PENDING / COMPLETED / CANCELLED / DRAFT

    priority_score      NUMERIC(6,2) DEFAULT 0, -- Optional solver priority
    duration_in_min     INTEGER NOT NULL, -- Added column for operation duration

    created_by          INTEGER NOT NULL
                        REFERENCES users(id) ON DELETE RESTRICT,

    updated_by          INTEGER
                        REFERENCES users(id) ON DELETE SET NULL,

    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (organization_id, operation_code)
);
```

### Indexing for Performance

**Fetch operations for a hospital**

```sql
CREATE INDEX idx_operations_org
ON operations (organization_id);
```

Solver filters by day window

```sql
CREATE INDEX idx_operations_day_window
ON operations (earliest_day, latest_day);
```

Query by status

```sql
CREATE INDEX idx_operations_status
ON operations (status);
```

JSONB GIN index (important for resource queries)

```sql
CREATE INDEX idx_operations_resources_gin
ON operations
USING GIN (resources);
```

---

## Operation_types

```sql
CREATE TABLE operation_types (
    id                  SERIAL PRIMARY KEY,

    organization_id     INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    -- NULL = global type shared across all orgs

    name                VARCHAR(100) NOT NULL,  -- UI display name
    description         TEXT,

    priority    INTEGER DEFAULT 0, -- Used by solver if operation has no override

    is_active           BOOLEAN DEFAULT TRUE,
    
    created_by          INTEGER NOT NULL
                        REFERENCES users(id) ON DELETE RESTRICT,

    updated_by          INTEGER
                        REFERENCES users(id) ON DELETE SET NULL,

    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (organization_id, name)
);
```

## infection_types

```sql
CREATE TABLE infection_types (
    id                      SERIAL PRIMARY KEY,

    organization_id         INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    -- NULL = global infection types shared by all hospitals

    name                    VARCHAR(100) NOT NULL,  -- UI display name
    description             TEXT,

    severity_level          INTEGER DEFAULT 0,      
    -- Higher = stricter infection control (used in solver rules)

    requires_isolation      BOOLEAN DEFAULT FALSE,
    requires_terminal_clean BOOLEAN DEFAULT FALSE,
    extra_cleaning_minutes  INTEGER DEFAULT 0,

    is_active               BOOLEAN DEFAULT TRUE,
    
    created_by          INTEGER NOT NULL
                        REFERENCES users(id) ON DELETE RESTRICT,

    updated_by          INTEGER
                        REFERENCES users(id) ON DELETE SET NULL,

    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (organization_id, name)
);
```

### Surgery Phase Requirements

```sql
CREATE TABLE surgery_phase_requirements (
    id                      SERIAL PRIMARY KEY,

    organization_id         INTEGER NOT NULL
                            REFERENCES organizations(id) ON DELETE CASCADE,

    operation_id              INTEGER NOT NULL
                            REFERENCES operations(id) ON DELETE CASCADE,

    phase_id                INTEGER NOT NULL
                            REFERENCES phase_requirements(id) ON DELETE CASCADE,
    -- Example: pre_op_anesthesiologist, OR, surgeon, pacu_bed

    required_count          INTEGER NOT NULL DEFAULT 1 CHECK (required_count > 0),

    start_offset_min        INTEGER NOT NULL,
    end_offset_min          INTEGER NOT NULL,
    -- Duration window relative to surgery start (like JSON [15, 90])

    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

);
```

### Assigned Resource (for INDIVIDUAL phases)

```sql
CREATE TABLE surgery_phase_assigned_resources (
    id                  SERIAL PRIMARY KEY,

    phase_requirement_id INTEGER NOT NULL
                         REFERENCES surgery_phase_requirements(id)
                         ON DELETE CASCADE,

    resource_id         INTEGER NOT NULL
                        REFERENCES resources(id) ON DELETE CASCADE,

    UNIQUE (phase_requirement_id)
);
```

### **Candidate Resource Pool (for POOL phases)**

```sql
CREATE TABLE surgery_phase_candidate_resources (
    id                  SERIAL PRIMARY KEY,

    phase_requirement_id INTEGER NOT NULL
                         REFERENCES surgery_phase_requirements(id)
                         ON DELETE CASCADE,

    resource_id         INTEGER NOT NULL
                        REFERENCES resources(id) ON DELETE CASCADE,
);
```

## Users

```sql
CREATE TABLE users (
    id                  SERIAL PRIMARY KEY,

    organization_id     INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    -- NULL allowed for SUPER_ADMIN (global user)

    role_id             INTEGER NOT NULL REFERENCES roles(id),

    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100),

    email               VARCHAR(150) UNIQUE NOT NULL,
    phone               VARCHAR(20),

    password_hash       TEXT NOT NULL,

    avatar_url          TEXT,              -- profile image for UI

    is_active           BOOLEAN DEFAULT TRUE,
    is_email_verified   BOOLEAN DEFAULT FALSE,

    last_login_at       TIMESTAMP,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## roles

```sql
CREATE TABLE roles (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) UNIQUE NOT NULL,   -- SUPER_ADMIN, ADMIN, USER
    description     TEXT,
    
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## user_activity_logs

```sql
CREATE TABLE user_activity_logs (
    id                  BIGSERIAL PRIMARY KEY,

    user_id             INTEGER REFERENCES users(id) ON DELETE SET NULL,
    organization_id     INTEGER REFERENCES organizations(id) ON DELETE CASCADE,

    action_type         VARCHAR(100) NOT NULL,  
    -- e.g. CREATE_OPERATION, UPDATE_SCHEDULE, LOGIN, DELETE_RESOURCE

    entity_type         VARCHAR(100),           
    -- e.g. OPERATION, RESOURCE, USER, CONFIG

    entity_id           VARCHAR(100),           
    -- ID of the affected record (operation id, resource id, etc.)

    description         TEXT,                   
    -- Human-readable summary for UI

    metadata            JSONB,                  
    -- Stores before/after values or extra context

    ip_address          INET,
    user_agent          TEXT,

    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

-- Insert roles if not present
INSERT INTO roles (id, name, description) VALUES
  (1, 'SUPER_ADMIN', 'Super administrator'),
  (2, 'ADMIN', 'Administrator'),
  (3, 'USER', 'Standard user')
ON CONFLICT (id) DO NOTHING;

-- Insert organizations if not present
INSERT INTO organizations (id, name, created_by) VALUES
  (1, 'Test Hospital', 1)
ON CONFLICT (id) DO NOTHING;

-- Insert super admin user
INSERT INTO users (
  id, organization_id, role_id, first_name, last_name, email, phone, password_hash, is_active, is_email_verified, created_at, updated_at
) VALUES (
  1, NULL, 1, 'Super', 'Admin', 'superadmin@example.com', '1234567890', '$2b$10$superadminhash', TRUE, TRUE, NOW(), NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert admin user
INSERT INTO users (
  id, organization_id, role_id, first_name, last_name, email, phone, password_hash, is_active, is_email_verified, created_at, updated_at
) VALUES (
  2, 1, 2, 'Admin', 'User', 'admin@example.com', '0987654321', '$2b$10$adminhash', TRUE, TRUE, NOW(), NOW()
)
ON CONFLICT (id) DO NOTHING;