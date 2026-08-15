import type { AppDataStore, HistoryCardRow, SchedulingQueueRow, StaffOnSiteRow, TodayScheduleSlot, UnscheduledBacklogRow } from '../../types/store';
import type { SurgeryRequestRecord } from '../../types/surgery';
import type { Contract } from '../../components/contracts/types';
import { DEFAULT_GLOBAL_SETTINGS } from '../../types/settings';
import surgeryRequestsSeed from './surgeryRequests.json';
import operationsSeed from './operations.json';
import contractsSeed from './contracts.json';

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
    staff: [],
    resourcePools: [],
    settings: DEFAULT_GLOBAL_SETTINGS,
  };
}
