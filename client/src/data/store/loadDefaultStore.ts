import type { AppDataStore } from '../../types/store';
import type { Contract } from '../../components/contracts/types';
import { DEFAULT_GLOBAL_SETTINGS } from '../../types/settings';
import contractsSeed from './contracts.json';

export function getDefaultAppDataStore(): AppDataStore {
  return {
    version: 1,
    surgeryRequests: [],
    ongoingSurgeries: [],
    schedulingQueue: [],
    surgeryHistory: [],
    unscheduledBacklog: [],
    todaySchedule: [],
    scheduleHeader: {
      monthLabel: '',
      dayOfMonth: '',
      weekday: '',
      subtitle: '',
    },
    staffOnSite: [],
    contracts: contractsSeed as Contract[],
    staff: [],
    resourcePools: [],
    settings: DEFAULT_GLOBAL_SETTINGS,
  };
}
