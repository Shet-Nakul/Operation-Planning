function normalizeApiBaseUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  let s = value.trim();
  if (!s) return '';
  s = s.replace(/\/+$/, '');
  if (s.endsWith('/api')) s = s.slice(0, -4);
  if (s.endsWith('/auth')) s = s.slice(0, -5);
  return s;
}

function normalizeToken(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  if (!s) return null;
  if (s === 'undefined' || s === 'null') return null;
  return s;
}

const RAW_API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL;
export const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL);

const RAW_ACCESS_TOKEN = (import.meta as any).env?.VITE_ACCESS_TOKEN;
export const HARD_CODED_ACCESS_TOKEN =
  normalizeToken(RAW_ACCESS_TOKEN) ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkFETUlOIiwiaWF0IjoxNzc5MjA1NjgwLCJleHAiOjE3ODY5ODE2ODB9.X5lsdSBqHn8q-mS0r9Yzg_eJHTBmwZRMZRpgIP4hK6s';

const RAW_DEV_EMAIL = (import.meta as any).env?.VITE_DEV_EMAIL;
const RAW_DEV_PASSWORD = (import.meta as any).env?.VITE_DEV_PASSWORD;
const DEV_EMAIL = normalizeToken(RAW_DEV_EMAIL) ?? 'admin@centralhospital.com';
const DEV_PASSWORD = normalizeToken(RAW_DEV_PASSWORD) ?? 'password123';

const STORAGE_ACCESS_TOKEN_KEY = 'op.accessToken';
const STORAGE_REFRESH_TOKEN_KEY = 'op.refreshToken';

function getStorage(): Storage | null {
  try {
    const s = (globalThis as any)?.localStorage;
    return s ?? null;
  } catch {
    return null;
  }
}

function readStoredToken(key: string): string | null {
  const s = getStorage();
  if (!s) return null;
  return normalizeToken(s.getItem(key));
}

function writeStoredToken(key: string, value: string | null) {
  const s = getStorage();
  if (!s) return;
  try {
    if (value) s.setItem(key, value);
    else s.removeItem(key);
  } catch {
    return;
  }
}

let runtimeAccessToken: string | null = readStoredToken(STORAGE_ACCESS_TOKEN_KEY);
let runtimeRefreshToken: string | null = readStoredToken(STORAGE_REFRESH_TOKEN_KEY);
let runtimeLoginPromise: Promise<string> | null = null;

