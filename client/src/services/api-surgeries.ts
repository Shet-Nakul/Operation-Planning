import { apiFetch } from './api-core';
import type { BackendSurgery, BackendSurgeryPayload } from '../types/surgery';

export async function getSurgeries(params?: { orgId?: number }): Promise<BackendSurgery[]> {
  const qs = params?.orgId ? `?orgId=${encodeURIComponent(String(params.orgId))}` : '';
  return apiFetch<BackendSurgery[]>(`/api/surgeries${qs}`, { method: 'GET' });
}

export async function getSurgeryById(id: number | string): Promise<BackendSurgery> {
  return apiFetch<BackendSurgery>(`/api/surgeries/${encodeURIComponent(String(id))}`, { method: 'GET' });
}

export async function createSurgery(body: BackendSurgeryPayload): Promise<BackendSurgery> {
  return apiFetch<BackendSurgery>('/api/surgeries', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateSurgeryById(
  id: number | string,
  body: Partial<BackendSurgeryPayload>,
): Promise<BackendSurgery> {
  return apiFetch<BackendSurgery>(`/api/surgeries/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteSurgeryById(id: number | string): Promise<void> {
  await apiFetch<void>(`/api/surgeries/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
}
