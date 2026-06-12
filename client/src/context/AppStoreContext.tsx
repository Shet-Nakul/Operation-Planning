import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createBlankSurgeryRequest, createRequestRecord } from '../data/surgeryRequestDefaults';
import { getDefaultAppDataStore } from '../data/store/loadDefaultStore';
import { downloadJsonFile } from '../lib/persistedStore';
import { getCatalogOperationTypes, getCatalogPhaseResources, getOrganizationById } from '../lib/api';
import type { AppDataStore } from '../types/store';
import type { TodayScheduleSlot } from '../types/store';
import type { Priority, SurgeryRequest, SurgeryRequestRecord } from '../types';
import type { Contract } from '../components/contracts/types';
import type { StaffMember } from '../components/staff/types';
import type { ResourcePool } from '../components/hr-pool/types';
import type { DefaultResourceSetting, GlobalSettings } from '../types/settings';

type AppStoreContextValue = {
  activeOrgId: number;
  setActiveOrgId: (id: number) => void;
  activeOrgName: string;
  setActiveOrgName: (name: string) => void;

  store: AppDataStore;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toast: string | null;
  pushToast: (message: string) => void;
  /** Merges JSON from disk workflow: replace in-memory store (use after you edit files + reload, or import). */
  replaceStore: (next: AppDataStore) => void;
  resetStoreToSeed: () => void;

  filteredSurgeryRequests: SurgeryRequestRecord[];

  updateRequestData: (id: string, updates: Partial<SurgeryRequest>) => void;
  upsertSurgeryRequest: (record: SurgeryRequestRecord) => void;
  deleteSurgeryRequest: (id: string) => void;
  markRequestDraft: (id: string) => void;
  markRequestInReview: (id: string) => void;
  submitSurgeryRequest: (id: string) => void;

  optimizeSchedulingQueue: () => void;
  exportFullStore: () => void;
  removeSchedulingQueueRow: (id: string) => void;
  scheduleUnscheduledRow: (id: string) => void;

  bumpOngoingProgress: (id: string, delta: number) => void;

  upsertContract: (contract: Contract) => void;
  replaceContracts: (contracts: Contract[]) => void;
  deleteContract: (id: string) => void;

  upsertStaff: (member: StaffMember) => void;
  replaceStaff: (staff: StaffMember[]) => void;
  deleteStaff: (id: string) => void;

  upsertResourcePool: (pool: ResourcePool) => void;
  deleteResourcePool: (id: string) => void;

  updateSettings: (updates: Partial<GlobalSettings>) => void;
};

export const AppStoreContext = createContext<AppStoreContextValue | null>(null);

const PRIORITY_ORDER: Record<string, number> = { EMERGENCY: 0, MANDATORY: 1, ELECTIVE: 2 };

const PHASE_KEYS = ['preOp', 'operative', 'postOp', 'sterilization', 'recovery'] as const;
type PhaseKey = (typeof PHASE_KEYS)[number];

const PHASE_LABELS: Record<PhaseKey, string> = {
  preOp: 'Pre-operative',
  operative: 'Operative',
  postOp: 'Post-operative',
  sterilization: 'Sterilization',
  recovery: 'Recovery',
};

function normalizePhaseTypeToId(value: unknown): string {
  const s = String(value ?? '').trim();
  if (!s) return '';
  const maybeId = s as PhaseKey;
  if ((PHASE_KEYS as readonly string[]).includes(maybeId)) return maybeId;
  const target = s.toLowerCase();
  const hit = PHASE_KEYS.find((k) => PHASE_LABELS[k].toLowerCase() === target);
  return hit ?? s;
}

function formatOperationTypeLabel(row: { category: string; name: string }): string {
  const category = String(row.category ?? '').trim();
  const name = String(row.name ?? '').trim();
  if (!category) return name;
  if (!name) return category;
  return `${category} - ${name}`;
}

function requestMatchesSearch(r: SurgeryRequestRecord, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const d = r.data;
  return (
    r.referenceCode.toLowerCase().includes(s) ||
    d.patientName.toLowerCase().includes(s) ||
    d.operationType.toLowerCase().includes(s) ||
    d.primarySurgeon.toLowerCase().includes(s)
  );
}

