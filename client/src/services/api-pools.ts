import { apiFetch } from './api-core';

export type ServerPoolDemandMatrixItem = {
  shift: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
};

function toFiniteNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeServerPoolDemandMatrixItem(row: any): ServerPoolDemandMatrixItem {
  const get = (longKey: string, shortKey: string) => row?.[longKey] ?? row?.[shortKey];
  return {
    shift: String(row?.shift ?? ''),
    monday: toFiniteNumber(get('monday', 'mon')),
    tuesday: toFiniteNumber(get('tuesday', 'tue')),
    wednesday: toFiniteNumber(get('wednesday', 'wed')),
    thursday: toFiniteNumber(get('thursday', 'thu')),
    friday: toFiniteNumber(get('friday', 'fri')),
    saturday: toFiniteNumber(get('saturday', 'sat')),
    sunday: toFiniteNumber(get('sunday', 'sun')),
  };
}

function normalizeServerPoolDemandMatrix(value: unknown): ServerPoolDemandMatrixItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((r) => normalizeServerPoolDemandMatrixItem(r));
}

export type ServerPoolListItem = {
  pool_id: string;
  pool_name: string;
  department_id?: number | null;
  department?: string | null;
  location?: string | null;
  primary_role?: string | null;
  total_members: number;
  weekly_hours: number;
  static_pct: number;
  dynamic_pct: number;
  metadata?: any;
};

export type CreatePoolBody = {
  organization_id: number;
  pool_name: string;
  department_id?: number;
  location?: string;
  primary_role?: string;
  static_pct?: number;
  dynamic_pct?: number;
  metadata?: any;
  employees?: string[];
  demand_matrix?: ServerPoolDemandMatrixItem[];
};

export type ServerPoolRecord = {
  id: number;
  organization_id: number;
  pool_id: string;
  pool_name: string;
  department_id?: number | null;
  department?: string | null;
  location?: string | null;
  primary_role?: string | null;
  static_pct: number;
  dynamic_pct: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
};

export type ServerPoolEmployee = {
  staff_id: string;
  name: string;
  role?: string | null;
  contract_type?: 'STATIC' | 'DYNAMIC';
};

export type ServerPoolCoverageDayCell = {
  actual: number;
  required: number;
  status: string;
};

export type ServerPoolCoverageRow = {
  shift: string;
  days: ServerPoolCoverageDayCell[];
};

export type ServerPoolCoverage = {
  week_start: string;
  rows: ServerPoolCoverageRow[];
};

export type ServerPoolDetailResponse = ServerPoolRecord & {
  total_members: number;
  weekly_hours: number;
  employees: ServerPoolEmployee[];
  coverage: ServerPoolCoverage;
};

export type ServerPoolDemandResponse = {
  pool_id: string;
  effective_from: string;
  effective_to?: string | null;
  weekly_hours: number;
  demand_matrix: ServerPoolDemandMatrixItem[];
};

export type UpdatePoolDemandBody = {
  effective_from: string;
  effective_to?: string;
  demand_matrix: ServerPoolDemandMatrixItem[];
};

export type ServerPoolShortageAlert = {
  pool_id: string;
  shift: string;
  day: string;
  shortfall: number;
  severity: string;
};

export async function getPools(params?: { orgId?: number }): Promise<ServerPoolListItem[]> {
  const qs = typeof params?.orgId === 'number' ? `?orgId=${encodeURIComponent(String(params.orgId))}` : '';
  return apiFetch<ServerPoolListItem[]>(`/api/pools${qs}`, {
    method: 'GET',
  });
}

export async function createPool(body: CreatePoolBody): Promise<ServerPoolRecord> {
  return apiFetch<ServerPoolRecord>('/api/pools', {
    method: 'POST',
    body: JSON.stringify({
      ...body,
      demand_matrix: body.demand_matrix
        ? normalizeServerPoolDemandMatrix(body.demand_matrix)
        : undefined,
    }),
  });
}

export async function getPoolById(poolId: string): Promise<ServerPoolDetailResponse> {
  return apiFetch<ServerPoolDetailResponse>(`/api/pools/${encodeURIComponent(poolId)}`, { method: 'GET' });
}

export async function getPoolDemand(poolId: string): Promise<ServerPoolDemandResponse> {
  const data = await apiFetch<ServerPoolDemandResponse>(`/api/pools/${encodeURIComponent(poolId)}/demand`, { method: 'GET' });
  return {
    ...data,
    demand_matrix: normalizeServerPoolDemandMatrix(data.demand_matrix),
  } as ServerPoolDemandResponse;
}

export async function updatePoolDemand(poolId: string, body: UpdatePoolDemandBody): Promise<ServerPoolDemandResponse> {
  const data = await apiFetch<ServerPoolDemandResponse>(`/api/pools/${encodeURIComponent(poolId)}/demand`, {
    method: 'PUT',
    body: JSON.stringify({
      ...body,
      demand_matrix: normalizeServerPoolDemandMatrix(body.demand_matrix),
    }),
  });
  return {
    ...data,
    demand_matrix: normalizeServerPoolDemandMatrix(data.demand_matrix),
  } as ServerPoolDemandResponse;
}

export async function getPoolShortages(poolId: string): Promise<ServerPoolShortageAlert[]> {
  return apiFetch<ServerPoolShortageAlert[]>(`/api/pools/${encodeURIComponent(poolId)}/shortages`, {
    method: 'GET',
  });
}
