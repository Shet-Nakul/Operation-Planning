# 🧑‍⚕️ Staff Management API - Request/Response Examples

**Endpoint**: `POST /api/v1/staff`  
**Purpose**: Create a new staff member  
**Auth Required**: Yes (JWT token in Authorization header)  
**Roles Allowed**: ADMIN, SCHEDULER  
**Status Code**: 201 Created (success) or 400/422 (validation error)

---

## Complete Request Cycle

### 1. Frontend Request (from React)

#### Headers
```http
POST /api/v1/staff HTTP/1.1
Host: api.stitch-surgery.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Accept: application/json
X-Request-ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

#### Payload (Request Body)
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Senior Cardiac Surgeon",
  "specializations": ["Cardiovascular", "Transplant"],
  "skills": ["Intubation", "Suturing", "Perfusion Management"],
  "licenseNumber": "MD-2024-001234",
  "licenseExpiry": "2027-06-30",
  "employeeId": "EMP-2024-5678",
  "employmentStatus": "PERMANENT",
  "startDate": "2024-01-15",
  "contractId": "contract-uuid-here",
  "supervisorId": "550e8400-e29b-41d4-a716-446655440001",
  "maxHoursPerWeek": 40,
  "maxConsecutiveShifts": 6,
  "restDaysPerWeek": 2
}
```

---

### 2. Field Definitions & Validation Rules

| Field | Type | Required | Validation Rules | Example |
|-------|------|----------|------------------|---------|
| `userId` | UUID | ✅ Yes | Must exist in users table, must be SURGEON/NURSE/ANESTHETIST role | `550e8400...` |
| `title` | String | ✅ Yes | 1-100 chars, non-empty | "Senior Cardiac Surgeon" |
| `specializations` | Array[String] | ✅ Yes | 1-5 items, each 1-50 chars | ["Cardiovascular", "Transplant"] |
| `skills` | Array[String] | ✅ Yes | 1-10 items, each 1-50 chars | ["Intubation", "Suturing"] |
| `licenseNumber` | String | ✅ Yes | Unique, 1-50 chars, alphanumeric + dash | "MD-2024-001234" |
| `licenseExpiry` | Date | ✅ Yes | Must be future date (ISO 8601) | "2027-06-30" |
| `employeeId` | String | ✅ Yes | Unique, 1-50 chars | "EMP-2024-5678" |
| `employmentStatus` | Enum | ✅ Yes | One of: PERMANENT, CONTRACT, LOCUM | "PERMANENT" |
| `startDate` | Date | ✅ Yes | Must be ≤ today (ISO 8601) | "2024-01-15" |
| `contractId` | UUID | ❌ No | Must exist in contracts table if provided | `contract-uuid` |
| `supervisorId` | UUID | ❌ No | Must be existing staff_member.id if provided | `550e8400...` |
| `maxHoursPerWeek` | Integer | ❌ No | Default: 40, range: 20-60 | 40 |
| `maxConsecutiveShifts` | Integer | ❌ No | Default: 6, range: 3-10 | 6 |
| `restDaysPerWeek` | Integer | ❌ No | Default: 2, range: 1-3 | 2 |

---

