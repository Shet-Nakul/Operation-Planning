import { ResourcePoolSummary, UnitStatus } from './types';

export const MOCK_POOLS: ResourcePoolSummary[] = [
  {
    pool_id: 'BED-BED-101',
    pool_name: 'ICU Beds',
    resource_type: 'BED',
    total_capacity: 112,
    in_use: 40,
    available: 72,
    in_maintenance: 0,
    utilization_rate: 0.36,
    status: 'OPERATIONAL',
  },
];

export const MOCK_UNITS = Array.from({ length: 40 }, (_, i) => ({
  unit_id: `ICU-${(i + 1).toString().padStart(2, '0')}`,
  status: (Math.random() > 0.4 ? 'IN_USE' : 'AVAILABLE') as UnitStatus,
}));
