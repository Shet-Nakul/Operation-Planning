import { apiFetch } from './api-core';
import type {
  BackendSurgeryPlanResult,
  PlanningProcessState,
  PlanningTriggerResponse,
} from '../types/surgery';

export async function triggerSurgeryPlanning(_orgId: number): Promise<PlanningTriggerResponse> {
  return apiFetch<PlanningTriggerResponse>('/api/planning', {
    method: 'POST',
  });
}

export async function fetchPlanResults(orgId: number): Promise<BackendSurgeryPlanResult[]> {
  return apiFetch<BackendSurgeryPlanResult[]>(
    `/api/surgery-plans?orgId=${encodeURIComponent(String(orgId))}`,
    { method: 'GET' },
  );
}

export async function fetchPlanResult(surgeryId: string): Promise<BackendSurgeryPlanResult> {
  return apiFetch<BackendSurgeryPlanResult>(`/api/surgery-plans/${encodeURIComponent(surgeryId)}`, {
    method: 'GET',
  });
}

export async function getPlanningProcessState(): Promise<PlanningProcessState> {
  return apiFetch<PlanningProcessState>('/api/planning-state', { method: 'GET' });
}
