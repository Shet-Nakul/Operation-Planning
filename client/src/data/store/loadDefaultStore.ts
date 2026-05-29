import type { AppDataStore, HistoryCardRow, SchedulingQueueRow, StaffOnSiteRow, TodayScheduleSlot, UnscheduledBacklogRow } from '../../types/store';
import type { SurgeryRequestRecord } from '../../types';
import type { Contract } from '../../components/contracts/types';
import type { StaffMember } from '../../components/staff/types';
import type { ResourcePool } from '../../components/hr-pool/types';
import { DEFAULT_GLOBAL_SETTINGS } from '../../types/settings';
import surgeryRequestsSeed from './surgeryRequests.json';
import operationsSeed from './operations.json';
import contractsSeed from './contracts.json';
import staffSeed from './staff.json';
import resourcePoolsSeed from './resourcePools.json';

export function getDefaultAppDataStore(): AppDataStore {
  return {
    version: 1,
    surgeryRequests: surgeryRequestsSeed as SurgeryRequestRecord[],
    ongoingSurgeries: operationsSeed.ongoingSurgeries,
    schedulingQueue: operationsSeed.schedulingQueue as SchedulingQueueRow[],
    surgeryHistory: operationsSeed.surgeryHistory as HistoryCardRow[],
    unscheduledBacklog: operationsSeed.unscheduledBacklog as UnscheduledBacklogRow[],
    todaySchedule: operationsSeed.todaySchedule as TodayScheduleSlot[],
    scheduleHeader: operationsSeed.scheduleHeader,
    staffOnSite: operationsSeed.staffOnSite as StaffOnSiteRow[],
    contracts: contractsSeed as Contract[],
    staff: staffSeed as StaffMember[],
    resourcePools: resourcePoolsSeed as ResourcePool[],
    settings: DEFAULT_GLOBAL_SETTINGS,
  };
}
