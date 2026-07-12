/**
 * Backend API Types - TypeScript Interfaces
 * 
 * These types represent the API response models from the backend.
 * Used by frontend to validate and handle backend responses.
 * 
 * Last Updated: April 21, 2026
 */

// ============================================================================
// AUTHENTICATION
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'surgeon' | 'nurse' | 'anesthetist' | 'planner' | 'supply_manager' | 'operations';
  department: string;
  status: 'active' | 'inactive' | 'archived';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

// ============================================================================
// CONTRACTS
// ============================================================================

export interface Contract {
  id: string;
  contractId: string;
  name: string;
  type: 'STATIC' | 'DYNAMIC';
  status: 'Active' | 'Draft' | 'Archived';
  staffTags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateContractRequest {
  contractId: string;
  name: string;
  type: 'STATIC' | 'DYNAMIC';
  status?: 'Draft' | 'Active';
  staffTags?: string[];
}

// ============================================================================
// STAFF MANAGEMENT
// ============================================================================

export interface ScheduleBlock {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  role: string;      // e.g., 'Main Surgery', 'OPD Clinic'
}

export interface EffortRole {
  id: string;
  type: 'CLINICAL' | 'RESEARCH' | 'TEACHING';
  description: string;
  percentage: number; // 0-100
}

export interface StaffMember {
  id: string;
  name: string;
  title: string;
  email: string;
  employeeId: string;
  specialization: string[];
  skills: string[];
  contractId: string;
  supervisorId: string;
  status: 'Active' | 'On Leave' | 'Archived';
  avatarUrl?: string;
  maxHoursPerWeek?: number;
  weeklySchedule: ScheduleBlock[];
  effortRoles: EffortRole[];
  pools: string[]; // Pool IDs
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffRequest {
  name: string;
  title: string;
  email: string;
  employeeId: string;
  specialization: string[];
  skills: string[];
  contractId: string;
  supervisorId?: string;
  status?: 'Active' | 'On Leave';
  maxHoursPerWeek?: number;
}

export interface UpdateStaffRequest {
  name?: string;
  title?: string;
  email?: string;
  specialization?: string[];
  skills?: string[];
  supervisorId?: string;
  status?: 'Active' | 'On Leave' | 'Archived';
  maxHoursPerWeek?: number;
}

export interface StaffAvailability {
  staffId: string;
  staffName: string;
  available: boolean;
  reason?: string; // If not available, why
  conflicts: string[]; // Existing assignments that conflict
}

// ============================================================================
// RESOURCE POOLS (HR)
// ============================================================================

export interface ResourcePoolMember {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  avatar?: string;
  type: 'STATIC' | 'DYNAMIC';
}

export interface ResourcePool {
  id: string;
  name: string;
  department: string;
  location: string;
  totalMembers: number;
  weeklyHours: number;
  contractSplit: string; // e.g., '60/40'
  primarySkill: string;
  status: 'active' | 'draft' | 'warning';
  icon: string;
  color: string;
  members?: ResourcePoolMember[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourcePoolRequest {
  name: string;
  department: string;
  location: string;
  totalMembers: number;
  weeklyHours: number;
  contractSplit: string;
  primarySkill: string;
  status?: 'draft' | 'active';
  icon: string;
  color: string;
}

// ============================================================================
// SURGERY REQUESTS
// ============================================================================

export type SurgeryRequestStatus = 'draft' | 'in_review' | 'scheduled' | 'in_progress' | 'completed';
export type SurgeryPriority = 'emergency' | 'mandatory' | 'elective';
export type SurgicalPhaseType = 'preOp' | 'operative' | 'postOp' | 'sterilization' | 'recovery';

export interface PhaseResourceAssignment {
  type: 'individual' | 'pool';
  id: string;
  name: string;
}

export interface PhaseResource {
  name: string;
  count: number;
  icon: string;
  startTime?: number;
  endTime?: number;
  assignment?: PhaseResourceAssignment;
}

export interface PhaseConfig {
  duration: string;
  resources: PhaseResource[];
  status?: string;
  icuProbability?: number;
}

export interface SurgeryPhases {
  preOp: PhaseConfig;
  operative: PhaseConfig;
  postOp: PhaseConfig;
  sterilization: PhaseConfig;
  recovery: PhaseConfig;
}

export interface ResourceItem {
  id: string;
  name: string;
  type: string; // e.g., '20ml Vial • Anesthetic'
  required: number;
  stockpile: number;
  status: 'available' | 'shortage';
  icon: string;
}

export interface SurgeryRequestData {
  patientName: string;
  operationType: string;
  primarySurgeon: string;
  infectionStatus: string; // 'Standard Precautions', 'Contact', 'Airborne', etc.
  priority: SurgeryPriority;
  earliestDate: string; // YYYY-MM-DD
  endDate: string;      // YYYY-MM-DD
  phases: SurgeryPhases;
  resources: ResourceItem[];
}

export interface SurgeryRequest {
  id: string;
  referenceCode: string;
  status: SurgeryRequestStatus;
  data: SurgeryRequestData;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CreateSurgeryRequestRequest {
  data: SurgeryRequestData;
}

export interface UpdateSurgeryRequestRequest {
  data?: Partial<SurgeryRequestData>;
  status?: SurgeryRequestStatus;
}

// ============================================================================
// SURGICAL PHASES & RESOURCES
// ============================================================================

export interface SurgicalPhase {
  id: string;
  surgeryRequestId: string;
  phaseType: SurgicalPhaseType;
  durationMinutes: number;
  icuProbability: number; // 0.00-1.00
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhaseResourceRequirement {
  id: string;
  surgicalPhaseId: string;
  resourceType: 'staff' | 'equipment' | 'supply';
  resourceId: string;
  resourceName: string;
  requiredCount: number;
  assignedCount: number;
  fulfilledCount: number;
  startTime?: string; // HH:mm format
  endTime?: string;   // HH:mm format
  status: 'pending' | 'allocated' | 'confirmed' | 'fulfilled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AllocateResourceRequest {
  resourceType: 'staff' | 'equipment' | 'supply';
  resourceId: string;
  count: number;
  notes?: string;
}

// ============================================================================
// STAFF ASSIGNMENTS
// ============================================================================

export interface StaffAssignment {
  id: string;
  surgeryRequestId: string;
  surgicalPhaseId: string;
  staffId: string;
  staffName: string;
  roleType: string; // e.g., 'Primary Surgeon', 'Anesthesiologist'
  dutyDescription?: string;
  scheduledStartTime?: string; // ISO 8601
  scheduledEndTime?: string;   // ISO 8601
  confirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffAssignmentRequest {
  surgeryRequestId: string;
  surgicalPhaseId: string;
  staffId: string;
  roleType: string;
  dutyDescription?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
}

// ============================================================================
// OPERATING ROOMS
// ============================================================================

export interface OperatingRoom {
  id: string;
  name: string; // e.g., 'OR-01'
  floor: number;
  capacity: number;
  equipment: string[]; // Equipment unit IDs
  status: 'available' | 'occupied' | 'maintenance' | 'closed';
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface ORSchedule {
  id: string;
  surgeryRequestId: string;
  operatingRoomId: string;
  operatingRoomName: string;
  scheduledStartTime: string; // ISO 8601
  scheduledEndTime: string;
  estimatedDurationMinutes: number;
  actualStartTime?: string;
  actualEndTime?: string;
  equipmentUsed: string[]; // Equipment IDs
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateORScheduleRequest {
  surgeryRequestId: string;
  operatingRoomId: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  estimatedDurationMinutes: number;
  equipmentNeeded?: string[];
}

export interface ORAvailabilitySlot {
  operatingRoomId: string;
  operatingRoomName: string;
  startTime: string; // ISO 8601
  endTime: string;
  durationMinutes: number;
  available: boolean;
}

// ============================================================================
// ICU MANAGEMENT
// ============================================================================

export interface ICUBed {
  id: string;
  location: string;
  bedNumber: string;
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  currentPatientId?: string;
  equipment: string[]; // Equipment IDs
  createdAt: string;
  updatedAt: string;
}

export interface ICUReservation {
  id: string;
  surgeryRequestId: string;
  icuBedId: string;
  icuLocation: string;
  scheduledStartTime: string; // ISO 8601
  scheduledEndTime: string;
  icuProbability: number; // 0.00-1.00
  confirmed: boolean;
  status: 'reserved' | 'occupied' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateICUReservationRequest {
  surgeryRequestId: string;
  icuBedId: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  icuProbability: number;
}

// ============================================================================
// SUPPLY MANAGEMENT
// ============================================================================

export interface SupplyItem {
  id: string;
  name: string;
  category: 'medication' | 'consumable' | 'blood_product' | 'equipment' | 'other';
  description?: string;
  unit: string; // e.g., 'ml', 'unit', 'box'
  status: 'active' | 'discontinued';
  createdAt: string;
  updatedAt: string;
}

export interface SupplyInventory {
  id: string;
  supplyItemId: string;
  supplyItemName: string;
  location: string;
  quantityInStock: number;
  quantityAllocated: number;
  quantityReserved: number;
  reorderLevel?: number;
  maxStock?: number;
  lastUpdated: string;
  notes?: string;
}

export interface SupplyAllocation {
  id: string;
  surgeryRequestId: string;
  supplyItemId: string;
  supplyItemName: string;
  quantityRequired: number;
  quantityAllocated: number;
  quantityUsed: number;
  status: 'pending' | 'allocated' | 'used' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplyAllocationRequest {
  surgeryRequestId: string;
  supplyItemId: string;
  quantityRequired: number;
}

// ============================================================================
// OPERATIONS DASHBOARD
// ============================================================================

export interface OngoingCase {
  id: string;
  patient: string;
  surgeon: string;
  specialty: string;
  or: string;
  elapsed: string;
  est: string;
  progress: number; // 0-100
  isOvertime: boolean;
}

export interface SchedulingQueueRow {
  id: string;
  name: string;
  caseId: string;
  surgeon: string;
  priority: 'EMERGENCY' | 'MANDATORY' | 'ELECTIVE';
  window: string;
  deadline: string;
  feasibility: string;
  status: 'error' | 'success' | 'warning';
}

export interface HistoryCardRow {
  id: string;
  name: string;
  details: string;
  time: string;
  deviation: string;
  status: 'success' | 'error';
}

export interface UnscheduledBacklogRow {
  id: string;
  name: string;
  caseId: string;
  initials: string;
  procedure: string;
  surgeon: string;
  priority: 'EMERGENCY' | 'MANDATORY' | 'ELECTIVE';
  window: string;
  status: string;
  color: 'emerald' | 'rose';
}

export interface StaffOnSiteRow {
  id: string;
  label: string;
  current: number;
  total: number;
  color: 'emerald' | 'orange';
}

export interface OperationsSummary {
  date: string; // YYYY-MM-DD
  ongoingSurgeries: OngoingCase[];
  schedulingQueue: SchedulingQueueRow[];
  surgeryHistory: HistoryCardRow[];
  unscheduledBacklog: UnscheduledBacklogRow[];
  staffOnSite: StaffOnSiteRow[];
  resourceUtilization: {
    operatingRooms: { used: number; total: number };
    icuBeds: { used: number; total: number };
    staffAvailable: { available: number; total: number };
  };
}

// ============================================================================
// SURGERY HISTORY / AUDIT
// ============================================================================

export interface SurgeryHistoryEntry {
  id: string;
  surgeryRequestId: string;
  actionType: 'created' | 'updated' | 'submitted' | 'approved' | 'scheduled' | 'started' | 'completed';
  timestamp: string; // ISO 8601
  performedBy?: string; // User ID
  details?: any; // JSONB flexible storage
  actualStartTime?: string;
  actualEndTime?: string;
  actualDurationMinutes?: number;
  deviationMinutes?: number;
  status: 'success' | 'error' | 'with_issues';
  notes?: string;
}

// ============================================================================
// PAGINATION & RESPONSES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// ============================================================================
// FILTERING & QUERY PARAMS
// ============================================================================

export interface SurgeryRequestFilters {
  status?: SurgeryRequestStatus[];
  priority?: SurgeryPriority[];
  patientName?: string;
  surgeon?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface StaffFilters {
  status?: ('Active' | 'On Leave' | 'Archived')[];
  specialization?: string[];
  skills?: string[];
  department?: string;
  page?: number;
  pageSize?: number;
}

export interface SupplyInventoryFilters {
  category?: string[];
  location?: string;
  lowStock?: boolean; // Items below reorder level
  page?: number;
  pageSize?: number;
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export interface BulkAssignStaffRequest {
  surgeryRequestId: string;
  assignments: CreateStaffAssignmentRequest[];
}

export interface BulkAssignStaffResponse {
  successCount: number;
  failureCount: number;
  failures?: Array<{
    assignment: CreateStaffAssignmentRequest;
    error: string;
  }>;
}

// ============================================================================
// VALIDATION & FEASIBILITY
// ============================================================================

export interface FeasibilityCheck {
  surgeryId: string;
  phaseType: SurgicalPhaseType;
  staffFeasible: boolean;
  equipmentFeasible: boolean;
  supplyFeasible: boolean;
  orAvailable: boolean;
  icuAvailable: boolean;
  overallFeasible: boolean;
  issues: string[];
  warnings: string[];
  recommendations?: string[];
}

export interface CheckFeasibilityRequest {
  surgeryRequestId: string;
  includeAlternatives?: boolean;
}

export interface AllocationSuggestion {
  surgeryRequestId: string;
  phaseType: SurgicalPhaseType;
  suggestedStaff: {
    staffId: string;
    name: string;
    score: number; // 0-100 match score
    reason: string;
  }[];
  suggestedOR?: {
    orId: string;
    name: string;
    availability: string;
  };
  suggestedICUBeds?: {
    bedId: string;
    location: string;
    availability: string;
  }[];
}