### 3. Success Response (201 Created)

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Staff member created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440099",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Senior Cardiac Surgeon",
    "specializations": ["Cardiovascular", "Transplant"],
    "skills": ["Intubation", "Suturing", "Perfusion Management"],
    "licenseNumber": "MD-2024-001234",
    "licenseExpiry": "2027-06-30",
    "employeeId": "EMP-2024-5678",
    "employmentStatus": "PERMANENT",
    "startDate": "2024-01-15",
    "contractId": "contract-uuid-here",
    "supervisorId": "550e8400-e29b-41d4-a716-446655440001",
    "maxHoursPerWeek": 40,
    "maxConsecutiveShifts": 6,
    "restDaysPerWeek": 2,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### 4. Validation Error Response (422 Unprocessable Entity)

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    {
      "field": "licenseExpiry",
      "message": "License expiry must be a future date",
      "value": "2022-01-01"
    },
    {
      "field": "userId",
      "message": "User not found or does not have SURGEON/NURSE/ANESTHETIST role",
      "value": "550e8400-e29b-41d4-a716-446655440000"
    },
    {
      "field": "specializations",
      "message": "Must provide at least 1 and at most 5 specializations",
      "value": []
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### 5. Authorization Error Response (403 Forbidden)

```json
{
  "success": false,
  "statusCode": 403,
  "message": "Insufficient permissions",
  "detail": "Only ADMIN or SCHEDULER roles can create staff members",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### 6. Conflict Error Response (409 Conflict)

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Duplicate resource",
  "errors": [
    {
      "field": "licenseNumber",
      "message": "License number already exists in system",
      "value": "MD-2024-001234"
    },
    {
      "field": "employeeId",
      "message": "Employee ID already exists",
      "value": "EMP-2024-5678"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### 7. Server Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "detail": "An unexpected error occurred while creating the staff member",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Frontend Implementation Example (React)

### TypeScript Interface

```typescript
// types/staff.ts
export interface CreateStaffPayload {
  userId: string;
  title: string;
  specializations: string[];
  skills: string[];
  licenseNumber: string;
  licenseExpiry: string; // ISO date YYYY-MM-DD
  employeeId: string;
  employmentStatus: 'PERMANENT' | 'CONTRACT' | 'LOCUM';
  startDate: string; // ISO date YYYY-MM-DD
  contractId?: string;
  supervisorId?: string;
  maxHoursPerWeek?: number;
  maxConsecutiveShifts?: number;
  restDaysPerWeek?: number;
}

export interface StaffMember extends CreateStaffPayload {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
    value: any;
  }>;
  timestamp: string;
}
```

### React Hook for API Call

```typescript
// hooks/useStaffApi.ts
import { useState } from 'react';
import { CreateStaffPayload, StaffMember, ApiResponse } from '../types/staff';

export function useCreateStaff() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStaff = async (payload: CreateStaffPayload): Promise<StaffMember | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://localhost:3001/api/v1/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Request-ID': crypto.randomUUID(),
        },
        body: JSON.stringify(payload),
      });

      const data: ApiResponse<StaffMember> = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to create staff member');
        return null;
      }

      return data.data || null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createStaff, loading, error };
}
```

### React Component Using Hook

```typescript
// components/staff/CreateProfile.tsx
import React, { useState } from 'react';
import { useCreateStaff } from '../../hooks/useStaffApi';
import { CreateStaffPayload } from '../../types/staff';

export function CreateProfile() {
  const { createStaff, loading, error } = useCreateStaff();
  const [formData, setFormData] = useState<CreateStaffPayload>({
    userId: '',
    title: '',
    specializations: [],
    skills: [],
    licenseNumber: '',
    licenseExpiry: '',
    employeeId: '',
    employmentStatus: 'PERMANENT',
    startDate: new Date().toISOString().split('T')[0],
    maxHoursPerWeek: 40,
    maxConsecutiveShifts: 6,
    restDaysPerWeek: 2,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await createStaff(formData);
    if (result) {
      console.log('Staff created:', result);
      // Navigate to profile or show success toast
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border rounded"
          required
        />
      </div>

      {/* Specializations multi-select */}
      <div>
        <label className="block text-sm font-medium">Specializations</label>
        <input
          type="text"
          placeholder="Add specialization and press Enter"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const value = (e.target as HTMLInputElement).value.trim();
              if (value) {
                setFormData({
                  ...formData,
                  specializations: [...formData.specializations, value],
                });
                (e.target as HTMLInputElement).value = '';
              }
            }
          }}
          className="w-full px-3 py-2 border rounded"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.specializations.map((spec) => (
            <span key={spec} className="bg-blue-100 px-3 py-1 rounded text-sm">
              {spec}
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    specializations: formData.specializations.filter((s) => s !== spec),
                  })
                }
                className="ml-2 text-red-600"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && <div className="text-red-600 text-sm">{error}</div>}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Creating...' : 'Create Staff Member'}
      </button>
    </form>
  );
}
```

---

## Backend Implementation (Express.js)

### Route Handler

```typescript
// routes/staff.ts
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validateStaffCreation } from '../middleware/validation';
import { StaffService } from '../services/staffService';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'SCHEDULER']),
  validateStaffCreation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const staffMember = await StaffService.createStaff(req.body, req.user.id);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Staff member created successfully',
        data: staffMember,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

