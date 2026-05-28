import type { SurgeryRequestRecord } from '../types';
import type { Contract } from '../components/contracts/types';
import type { StaffMember } from '../components/staff/types';
import type { ResourcePool } from '../components/hr-pool/types';
import type { GlobalSettings } from './settings';

export type FeasibilityStatus = 'error' | 'success' | 'warning';

export type OngoingCase = {
  id: string;
  patient: string;
  surgeon: string;
  specialty: string;
  or: string;
  elapsed: string;
  est: string;
  progress: number;
  isOvertime?: boolean;
};

export type SchedulingQueueRow = {
  id: string;
  name: string;
  caseId: string;
  surgeon: string;
  priority: 'EMERGENCY' | 'MANDATORY' | 'ELECTIVE';
  window: string;
  deadline: string;
  feasibility: string;
  status: FeasibilityStatus;
};

export type HistoryCardRow = {
  id: string;
  name: string;
  details: string;
  time: string;
  deviation: string;
  status: 'success' | 'error';
};

export type UnscheduledBacklogRow = {
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
};

export type ScheduleTagColor = 'emerald' | 'primary' | 'slate';

export type TodayScheduleSlot = {
  id: string;
  time: string;
  duration: string;
  title: string;
  tag: string;
  tagColor: ScheduleTagColor;
  or: string;
  surgeon: string;
  isFuture?: boolean;
};

export type StaffOnSiteRow = {
  id: string;
  label: string;
  current: number;
  total: number;
  color: 'emerald' | 'orange';
};

export type ScheduleHeaderMeta = {
  monthLabel: string;
  dayOfMonth: string;
  weekday: string;
  subtitle: string;
};

/** Serializable application state (JSON). */
export type AppDataStore = {
  version: 1;
  surgeryRequests: SurgeryRequestRecord[];
  ongoingSurgeries: OngoingCase[];
  schedulingQueue: SchedulingQueueRow[];
  surgeryHistory: HistoryCardRow[];
  unscheduledBacklog: UnscheduledBacklogRow[];
  todaySchedule: TodayScheduleSlot[];
  scheduleHeader: ScheduleHeaderMeta;
  staffOnSite: StaffOnSiteRow[];
  contracts: Contract[];
  staff: StaffMember[];
  resourcePools: ResourcePool[];
  settings: GlobalSettings;
};
