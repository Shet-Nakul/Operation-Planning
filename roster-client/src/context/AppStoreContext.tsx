import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Contract } from '../components/contracts/types';
import type { StaffMember } from '../components/staff/types';
import type { ResourcePool } from '../components/hr-pool/types';
import { DEFAULT_GLOBAL_SETTINGS, type GlobalSettings } from '../types/settings';
import { fromSolverForbiddenPatterns } from '../lib/forbiddenPatterns';
import {
  getCatalogDepartments, getCatalogShifts, getCatalogSkills, getCatalogSpecializations,
  getCatalogStaffTags, getForbiddenPatternRecords, getOrgGlobalSettings,
  readAuthSession, subscribeAuthSession,
} from '../lib/api';

export type ToastState = { id: string; message: string; variant: 'success' | 'error' | 'info'; createdAt: number; durationMs: number };
type ToastInput = string | { message: string; variant?: ToastState['variant']; durationMs?: number };
export type ModalState = { isOpen: boolean; title: string; message: string; type: 'error' | 'warning' | 'info' | 'success' };
type Store = { contracts: Contract[]; staff: StaffMember[]; resourcePools: ResourcePool[]; settings: GlobalSettings };
type Context = {
  activeOrgId: number;
  store: Store;
  toast: ToastState | null;
  pushToast: (input: ToastInput) => void;
  replaceStaff: (rows: StaffMember[]) => void;
  upsertStaff: (row: StaffMember) => void;
  replaceContracts: (rows: Contract[]) => void;
  upsertContract: (row: Contract) => void;
  deleteContract: (id: string) => void;
  updateSettings: (settings: Partial<GlobalSettings>) => void;
  refreshSettings: () => void;
};

const initialStore = (): Store => ({
  contracts: [], staff: [], resourcePools: [],
  settings: {
    ...DEFAULT_GLOBAL_SETTINGS,
    catalogs: { staffTags: [], specializations: [], skills: [], resourceTypes: [], departments: [], shifts: [] },
  },
});

export const AppStoreContext = createContext<Context | null>(null);

export function useAppStore() {
  const value = useContext(AppStoreContext);
  if (!value) throw new Error('AppStoreContext not found');
  return value;
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(readAuthSession);
  const [store, setStore] = useState(initialStore);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [settingsRevision, setSettingsRevision] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeOrgId = session.user?.organization_id ?? 0;
  useEffect(() => subscribeAuthSession(setSession), []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const pushToast = useCallback((input: ToastInput) => {
    const data = typeof input === 'string' ? { message: input } : input;
    const createdAt = Date.now();
    const durationMs = data.durationMs ?? 5000;
    setToast({ id: `${createdAt}-${Math.random()}`, message: data.message, variant: data.variant ?? 'success', createdAt, durationMs });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), durationMs);
  }, []);
  const refreshSettings = useCallback(() => setSettingsRevision(value => value + 1), []);

  useEffect(() => {
    const next = initialStore();
    next.settings.orgGlobalSettings = { ...next.settings.orgGlobalSettings, organization_id: activeOrgId };
    setStore(next);
  }, [session.user?.id, activeOrgId]);
  useEffect(() => {
    if (!session.accessToken || !activeOrgId || session.user?.role === 'SUPERADMIN' || session.user?.role === 'USER') return;
    let cancelled = false;
    Promise.allSettled([
      getCatalogStaffTags({ orgId: activeOrgId }), getCatalogSpecializations({ orgId: activeOrgId }),
      getCatalogSkills({ orgId: activeOrgId }), getCatalogDepartments({ orgId: activeOrgId }),
      getCatalogShifts({ orgId: activeOrgId }), getOrgGlobalSettings(activeOrgId),
      getForbiddenPatternRecords({ orgId: activeOrgId }),
    ] as const).then(([staffTags, specializations, skills, departments, shifts, global, patterns]) => {
      if (cancelled) return;
      const failures = [staffTags, specializations, skills, departments, shifts, global, patterns].filter(result => result.status === 'rejected');
      if (failures.length) pushToast({ message: `Unable to load ${failures.length} rostering settings source(s). Check your connection and permissions.`, variant: 'error' });
      const globalPattern = patterns.status === 'fulfilled' ? patterns.value.find(row => row.scope?.toUpperCase() === 'GLOBAL') : undefined;
      setStore(previous => ({
        ...previous,
        settings: {
          ...previous.settings,
          catalogs: {
            ...previous.settings.catalogs,
            staffTags: staffTags.status === 'fulfilled' ? staffTags.value : previous.settings.catalogs.staffTags,
            specializations: specializations.status === 'fulfilled' ? specializations.value : previous.settings.catalogs.specializations,
            skills: skills.status === 'fulfilled' ? skills.value : previous.settings.catalogs.skills,
            departments: departments.status === 'fulfilled' ? departments.value : previous.settings.catalogs.departments,
            shifts: shifts.status === 'fulfilled' ? shifts.value : previous.settings.catalogs.shifts,
          },
          orgGlobalSettings: global.status === 'fulfilled' ? global.value : previous.settings.orgGlobalSettings,
          forbiddenPatterns: globalPattern ? fromSolverForbiddenPatterns(globalPattern.forbidden_patterns) : patterns.status === 'fulfilled' ? [] : previous.settings.forbiddenPatterns,
        },
      }));
    });
    return () => { cancelled = true; };
  }, [session.accessToken, session.user?.id, session.user?.role, activeOrgId, settingsRevision, pushToast]);

  const replaceStaff = useCallback((staff: StaffMember[]) => setStore(s => ({ ...s, staff })), []);
  const upsertStaff = useCallback((row: StaffMember) => setStore(s => ({ ...s, staff: [row, ...s.staff.filter(item => item.id !== row.id)] })), []);
  const replaceContracts = useCallback((contracts: Contract[]) => setStore(s => ({ ...s, contracts })), []);
  const upsertContract = useCallback((row: Contract) => setStore(s => ({ ...s, contracts: [row, ...s.contracts.filter(item => item.id !== row.id)] })), []);
  const deleteContract = useCallback((id: string) => setStore(s => ({ ...s, contracts: s.contracts.filter(item => item.id !== id) })), []);
  const updateSettings = useCallback((updates: Partial<GlobalSettings>) => setStore(s => ({ ...s, settings: { ...s.settings, ...updates } })), []);

  return <AppStoreContext.Provider value={{ activeOrgId, store, toast, pushToast, replaceStaff, upsertStaff, replaceContracts, upsertContract, deleteContract, updateSettings, refreshSettings }}>{children}</AppStoreContext.Provider>;
}
