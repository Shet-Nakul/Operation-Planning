export type ShiftType = 'Early' | 'Day' | 'Late' | 'Night';

export interface ShiftConfig {
  type: ShiftType;
  startTime: string;
  endTime: string;
}

export interface ForbiddenPattern {
  id: string;
  pattern: string;
  description: string;
  enabled: boolean;
}

export type CatalogStaffTag = {
  id: number;
  organization_id: number;
  name: string;
  color?: string | null;
};

export type CatalogSpecialization = {
  id: number;
  organization_id: number;
  name: string;
  description?: string | null;
};

export type CatalogSkill = {
  id: number;
  organization_id: number;
  name: string;
  description?: string | null;
};

export type CatalogDepartment = {
  id: number;
  organization_id: number;
  name: string;
  description?: string | null;
};

export type CatalogShift = {
  id: number;
  organization_id: number;
  name: string;
  start_time: string;
  end_time: string;
  description?: string | null;
};

export type CatalogSettings = {
  staffTags: CatalogStaffTag[];
  specializations: CatalogSpecialization[];
  skills: CatalogSkill[];
  departments: CatalogDepartment[];
  shifts: CatalogShift[];
};

export type OrgGlobalSettings = {
  organization_id: number;
  business_hours_start: string;
  business_hours_end: string;
  surgery_planning_horizon: number;
  roster_planning_horizon: number;
  surgery_planning_resolution: number;
};

export interface GlobalSettings {
  operationTypes: string[];
  forbiddenPatterns: ForbiddenPattern[];
  shifts: ShiftConfig[];
  phaseResources: Record<string, DefaultResourceSetting[]>;
  catalogs: CatalogSettings;
  orgGlobalSettings: OrgGlobalSettings;
}

export interface DefaultResourceSetting {
  name: string;
  count: number;
  icon: string;
}

export const DEFAULT_SHIFTS: ShiftConfig[] = [
  { type: 'Early', startTime: '05:00', endTime: '13:00' },
  { type: 'Day', startTime: '08:00', endTime: '16:00' },
  { type: 'Late', startTime: '14:00', endTime: '22:00' },
  { type: 'Night', startTime: '21:00', endTime: '05:00' },
];

export const DEFAULT_FORBIDDEN_PATTERNS: ForbiddenPattern[] = [
  { id: 'late-day', pattern: 'Late → Day', description: 'Avoid back-to-back late then day shift', enabled: true },
  { id: 'day-early-day', pattern: 'Day → Early → Day', description: 'Avoid irregular day–early–day sequence', enabled: true },
  { id: 'fri-off-weekend', pattern: 'Friday Off Before Weekend', description: 'Prefer no shift on Friday before weekend work', enabled: true },
  { id: 'late-early', pattern: 'Late → Early', description: 'Avoid short turnaround between late and early shift', enabled: true },
  { id: 'day-night', pattern: 'Day → Night', description: 'Avoid switching from day to night shift', enabled: true },
  { id: 'night-day', pattern: 'Night → Day', description: 'Avoid switching from night to day shift', enabled: true },
  { id: 'night-early', pattern: 'Night → Early', description: 'Avoid switching from night to early shift', enabled: true },
];

export const DEFAULT_OPERATION_TYPES: string[] = [
  'Neuro - Craniotomy',
  'Cardio - Bypass (CABG)',
  'Ortho - Hip Replacement',
  'Ortho - Knee Replacement',
  'General - Appendectomy',
  'General - Cholecystectomy',
  'Neuro - Spinal Fusion',
];

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  operationTypes: DEFAULT_OPERATION_TYPES,
  forbiddenPatterns: DEFAULT_FORBIDDEN_PATTERNS,
  shifts: DEFAULT_SHIFTS,
  catalogs: {
    staffTags: [],
    specializations: [],
    skills: [],
    departments: [],
    shifts: [],
  },
  orgGlobalSettings: {
    organization_id: 1,
    business_hours_start: '08:00',
    business_hours_end: '18:00',
    surgery_planning_horizon: 3,
    roster_planning_horizon: 28,
    surgery_planning_resolution: 15,
  },
  phaseResources: {
    preOp: [
      { name: "Anesthesiologist", count: 1, icon: "user" },
      { name: "Vitals Nurse", count: 2, icon: "nurse" },
      { name: "Pre-Op Technician", count: 1, icon: "user" },
      { name: "IV Pump", count: 1, icon: "equipment" }
    ],
    operative: [
      { name: "Operating Room", count: 1, icon: "room" },
      { name: "Lead Surgeon", count: 1, icon: "user" },
      { name: "Assistant Surgeon", count: 1, icon: "user" },
      { name: "Scrub Nurse", count: 2, icon: "nurse" },
      { name: "Circulating Nurse", count: 1, icon: "nurse" },
      { name: "Anesthesiologist", count: 1, icon: "user" },
      { name: "Anesthesia Technician", count: 1, icon: "user" },
      { name: "Surgical Kit", count: 1, icon: "equipment" },
      { name: "Operating Table", count: 1, icon: "bed" }
    ],
    postOp: [
      { name: "PACU Bed", count: 1, icon: "bed" },
      { name: "Anesthesiologist", count: 1, icon: "user" },
      { name: "Recovery Nurse", count: 2, icon: "nurse" },
      { name: "Monitor Station", count: 1, icon: "equipment" }
    ],
    sterilization: [
      { name: "Cleaning Crew", count: 2, icon: "user" },
      { name: "Sterilization Tech", count: 1, icon: "user" },
      { name: "Sterilizer Machine", count: 1, icon: "equipment" }
    ],
    recovery: [
      { name: "ICU Bed", count: 1, icon: "bed" },
      { name: "ICU Nurse", count: 1, icon: "nurse" },
      { name: "Respiratory Therapist", count: 1, icon: "user" },
      { name: "Monitoring Equipment", count: 1, icon: "equipment" }
    ]
  },
};
