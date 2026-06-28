/*
Files used by this module:
- client/src/lib/api.ts
*/

import { apiFetch } from '../api';

type SuccessEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

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
  usp.set('orgId', String(params.orgId));
  usp.set('poolId', params.poolId);
  if (typeof params.year === 'number') usp.set('year', String(params.year));
  if (typeof params.month === 'number') usp.set('month', String(params.month));

  const res = await apiFetch<SuccessEnvelope<ServerPoolRosteringByDate> | ServerPoolRosteringByDate>(
    `/api/rosterings/pool?${usp.toString()}`,
    { method: 'GET' },
  );
  const data = ((res as any)?.data ?? res) as any;
  if (!data || typeof data !== 'object') return {};
  return data as ServerPoolRosteringByDate;
}

export async function getEmployeeRostering(params: {
  orgId: number;
  employeeId: string;
  year?: number;
  month?: number;
}): Promise<ServerEmployeeRosteringByDate> {
  const usp = new URLSearchParams();
  usp.set('orgId', String(params.orgId));
  usp.set('employeeId', params.employeeId);
  if (typeof params.year === 'number') usp.set('year', String(params.year));
  if (typeof params.month === 'number') usp.set('month', String(params.month));

  const res = await apiFetch<SuccessEnvelope<ServerEmployeeRosteringByDate> | ServerEmployeeRosteringByDate>(
    `/api/rosterings/employee?${usp.toString()}`,
    { method: 'GET' },
  );
  const data = ((res as any)?.data ?? res) as any;
  if (!data || typeof data !== 'object') return {};
  return data as ServerEmployeeRosteringByDate;
}