### Service Layer

```typescript
// services/staffService.ts
import { pool } from '../database/connect';
import { CreateStaffPayload, StaffMember } from '../types/staff';

export class StaffService {
  static async createStaff(
    payload: CreateStaffPayload,
    createdBy: string
  ): Promise<StaffMember> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify user exists and has correct role
      const userResult = await client.query(
        'SELECT id, role FROM users WHERE id = $1 AND role IN ($2, $3, $4)',
        [payload.userId, 'SURGEON', 'NURSE', 'ANESTHETIST']
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found or does not have required role');
      }

      // Insert staff member
      const staffResult = await client.query(
        `INSERT INTO staff_members (
          user_id, title, specializations, skills, license_number, 
          license_expiry, employee_id, employment_status, start_date,
          contract_id, supervisor_id, max_hours_per_week,
          max_consecutive_shifts, rest_days_per_week
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          payload.userId,
          payload.title,
          payload.specializations,
          payload.skills,
          payload.licenseNumber,
          payload.licenseExpiry,
          payload.employeeId,
          payload.employmentStatus,
          payload.startDate,
          payload.contractId || null,
          payload.supervisorId || null,
          payload.maxHoursPerWeek || 40,
          payload.maxConsecutiveShifts || 6,
          payload.restDaysPerWeek || 2,
        ]
      );

      // Log audit
      await client.query(
        `INSERT INTO audit_logs (user_id, entity_type, entity_id, action, new_values)
         VALUES ($1, $2, $3, $4, $5)`,
        [createdBy, 'STAFF_MEMBER', staffResult.rows[0].id, 'CREATE', JSON.stringify(payload)]
      );

      await client.query('COMMIT');

      return staffResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
```

### Validation Middleware

```typescript
// middleware/validation.ts
import { Request, Response, NextFunction } from 'express';

