import { apiFetch, type PaginatedResponse } from './api-core';

export type ServerOrganization = {
  id: number;
  name: string;
  location?: string | null;
  contact_number?: string | null;
  contact_email?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type OrganizationStats = {
  staff: number;
  humanPools: number;
  assetPools: number;
  capacity: number;
  units: number;
  availableUnits: number;
  inventoryItems: number;
  inventoryAlerts: number;
  contracts: number;
  departments: number;
  users: number;
  activeUsers: number;
  surgeries: number;
  operationTypes: number;
};

export async function getOrganizationStats(id: number): Promise<OrganizationStats> {
  return apiFetch<OrganizationStats>(`/api/organizations/${id}/stats`, { method: 'GET' });
}

export type ServerRole = {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
};

export type ServerUser = {
  id: number;
  organization_id?: number | null;
  role_id: number;
  first_name: string;
  last_name?: string | null;
  email: string;
  is_active: boolean;
  permissions?: string[];
  created_at: string;
  updated_at: string;
  role?: { id: number; name: string; description?: string | null } | null;
  organization?: { id: number; name: string } | null;
};

export type OrganizationRegistrationResponse = {
  organization: ServerOrganization;
  admin: ServerUser;
  credentials: { email: string; password: string };
  emailDelivery: 'not_configured';
  smsDelivery: 'not_configured';
};

export async function createOrganization(body: {
  name: string;
  location?: string;
  contact_number?: string;
  contact_email?: string;
  status?: string;
  initial_admin?: { first_name: string; last_name?: string; email: string; password?: string };
}): Promise<OrganizationRegistrationResponse> {
  return apiFetch<OrganizationRegistrationResponse>('/api/organizations', { method: 'POST', body: JSON.stringify(body) });
}

export async function getOrganizations(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<ServerOrganization>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch<PaginatedResponse<ServerOrganization>>(`/api/organizations${suffix}`, { method: 'GET' });
}

export async function getOrganizationById(id: string | number): Promise<ServerOrganization> {
  return apiFetch<ServerOrganization>(`/api/organizations/${encodeURIComponent(String(id))}`, { method: 'GET' });
}

export async function updateOrganizationById(
  id: string | number,
  body: Partial<{ name: string; location: string; contact_number: string; contact_email: string; status: string }>,
): Promise<ServerOrganization> {
  return apiFetch<ServerOrganization>(`/api/organizations/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteOrganizationById(id: string | number): Promise<void> {
  await apiFetch<void>(`/api/organizations/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
}

export async function getRoles(): Promise<ServerRole[]> {
  return apiFetch<ServerRole[]>('/api/roles', { method: 'GET' });
}

export async function createRole(body: { name: string; description?: string }): Promise<ServerRole> {
  return apiFetch<ServerRole>('/api/roles', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateRoleById(
  id: string | number,
  body: Partial<{ name: string; description: string }>,
): Promise<ServerRole> {
  return apiFetch<ServerRole>(`/api/roles/${encodeURIComponent(String(id))}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteRoleById(id: string | number): Promise<void> {
  await apiFetch<void>(`/api/roles/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
}

export async function getUsers(params?: {
  page?: number;
  limit?: number;
  orgId?: number;
}): Promise<PaginatedResponse<ServerUser>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (typeof params?.orgId === 'number') qs.set('orgId', String(params.orgId));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch<PaginatedResponse<ServerUser>>(`/api/users${suffix}`, { method: 'GET' });
}

export async function createUser(body: {
  organization_id?: number;
  role_id: number;
  first_name: string;
  last_name?: string;
  email: string;
  password?: string;
  is_active?: boolean;
}): Promise<ServerUser & { credentials: { email: string; password: string }; emailDelivery: string }> {
  return apiFetch<ServerUser & { credentials: { email: string; password: string }; emailDelivery: string }>('/api/users', { method: 'POST', body: JSON.stringify(body) });
}

export async function getUserById(id: string | number): Promise<ServerUser> {
  return apiFetch<ServerUser>(`/api/users/${encodeURIComponent(String(id))}`, { method: 'GET' });
}

export async function updateUserById(
  id: string | number,
  body: Partial<{
    organization_id: number;
    role_id: number;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    is_active: boolean;
  }>,
): Promise<ServerUser> {
  return apiFetch<ServerUser>(`/api/users/${encodeURIComponent(String(id))}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteUserById(id: string | number): Promise<void> {
  await apiFetch<void>(`/api/users/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
}

