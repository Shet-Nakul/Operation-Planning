import { apiFetch } from './api-core';

export type ServerPoolRosteringAssignmentsByShift = Record<string, string[]>;
export type ServerPoolRosteringByDate = Record<string, ServerPoolRosteringAssignmentsByShift>;

export type ServerEmployeeRosteringAssignment = {
  pool?: string;
  shift?: string;
};

export type ServerEmployeeRosteringByDate = Record<string, ServerEmployeeRosteringAssignment>;

export async function getPoolRostering(params: {
  orgId: number;
  poolId: string;
  year?: number;
  month?: number;
}): Promise<ServerPoolRosteringByDate> {
  const usp = new URLSearchParams();
  usp.set('view', 'pool');
  usp.set('orgId', String(params.orgId));
  usp.set('poolId', params.poolId);
  if (typeof params.year === 'number') usp.set('year', String(params.year));
  if (typeof params.month === 'number') usp.set('month', String(params.month));

  const res = await apiFetch<ServerPoolRosteringByDate>(`/api/rosterings?${usp.toString()}`, { method: 'GET' });
  if (!res || typeof res !== 'object') return {};
  return res as ServerPoolRosteringByDate;
}

export async function getRosteringProcessState(): Promise<{ running: boolean }> {
  const res = await apiFetch<{ running?: boolean }>('/api/process-state', { method: 'GET' });
  return { running: Boolean(res?.running) };
}

export async function getEmployeeRostering(params: {
  orgId: number;
  employeeId: string;
  year?: number;
  month?: number;
}): Promise<ServerEmployeeRosteringByDate> {
  const usp = new URLSearchParams();
  usp.set('view', 'employee');
  usp.set('orgId', String(params.orgId));
  usp.set('employeeId', params.employeeId);
  if (typeof params.year === 'number') usp.set('year', String(params.year));
  if (typeof params.month === 'number') usp.set('month', String(params.month));

  const res = await apiFetch<ServerEmployeeRosteringByDate>(`/api/rosterings?${usp.toString()}`, { method: 'GET' });
  if (!res || typeof res !== 'object') return {};
  return res as ServerEmployeeRosteringByDate;
}

export type ServerRosteringRow = {
  id: number;
  organization_id: number;
  year: number;
  month: number;
  employee_centric?: Record<string, ServerEmployeeRosteringByDate>;
  pool_centric?: Record<string, ServerPoolRosteringByDate>;
  date_centric?: Record<string, unknown>;
  created_at?: string;
};

export async function getAllRosterings(params: { orgId: number }): Promise<ServerRosteringRow[]> {
  const usp = new URLSearchParams();
  usp.set('view', 'all');
  usp.set('orgId', String(params.orgId));

  const res = await apiFetch<ServerRosteringRow[]>(`/api/rosterings?${usp.toString()}`, { method: 'GET' });
  return Array.isArray(res) ? res : [];
}
