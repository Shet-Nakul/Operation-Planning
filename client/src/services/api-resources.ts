import { apiFetch } from './api-core';

export type RenewableResourceType = 'BED' | 'EQUIPMENT' | 'ROOM' | 'DEVICE' | 'VEHICLE';
export type RenewableResourcePoolStatus = 'OPERATIONAL' | 'MAINTENANCE' | 'DECOMMISSIONED' | string;
export type RenewableResourceUnitStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | string;

export type RenewableResourceDayHours = {
  hours: Array<[string, string]>;
};

export type RenewableResourceWeeklyTemplate = Partial<{
  monday: RenewableResourceDayHours;
  tuesday: RenewableResourceDayHours;
  wednesday: RenewableResourceDayHours;
  thursday: RenewableResourceDayHours;
  friday: RenewableResourceDayHours;
  saturday: RenewableResourceDayHours;
  sunday: RenewableResourceDayHours;
}>;

export type ServerRenewableResourcePoolListItem = {
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
  status: RenewableResourcePoolStatus;
  weekly_template?: RenewableResourceWeeklyTemplate;
  metadata?: any;
};

export type ServerRenewableResourceUnit = {
  unit_id: string;
  status: RenewableResourceUnitStatus;
  variant?: string | null;
  attributes?: any;
  last_released_at?: string | null;
  assigned_to?: string | null;
  assigned_at?: string | null;
  estimated_release?: string | null;
};

export type ServerRenewableResourcePoolDetail = {
  pool_id: string;
  pool_name: string;
  resource_type: RenewableResourceType | string;
  department?: string | null;
  location?: string | null;
  total_capacity: number;
  unit_count?: number;
  in_use: number;
  available: number;
  in_maintenance: number;
  utilization_rate: number;
  status: RenewableResourcePoolStatus;
  weekly_template?: RenewableResourceWeeklyTemplate;
  units: ServerRenewableResourceUnit[];
  health?: any;
  metadata?: any;
};

export type CreateRenewableResourcePoolBody = {
  organization_id: number;
  pool_name: string;
  resource_type: RenewableResourceType | string;
  department?: string;
  location?: string;
  total_capacity: number;
  unit_prefix?: string;
  default_variant?: string;
  default_attributes?: any;
  weekly_template?: RenewableResourceWeeklyTemplate;
  metadata?: any;
};

export type UpdateRenewableResourcePoolCapacityBody = {
  total_capacity: number;
  reason?: string;
  effective_from?: string;
};

export type UpdateRenewableResourcePoolWeeklyTemplateBody = {
  weekly_template: RenewableResourceWeeklyTemplate;
};

export type AddRenewableResourceUnitsBody = {
  units: Array<{
    unit_id: string;
    variant?: string;
    attributes?: any;
    status?: RenewableResourceUnitStatus;
  }>;
};

export type UpdateRenewableResourceUnitBody = {
  variant?: string;
  attributes?: any;
  status?: RenewableResourceUnitStatus;
  reason?: string;
};

export type NonRenewableResourceStatus = 'AVAILABLE' | 'SHORTAGE' | 'OUT_OF_STOCK' | 'MAINTENANCE' | string;

export type ServerNonRenewableResource = {
  id: number;
  organization_id: number;
  resource_id: string;
  name: string;
  spec?: string | null;
  category: string;
  uom: string;
  stockpile_qty: number;
  min_required_qty: number;
  status: NonRenewableResourceStatus;
  created_at: string;
  updated_at: string;
};

export type CreateNonRenewableResourceBody = {
  organization_id: number;
  name: string;
  spec?: string;
  category: string;
  uom: string;
  stockpile_qty: number;
  min_required_qty: number;
  status?: string;
};

export type UpdateNonRenewableResourceBody = Partial<{
  name: string;
  spec: string;
  category: string;
  uom: string;
  stockpile_qty: number;
  min_required_qty: number;
  status: string;
}>;

