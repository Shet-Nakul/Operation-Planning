export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? '';

export const HARD_CODED_ACCESS_TOKEN =
  (import.meta as any).env?.VITE_ACCESS_TOKEN ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzc3ODExODIxLCJleHAiOjE3Nzc4MTI3MjF9.E426gYOAJcFqqKUG2L104HOAaXCe7Nj5anrrOnbLmmA';

export type ApiErrorShape = {
  error?: string;
  message?: string;
};

async function readJsonSafely(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return null;
  return await res.json();
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const hasAuth = path.startsWith('/api/');
  if (hasAuth && HARD_CODED_ACCESS_TOKEN && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${HARD_CODED_ACCESS_TOKEN}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const body = await readJsonSafely(res);
  if (!res.ok) {
    const err = (body ?? {}) as ApiErrorShape;
    const msg = err.error || err.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return body as T;
}

export type ServerContract = {
  id: number;
  organization_id: number;
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
  name: string;
  type: 'STATIC' | 'DYNAMIC';
  status?: string;
  staff_tags?: string[];
  configuration?: any;
  global_settings?: any;
  metadata?: any;
};

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

export type ServerStaffTag = {
  id: number;
  organization_id: number;
  name: string;
  color?: string | null;
};

export type ServerSpecialization = {
  id: number;
  organization_id: number;
  name: string;
  description?: string | null;
};

export type ServerSkill = {
  id: number;
  organization_id: number;
  name: string;
  description?: string | null;
};

export type ServerShift = {
  id: number;
  organization_id: number;
  name: string;
  start_time: string;
  end_time: string;
  description?: string | null;
};

export async function getCatalogStaffTags(params?: { orgId?: number }): Promise<ServerStaffTag[]> {
  const qs = params?.orgId ? `?orgId=${encodeURIComponent(String(params.orgId))}` : '';
  return apiFetch<ServerStaffTag[]>(`/api/catalogs/roles${qs}`, { method: 'GET' });
}

export async function createCatalogStaffTag(body: {
  organization_id: number;
  name: string;
  color?: string;
}): Promise<ServerStaffTag> {
  return apiFetch<ServerStaffTag>('/api/catalogs/roles', { method: 'POST', body: JSON.stringify(body) });
}

export async function getCatalogSpecializations(params?: { orgId?: number }): Promise<ServerSpecialization[]> {
  const qs = params?.orgId ? `?orgId=${encodeURIComponent(String(params.orgId))}` : '';
  return apiFetch<ServerSpecialization[]>(`/api/catalogs/specializations${qs}`, { method: 'GET' });
}

export async function createCatalogSpecialization(body: {
  organization_id: number;
  name: string;
  description?: string;
}): Promise<ServerSpecialization> {
  return apiFetch<ServerSpecialization>('/api/catalogs/specializations', { method: 'POST', body: JSON.stringify(body) });
}

export async function getCatalogSkills(params?: { orgId?: number }): Promise<ServerSkill[]> {
  const qs = params?.orgId ? `?orgId=${encodeURIComponent(String(params.orgId))}` : '';
  return apiFetch<ServerSkill[]>(`/api/catalogs/skills${qs}`, { method: 'GET' });
}

export async function createCatalogSkill(body: {
  organization_id: number;
  name: string;
  description?: string;
}): Promise<ServerSkill> {
  return apiFetch<ServerSkill>('/api/catalogs/skills', { method: 'POST', body: JSON.stringify(body) });
}

export async function getCatalogShifts(params?: { orgId?: number }): Promise<ServerShift[]> {
  const qs = params?.orgId ? `?orgId=${encodeURIComponent(String(params.orgId))}` : '';
  return apiFetch<ServerShift[]>(`/api/catalogs/shift${qs}`, { method: 'GET' });
}

export async function createCatalogShift(body: {
  organization_id: number;
  name: string;
  start_time: string;
  end_time: string;
  description?: string;
}): Promise<ServerShift> {
  return apiFetch<ServerShift>('/api/catalogs/shift', { method: 'POST', body: JSON.stringify(body) });
}

export type ServerOrgGlobalSettings = {
  id: number;
  organization_id: number;
  business_hours_start: string;
  business_hours_end: string;
  surgery_planning_horizon: number;
  roster_planning_horizon: number;
  surgery_planning_resolution: number;
  created_at: string;
  updated_at: string;
};

export async function getOrgGlobalSettings(orgId: number): Promise<ServerOrgGlobalSettings> {
  return apiFetch<ServerOrgGlobalSettings>(`/api/catalogs/global_settings/${encodeURIComponent(String(orgId))}`, {
    method: 'GET',
  });
}

export async function upsertOrgGlobalSettings(body: {
  organization_id: number;
  business_hours_start?: string;
  business_hours_end?: string;
  surgery_planning_horizon?: number;
  roster_planning_horizon?: number;
  surgery_planning_resolution?: number;
}): Promise<ServerOrgGlobalSettings> {
  return apiFetch<ServerOrgGlobalSettings>('/api/catalogs/global_settings', { method: 'POST', body: JSON.stringify(body) });
}
