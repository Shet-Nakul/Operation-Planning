export type RenewableResourceType = 'BED' | 'EQUIPMENT' | 'ROOM' | 'DEVICE' | 'VEHICLE';

export type ResourcePoolStatus = 'OPERATIONAL' | 'MAINTENANCE' | 'DECOMMISSIONED' | string;

export type UnitStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | string;

export interface ResourcePoolSummary {
  pool_id: string;
  pool_name: string;
  resource_type: RenewableResourceType | string;
  department?: string | null;
  location?: string | null;
  total_capacity: number;
  unit_count?: number;
  in_use: number;
  available: number;
  in_maintenance?: number;
  utilization_rate: number;
  status: ResourcePoolStatus;
  metadata?: any;
}

export interface ResourcePoolDetail extends ResourcePoolSummary {
  units: Array<{
    unit_id: string;
    status: UnitStatus;
    variant?: string | null;
    attributes?: any;
    last_released_at?: string | null;
    assigned_to?: string | null;
    assigned_at?: string | null;
    estimated_release?: string | null;
  }>;
  health?: any;
}
