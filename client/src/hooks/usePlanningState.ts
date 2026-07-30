import { useState, useEffect, useCallback } from 'react';
import { triggerSurgeryPlanning, getPlanningProcessState, fetchPlanResults } from '../services/api-planning';
import type { BackendSurgeryPlanResult } from '../types/surgery';

/**
 * Hook to manage surgery planning process.
 * Provides functions to start planning, current running state,
 * latest result and any error encountered.
 */
export function usePlanningState(pollIntervalMs: number = 5000) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BackendSurgeryPlanResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<number | null>(null);
  const [trackedSurgeryIds, setTrackedSurgeryIds] = useState<string[]>([]);

  const startPlanning = useCallback(async (orgId: number, surgeryIds: string[] = []) => {
    try {
      setError(null);
      setResult(null);
      const resp = await triggerSurgeryPlanning(orgId);
      if (!resp.success) {
        setError(resp.message ?? 'Failed to start planning');
        return;
      }
      setActiveOrgId(orgId);
      setTrackedSurgeryIds(surgeryIds);
      setIsRunning(true);
    } catch (e: any) {
      setError(e?.message ?? 'Unexpected error');
    }
  }, []);

  // Poll the planning state and fetch result when done
  useEffect(() => {
    if (!isRunning || !activeOrgId) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const { running } = await getPlanningProcessState();
        if (!cancelled) {
          if (!running) {
            const rows = await fetchPlanResults(activeOrgId);
            const filtered =
              trackedSurgeryIds.length > 0
                ? rows.filter((row) => trackedSurgeryIds.includes(String(row.surgery_id)))
                : rows;
            setResult(filtered);
            setIsRunning(false);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? 'Polling error');
          setIsRunning(false);
        }
      }
    };
    const id = setInterval(poll, pollIntervalMs);
    poll();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [activeOrgId, isRunning, pollIntervalMs, trackedSurgeryIds]);

  return { isRunning, startPlanning, result, error };
}
