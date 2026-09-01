export type Priority = 'emergency' | 'mandatory' | 'elective';

export type BackendSurgeryStatus =
  | 'DRAFT'
  | 'ESTIMATED'
  | 'PLANNING'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'CANCELLED';

export type SurgeryRequestStatus = BackendSurgeryStatus;

export type BackendStageKey = 'pre_op' | 'operative' | 'post_op' | 'sterilization' | 'recovery';
export type UiPhaseKey = 'preOp' | 'operative' | 'postOp' | 'sterilization' | 'recovery';

export interface PhaseResourceAssignment {
  type: 'individual' | 'pool';
  id: string;
  name: string;
  poolId?: string;
  poolName?: string;
}

export interface PhaseResource {
  name: string;
  count: number;
  icon: string;
  roles?: string[];
  startTime?: number;
  endTime?: number;
  assignments?: PhaseResourceAssignment[];
}

export interface PhaseConfig {
  duration: string;
  resources: PhaseResource[];
  status?: string;
  icuProbability?: number;
}

export interface ResourceItem {
  id: string;
  name: string;
  type: string;
  required: number;
  stockpile: number;
  status: 'available' | 'shortage';
  icon: string;
}

export interface SurgeryRequest {
  patientName: string;
  operationType: string;
  primarySurgeon: string;
  infectionStatus: string;
  infectionType: number;
  priority: Priority;
  earliestDate: string;
  endDate: string;
  earliestDateTime: string;
  endDateTime: string;
  departmentId?: number | null;
  department?: string;
  plannedStart?: string;
  phases: {
    preOp: PhaseConfig;
    operative: PhaseConfig;
    postOp: PhaseConfig;
    sterilization: PhaseConfig;
    recovery: PhaseConfig;
  };
  resources: ResourceItem[];
}

export interface BackendStageRequirement {
  role: string;
  assigned?: string | null;
  count: number;
  duration: [number, number];
  probability?: number;
}

export interface BackendTimeWindows {
  earliest_date: string;
  latest_date: string;
  planned_start?: string | null;
  planned_by?: string | null;
}

export interface BackendSurgery {
  id: number;
  organization_id: number;
  surgery_id: string;
  name: string;
  type: string;
  infection_type: number;
  department_id?: number | null;
  department?: string | null;
  status: BackendSurgeryStatus;
  time_windows: BackendTimeWindows;
  stages: Partial<Record<BackendStageKey, BackendStageRequirement[]>> | null;
  created_at?: string;
  updated_at?: string;
}

export interface BackendSurgeryPayload {
  organization_id: number;
  name: string;
  type: string;
  infection_type?: number;
  department_id?: number | null;
  status?: BackendSurgeryStatus;
  time_windows: BackendTimeWindows;
  stages: Partial<Record<BackendStageKey, BackendStageRequirement[]>>;
}

export interface BackendSurgeryPlanResult {
  id: number;
  surgery_id: string;
  organization_id: number;
  department: string;
  result: {
    id?: string;
    resources_assigned?: Record<string, unknown>;
    planned_start?: string;
    [key: string]: unknown;
  };
  created_at?: string;
  updated_at?: string;
}

export interface PlanningTriggerResponse {
  success: boolean;
  processId?: string;
  message?: string;
}

export interface PlanningProcessState {
  running: boolean;
}

export interface SurgeryRuntimeState {
  progress: number;
  elapsedTime?: string;
  estimatedTime?: string;
  assignedOr?: string;
  assignedRoom?: string;
  isOvertime?: boolean;
  completedAt?: string;
  deviationMinutes?: number;
}

export interface LockedResourceEntry {
  id: string;
  name: string;
  type: 'staff' | 'room' | 'equipment' | 'device' | 'supply';
  role?: string;
  status: 'locked' | 'scheduled' | 'in-use' | 'released';
  lockedUntil?: string;
  phase?: string;
  count?: number;
}

export interface SurgeryRequestRecord {
  id: string;
  backendId?: number;
  organizationId: number;
  referenceCode: string;
  status: BackendSurgeryStatus;
  updatedAt: string;
  isPersisted: boolean;
  data: SurgeryRequest;
  planResult?: BackendSurgeryPlanResult | null;
  runtime?: SurgeryRuntimeState;
  lockedResources?: LockedResourceEntry[];
}

/**
 * Resource navigation payload for linking to resource details
 * Used when clicking on assigned resources in surgery views
 */
export interface ResourceNavigationPayload {
  /** Type of resource: 'staff' for human resources, 'pool' for HR pools, 'equipment' for non-human pools */
  resourceType: 'staff' | 'pool' | 'equipment' | 'room' | 'device';
  /** Unique identifier - staffId for staff, poolId for pools */
  resourceId: string;
  /** Display name of the resource */
  resourceName: string;
  /** Non-human unit id when a specific pool unit was allocated */
  unitId?: string;
  /** Role/function of the resource in the surgery */
  role?: string;
  /** Planned start time of the surgery (for calendar blocking) */
  surgeryStartTime?: string;
  /** Planned end time of the surgery (for calendar blocking) */
  surgeryEndTime?: string;
  /** Surgery reference code */
  surgeryReference?: string;
  /** Phase where this resource is assigned */
  phase?: string;
}
