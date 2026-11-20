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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitUntilPlanningIdle(pollIntervalMs = 2000, timeoutMs = 6 * 60 * 1000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const state = await getPlanningProcessState();
    if (!state?.running) return;
    await sleep(pollIntervalMs);
  }
  throw new Error('Timed out waiting for surgery planning to finish');
}

/**
 * Starts an org-wide planning run and waits for it to finish.
 * An idle planner does not mean every request received a plan.
 */
export async function runSurgeryPlanning(orgId: number): Promise<void> {
  await waitUntilPlanningIdle();

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const resp = await triggerSurgeryPlanning(orgId);
      if (!resp.success) {
        lastError = new Error(resp.message ?? 'Failed to start planning');
        await sleep(2000);
        continue;
      }
      lastError = null;
      break;
    } catch (e: unknown) {
      lastError = e instanceof Error ? e : new Error('Failed to start planning');
      const busy = /still running|already running/i.test(lastError.message);
      if (!busy) throw lastError;
      await sleep(2000);
    }
  }
  if (lastError) throw lastError;

  await waitUntilPlanningIdle();
}
