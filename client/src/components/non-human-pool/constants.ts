import { ResourcePool } from './types';

export const MOCK_POOLS: ResourcePool[] = [
  { id: '1', name: 'ICU Beds', count: 112, status: 'OPTIMAL', icon: 'Bed' },
  { id: '2', name: 'Operating Rooms', count: 24, status: 'HIGH DEMAND', icon: 'Stethoscope' },
  { id: '3', name: 'PACU Units', count: 48, status: 'STABLE', icon: 'Armchair' },
  { id: '4', name: 'Ventilators', count: 86, status: 'READY', icon: 'Wind' },
  { id: '5', name: 'Dialysis Units', count: 15, status: 'STABLE', icon: 'Activity' },
  { id: '6', name: 'MRI Suites', count: 4, status: 'LIMITED', icon: 'Microscope' },
  { id: '7', name: 'Mobile C-Arms', count: 12, status: 'OPTIMAL', icon: 'Scan' },
];

export const MOCK_UNITS = Array.from({ length: 40 }, (_, i) => ({
  id: `ICU-${(i + 1).toString().padStart(2, '0')}`,
  status: Math.random() > 0.4 ? 'occupied' : 'available',
}));
