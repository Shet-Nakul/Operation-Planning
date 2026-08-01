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
import {
  getCatalogDepartments,
  getCatalogOperationTypes,
  getCatalogPhaseResources,
  getCatalogResourceTypes,
  getCatalogShifts,
  getCatalogSkills,
  getCatalogSpecializations,
  getCatalogStaffTags,
  getForbiddenPatternRecords,
  getOrganizationById,
  getOrgGlobalSettings,
} from '../lib/api';
import type { AppDataStore } from '../types/store';
import type { TodayScheduleSlot } from '../types/store';
import type { Priority, SurgeryRequest, SurgeryRequestRecord, SurgeryRuntimeState } from '../types/surgery';
import type { Contract } from '../components/contracts/types';
import type { StaffMember } from '../components/staff/types';
import type { ResourcePool } from '../components/hr-pool/types';
import {
  DEFAULT_FORBIDDEN_PATTERNS,
  DEFAULT_GLOBAL_SETTINGS,
  type CatalogSettings,
  type DefaultResourceSetting,
  type ForbiddenPattern,
  type GlobalSettings,
  type OrgGlobalSettings,
} from '../types/settings';

export type ToastVariant = 'success' | 'error' | 'info';

export type ToastState = {
  id: string;
  message: string;
  variant: ToastVariant;
  createdAt: number;
  durationMs: number;
};

export type ToastInput =
  | string
  | {
      message: string;
      variant?: ToastVariant;
      durationMs?: number;
    };

export type ModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
};

type AppStoreContextValue = {
  activeOrgId: number;
  setActiveOrgId: (id: number) => void;
  activeOrgName: string;
  setActiveOrgName: (name: string) => void;

  store: AppDataStore;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toast: ToastState | null;
  pushToast: (toast: ToastInput) => void;
  modal: ModalState | null;
  showModal: (modal: Omit<ModalState, 'isOpen'>) => void;
  closeModal: () => void;
  replaceStore: (next: AppDataStore) => void;
  resetStoreToSeed: () => void;

  filteredSurgeryRequests: SurgeryRequestRecord[];

  ongoingSurgeriesDerived: SurgeryRequestRecord[];
  pendingCompletionSurgeries: SurgeryRequestRecord[];
  todayScheduleDerived: SurgeryRequestRecord[];
  backlogDerived: SurgeryRequestRecord[];
  historyDerived: SurgeryRequestRecord[];

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
  bumpSurgeryProgress: (id: string, delta: number) => void;
  markSurgeryPendingCompletion: (id: string) => void;
  confirmSurgeryCompletion: (id: string) => void;
  revertSurgeryToInProgress: (id: string) => void;
  startSurgery: (id: string) => void;

  upsertContract: (contract: Contract) => void;
  replaceContracts: (contracts: Contract[]) => void;
  deleteContract: (id: string) => void;

  upsertStaff: (member: StaffMember) => void;
  replaceStaff: (staff: StaffMember[]) => void;
  deleteStaff: (id: string) => void;

  upsertResourcePool: (pool: ResourcePool) => void;
  replaceResourcePools: (pools: ResourcePool[]) => void;
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

function normalizeRoleNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((entry) => String(entry ?? '').trim())
        .filter(Boolean),
    ),
  );
}

function normalizeCatalogSettings(seed?: Partial<CatalogSettings>): CatalogSettings {
  return {
    staffTags: Array.isArray((seed as any)?.staffTags) ? (seed as any).staffTags : [],
    specializations: Array.isArray((seed as any)?.specializations) ? (seed as any).specializations : [],
    skills: Array.isArray((seed as any)?.skills) ? (seed as any).skills : [],
    resourceTypes: Array.isArray((seed as any)?.resourceTypes) ? (seed as any).resourceTypes : [],
    departments: Array.isArray((seed as any)?.departments) ? (seed as any).departments : [],
    shifts: Array.isArray((seed as any)?.shifts) ? (seed as any).shifts : [],
  };
}

