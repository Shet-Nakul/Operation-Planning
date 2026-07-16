import { apiFetch } from './api-core';

export type ServerStaffTag = {
  id: number;
  organization_id: number;
  name: string;
  color?: string | null;
  status?: string | null;
};

export type ServerSpecialization = {
  id: number;
  organization_id: number;
  name: string;
  description?: string | null;
  status?: string | null;
};

export type ServerSkill = {
  id: number;
  organization_id: number;
  name: string;
  description?: string | null;
  status?: string | null;
};

export type ServerResourceType = {
  id: number;
  organization_id: number;
  name: string;
  status?: string | null;
};

export type ServerDepartment = {
  id: number;
  organization_id: number;
  name: string;
  description?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ServerShift = {
  id: number;
  organization_id: number;
  name: string;
  start_time: string;
  end_time: string;
  description?: string | null;
  status?: string | null;
};

export type ServerOperationType = {
  id: number;
  organization_id: number;
  category: string;
  name: string;
  status?: string | null;
  created_at: string;
  updated_at: string;
};

export type ServerPhaseResource = {
  id: number;
  organization_id: number;
  type: string;
  name: string;
  default_count: number;
  status?: string | null;
  created_at: string;
  updated_at: string;
};

export type ServerOrgGlobalSettings = {
  id: number;
  organization_id: number;
  operation_hours_start: string;
  operation_hours_end: string;
  surgery_planning_horizon: number;
  roster_planning_horizon: number;
  surgery_planning_resolution: number;
  created_at: string;
  updated_at: string;
};

export async function getCatalogStaffTags(params?: { orgId?: number }): Promise<ServerStaffTag[]> {
  const qs = params?.orgId ? `?orgId=${encodeURIComponent(String(params.orgId))}` : '';
  return apiFetch<ServerStaffTag[]>(`/api/catalogs/roles${qs}`, { method: 'GET' });
}

export async function createCatalogStaffTag(body: {
  organization_id: number;
  name: string;
  color?: string;
  status?: string;
}): Promise<ServerStaffTag> {
  return apiFetch<ServerStaffTag>('/api/catalogs/roles', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateCatalogStaffTag(
  id: number,
  body: Partial<{
    organization_id: number;
    name: string;
    color?: string;
    status?: string;
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

export async function getCatalogResourceTypes(params?: { orgId?: number }): Promise<ServerResourceType[]> {
  const qs = params?.orgId ? `?orgId=${encodeURIComponent(String(params.orgId))}` : '';
  return apiFetch<ServerResourceType[]>(`/api/catalogs/resource_types${qs}`, { method: 'GET' });
}

export async function createCatalogResourceType(body: {
  organization_id: number;
  name: string;
  status?: string;
}): Promise<ServerResourceType> {
  return apiFetch<ServerResourceType>('/api/catalogs/resource_types', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateCatalogResourceType(
  id: number,
  body: Partial<{
    organization_id: number;
    name: string;
    status?: string;
  }>,
): Promise<ServerResourceType> {
  return apiFetch<ServerResourceType>(`/api/catalogs/resource_types/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteCatalogResourceType(id: number): Promise<void> {
  await apiFetch<void>(`/api/catalogs/resource_types/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
}

export async function getCatalogSpecializations(params?: { orgId?: number }): Promise<ServerSpecialization[]> {
  const qs = params?.orgId ? `?orgId=${encodeURIComponent(String(params.orgId))}` : '';
  return apiFetch<ServerSpecialization[]>(`/api/catalogs/specializations${qs}`, { method: 'GET' });
}

export async function createCatalogSpecialization(body: {
  organization_id: number;
  name: string;
  description?: string;
  status?: string;
}): Promise<ServerSpecialization> {
  return apiFetch<ServerSpecialization>('/api/catalogs/specializations', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateCatalogSpecialization(
  id: number,
  body: Partial<{
    organization_id: number;
    name: string;
    description?: string;
    status?: string;
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
  status?: string;
}): Promise<ServerSkill> {
  return apiFetch<ServerSkill>('/api/catalogs/skills', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateCatalogSkill(
  id: number,
  body: Partial<{
    organization_id: number;
    name: string;
    description?: string;
    status?: string;
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

export async function getCatalogDepartments(params?: { orgId?: number }): Promise<ServerDepartment[]> {
  const qs = params?.orgId ? `?orgId=${encodeURIComponent(String(params.orgId))}` : '';
  return apiFetch<ServerDepartment[]>(`/api/catalogs/departments${qs}`, { method: 'GET' });
}

export async function createCatalogDepartment(body: {
  organization_id: number;
  name: string;
  description?: string;
  status?: string;
}): Promise<ServerDepartment> {
  return apiFetch<ServerDepartment>('/api/catalogs/departments', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateCatalogDepartment(
  id: number,
  body: Partial<{
    organization_id: number;
    name: string;
    description?: string;
    status?: string;
  }>,
): Promise<ServerDepartment> {
  return apiFetch<ServerDepartment>(`/api/catalogs/departments/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteCatalogDepartment(id: number): Promise<void> {
  await apiFetch<void>(`/api/catalogs/departments/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
}

export async function getCatalogShifts(params?: { orgId?: number }): Promise<ServerShift[]> {
  const qs = params?.orgId ? `?orgId=${encodeURIComponent(String(params.orgId))}` : '';
  return apiFetch<ServerShift[]>(`/api/catalogs/shift${qs}`, { method: 'GET' });
}

export async function createCatalogShift(body: {
  organization_id: number;
  name: string;
  alias: string;
  start_time: string;
  end_time: string;
  description?: string;
  status?: string;
}): Promise<ServerShift> {
  return apiFetch<ServerShift>('/api/catalogs/shift', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateCatalogShift(
  id: number,
  body: Partial<{
    organization_id: number;
    name: string;
    alias: string;
    start_time: string;
    end_time: string;
    description?: string;
    status?: string;
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

export async function getCatalogOperationTypes(params?: { orgId?: number }): Promise<ServerOperationType[]> {
  const qs = params?.orgId ? `?orgId=${encodeURIComponent(String(params.orgId))}` : '';
  return apiFetch<ServerOperationType[]>(`/api/catalogs/operation_types${qs}`, { method: 'GET' });
}

export async function createCatalogOperationType(body: {
  organization_id: number;
  category: string;
  name: string;
  status?: string;
}): Promise<ServerOperationType> {
  return apiFetch<ServerOperationType>('/api/catalogs/operation_types', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateCatalogOperationType(
  id: number,
  body: Partial<{
    category: string;
    name: string;
    status?: string;
  }>,
): Promise<ServerOperationType> {
  return apiFetch<ServerOperationType>(`/api/catalogs/operation_types/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteCatalogOperationType(id: number): Promise<void> {
  await apiFetch<void>(`/api/catalogs/operation_types/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
}

export async function getCatalogPhaseResources(params?: { orgId?: number }): Promise<ServerPhaseResource[]> {
  const qs = params?.orgId ? `?orgId=${encodeURIComponent(String(params.orgId))}` : '';
  return apiFetch<ServerPhaseResource[]>(`/api/catalogs/phase_resource${qs}`, { method: 'GET' });
}

export async function createCatalogPhaseResource(body: {
  organization_id: number;
  type: string;
  name: string;
  default_count?: number;
  status?: string;
}): Promise<ServerPhaseResource> {
  return apiFetch<ServerPhaseResource>('/api/catalogs/phase_resource', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateCatalogPhaseResource(
  id: number,
  body: Partial<{
    type: string;
    name: string;
    default_count: number;
    status?: string;
  }>,
): Promise<ServerPhaseResource> {
  return apiFetch<ServerPhaseResource>(`/api/catalogs/phase_resource/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteCatalogPhaseResource(id: number): Promise<void> {
  await apiFetch<void>(`/api/catalogs/phase_resource/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
}

export async function getOrgGlobalSettings(orgId: number): Promise<ServerOrgGlobalSettings> {
  return apiFetch<ServerOrgGlobalSettings>(`/api/catalogs/global_settings/${encodeURIComponent(String(orgId))}`, {
    method: 'GET',
  });
}

export async function upsertOrgGlobalSettings(body: {
  organization_id: number;
  operation_hours_start?: string;
  operation_hours_end?: string;
  surgery_planning_horizon?: number;
  roster_planning_horizon?: number;
  surgery_planning_resolution?: number;
}): Promise<ServerOrgGlobalSettings> {
  return apiFetch<ServerOrgGlobalSettings>('/api/catalogs/global_settings', { method: 'POST', body: JSON.stringify(body) });
}
