import type { BlockBooking } from '../../services/api-resources';

export type RenewableResourceType = 'BED' | 'EQUIPMENT' | 'ROOM' | 'DEVICE' | 'VEHICLE';

export type ResourcePoolStatus = 'OPERATIONAL' | 'MAINTENANCE' | 'DECOMMISSIONED' | string;

export type UnitStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RESERVED' | 'BLOCKED' | string;

export type ResourcePoolDayHours = {
  hours: Array<[string, string]>;
};

export type ResourcePoolWeeklyTemplate = Partial<{
  monday: ResourcePoolDayHours;
  tuesday: ResourcePoolDayHours;
  wednesday: ResourcePoolDayHours;
  thursday: ResourcePoolDayHours;
  friday: ResourcePoolDayHours;
  saturday: ResourcePoolDayHours;
  sunday: ResourcePoolDayHours;
}>;

export interface ResourcePoolSummary {
  pool_id: string;
  pool_name: string;
  resource_type: RenewableResourceType | string;
  department?: string | null;
  location?: string | null;
  total_capacity: number;
  unit_count?: number;
  resources?: string[];
  in_use: number;
  available: number;
  in_maintenance?: number;
  utilization_rate: number;
  status: ResourcePoolStatus;
  weekly_template?: ResourcePoolWeeklyTemplate;
  metadata?: any;
}

export interface ResourcePoolDetail extends ResourcePoolSummary {
  weekly_template?: ResourcePoolWeeklyTemplate;
  units: Array<{
    unit_id: string;
    status: UnitStatus;
    current_status: UnitStatus;
    status_till: string | null;
    variant?: string | null;
    attributes?: any;
    block_bookings: BlockBooking[];
    last_released_at?: string | null;
    assigned_to?: string | null;
    assigned_at?: string | null;
    estimated_release?: string | null;
  }>;
  health?: any;
}
