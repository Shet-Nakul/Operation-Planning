export type StaffStatus = 'Active' | 'On Leave' | 'Archived';

export interface ScheduleBlock {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  role: string;
}

export interface EffortRole {
  id: string;
  type: 'CLINICAL' | 'RESEARCH' | 'TEACHING';
  description: string;
  percentage: number;
}

export interface StaffMember {
  id: string;
  name: string;
  title: string;
  specialization: string[];
  contractId: string;
  supervisor: string;
  status: StaffStatus;
  email: string;
  avatarUrl?: string;
  employeeId: string;
  skills: string[];
  weeklySchedule: ScheduleBlock[];
  effortRoles: EffortRole[];
  pools: string[];
}
