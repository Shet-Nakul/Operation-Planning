export interface Member {
  id: string;
  name: string;
  role: string;
  avatar: string;
  type: 'STATIC' | 'DYNAMIC';
  departmentId?: number;
  department?: string;
}

export interface Shift {
  id: string;
  name: string;
  start: string;
  end: string;
  typical: string;
  icon: string;
  color: string;
}

export interface ResourcePool {
  id: string;
  name: string;
  department: string;
  location: string;
  totalMembers: number;
  weeklyHours: number;
  contractSplit: string;
  primarySkill: string;
  status: 'active' | 'draft' | 'warning';
  icon: string;
  color: string;
}

export type ViewState = 'directory' | 'new-pool' | 'pool-demand' | 'pool-detail';

export type HrPoolCreateDraft = {
  poolName: string;
  primarySkill: string;
  departmentId: string;
  location: string;
  costCenter: string;
};

export const EMPTY_HR_POOL_CREATE_DRAFT: HrPoolCreateDraft = {
  poolName: '',
  primarySkill: 'Select Role',
  departmentId: '',
  location: '',
  costCenter: '',
};
