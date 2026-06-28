export type ResourceStatus = 'OPTIMAL' | 'HIGH DEMAND' | 'STABLE' | 'READY' | 'LIMITED';

export interface ResourcePool {
  id: string;
  name: string;
  count: number;
  status: ResourceStatus;
  icon: string;
}

export interface Unit {
  id: string;
  status: 'available' | 'occupied';
}