export async function getRenewableResourcePools(params?: {
  orgId?: number;
  resource_type?: string;
  department?: string;
  status?: string;
}): Promise<ServerRenewableResourcePoolListItem[]> {
  const usp = new URLSearchParams();
  if (typeof params?.orgId === 'number') usp.set('orgId', String(params.orgId));
  if (params?.resource_type) usp.set('resource_type', params.resource_type);
  if (params?.department) usp.set('department', params.department);
  if (params?.status) usp.set('status', params.status);
  const qs = usp.toString() ? `?${usp.toString()}` : '';
  return apiFetch<ServerRenewableResourcePoolListItem[]>(`/api/resources/pools${qs}`, { method: 'GET' });
}

export async function createRenewableResourcePool(body: CreateRenewableResourcePoolBody): Promise<any> {
  return apiFetch<any>('/api/resources/pools', { method: 'POST', body: JSON.stringify(body) });
}

export async function getRenewableResourcePoolById(poolId: string): Promise<ServerRenewableResourcePoolDetail> {
  return apiFetch<ServerRenewableResourcePoolDetail>(`/api/resources/pools/${encodeURIComponent(poolId)}`, { method: 'GET' });
}

export async function updateRenewableResourcePoolCapacity(
  poolId: string,
  body: UpdateRenewableResourcePoolCapacityBody,
): Promise<any> {
  return apiFetch<any>(`/api/resources/pools/${encodeURIComponent(poolId)}/capacity`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function updateRenewableResourcePoolWeeklyTemplate(
  poolId: string,
  body: UpdateRenewableResourcePoolWeeklyTemplateBody,
): Promise<any> {
  return apiFetch<any>(`/api/resources/pools/${encodeURIComponent(poolId)}/weekly_template`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function getRenewableResourcePoolHealth(poolId: string): Promise<any> {
  return apiFetch<any>(`/api/resources/pools/${encodeURIComponent(poolId)}/health`, { method: 'GET' });
}

export async function addRenewableResourceUnitsToPool(poolId: string, body: AddRenewableResourceUnitsBody): Promise<any> {
  return apiFetch<any>(`/api/resources/pools/${encodeURIComponent(poolId)}/units`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateRenewableResourceUnit(unitId: string, body: UpdateRenewableResourceUnitBody): Promise<any> {
  return apiFetch<any>(`/api/resources/units/${encodeURIComponent(unitId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function createNonRenewableResource(body: CreateNonRenewableResourceBody): Promise<ServerNonRenewableResource> {
  return apiFetch<ServerNonRenewableResource>('/api/non-renewable-resources', { method: 'POST', body: JSON.stringify(body) });
}

export async function getNonRenewableResources(params?: {
  query?: string;
  category?: string;
  status?: string;
  limit?: number;
  orgId?: number;
}): Promise<ServerNonRenewableResource[]> {
  const usp = new URLSearchParams();
  if (params?.query) usp.set('query', params.query);
  if (params?.category) usp.set('category', params.category);
  if (params?.status) usp.set('status', params.status);
  if (typeof params?.limit === 'number') usp.set('limit', String(params.limit));
  if (typeof params?.orgId === 'number') usp.set('orgId', String(params.orgId));
  const qs = usp.toString() ? `?${usp.toString()}` : '';
  return apiFetch<ServerNonRenewableResource[]>(`/api/non-renewable-resources${qs}`, { method: 'GET' });
}

export async function getNonRenewableResourceById(resourceId: string): Promise<ServerNonRenewableResource> {
  return apiFetch<ServerNonRenewableResource>(`/api/non-renewable-resources/${encodeURIComponent(resourceId)}`, { method: 'GET' });
}

export async function updateNonRenewableResource(resourceId: string, body: UpdateNonRenewableResourceBody): Promise<ServerNonRenewableResource> {
  return apiFetch<ServerNonRenewableResource>(`/api/non-renewable-resources/${encodeURIComponent(resourceId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteNonRenewableResource(resourceId: string): Promise<{ resource_id: string; deleted: boolean; deleted_at: string }> {
  return apiFetch<{ resource_id: string; deleted: boolean; deleted_at: string }>(`/api/non-renewable-resources/${encodeURIComponent(resourceId)}`, { method: 'DELETE' });
}