function normalizeForbiddenPatterns(value: unknown): ForbiddenPattern[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((pattern: any) => {
      const text = String(pattern?.pattern ?? '').trim();
      const id = String(pattern?.id ?? text);
      return {
        id,
        pattern: text,
        description: String(pattern?.description ?? ''),
        enabled: Boolean(pattern?.enabled ?? true),
      };
    })
    .filter((pattern) => Boolean(pattern.id && pattern.pattern));
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
  const [toast, setToast] = useState<ToastState | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
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

  const showToast = useCallback((input: ToastInput) => {
    const createdAt = Date.now();
    const parsed =
      typeof input === 'string'
        ? {
            message: input,
            variant: /(^|\b)(failed|error)\b/i.test(input) ? ('error' as const) : ('success' as const),
            durationMs: 5000,
          }
        : {
            message: input.message,
            variant: input.variant ?? ('success' as const),
            durationMs: input.durationMs ?? 5000,
          };

    setToast({
      id: `${createdAt}-${Math.random().toString(36).slice(2, 9)}`,
      message: parsed.message,
      variant: parsed.variant,
      createdAt,
      durationMs: parsed.durationMs,
    });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), parsed.durationMs);
  }, []);

  const showModal = useCallback((modalData: Omit<ModalState, 'isOpen'>) => {
    setModal({
      ...modalData,
      isOpen: true,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
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

  const ongoingSurgeriesDerived = useMemo(
    () =>
      store.surgeryRequests.filter(
        (r) => r.status === 'IN_PROGRESS' && (r.runtime?.progress ?? 0) < 100,
      ),
    [store.surgeryRequests],
  );

  const pendingCompletionSurgeries = useMemo(
    () =>
      store.surgeryRequests.filter(
        (r) => r.status === 'IN_PROGRESS' && (r.runtime?.progress ?? 0) >= 100,
      ),
    [store.surgeryRequests],
  );

  const todayScheduleDerived = useMemo(() => {
    const today = new Date().toDateString();
    return store.surgeryRequests.filter((r) => {
      if (r.status === 'IN_PROGRESS') return true;
      if (r.status === 'PLANNED') {
        const plannedStart = r.planResult?.result?.planned_start as string | undefined;
        if (plannedStart) {
          try {
            return new Date(plannedStart).toDateString() === today;
          } catch {
            return true;
          }
        }
        return true;
      }
      return false;
    });
  }, [store.surgeryRequests]);

  const backlogDerived = useMemo(
    () =>
      store.surgeryRequests.filter((r) =>
        ['DRAFT', 'ESTIMATED', 'PLANNING'].includes(r.status),
      ),
    [store.surgeryRequests],
  );

  const historyDerived = useMemo(
    () => store.surgeryRequests.filter((r) => r.status === 'DONE'),
    [store.surgeryRequests],
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
          r.id === id ? { ...r, status: 'DRAFT' as const, updatedAt: new Date().toISOString() } : r,
        ),
      }));
      showToast('Draft saved.');
    },
    [activeOrgId, showToast],
  );

  const markRequestInReview = useCallback(
    (id: string) => {
      setStore((s) => ({
        ...s,
        surgeryRequests: s.surgeryRequests.map((r) =>
          r.id === id ? { ...r, status: 'ESTIMATED' as const, updatedAt: new Date().toISOString() } : r,
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
            r.id === id ? { ...r, status: 'PLANNED' as const, updatedAt: new Date().toISOString() } : r,
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
        const newReq = createRequestRecord(data, activeOrgId, { status: 'DRAFT' });
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

  const bumpSurgeryProgress = useCallback((id: string, delta: number) => {
    setStore((s) => ({
      ...s,
      surgeryRequests: s.surgeryRequests.map((r) => {
        if (r.id !== id) return r;
        const currentProgress = r.runtime?.progress ?? 0;
        const newProgress = Math.min(100, Math.max(0, Math.round(currentProgress + delta)));
        const isOvertime = newProgress > 95 ? true : r.runtime?.isOvertime ?? false;
        const existingRuntime: SurgeryRuntimeState = {
          progress: 0,
          elapsedTime: '0h 00m',
          estimatedTime: '0h 00m',
          assignedOr: 'OR-01',
          assignedRoom: 'OR Suite 1',
          ...r.runtime,
        };
        return {
          ...r,
          updatedAt: new Date().toISOString(),
          runtime: {
            ...existingRuntime,
            progress: newProgress,
            isOvertime,
          },
        };
      }),
    }));
  }, []);

  const startSurgery = useCallback(
    (id: string) => {
      setStore((s) => ({
        ...s,
        surgeryRequests: s.surgeryRequests.map((r) => {
          if (r.id !== id || r.status !== 'PLANNED') return r;
          const totalDuration = Object.values(r.data.phases).reduce((acc, ph) => {
            let total = 0;
            const dayMatch = ph.duration.match(/(\d+)\s*day/);
            const hourMatch = ph.duration.match(/(\d+)\s*hr/);
            const minMatch = ph.duration.match(/(\d+)\s*min/);
            if (dayMatch) total += parseInt(dayMatch[1], 10) * 24 * 60;
            if (hourMatch) total += parseInt(hourMatch[1], 10) * 60;
            if (minMatch) total += parseInt(minMatch[1], 10);
            return acc + total;
          }, 0);
          const hours = Math.floor(totalDuration / 60);
          const mins = totalDuration % 60;
          const estStr = totalDuration > 0 ? `${hours}h ${mins.toString().padStart(2, '0')}m` : '1h 30m';
          const derivedOr = r.planResult?.result?.resources_assigned
            ? Object.keys(r.planResult.result.resources_assigned).find((k) =>
                k.toLowerCase().includes('room') || k.toLowerCase().includes('or'),
              ) ?? 'OR-01'
            : 'OR-01';
          const existingRuntime = r.runtime ?? {};
          const assignedResources: NonNullable<SurgeryRequestRecord['lockedResources']> = [];
          const res = r.planResult?.result?.resources_assigned;
          if (res && typeof res === 'object') {
            Object.entries(res as Record<string, unknown>).forEach(([key, val], idx) => {
              const isStaff = /(surgeon|nurse|anesth|staff|role|doctor)/i.test(key);
              const isRoom = /(room|suite|or_|operating|theatre)/i.test(key);
              const type: 'staff' | 'room' | 'equipment' | 'device' | 'supply' = isRoom
                ? 'room'
                : isStaff
                  ? 'staff'
                  : 'equipment';
              let name = 'Allocated';
              if (Array.isArray(val) && val.length > 0) {
                const first = val[0];
                if (typeof first === 'string') name = first;
                else if (first && typeof first === 'object') {
                  const anyName = (first as Record<string, unknown>).name;
                  name = anyName ? String(anyName) : String(val.length) + ' assigned';
                } else {
                  name = String(val.length) + ' assigned';
                }
              } else if (typeof val === 'string') {
                name = val;
              } else if (val && typeof val === 'object') {
                const anyName = (val as Record<string, unknown>).name;
                if (anyName) name = String(anyName);
              }
              assignedResources.push({
                id: `lr-${id}-${idx}-${key}`,
                name,
                type,
                role: key.replace(/_/g, ' '),
                status: 'in-use',
                phase: 'operative',
              });
            });
          }
          r.data.phases.preOp.resources.forEach((res, idx) => {
            assignedResources.push({
              id: `lr-${id}-preop-${idx}`,
              name: res.name,
              type: 'staff',
              role: res.roles?.join(', ') ?? 'Pre-op Team',
              status: 'in-use',
              phase: 'Pre-operative',
              count: res.count,
            });
          });
          r.data.phases.operative.resources.forEach((res, idx) => {
            assignedResources.push({
              id: `lr-${id}-op-${idx}`,
              name: res.name,
              type: 'staff',
              role: res.roles?.join(', ') ?? 'Surgical Team',
              status: 'in-use',
              phase: 'Operative',
              count: res.count,
            });
          });
          return {
            ...r,
            status: 'IN_PROGRESS' as const,
            updatedAt: new Date().toISOString(),
            runtime: {
              progress: 0,
              elapsedTime: '0h 00m',
              estimatedTime: estStr,
              assignedOr: derivedOr,
              assignedRoom: `OR Suite ${derivedOr.split('-').pop() ?? '1'}`,
              isOvertime: false,
              ...existingRuntime,
            },
            lockedResources: assignedResources.length > 0 ? assignedResources : r.lockedResources,
          };
        }),
      }));
      showToast('Surgery started. Resources locked and allocated.');
    },
    [showToast],
  );

  const markSurgeryPendingCompletion = useCallback(
    (id: string) => {
      setStore((s) => ({
        ...s,
        surgeryRequests: s.surgeryRequests.map((r) => {
          if (r.id !== id) return r;
          const existingRuntime: SurgeryRuntimeState = {
            elapsedTime: r.runtime?.estimatedTime ?? '1h 30m',
            estimatedTime: r.runtime?.estimatedTime ?? '1h 30m',
            assignedOr: r.runtime?.assignedOr ?? 'OR-01',
            assignedRoom: r.runtime?.assignedRoom ?? 'OR Suite 1',
            isOvertime: (r.runtime?.progress ?? 0) > 100,
            ...r.runtime,
            progress: 100,
            completedAt: new Date().toISOString(),
          };
          return {
            ...r,
            updatedAt: new Date().toISOString(),
            runtime: existingRuntime,
          };
        }),
      }));
      showToast('Surgery marked as complete — awaiting final confirmation.');
    },
    [showToast],
  );

  const confirmSurgeryCompletion = useCallback(
    (id: string) => {
      setStore((s) => {
        const rec = s.surgeryRequests.find((r) => r.id === id);
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let deviation = 'On Schedule';
        let devStatus: 'success' | 'error' = 'success';
        if (rec?.runtime?.deviationMinutes) {
          const m = rec.runtime.deviationMinutes;
          if (m > 0) {
            deviation = `+${m}m (Delay)`;
            devStatus = 'error';
          } else if (m < 0) {
            deviation = `${m}m (Ahead)`;
          }
        } else if (rec?.runtime?.isOvertime) {
          deviation = '+15m (Delay)';
          devStatus = 'error';
        }
        return {
          ...s,
          surgeryRequests: s.surgeryRequests.map((r) => {
            if (r.id !== id) return r;
            return {
              ...r,
              status: 'DONE' as const,
              updatedAt: now.toISOString(),
              runtime: {
                ...(r.runtime ?? { progress: 100 }),
                progress: 100,
                completedAt: now.toISOString(),
              },
              lockedResources: (r.lockedResources ?? []).map((lr) => ({
                ...lr,
                status: 'released' as const,
              })),
            };
          }),
          surgeryHistory: rec
            ? [
                {
                  id: `h-${Date.now()}`,
                  name: rec.data.patientName || 'Patient',
                  details: `${rec.data.primarySurgeon || 'Lead Surgeon'} • ${rec.data.operationType || 'Procedure'}`,
                  time: `Completed ${timeStr}`,
                  deviation,
                  status: devStatus,
                },
                ...s.surgeryHistory,
              ]
            : s.surgeryHistory,
        };
      });
      showToast('Surgery confirmed as complete. Resources released.');
    },
    [showToast],
  );

  const revertSurgeryToInProgress = useCallback(
    (id: string) => {
      setStore((s) => ({
        ...s,
        surgeryRequests: s.surgeryRequests.map((r) => {
          if (r.id !== id) return r;
          return {
            ...r,
            updatedAt: new Date().toISOString(),
            runtime: {
              ...(r.runtime ?? { progress: 95 }),
              progress: 95,
              completedAt: undefined,
            },
          };
        }),
      }));
      showToast('Reverted to in-progress.');
    },
    [showToast],
  );

  const upsertContract = useCallback((contract: Contract) => {
    setStore((s) => {
      const idx = s.contracts.findIndex((c) => c.id === contract.id);
      if (idx === -1) return { ...s, contracts: [contract, ...s.contracts] };
      const next = [...s.contracts];
      next[idx] = contract;
      return { ...s, contracts: next };
    });
    showToast('Contract saved successfully.');
  }, [showToast]);

  const replaceContracts = useCallback((contracts: Contract[]) => {
    setStore((s) => ({ ...s, contracts }));
  }, []);

  const deleteContract = useCallback((id: string) => {
    setStore((s) => ({
      ...s,
      contracts: s.contracts.filter((c) => c.id !== id),
    }));
    showToast('Contract deleted successfully.');
  }, [showToast]);

  const upsertStaff = useCallback((member: StaffMember) => {
    setStore((s) => {
      const idx = s.staff.findIndex((m) => m.id === member.id);
      if (idx === -1) return { ...s, staff: [member, ...s.staff] };
      const next = [...s.staff];
      next[idx] = member;
      return { ...s, staff: next };
    });
    showToast('Staff member updated successfully.');
  }, [showToast]);

  const replaceStaff = useCallback((staff: StaffMember[]) => {
    setStore((s) => ({ ...s, staff }));
  }, []);

  const deleteStaff = useCallback((id: string) => {
    setStore((s) => ({
      ...s,
      staff: s.staff.map((m) => m.id === id ? { ...m, status: 'Archived' as const } : m),
    }));
    showToast('Staff member archived successfully.');
  }, [showToast]);

  const upsertResourcePool = useCallback((pool: ResourcePool) => {
    setStore((s) => {
      const idx = s.resourcePools.findIndex((p) => p.id === pool.id);
      if (idx === -1) return { ...s, resourcePools: [pool, ...s.resourcePools] };
      const next = [...s.resourcePools];
      next[idx] = pool;
      return { ...s, resourcePools: next };
    });
    showToast('Resource pool updated successfully.');
  }, [showToast]);

  const deleteResourcePool = useCallback((id: string) => {
    setStore((s) => ({
      ...s,
      resourcePools: s.resourcePools.filter((p) => p.id !== id),
    }));
    showToast('Resource pool deleted successfully.');
  }, [showToast]);

  const replaceResourcePools = useCallback((pools: ResourcePool[]) => {
    setStore((s) => ({ ...s, resourcePools: pools }));
  }, []);

  const updateSettings = useCallback((updates: Partial<GlobalSettings>) => {
    setStore((s) => ({
      ...s,
      settings: { ...s.settings, ...updates },
    }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const orgId = activeOrgId || 1;
      try {
        const [org, opTypes, phaseResources, staffTags, specializations, skills, resourceTypes, departments, shifts, globalSettings, forbiddenRows] =
          await Promise.all([
            getOrganizationById(orgId),
            getCatalogOperationTypes({ orgId }),
            getCatalogPhaseResources({ orgId }),
            getCatalogStaffTags({ orgId }),
            getCatalogSpecializations({ orgId }),
            getCatalogSkills({ orgId }),
            getCatalogResourceTypes({ orgId }),
            getCatalogDepartments({ orgId }),
            getCatalogShifts({ orgId }),
            getOrgGlobalSettings(orgId).catch((error: any) => {
              const message = String(error?.message ?? '');
              if (!/not found/i.test(message)) throw error;
              return null;
            }),
            getForbiddenPatternRecords({ orgId }).catch(() => []),
          ]);
        if (cancelled) return;

        setActiveOrgName(String(org?.name ?? ''));

        setStore((s) => {
          const baseSettings = s.settings ?? DEFAULT_GLOBAL_SETTINGS;
          const nextSettings: GlobalSettings = { ...baseSettings };
          const existingCatalogs = baseSettings.catalogs ?? DEFAULT_GLOBAL_SETTINGS.catalogs;

          if (Array.isArray(opTypes) && opTypes.length > 0) {
            const labels = opTypes.map((r) => formatOperationTypeLabel(r)).filter(Boolean);
            if (labels.length > 0) nextSettings.operationTypes = labels;
          }

          if (Array.isArray(phaseResources) && phaseResources.length > 0) {
            const existing = baseSettings.phaseResources ?? DEFAULT_GLOBAL_SETTINGS.phaseResources;
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
                roles: normalizeRoleNames((r as any).roles),
              });
            });
            nextSettings.phaseResources = nextPhase;
          }

          const hasCatalogRows = [staffTags, specializations, skills, resourceTypes, departments, shifts].some(
            (rows) => Array.isArray(rows) && rows.length > 0,
          );
          if (hasCatalogRows) {
            nextSettings.catalogs = normalizeCatalogSettings({
              staffTags: Array.isArray(staffTags) && staffTags.length > 0 ? staffTags : existingCatalogs.staffTags,
              specializations:
                Array.isArray(specializations) && specializations.length > 0 ? specializations : existingCatalogs.specializations,
              skills: Array.isArray(skills) && skills.length > 0 ? skills : existingCatalogs.skills,
              resourceTypes: Array.isArray(resourceTypes) && resourceTypes.length > 0 ? resourceTypes : existingCatalogs.resourceTypes,
              departments: Array.isArray(departments) && departments.length > 0 ? departments : existingCatalogs.departments,
              shifts: Array.isArray(shifts) && shifts.length > 0 ? shifts : existingCatalogs.shifts,
            });
          }

          if (globalSettings) {
            nextSettings.orgGlobalSettings = {
              organization_id: globalSettings.organization_id,
              operation_hours_start: globalSettings.operation_hours_start,
              operation_hours_end: globalSettings.operation_hours_end,
              surgery_planning_horizon: globalSettings.surgery_planning_horizon,
              roster_planning_horizon: globalSettings.roster_planning_horizon,
              surgery_planning_resolution: globalSettings.surgery_planning_resolution,
            };
          }

          const preferredForbiddenPatterns = normalizeForbiddenPatterns(
            Array.isArray(forbiddenRows) && forbiddenRows.length > 0
              ? (forbiddenRows.find((row: any) => String(row?.scope ?? '').trim().toUpperCase() === 'GLOBAL') ?? forbiddenRows[0])?.forbidden_patterns
              : undefined,
          );
          if (preferredForbiddenPatterns.length > 0) {
            nextSettings.forbiddenPatterns = preferredForbiddenPatterns;
          } else if (!nextSettings.forbiddenPatterns?.length) {
            nextSettings.forbiddenPatterns = baseSettings.forbiddenPatterns ?? DEFAULT_FORBIDDEN_PATTERNS;
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
  }, [activeOrgId]);

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
      modal,
      showModal,
      closeModal,
      replaceStore,
      resetStoreToSeed,
      filteredSurgeryRequests,
      ongoingSurgeriesDerived,
      pendingCompletionSurgeries,
      todayScheduleDerived,
      backlogDerived,
      historyDerived,
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
      bumpSurgeryProgress,
      markSurgeryPendingCompletion,
      confirmSurgeryCompletion,
      revertSurgeryToInProgress,
      startSurgery,
      upsertContract,
      replaceContracts,
      deleteContract,
      upsertStaff,
      replaceStaff,
      deleteStaff,
      upsertResourcePool,
      replaceResourcePools,
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
      modal,
      showModal,
      closeModal,
      replaceStore,
      resetStoreToSeed,
      filteredSurgeryRequests,
      ongoingSurgeriesDerived,
      pendingCompletionSurgeries,
      todayScheduleDerived,
      backlogDerived,
      historyDerived,
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
      bumpSurgeryProgress,
      markSurgeryPendingCompletion,
      confirmSurgeryCompletion,
      revertSurgeryToInProgress,
      startSurgery,
      upsertContract,
      replaceContracts,
      deleteContract,
      upsertStaff,
      replaceStaff,
      deleteStaff,
      upsertResourcePool,
      replaceResourcePools,
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