export type ApiErrorShape = {
  error?: string;
  message?: string;
};

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const hasAuth = path.startsWith('/api/');
  const url = `${API_BASE_URL}${path}`;

  const doRequest = async (h: Headers) => {
    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        headers: h,
      });
    } catch {
      throw new Error(`Network request failed: ${url}`);
    }

    const contentType = res.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');

    let body: unknown = null;
    let bodyText: string | null = null;
    try {
      if (isJson) {
        body = await res.json();
      } else {
        bodyText = await res.text();
      }
    } catch {
      body = null;
      bodyText = null;
    }

    return { res, contentType, isJson, body, bodyText };
  };

  const ensureRuntimeToken = async () => {
    if (runtimeAccessToken) return runtimeAccessToken;
    if (runtimeLoginPromise) return await runtimeLoginPromise;

    runtimeLoginPromise = (async () => {
      const loginUrl = `${API_BASE_URL}/auth/login`;
      const loginRes = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: DEV_EMAIL, password: DEV_PASSWORD }),
      });

      const loginContentType = loginRes.headers.get('content-type') ?? '';
      if (!loginContentType.includes('application/json')) {
        const t = (await loginRes.text()).slice(0, 200);
        throw new Error(`Login failed: ${loginRes.status} ${loginContentType || 'unknown'} ${loginUrl} ${t}`);
      }

      const json = (await loginRes.json()) as any;
      const token = normalizeToken(json?.accessToken ?? json?.token ?? json?.access_token);
      const refresh = normalizeToken(json?.refreshToken ?? json?.refresh_token);
      const err = normalizeToken(json?.error ?? json?.message);
      if (!token) throw new Error(`Login failed: ${err || 'missing accessToken'}`);
      runtimeAccessToken = token;
      runtimeRefreshToken = refresh;
      writeStoredToken(STORAGE_ACCESS_TOKEN_KEY, runtimeAccessToken);
      writeStoredToken(STORAGE_REFRESH_TOKEN_KEY, runtimeRefreshToken);
      return token;
    })();

    try {
      return await runtimeLoginPromise;
    } finally {
      runtimeLoginPromise = null;
    }
  };

  const tryRefreshToken = async () => {
    if (!runtimeRefreshToken) return null;
    const refreshUrl = `${API_BASE_URL}/auth/refresh`;
    const refreshRes = await fetch(refreshUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: runtimeRefreshToken }),
    });

    const refreshContentType = refreshRes.headers.get('content-type') ?? '';
    const isJson = refreshContentType.includes('application/json');
    const json = isJson ? ((await refreshRes.json()) as any) : null;
    const token = normalizeToken(json?.accessToken ?? json?.token ?? json?.access_token);
    const refresh = normalizeToken(json?.refreshToken ?? json?.refresh_token);
    if (!token) return null;
    runtimeAccessToken = token;
    runtimeRefreshToken = refresh ?? runtimeRefreshToken;
    writeStoredToken(STORAGE_ACCESS_TOKEN_KEY, runtimeAccessToken);
    writeStoredToken(STORAGE_REFRESH_TOKEN_KEY, runtimeRefreshToken);
    return token;
  };

  if (hasAuth && !headers.has('Authorization')) {
    const token = runtimeAccessToken ?? HARD_CODED_ACCESS_TOKEN;
    headers.set('Authorization', `Bearer ${token}`);
  }

  let { res, contentType, isJson, body, bodyText } = await doRequest(headers);

  if (!res.ok && hasAuth && (res.status === 401 || res.status === 403)) {
    runtimeAccessToken = null;
    writeStoredToken(STORAGE_ACCESS_TOKEN_KEY, null);
    const refreshed = await tryRefreshToken();
    const fresh = refreshed ?? (await ensureRuntimeToken());
    const retryHeaders = new Headers(headers);
    retryHeaders.set('Authorization', `Bearer ${fresh}`);
    ({ res, contentType, isJson, body, bodyText } = await doRequest(retryHeaders));
  }

  if (!res.ok) {
    const err = (body ?? {}) as ApiErrorShape;
    const msg =
      err.error ||
      err.message ||
      bodyText ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  const expectsJson = path.startsWith('/api/') || path.startsWith('/auth/');
  if (expectsJson && (res.status === 204 || res.status === 205)) {
    return null as T;
  }
  if (expectsJson && !isJson) {
    const snippet = (bodyText ?? '').slice(0, 200);
    throw new Error(`Invalid API response (expected JSON): ${res.status} ${contentType || 'unknown'} ${url} ${snippet}`);
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

export async function getContractById(id: string | number): Promise<ServerContract> {
  return apiFetch<ServerContract>(`/api/contracts/${encodeURIComponent(String(id))}`, { method: 'GET' });
}

export type UpdateContractBody = Partial<CreateContractBody>;

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

export type ServerStaff = {
  id: number;
  organization_id: number;
  staff_id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  profile_picture?: string | null;
  department?: string | null;
  designation?: string | null;
  contract_id?: string | null;
  supervisor?: string | null;
  skills?: any;
  certifications?: any;
  roles?: any;
  role_distribution?: any;
  weekly_template?: any;
  pool_assignments?: any;
  created_at: string;
  updated_at: string;
};

export type CreateStaffBody = {
  organization_id: number;
  personal_details: {
    staff_id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    profile_picture?: string;
  };
  professional_primary_details: {
    department?: string;
    designation?: string;
    contract_id?: string;
    supervisor?: string;
  };
  professional_secondary_details: {
    skills?: string[];
    certifications?: string[];
    roles?: string[];
    role_distribution?: Record<string, number>;
    weekly_template?: any;
    pool_assignments?: any[];
  };
};

export async function createStaff(body: CreateStaffBody): Promise<ServerStaff> {
  return apiFetch<ServerStaff>('/api/staff', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getStaff(params?: { orgId?: number }): Promise<ServerStaff[]> {
  const qs = params?.orgId ? `?orgId=${encodeURIComponent(String(params.orgId))}` : '';
  return apiFetch<ServerStaff[]>(`/api/staff${qs}`, { method: 'GET' });
}

export async function deleteStaffById(id: string | number): Promise<void> {
  await apiFetch<void>(`/api/staff/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
}

export type UpdateStaffBody = Partial<{
  organization_id: number;
  personal_details: Partial<{
    staff_id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    profile_picture: string;
  }>;
  professional_primary_details: Partial<{
    department: string;
    designation: string;
    contract_id: string;
    supervisor: string;
  }>;
  professional_secondary_details: Partial<{
    skills: string[];
    certifications: string[];
    roles: string[];
    role_distribution: Record<string, number>;
    weekly_template: any;
    pool_assignments: any[];
  }>;
}>;

export async function updateStaffById(id: string | number, body: UpdateStaffBody): Promise<ServerStaff> {
  return apiFetch<ServerStaff>(`/api/staff/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export type ServerPoolDemandMatrixItem = {
  shift: string;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
};

export type ServerPoolListItem = {
  pool_id: string;
  pool_name: string;
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
  department?: string;
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
  return apiFetch<ServerPoolListItem[]>(`/api/pools${qs}`, { method: 'GET' });
}

export async function createPool(body: CreatePoolBody): Promise<ServerPoolRecord> {
  return apiFetch<ServerPoolRecord>('/api/pools', { method: 'POST', body: JSON.stringify(body) });
}

export async function getPoolById(poolId: string): Promise<ServerPoolDetailResponse> {
  return apiFetch<ServerPoolDetailResponse>(`/api/pools/${encodeURIComponent(poolId)}`, { method: 'GET' });
}

export async function getPoolDemand(poolId: string): Promise<ServerPoolDemandResponse> {
  return apiFetch<ServerPoolDemandResponse>(`/api/pools/${encodeURIComponent(poolId)}/demand`, { method: 'GET' });
}

export async function updatePoolDemand(poolId: string, body: UpdatePoolDemandBody): Promise<ServerPoolDemandResponse> {
  return apiFetch<ServerPoolDemandResponse>(`/api/pools/${encodeURIComponent(poolId)}/demand`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function getPoolShortages(poolId: string): Promise<ServerPoolShortageAlert[]> {
  return apiFetch<ServerPoolShortageAlert[]>(`/api/pools/${encodeURIComponent(poolId)}/shortages`, { method: 'GET' });
}

export type RenewableResourceType = 'BED' | 'EQUIPMENT' | 'ROOM' | 'DEVICE' | 'VEHICLE';
export type RenewableResourcePoolStatus = 'OPERATIONAL' | 'MAINTENANCE' | 'DECOMMISSIONED' | string;
export type RenewableResourceUnitStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | string;

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
  units: ServerRenewableResourceUnit[];
  health?: any;
  metadata?: any;
};

export type CreateRenewableResourcePoolBody = {
  organization_id: number;
  pool_name: string;
  resource_type: RenewableResourceType;
  department?: string;
  location?: string;
  total_capacity: number;
  unit_prefix?: string;
  default_variant?: string;
  default_attributes?: any;
  metadata?: any;
};

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

export async function createRenewableResourcePool(
  body: CreateRenewableResourcePoolBody,
): Promise<any> {
  return apiFetch<any>('/api/resources/pools', { method: 'POST', body: JSON.stringify(body) });
}

export async function getRenewableResourcePoolById(poolId: string): Promise<ServerRenewableResourcePoolDetail> {
  return apiFetch<ServerRenewableResourcePoolDetail>(`/api/resources/pools/${encodeURIComponent(poolId)}`, { method: 'GET' });
}

export type UpdateRenewableResourcePoolCapacityBody = {
  total_capacity: number;
  reason?: string;
  effective_from?: string;
};

export async function updateRenewableResourcePoolCapacity(
  poolId: string,
  body: UpdateRenewableResourcePoolCapacityBody,
): Promise<any> {
  return apiFetch<any>(`/api/resources/pools/${encodeURIComponent(poolId)}/capacity`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function getRenewableResourcePoolHealth(poolId: string): Promise<any> {
  return apiFetch<any>(`/api/resources/pools/${encodeURIComponent(poolId)}/health`, { method: 'GET' });
}

export type AddRenewableResourceUnitsBody = {
  units: Array<{
    unit_id: string;
    variant?: string;
    attributes?: any;
    status?: RenewableResourceUnitStatus;
  }>;
};

export async function addRenewableResourceUnitsToPool(poolId: string, body: AddRenewableResourceUnitsBody): Promise<any> {
  return apiFetch<any>(`/api/resources/pools/${encodeURIComponent(poolId)}/units`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export type UpdateRenewableResourceUnitBody = {
  variant?: string;
  attributes?: any;
  status?: RenewableResourceUnitStatus;
  reason?: string;
};

export async function updateRenewableResourceUnit(unitId: string, body: UpdateRenewableResourceUnitBody): Promise<any> {
  return apiFetch<any>(`/api/resources/units/${encodeURIComponent(unitId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
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

export async function updateCatalogStaffTag(
  id: number,
  body: Partial<{
    organization_id: number;
    name: string;
    color?: string;
  }>,
): Promise<ServerStaffTag> {
  return apiFetch<ServerStaffTag>(`/api/catalogs/roles/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteCatalogStaffTag(id: number): Promise<void> {
  await apiFetch<void>(`/api/catalogs/roles/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
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

export async function updateCatalogSpecialization(
  id: number,
  body: Partial<{
    organization_id: number;
    name: string;
    description?: string;
  }>,
): Promise<ServerSpecialization> {
  return apiFetch<ServerSpecialization>(`/api/catalogs/specializations/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteCatalogSpecialization(id: number): Promise<void> {
  await apiFetch<void>(`/api/catalogs/specializations/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
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

export async function updateCatalogSkill(
  id: number,
  body: Partial<{
    organization_id: number;
    name: string;
    description?: string;
  }>,
): Promise<ServerSkill> {
  return apiFetch<ServerSkill>(`/api/catalogs/skills/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteCatalogSkill(id: number): Promise<void> {
  await apiFetch<void>(`/api/catalogs/skills/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
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

export async function updateCatalogShift(
  id: number,
  body: Partial<{
    organization_id: number;
    name: string;
    start_time: string;
    end_time: string;
    description?: string;
  }>,
): Promise<ServerShift> {
  return apiFetch<ServerShift>(`/api/catalogs/shift/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteCatalogShift(id: number): Promise<void> {
  await apiFetch<void>(`/api/catalogs/shift/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
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