export const validateStaffCreation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = [];

  // Required fields
  if (!req.body.userId || typeof req.body.userId !== 'string') {
    errors.push({ field: 'userId', message: 'userId is required and must be a UUID' });
  }

  if (!req.body.title || req.body.title.length < 1 || req.body.title.length > 100) {
    errors.push({ field: 'title', message: 'title is required and must be 1-100 chars' });
  }

  if (!Array.isArray(req.body.specializations) || req.body.specializations.length === 0) {
    errors.push({
      field: 'specializations',
      message: 'At least 1 specialization required',
    });
  }

  if (!Array.isArray(req.body.skills) || req.body.skills.length === 0) {
    errors.push({ field: 'skills', message: 'At least 1 skill required' });
  }

  if (!req.body.licenseNumber || req.body.licenseNumber.length < 1) {
    errors.push({ field: 'licenseNumber', message: 'licenseNumber is required' });
  }

  // License expiry in future
  if (req.body.licenseExpiry) {
    const expiryDate = new Date(req.body.licenseExpiry);
    if (expiryDate <= new Date()) {
      errors.push({
        field: 'licenseExpiry',
        message: 'licenseExpiry must be a future date',
      });
    }
  }

  if (!req.body.employeeId) {
    errors.push({ field: 'employeeId', message: 'employeeId is required' });
  }

  if (!['PERMANENT', 'CONTRACT', 'LOCUM'].includes(req.body.employmentStatus)) {
    errors.push({
      field: 'employmentStatus',
      message: 'employmentStatus must be one of: PERMANENT, CONTRACT, LOCUM',
    });
  }

  if (errors.length > 0) {
    return res.status(422).json({
      success: false,
      statusCode: 422,
      message: 'Validation failed',
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  next();
};
```

---

## Database Query

### SQL Insert Statement

```sql
INSERT INTO staff_members (
  user_id,
  title,
  specializations,
  skills,
  license_number,
  license_expiry,
  employee_id,
  employment_status,
  start_date,
  contract_id,
  supervisor_id,
  max_hours_per_week,
  max_consecutive_shifts,
  rest_days_per_week,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',           -- user_id
  'Senior Cardiac Surgeon',                         -- title
  ARRAY['Cardiovascular', 'Transplant'],            -- specializations (PostgreSQL ARRAY)
  ARRAY['Intubation', 'Suturing', ...],             -- skills
  'MD-2024-001234',                                 -- license_number
  '2027-06-30',                                     -- license_expiry
  'EMP-2024-5678',                                  -- employee_id
  'PERMANENT',                                      -- employment_status
  '2024-01-15',                                     -- start_date
  'contract-uuid-here',                             -- contract_id (nullable)
  '550e8400-e29b-41d4-a716-446655440001',           -- supervisor_id (nullable)
  40,                                               -- max_hours_per_week
  6,                                                -- max_consecutive_shifts
  2,                                                -- rest_days_per_week
  NOW(),                                            -- created_at
  NOW()                                             -- updated_at
)
RETURNING *;
```

---

## Related Endpoints

### GET Staff List
```http
GET /api/v1/staff?role=SURGEON&specialization=CARDIO&status=ACTIVE&page=1&limit=20
```

**Response**: List of staff with pagination

### GET Single Staff
```http
GET /api/v1/staff/:id
```

**Response**: Single staff member with full details

### PATCH Staff
```http
PATCH /api/v1/staff/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Surgical Director",
  "maxHoursPerWeek": 35
}
```

**Response**: Updated staff member

### DELETE Staff (Soft Delete)
```http
DELETE /api/v1/staff/:id
Authorization: Bearer <token>
```

**Response**: { success: true }

---

## Testing with cURL

```bash
# Create staff member
curl -X POST http://localhost:3001/api/v1/staff \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Senior Cardiac Surgeon",
    "specializations": ["Cardiovascular", "Transplant"],
    "skills": ["Intubation", "Suturing"],
    "licenseNumber": "MD-2024-001234",
    "licenseExpiry": "2027-06-30",
    "employeeId": "EMP-2024-5678",
    "employmentStatus": "PERMANENT",
    "startDate": "2024-01-15"
  }'

# Get all staff
curl -X GET http://localhost:3001/api/v1/staff \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Get single staff
curl -X GET http://localhost:3001/api/v1/staff/550e8400-e29b-41d4-a716-446655440099 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Testing with Postman

**Collection Example**:
```json
{
  "info": {
    "name": "Stitch Surgery - Staff API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Staff",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"userId\": \"550e8400-e29b-41d4-a716-446655440000\",\n  \"title\": \"Senior Cardiac Surgeon\",\n  \"specializations\": [\"Cardiovascular\", \"Transplant\"],\n  \"skills\": [\"Intubation\", \"Suturing\"],\n  \"licenseNumber\": \"MD-2024-001234\",\n  \"licenseExpiry\": \"2027-06-30\",\n  \"employeeId\": \"EMP-2024-5678\",\n  \"employmentStatus\": \"PERMANENT\",\n  \"startDate\": \"2024-01-15\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/staff",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "staff"]
        }
      }
    }
  ]
}
```

---

## Data Flow Diagram

```
Frontend (React)                Backend (Express)              Database (PostgreSQL)
┌──────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│  CreateProfile   │          │  POST /api/v1/  │          │  staff_members  │
│  Component       │  ────→   │  staff          │  ────→   │  (INSERT)       │
│                  │   JSON   │  Handler        │   SQL    │                 │
└──────────────────┘          └─────────────────┘          └─────────────────┘
         │                             │                            │
         │ useCreateStaff hook         │ Validation                 │ Constraints
         │ validateFormData            │ Authorization              │ Check FK refs
         │                             │ Audit logging              │ UNIQUE on IDs
         │                             │                            │
         └─────────────────────────────────────────────────────────
                         Returns 201 + StaffMember JSON
```

---

*All examples use TypeScript and modern async/await patterns.*  
*Ready to implement in your Express.js backend.*
