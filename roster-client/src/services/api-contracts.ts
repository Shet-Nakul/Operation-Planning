import { apiFetch, type PaginatedResponse } from './api-core';

export type ServerContract = {
  id: number;
  organization_id: number;
  contract_id: string;
  name: string;
  type: 'STATIC' | 'DYNAMIC';
  status: string;
  staff_tags: string[];
  configuration: any;
  global_settings?: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
};

export type CreateContractBody = {
  organization_id: number;
  contract_id?: string;
  name: string;
  type: 'STATIC' | 'DYNAMIC';
  status?: string;
  staff_tags?: string[];
  configuration?: any;
  global_settings?: any;
  metadata?: any;
};

export type UpdateContractBody = Partial<CreateContractBody>;

export async function createContract(body: CreateContractBody): Promise<ServerContract> {
  return apiFetch<ServerContract>('/api/contracts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getContracts(params?: { orgId?: number }): Promise<ServerContract[]> {
  const qs = params?.orgId ? `?orgId=${encodeURIComponent(String(params.orgId))}` : '';
  return apiFetch<ServerContract[]>(`/api/contracts${qs}`, { method: 'GET' });
}

export async function getContractById(id: string | number): Promise<ServerContract> {
  return apiFetch<ServerContract>(`/api/contracts/${encodeURIComponent(String(id))}`, { method: 'GET' });
}

export async function updateContractById(id: string | number, body: UpdateContractBody): Promise<ServerContract> {
  return apiFetch<ServerContract>(`/api/contracts/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteContractById(id: string | number): Promise<void> {
  await apiFetch<void>(`/api/contracts/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
}

export type ServerActivityLog = {
  id: number;
  user_id?: number | null;
  organization_id?: number | null;
  action: string;
  entity?: string | null;
  entity_id?: string | null;
  description?: string | null;
  metadata?: any;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name?: string | null;
    email: string;
  } | null;
  organization?: {
    id: number;
    name: string;
  } | null;
};

export type ActivityLogsResponse = {
  data: ServerActivityLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export async function getActivityLogs(params?: {
  page?: number;
  limit?: number;
  orgId?: number;
  userId?: number;
}): Promise<ActivityLogsResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (typeof params?.orgId === 'number') qs.set('orgId', String(params.orgId));
  if (typeof params?.userId === 'number') qs.set('userId', String(params.userId));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch<ActivityLogsResponse>(`/api/activity-logs${suffix}`, { method: 'GET' });
}

export type ServerForbiddenPatternRecord = {
  id: number;
  organization_id: number;
  scope: string;
  applies_to: string;
  forbidden_patterns: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
};

export async function getForbiddenPatternRecords(params?: { orgId?: number }): Promise<ServerForbiddenPatternRecord[]> {
  const qs = params?.orgId ? `?orgId=${encodeURIComponent(String(params.orgId))}` : '';
  return apiFetch<ServerForbiddenPatternRecord[]>(`/api/catalogs/pattern${qs}`, { method: 'GET' });
}

export async function createForbiddenPatternRecord(body: {
  organization_id: number;
  scope?: string;
  applies_to?: string;
  forbidden_patterns: any[];
  metadata?: any;
}): Promise<ServerForbiddenPatternRecord> {
  return apiFetch<ServerForbiddenPatternRecord>('/api/catalogs/pattern', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateForbiddenPatternRecord(
  id: string | number,
  body: Partial<{
    organization_id: number;
    scope: string;
    applies_to: string;
    forbidden_patterns: any[];
    metadata: any;
  }>,
): Promise<ServerForbiddenPatternRecord> {
  return apiFetch<ServerForbiddenPatternRecord>(`/api/catalogs/pattern/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteForbiddenPatternRecord(id: string | number): Promise<void> {
  await apiFetch<void>(`/api/catalogs/pattern/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
}
