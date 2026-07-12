export type Priority = 'emergency' | 'mandatory' | 'elective';

export interface SurgeryRequest {
  patientName: string;
  operationType: string;
  primarySurgeon: string;
  infectionStatus: string;
  priority: Priority;
  earliestDate: string;
  endDate: string;
  
  // Phase Resources
  phases: {
    preOp: PhaseConfig;
    operative: PhaseConfig;
    postOp: PhaseConfig;
    sterilization: PhaseConfig;
    recovery: PhaseConfig;
  };
  
  // Resources
  resources: ResourceItem[];
}

export interface PhaseResourceAssignment {
  type: 'individual' | 'pool';
  id: string;
  name: string;
}

export interface PhaseConfig {
  duration: string;
  resources: { name: string; count: number; icon: string; startTime?: number; endTime?: number; assignments?: PhaseResourceAssignment[] }[];
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

export type SurgeryRequestStatus = 'draft' | 'in_review' | 'scheduled';

export interface SurgeryRequestRecord {
  id: string;
  referenceCode: string;
  status: SurgeryRequestStatus;
  updatedAt: string;
  data: SurgeryRequest;
}