function mapBacklogPriorityToCase(p: 'EMERGENCY' | 'MANDATORY' | 'ELECTIVE'): Priority {
  if (p === 'EMERGENCY') return 'emergency';
  if (p === 'MANDATORY') return 'mandatory';
  return 'elective';
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<AppDataStore>(() => getDefaultAppDataStore());
  const [activeOrgId, setActiveOrgId] = useState(1);
  const [activeOrgName, setActiveOrgName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const org = await getOrganizationById(activeOrgId);
        if (cancelled) return;
        setActiveOrgName(String(org?.name ?? ''));
      } catch {
        if (!cancelled) setActiveOrgName('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeOrgId]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  }, []);

  const replaceStore = useCallback((next: AppDataStore) => {
    setStore(next);
    showToast('Store updated.');
  }, [showToast]);

  const resetStoreToSeed = useCallback(() => {
    setStore(getDefaultAppDataStore());
    showToast('Reset to seed data from data/store JSON.');
  }, [showToast]);

  const filteredSurgeryRequests = useMemo(
    () => store.surgeryRequests.filter((r) => requestMatchesSearch(r, searchQuery)),
    [store.surgeryRequests, searchQuery],
  );

  const updateRequestData = useCallback((id: string, updates: Partial<SurgeryRequest>) => {
    setStore((s) => ({
      ...s,
      surgeryRequests: s.surgeryRequests.map((r) =>
        r.id === id
          ? { ...r, data: { ...r.data, ...updates }, updatedAt: new Date().toISOString() }
          : r,
      ),
    }));
  }, []);

  const upsertSurgeryRequest = useCallback((record: SurgeryRequestRecord) => {
    setStore((s) => {
      const i = s.surgeryRequests.findIndex((r) => r.id === record.id);
      if (i === -1) return { ...s, surgeryRequests: [record, ...s.surgeryRequests] };
      const next = [...s.surgeryRequests];
      next[i] = record;
      return { ...s, surgeryRequests: next };
    });
  }, []);

  const deleteSurgeryRequest = useCallback((id: string) => {
    setStore((s) => ({ ...s, surgeryRequests: s.surgeryRequests.filter((r) => r.id !== id) }));
  }, []);

  const markRequestDraft = useCallback(
    (id: string) => {
      setStore((s) => ({
        ...s,
        surgeryRequests: s.surgeryRequests.map((r) =>
          r.id === id ? { ...r, status: 'draft' as const, updatedAt: new Date().toISOString() } : r,
        ),
      }));
      showToast('Draft saved.');
    },
    [showToast],
  );

  const markRequestInReview = useCallback(
    (id: string) => {
      setStore((s) => ({
        ...s,
        surgeryRequests: s.surgeryRequests.map((r) =>
          r.id === id ? { ...r, status: 'in_review' as const, updatedAt: new Date().toISOString() } : r,
        ),
      }));
      showToast('Marked in review.');
    },
    [showToast],
  );

  const submitSurgeryRequest = useCallback(
    (id: string) => {
      setStore((s) => {
        const rec = s.surgeryRequests.find((r) => r.id === id);
        return {
          ...s,
          surgeryRequests: s.surgeryRequests.map((r) =>
            r.id === id ? { ...r, status: 'scheduled' as const, updatedAt: new Date().toISOString() } : r,
          ),
          surgeryHistory: rec
            ? [
                {
                  id: `h-${Date.now()}`,
                  name: rec.data.patientName || 'Patient',
                  details: `Submitted • ${rec.data.operationType || 'Procedure'}`,
                  time: `Logged ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                  deviation: 'Awaiting OR slot',
                  status: 'success' as const,
                },
                ...s.surgeryHistory,
              ]
            : s.surgeryHistory,
        };
      });
      showToast('Surgery request submitted.');
    },
    [showToast],
  );

  const optimizeSchedulingQueue = useCallback(() => {
    setStore((s) => ({
      ...s,
      schedulingQueue: [...s.schedulingQueue].sort(
        (a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9),
      ),
    }));
    showToast('Queue optimized by priority (emergency first).');
  }, [showToast]);

  const exportFullStore = useCallback(() => {
    downloadJsonFile(`clinical-store-${new Date().toISOString().slice(0, 10)}.json`, store);
    showToast('Exported full data store JSON.');
  }, [store, showToast]);

  const removeSchedulingQueueRow = useCallback(
    (id: string) => {
      setStore((s) => ({ ...s, schedulingQueue: s.schedulingQueue.filter((r) => r.id !== id) }));
      showToast('Case removed from scheduling queue.');
    },
    [showToast],
  );

  const scheduleUnscheduledRow = useCallback(
    (id: string) => {
      let label = '';
      setStore((s) => {
        const row = s.unscheduledBacklog.find((x) => x.id === id);
        if (!row || row.color !== 'emerald') return s;
        label = row.name;
        const data = createBlankSurgeryRequest();
        data.patientName = row.name;
        data.operationType = row.procedure;
        data.primarySurgeon = row.surgeon;
        data.priority = mapBacklogPriorityToCase(row.priority);
        const newReq = createRequestRecord(data, { status: 'draft' });
        const slot: TodayScheduleSlot = {
          id: `ts-${crypto.randomUUID().slice(0, 8)}`,
          time: 'TBD',
          duration: '—',
          title: row.procedure,
          tag: 'QUEUED',
          tagColor: 'slate',
          or: 'Assign OR',
          surgeon: row.surgeon,
          isFuture: true,
        };
        return {
          ...s,
          unscheduledBacklog: s.unscheduledBacklog.filter((x) => x.id !== id),
          todaySchedule: [...s.todaySchedule, slot],
          surgeryRequests: [newReq, ...s.surgeryRequests],
        };
      });
      if (label) showToast(`${label}: added to today’s board + new draft request.`);
      else showToast('This row cannot be scheduled until issues are resolved.');
    },
    [showToast],
  );

  const bumpOngoingProgress = useCallback((id: string, delta: number) => {
    setStore((s) => ({
      ...s,
      ongoingSurgeries: s.ongoingSurgeries.map((c) =>
        c.id === id
          ? {
              ...c,
              progress: Math.min(100, Math.max(0, Math.round(c.progress + delta))),
              isOvertime: c.progress + delta > 95 ? true : c.isOvertime,
            }
          : c,
      ),
    }));
  }, []);

  const upsertContract = useCallback((contract: Contract) => {
    setStore((s) => {
      const idx = s.contracts.findIndex((c) => c.id === contract.id);
      if (idx === -1) return { ...s, contracts: [contract, ...s.contracts] };
      const next = [...s.contracts];
      next[idx] = contract;
      return { ...s, contracts: next };
    });
    showToast(`Contract ${contract.id} saved.`);
  }, [showToast]);

  const replaceContracts = useCallback((contracts: Contract[]) => {
    setStore((s) => ({ ...s, contracts }));
  }, []);

  const deleteContract = useCallback((id: string) => {
    setStore((s) => ({
      ...s,
      contracts: s.contracts.filter((c) => c.id !== id),
    }));
    showToast('Contract deleted.');
  }, [showToast]);

  const upsertStaff = useCallback((member: StaffMember) => {
    setStore((s) => {
      const idx = s.staff.findIndex((m) => m.id === member.id);
      if (idx === -1) return { ...s, staff: [member, ...s.staff] };
      const next = [...s.staff];
      next[idx] = member;
      return { ...s, staff: next };
    });
    showToast(`Staff member ${member.name} updated.`);
  }, [showToast]);

  const replaceStaff = useCallback((staff: StaffMember[]) => {
    setStore((s) => ({ ...s, staff }));
  }, []);

  const deleteStaff = useCallback((id: string) => {
    setStore((s) => ({
      ...s,
      staff: s.staff.map((m) => m.id === id ? { ...m, status: 'Archived' as const } : m),
    }));
    showToast('Staff member archived.');
  }, [showToast]);

  const upsertResourcePool = useCallback((pool: ResourcePool) => {
    setStore((s) => {
      const idx = s.resourcePools.findIndex((p) => p.id === pool.id);
      if (idx === -1) return { ...s, resourcePools: [pool, ...s.resourcePools] };
      const next = [...s.resourcePools];
      next[idx] = pool;
      return { ...s, resourcePools: next };
    });
    showToast(`Resource pool ${pool.name} updated.`);
  }, [showToast]);

  const deleteResourcePool = useCallback((id: string) => {
    setStore((s) => ({
      ...s,
      resourcePools: s.resourcePools.filter((p) => p.id !== id),
    }));
    showToast('Resource pool deleted.');
  }, [showToast]);

  const updateSettings = useCallback((updates: Partial<GlobalSettings>) => {
    setStore((s) => ({
      ...s,
      settings: { ...s.settings, ...updates },
    }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const orgId = 1;
        const [opTypes, phaseResources] = await Promise.all([
          getCatalogOperationTypes({ orgId }),
          getCatalogPhaseResources({ orgId }),
        ]);
        if (cancelled) return;

        setStore((s) => {
          const nextSettings: GlobalSettings = { ...s.settings };

          if (Array.isArray(opTypes) && opTypes.length > 0) {
            const labels = opTypes.map((r) => formatOperationTypeLabel(r)).filter(Boolean);
            if (labels.length > 0) nextSettings.operationTypes = labels;
          }

          if (Array.isArray(phaseResources) && phaseResources.length > 0) {
            const existing = s.settings?.phaseResources ?? {};
            const nextPhase: Record<string, DefaultResourceSetting[]> = {};
            PHASE_KEYS.forEach((k) => {
              nextPhase[k] = [];
            });
            phaseResources.forEach((r) => {
              const type = normalizePhaseTypeToId(r.type);
              if (!type) return;
              if (!nextPhase[type]) nextPhase[type] = [];
              const name = String(r.name ?? '').trim();
              if (!name) return;
              const icon =
                existing[type]?.find((x) => String(x.name).trim().toLowerCase() === name.toLowerCase())?.icon || 'user';
              nextPhase[type].push({
                name,
                count: Math.max(1, Number((r as any).default_count) || 1),
                icon,
              });
            });
            nextSettings.phaseResources = nextPhase;
          }

          return { ...s, settings: nextSettings };
        });
      } catch {
        return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AppStoreContextValue>(
    () => ({
      activeOrgId,
      setActiveOrgId,
      activeOrgName,
      setActiveOrgName,
      store,
      searchQuery,
      setSearchQuery,
      toast,
      pushToast: showToast,
      replaceStore,
      resetStoreToSeed,
      filteredSurgeryRequests,
      updateRequestData,
      upsertSurgeryRequest,
      deleteSurgeryRequest,
      markRequestDraft,
      markRequestInReview,
      submitSurgeryRequest,
      optimizeSchedulingQueue,
      exportFullStore,
      removeSchedulingQueueRow,
      scheduleUnscheduledRow,
      bumpOngoingProgress,
      upsertContract,
      replaceContracts,
      deleteContract,
      upsertStaff,
      replaceStaff,
      deleteStaff,
      upsertResourcePool,
      deleteResourcePool,
      updateSettings,
    }),
    [
      activeOrgId,
      activeOrgName,
      store,
      searchQuery,
      toast,
      showToast,
      replaceStore,
      resetStoreToSeed,
      filteredSurgeryRequests,
      updateRequestData,
      upsertSurgeryRequest,
      deleteSurgeryRequest,
      markRequestDraft,
      markRequestInReview,
      submitSurgeryRequest,
      optimizeSchedulingQueue,
      exportFullStore,
      removeSchedulingQueueRow,
      scheduleUnscheduledRow,
      bumpOngoingProgress,
      upsertContract,
      replaceContracts,
      deleteContract,
      upsertStaff,
      replaceStaff,
      deleteStaff,
      upsertResourcePool,
      deleteResourcePool,
      updateSettings,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
  return ctx;
}
