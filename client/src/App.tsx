import { useCallback, useEffect, useMemo, useState } from 'react';
import { Library, PlusSquare, Wrench } from 'lucide-react';
import { Sidebar, type AppTabId } from './components/layout/Sidebar';
import { TopNav, type ShellUser } from './components/layout/TopNav';
import ControlCenterPage from './pages/ControlCenterPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import ActivityLogPage from './pages/ActivityLogPage';
import NonRenewableResourcesPage from './pages/NonRenewableResourcesPage';
import AuthPage from './pages/AuthPage';
import OrganizationsAdminPage from './pages/OrganizationsAdminPage';
import UsersAdminPage from './pages/UsersAdminPage';
import RolesAdminPage from './pages/RolesAdminPage';
import { SurgeryRequestsWorkspace } from './components/surgery-request/SurgeryRequestsWorkspace';
import { ToastHost } from './components/ui/ToastHost';
import { ModalHost } from './components/ui/ModalHost';
import { useAppStore } from './context/AppStoreContext';
import { createBlankSurgeryRequest, createRequestRecord } from './data/surgeryRequestDefaults';
import { fetchPlanResults, runPlanningForSurgeries } from './services/api-planning';
import { createSurgery, deleteSurgeryById, getSurgeries, updateSurgeryById } from './services/api-surgeries';
import type { BackendSurgery, BackendSurgeryPlanResult, BackendSurgeryStatus, SurgeryRequestRecord, ResourceNavigationPayload } from './types/surgery';
import { mapBackendSurgeryToRequestRecord, mapRequestToBackendPayload, unwrapPlanResultPayload, withSynchronizedWindow } from './utils/surgeryMappers';
import { ContractLibrary } from './components/contracts/ContractLibrary';
import { CreateContract } from './components/contracts/CreateContract';
import { type Contract as UiContract, type ViewState } from './components/contracts/types';
import StaffDirectory from './components/staff/StaffDirectory';
import CreateProfile from './components/staff/CreateProfile';
import ProfileDetail from './components/staff/ProfileDetail';
import { INITIAL_STAFF } from './components/staff/constants';
import { type StaffMember, normalizeScheduleRoleName } from './components/staff/types';
import { PoolDirectory } from './components/hr-pool/PoolDirectory';
import { NewResourcePool } from './components/hr-pool/NewResourcePool';
import { PoolDemand } from './components/hr-pool/PoolDemand';
import { PoolDetail } from './components/hr-pool/PoolDetail';
import { MOCK_SHIFTS } from './components/hr-pool/constants';
import { EMPTY_HR_POOL_CREATE_DRAFT, type HrPoolCreateDraft, type Member, type Shift, type ViewState as HRPoolViewState } from './components/hr-pool/types';
import { DashboardView } from './components/non-human-pool/DashboardView';
import { CreatePoolView } from './components/non-human-pool/CreatePoolView';
import { PoolDetailsView } from './components/non-human-pool/PoolDetailsView';
import { type ResourcePoolSummary } from './components/non-human-pool/types';
import { extractCanonicalStaffId, resolveAssignedResource } from './lib/resolveAssignedResource';
import { clearAuthSession, deleteStaffById, getCatalogDepartments, getCatalogShifts, getPools, getRenewableResourcePools, getStaff, readAuthSession, subscribeAuthSession, type AuthUser, type ServerPoolDemandMatrixItem, type ServerShift, updateStaffById } from './lib/api';

type RequestsViewMode = 'list' | 'editor' | 'viewer';
type StaffViewMode = 'DIRECTORY' | 'CREATE' | 'DETAIL';

const AVATAR_STATUS =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuArKh3ZmzrFSBdPH4bW9QFfmMNAcCrlWNjfIIP1CIFo6wW7HLjL0de-ed0hrZqhE02uLLlO_eTTTSvZLXH2dX1g4GXD94F4UNUJnGSq-kUVdGkRhBCNuUltzgnLzZhuw142wwdNFY-a9vONxgR7vKP4hnoiXBh7-r3xYxaH43lMeVd8Z1GWWPrcf_yz09l1mkeIpXxnEEDZyRJI4PvZbRy8WA80ZjGepSPINY5lGC2bIqsryMkuz7fl4OYpgvCLyPKsX7rwejvyVd8';

const AVATAR_DEFAULT =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD0D8fgWxvz2E_mFCWDisS05p14wIoRW5-wc1-GnJYWmp24ejlK9RkKdplFejzKUMVjEHtsxZT6ha9kkqvrgiAqo6GMkg5lN9zxtWLZaF5JvBQSUiamW4TjQcgzJJ9KcMS5FrrG1YmV2CWL7dJJq2517MSCM9RsUxd4nboOp0Rx9fbKuPYCkN6xgaruJOKl_LhzxXKTPfcbHwlhiQ_yka9iwvBUrGrQ9FUq14-znHOVhpOxpzCKYm-BlYmhy1GNUK2GINz2tXuLFr8';

function headerTitle(tab: AppTabId): string {
  const titles: Record<AppTabId, string> = {
    'surgery-control-center': 'Operational Control Center',
    'surgery-analytics': 'Analytics Command',
    requests: 'Surgery Requests',
    contracts: 'Staff Contracts Management',
    staff: 'Personnel Management',
    'hr-pool': 'Resource Pools Management',
    'non-human-pool': 'Equipment & Asset Management',
    'non-renewable-resources': 'Medicine Inventory',
    'admin-organizations': 'Organizations',
    'admin-users': 'Users',
    'admin-roles': 'Roles',
    'settings': 'System Settings',
    'activity-log': 'Activity Log',
  };
  return titles[tab];
}

function requestMatchesSearch(record: SurgeryRequestRecord, query: string): boolean {
  const s = query.trim().toLowerCase();
  if (!s) return true;

  return (
    record.referenceCode.toLowerCase().includes(s) ||
    record.data.patientName.toLowerCase().includes(s) ||
    record.data.operationType.toLowerCase().includes(s) ||
    record.data.primarySurgeon.toLowerCase().includes(s) ||
    record.status.toLowerCase().includes(s)
  );
}

function mergeUiDraftIntoRecord(
  backendSurgery: BackendSurgery,
  draftRecord: SurgeryRequestRecord,
  planResult?: BackendSurgeryPlanResult | null,
): SurgeryRequestRecord {
  const mapped = mapBackendSurgeryToRequestRecord(backendSurgery, planResult);
  return {
    ...mapped,
    data: {
      ...mapped.data,
      ...draftRecord.data,
      infectionType: mapped.data.infectionType,
      infectionStatus: draftRecord.data.infectionStatus || mapped.data.infectionStatus,
    },
  };
}

export default function App() {
  const {
    store,
    toast,
    pushToast,
    modal,
    closeModal,
    activeOrgName,
    searchQuery,
    setSearchQuery,
    resetStoreToSeed,
    upsertStaff,
    replaceStaff,
    deleteStaff,
    upsertResourcePool,
    replaceResourcePools,
    deleteResourcePool,
    replaceSurgeryRequests,
  } = useAppStore();

  const [authSession, setAuthSessionState] = useState(() => readAuthSession());
  const authUser = authSession.user;
  const isAuthenticated = Boolean(authSession.accessToken);

  useEffect(() => subscribeAuthSession(setAuthSessionState), []);

  const [activeTab, setActiveTab] = useState<AppTabId>('surgery-control-center');
  const [requestsView, setRequestsView] = useState<RequestsViewMode>('list');
  const [surgeryRequests, setSurgeryRequests] = useState<SurgeryRequestRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isNewRequest, setIsNewRequest] = useState(false);
  const [planningSubmit, setPlanningSubmit] = useState(false);
  const [step, setStep] = useState(1);
  const [contractView, setContractView] = useState<ViewState>('LIBRARY');
  const [activeContractId, setActiveContractId] = useState<string | null>(null);
  const [contractMode, setContractMode] = useState<'create' | 'edit' | 'view'>('create');
  const [staffView, setStaffView] = useState<StaffViewMode>('DIRECTORY');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [staffRosteringFocus, setStaffRosteringFocus] = useState<null | {
    orgId: number;
    employeeId: string;
    dateIso: string;
    shiftKey: string;
    poolId: string;
  }>(null);
  const [hrPoolView, setHrPoolView] = useState<HRPoolViewState>('directory');
  const [selectedHrPoolId, setSelectedHrPoolId] = useState<string | null>(null);
  const [draftHrPoolDemandMatrix, setDraftHrPoolDemandMatrix] = useState<ServerPoolDemandMatrixItem[]>([]);
  const [draftHrPoolForm, setDraftHrPoolForm] = useState<HrPoolCreateDraft>(EMPTY_HR_POOL_CREATE_DRAFT);
  const [shiftList, setShiftList] = useState(MOCK_SHIFTS);
  const [memberList, setMemberList] = useState<Member[]>([]);
  const [nhPoolView, setNhPoolView] = useState<'dashboard' | 'create' | 'details'>('dashboard');
  const [nhPools, setNhPools] = useState<ResourcePoolSummary[]>([]);
  const [nhPoolsLoading, setNhPoolsLoading] = useState(false);
  const [nhPoolsError, setNhPoolsError] = useState<string | null>(null);
  const [selectedNhPoolId, setSelectedNhPoolId] = useState<string | null>(null);
  const [selectedNhUnitId, setSelectedNhUnitId] = useState<string | null>(null);
  const requestOrgId = Number(authUser?.organization_id ?? 1);

  const loadSurgeryRequests = useCallback(async () => {
    const [surgeries, planResults] = await Promise.all([
      getSurgeries({ orgId: requestOrgId }),
      fetchPlanResults(requestOrgId).catch(() => [] as BackendSurgeryPlanResult[]),
    ]);

    const planResultsBySurgeryId = new Map(
      planResults.map((row) => [String(row.surgery_id), row] as const),
    );

    setSurgeryRequests(
      surgeries
        .map((surgery) =>
          mapBackendSurgeryToRequestRecord(
            surgery,
            planResultsBySurgeryId.get(String(surgery.surgery_id)) ?? null,
          ),
        )
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    );
  }, [requestOrgId]);

  useEffect(() => {
    replaceSurgeryRequests(surgeryRequests);
  }, [surgeryRequests, replaceSurgeryRequests]);

  const refreshSurgeries = useCallback(() => {
    loadSurgeryRequests().catch((e: any) => {
      pushToast({ message: `Surgery request sync failed: ${e?.message ?? 'Unknown error'}`, variant: 'error' });
    });
  }, [loadSurgeryRequests, pushToast]);

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'surgery-control-center') return;
    refreshSurgeries();
  }, [activeTab, isAuthenticated, refreshSurgeries]);

  const mapServerStaffToUi = useCallback((rows: any[], departments: any[]): StaffMember[] => {
    const toTitleCase = (s: string) => (s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s);
    const deptById = new Map((departments ?? []).map((d: any) => [Number(d.id), String(d.name)]));

    return rows.map((r) => {
      const rawSkills = r.skills;
      const skills = Array.isArray(rawSkills) ? rawSkills.filter((x) => typeof x === 'string') : [];

      const rawPools = r.pool_assignments;
      const pools = Array.isArray(rawPools)
        ? rawPools
            .map((p: any) => (typeof p?.pool_id === 'string' ? p.pool_id : null))
            .filter((x): x is string => Boolean(x))
        : [];

      const weeklySchedule =
        r.weekly_template && typeof r.weekly_template === 'object'
          ? Object.entries(r.weekly_template as any).flatMap(([day, blocks]) => {
              if (!Array.isArray(blocks)) return [];
              return blocks.map((b: any) => ({
                id: `${r.id}-${day}-${Math.random().toString(36).slice(2, 9)}`,
                day: toTitleCase(String(day)),
                startTime: String(b?.start ?? ''),
                endTime: String(b?.end ?? ''),
                role: normalizeScheduleRoleName(String(b?.role ?? '')),
              }));
            })
          : [];

      const role_distribution = r.role_distribution && typeof r.role_distribution === 'object' ? (r.role_distribution as any) : {};
      const effortRoles = Object.entries(role_distribution).map(([k, v]) => ({
        id: `${r.id}-${k}`,
        type: 'CLINICAL' as const,
        description: k,
        percentage: typeof v === 'number' ? Math.round(v * 100) : 0,
      }));

      const deptNameRaw = typeof (r as any)?.department === 'string' ? String((r as any).department).trim() : '';
      const deptId = typeof (r as any)?.department_id === 'number' ? Number((r as any).department_id) : undefined;
      const deptName = deptNameRaw || (typeof deptId === 'number' ? (deptById.get(deptId) ?? '') : '');

      return {
        id: String(r.id),
        name: r.name,
        title: r.designation || 'Clinical Staff',
        specialization: skills.length > 0 ? skills : ['General'],
        contractId: r.contract_id || '',
        departmentId: typeof deptId === 'number' ? deptId : undefined,
        department: deptName ? String(deptName) : undefined,
        supervisor: r.supervisor || 'Hospital Admin',
        status: 'Active' as const,
        email: r.email || '',
        employeeId: r.staff_id.startsWith('#') ? r.staff_id : `#${r.staff_id}`,
        skills: skills.length > 0 ? skills : ['General Medicine'],
        weeklySchedule,
        effortRoles,
        pools,
      } satisfies StaffMember;
    });
  }, []);

  const loadStaff = useCallback(async () => {
    try {
      const rows = await getStaff({ orgId: 1 });
      const departments = (store.settings?.catalogs as any)?.departments ?? [];
      const staff = mapServerStaffToUi(rows, departments);
      replaceStaff(staff);
      return staff;
    } catch (e: any) {
      pushToast({ message: `Staff sync failed: ${e?.message ?? 'Unknown error'}`, variant: 'error' });
      throw e;
    }
  }, [mapServerStaffToUi, pushToast, replaceStaff, store.settings?.catalogs]);

  const loadResourcePools = useCallback(async () => {
    try {
      const deptRows = await getCatalogDepartments({ orgId: 1 }).catch(() => []);
      const catalogDepartments = (Array.isArray(deptRows) ? deptRows : [])
        .map((r: any) => ({ id: Number(r?.id), name: String(r?.name ?? '').trim() }))
        .filter((r) => Number.isFinite(r.id) && r.name.length > 0);

      const departmentNameById = new Map(catalogDepartments.map((d) => [Number(d.id), String(d.name)]));

      const [hrPoolRows, nhPoolRows] = await Promise.all([
        getPools({ orgId: 1 }).catch(() => []),
        getRenewableResourcePools({ orgId: 1 }).catch(() => []),
      ]);

      const toUiPool = (p: any): any => {
        const meta = (p?.metadata ?? {}) as any;
        const status = meta?.status === 'draft' || meta?.status === 'warning' || meta?.status === 'active' ? meta.status : 'active';
        const deptName =
          typeof p?.department === 'string' && p.department.trim()
            ? p.department
            : typeof p?.department_id === 'number'
              ? (departmentNameById.get(Number(p.department_id)) ?? '')
              : '';
        return {
          id: String(p.pool_id ?? p.poolId ?? p.id ?? ''),
          name: String(p.pool_name ?? p.poolName ?? p.name ?? ''),
          department: String(deptName),
          location: String(p.location ?? ''),
          totalMembers: Number(p.total_members ?? p.totalMembers ?? 0),
          weeklyHours: Number(p.weekly_hours ?? p.weeklyHours ?? 0),
          contractSplit: `${Number(p.static_pct ?? p.staticPct ?? 50)}/${Number(p.dynamic_pct ?? p.dynamicPct ?? 50)}`,
          primarySkill: String(p.primary_role ?? p.primaryRole ?? p.primarySkill ?? ''),
          status,
          icon: String(meta?.icon ?? p.icon ?? 'Users'),
          color: String(meta?.color ?? p.color ?? 'blue'),
        };
      };

      const hrPools = (Array.isArray(hrPoolRows) ? hrPoolRows : []).map(toUiPool);
      const nhPoolsMapped = (Array.isArray(nhPoolRows) ? nhPoolRows : []).map(toUiPool);
      const combined = [...hrPools, ...nhPoolsMapped].filter((p) => p.id && p.name);

      replaceResourcePools(combined as any[]);

      setNhPools(Array.isArray(nhPoolRows) ? (nhPoolRows as any) : []);
      return combined;
    } catch (e: any) {
      pushToast({ message: `Resource pool sync failed: ${e?.message ?? 'Unknown error'}`, variant: 'error' });
      throw e;
    }
  }, [pushToast, replaceResourcePools]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSurgeryRequests([]);
      return;
    }

    loadSurgeryRequests().catch((e: any) => {
      pushToast({ message: `Surgery request sync failed: ${e?.message ?? 'Unknown error'}`, variant: 'error' });
    });

    loadStaff().catch(() => {});
    loadResourcePools().catch(() => {});
  }, [isAuthenticated, loadSurgeryRequests, loadStaff, loadResourcePools, pushToast]);

  useEffect(() => {
    if (activeTab !== 'staff' || staffView !== 'DIRECTORY') return;
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      try { await loadStaff(); } catch {}
    })();
    return () => { cancelled = true; };
  }, [activeTab, staffView, loadStaff]);

  const loadNhPools = useCallback(async () => {
    setNhPoolsLoading(true);
    setNhPoolsError(null);
    try {
      const rows = await getRenewableResourcePools({ orgId: 1 });
      setNhPools(Array.isArray(rows) ? (rows as any) : []);
    } catch (e: any) {
      setNhPoolsError(String(e?.message ?? 'Failed to load pools'));
    } finally {
      setNhPoolsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'non-human-pool') return;
    if (nhPoolView !== 'dashboard') return;
    Promise.allSettled([loadNhPools(), loadResourcePools()]).catch(() => {});
  }, [activeTab, nhPoolView, loadNhPools, loadResourcePools]);

  useEffect(() => {
    if (activeTab !== 'hr-pool') return;
    if (hrPoolView !== 'directory') return;
    loadResourcePools().catch(() => {});
  }, [activeTab, hrPoolView, loadResourcePools]);

  const shiftColorClass = useCallback((name: string) => {
    const s = String(name || '').toLowerCase();
    if (s.includes('night')) return 'text-indigo-500';
    if (s.includes('afternoon') || s.includes('late') || s.includes('evening')) return 'text-orange-500';
    if (s.includes('morning') || s.includes('day') || s.includes('early')) return 'text-amber-500';
    return 'text-slate-500';
  }, []);

  const toUiShift = useCallback((s: ServerShift): Shift => {
    const start = String(s.start_time ?? '');
    const end = String(s.end_time ?? '');
    return {
      id: `catalog-${s.id}`,
      name: String(s.name ?? 'Shift'),
      start,
      end,
      typical: `${start} - ${end}`,
      icon: 'Clock',
      color: shiftColorClass(String(s.name ?? '')),
    };
  }, [shiftColorClass]);

  const loadCatalogShifts = useCallback(async () => {
    const rows = await getCatalogShifts({ orgId: 1 });
    const mapped = rows.map(toUiShift);
    if (mapped.length > 0) setShiftList(mapped);
  }, [toUiShift]);

  const resetHrPoolCreateDraft = useCallback(() => {
    setDraftHrPoolDemandMatrix([]);
    setMemberList([]);
    setDraftHrPoolForm(EMPTY_HR_POOL_CREATE_DRAFT);
    const fromStore = store.settings?.catalogs?.shifts ?? [];
    if (fromStore.length > 0) {
      setShiftList(fromStore.map((s: any) => toUiShift(s)));
    } else {
      setShiftList(MOCK_SHIFTS);
      loadCatalogShifts().catch(() => {});
    }
  }, [loadCatalogShifts, store.settings?.catalogs?.shifts, toUiShift]);

  const navigateHrPool = useCallback((view: HRPoolViewState) => {
    const startingFreshCreate = view === 'new-pool' && hrPoolView === 'directory';
    if (startingFreshCreate) {
      setSelectedHrPoolId(null);
      resetHrPoolCreateDraft();
    }
    setHrPoolView(view);
  }, [hrPoolView, resetHrPoolCreateDraft]);

  /** Handle navigation to a resource from surgery view (staff profile, pool, equipment) */
  const handleNavigateToResource = useCallback((payload: ResourceNavigationPayload) => {
    const { resourceType, resourceId, resourceName, surgeryStartTime, surgeryReference, unitId } = payload;

    const focusDateIso = surgeryStartTime
      ? surgeryStartTime.split('T')[0]
      : new Date().toISOString().split('T')[0];

    const catalog = {
      staff: store.staff || [],
      hrPools: (store.resourcePools || []).map((p) => ({ id: p.id, name: p.name })),
      nhPools: (nhPools || []).map((p) => ({
        pool_id: String(p.pool_id),
        pool_name: String(p.pool_name),
        resource_type: p.resource_type ? String(p.resource_type) : undefined,
        resources: Array.isArray(p.resources) ? p.resources.map(String) : [],
      })),
    };
    const resolved = resolveAssignedResource(
      [resourceId, unitId, resourceName],
      resourceType,
      catalog,
    );
    const kind = resolved?.kind;
    const resolvedType = resolved?.navigationType ?? resourceType;
    const resolvedId = resolved?.resourceId || resourceId;
    const resolvedName = resolved?.resourceName || resourceName;
    const resolvedUnitId = resolved?.unitId || unitId;

    const openStaff = (match: { id: string; employeeId?: string; name: string }) => {
      setStaffRosteringFocus({
        orgId: requestOrgId,
        employeeId: String(match.employeeId ?? '').replace(/^#/, ''),
        dateIso: focusDateIso,
        shiftKey: '',
        poolId: '',
      });
      setActiveTab('staff');
      setSelectedStaffId(match.id);
      setStaffView('DETAIL');
    };

    const openHrPool = (poolId: string, name: string) => {
      setSelectedHrPoolId(poolId);
      setActiveTab('hr-pool');
      setHrPoolView('pool-detail');
      pushToast(`Viewing pool: ${name}. Surgery "${surgeryReference}" is scheduled on ${focusDateIso}.`);
    };

    const openNhPool = (poolId: string, name: string, unit?: string) => {
      setSelectedNhPoolId(poolId);
      setSelectedNhUnitId(unit ?? null);
      setActiveTab('non-human-pool');
      setNhPoolView('details');
      pushToast(`Viewing ${name}${unit ? ` (${unit})` : ''}. Surgery "${surgeryReference}" is scheduled on ${focusDateIso}.`);
    };

    const findStaffMatch = () => {
      const targetId = String(resolvedId ?? '').replace(/^#/, '');
      const canonicalTarget =
        extractCanonicalStaffId(targetId) ??
        extractCanonicalStaffId(String(resourceId ?? '')) ??
        extractCanonicalStaffId(String(resourceName ?? ''));
      return (store.staff || []).find((s) => {
        const staffEmpId = String(s.employeeId ?? '').replace(/^#/, '');
        const staffEmpNorm = staffEmpId.toLowerCase();
        const targetNorm = targetId.toLowerCase();
        return (
          staffEmpId === targetId ||
          s.id === resolvedId ||
          s.name === resolvedName ||
          (canonicalTarget != null && staffEmpNorm === canonicalTarget.toLowerCase())
        );
      });
    };

    const findHrPoolMatch = () => {
      const nhIds = new Set((nhPools || []).map((p) => String(p.pool_id)));
      return (store.resourcePools || []).find((p) => {
        return !nhIds.has(p.id) && (p.id === resolvedId || p.name === resolvedName);
      });
    };

    const findNhPoolMatch = () =>
      (nhPools || []).find((p) => {
        const units = Array.isArray(p.resources) ? p.resources.map(String) : [];
        const target = String(resolvedId ?? '');
        const unit = String(resolvedUnitId ?? '');
        return (
          String(p.pool_id) === target ||
          p.pool_name === resolvedName ||
          units.includes(target) ||
          (unit && (units.includes(unit) || String(p.pool_id) === unit))
        );
      });

    const tryStaff = () => {
      const staffMatch = findStaffMatch();
      if (staffMatch) {
        openStaff(staffMatch);
        return true;
      }
      return false;
    };

    const tryHrPool = () => {
      const poolMatch = findHrPoolMatch();
      if (poolMatch) {
        openHrPool(poolMatch.id, poolMatch.name);
        return true;
      }
      return false;
    };

    const tryNhPool = () => {
      const nhPoolMatch = findNhPoolMatch();
      if (!nhPoolMatch) return false;
      const units = Array.isArray(nhPoolMatch.resources) ? nhPoolMatch.resources.map(String) : [];
      const unit =
        resolvedUnitId && units.includes(resolvedUnitId)
          ? resolvedUnitId
          : units.includes(String(resolvedId))
            ? String(resolvedId)
            : undefined;
      openNhPool(String(nhPoolMatch.pool_id), nhPoolMatch.pool_name, unit);
      return true;
    };

    if (kind === 'staff' || resolvedType === 'staff') {
      if (tryStaff() || tryHrPool() || tryNhPool()) return;
      pushToast({ message: `Staff profile not found for "${resolvedName}"`, variant: 'error' });
      return;
    }

    if (kind === 'hr-pool' || resolvedType === 'pool') {
      if (tryHrPool() || tryStaff() || tryNhPool()) return;
      pushToast({ message: `Staff pool not found for "${resolvedName}"`, variant: 'error' });
      return;
    }

    if (tryNhPool() || tryStaff() || tryHrPool()) return;

    pushToast({
      message: `Equipment/room pool not found for "${resolvedName}". Opening Equipment & Asset Management.`,
      variant: 'info',
    });
    setActiveTab('non-human-pool');
    setNhPoolView('dashboard');
  }, [store.staff, store.resourcePools, nhPools, requestOrgId, pushToast]);

  const filteredSurgeryRequests = useMemo(
    () => surgeryRequests.filter((record) => requestMatchesSearch(record, searchQuery)),
    [searchQuery, surgeryRequests],
  );

  const activeRecord = useMemo(
    () => surgeryRequests.find((record) => record.id === activeId) ?? null,
    [activeId, surgeryRequests],
  );

  const replaceRequestRecord = useCallback((nextRecord: SurgeryRequestRecord, replaceId?: string) => {
    setSurgeryRequests((current) => {
      const next = current.filter(
        (record) => record.id !== nextRecord.id && (!replaceId || record.id !== replaceId),
      );
      return [nextRecord, ...next].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    });
  }, []);

  const persistRequestRecord = useCallback(
    async (record: SurgeryRequestRecord, targetStatus?: BackendSurgeryStatus) => {
      if (!record.data.patientName.trim()) {
        throw new Error('Patient name is required');
      }
      if (!record.data.operationType.trim()) {
        throw new Error('Operation type is required');
      }

      const basePayload = mapRequestToBackendPayload(record.data, requestOrgId);

      const dropPriorPlan = targetStatus === 'ESTIMATED' || targetStatus === 'PLANNING';
      const priorPlan = dropPriorPlan ? null : record.planResult;

      if (!record.isPersisted || !record.backendId) {
        let created = await createSurgery(basePayload);
        let persisted = mergeUiDraftIntoRecord(created, record, priorPlan);

        if (targetStatus && targetStatus !== 'DRAFT') {
          created = await updateSurgeryById(
            created.id,
            mapRequestToBackendPayload(record.data, requestOrgId, targetStatus),
          );
          persisted = mergeUiDraftIntoRecord(created, persisted, priorPlan);
        }

        replaceRequestRecord(persisted, record.id);
        return persisted;
      }

      const updated = await updateSurgeryById(
        record.backendId,
        mapRequestToBackendPayload(record.data, requestOrgId, targetStatus),
      );
      const persisted = mergeUiDraftIntoRecord(updated, record, priorPlan);
      replaceRequestRecord(persisted);
      return persisted;
    },
    [replaceRequestRecord, requestOrgId],
  );

  const shellUser: ShellUser = useMemo(() => {
    const name = authUser
      ? `${authUser.first_name ?? ''} ${authUser.last_name ?? ''}`.trim() || authUser.email
      : 'Dr. Julian Vance';
    const role = authUser ? String(authUser.role ?? 'User') : activeTab === 'surgery-control-center' ? 'Head of Surgery' : 'Clinical Lead';
    const avatar = activeTab === 'surgery-control-center' ? AVATAR_STATUS : AVATAR_DEFAULT;
    return { name, role, avatar };
  }, [activeTab, authUser]);

  const goToRequestList = () => {
    setRequestsView('list');
    setActiveId(null);
    setIsNewRequest(false);
    setStep(1);
  };

  const openRequestEditor = (id: string) => {
    setActiveId(id);
    setIsNewRequest(false);
    setStep(1);
    setRequestsView('editor');
  };

  const openRequestViewer = (id: string) => {
    setActiveId(id);
    setRequestsView('viewer');
  };

  const navigateContracts = useCallback((view: ViewState) => {
    setContractView(view);
    if (view === 'LIBRARY') {
      setActiveContractId(null);
      setContractMode('create');
    }
  }, []);

  const editContract = useCallback((contract: UiContract) => {
    setActiveContractId(contract.id);
    setContractMode('edit');
    setContractView(contract.type === 'STATIC' ? 'CREATE_STATIC' : 'CREATE_DYNAMIC');
  }, []);

  const viewContract = useCallback((contract: UiContract) => {
    setActiveContractId(contract.id);
    setContractMode('view');
    setContractView(contract.type === 'STATIC' ? 'CREATE_STATIC' : 'CREATE_DYNAMIC');
  }, []);

  const startNewRequest = () => {
    setSearchQuery('');
    const rec = createRequestRecord(createBlankSurgeryRequest(), requestOrgId);
    replaceRequestRecord(rec);
    setActiveId(rec.id);
    setIsNewRequest(true);
    setStep(1);
    setRequestsView('editor');
  };

  const patchActiveRequest = (updates: Partial<SurgeryRequestRecord['data']>) => {
    if (!activeId) return;
    setSurgeryRequests((current) =>
      current.map((record) =>
        record.id === activeId
          ? {
              ...record,
              data: withSynchronizedWindow(record.data, updates),
              updatedAt: new Date().toISOString(),
            }
          : record,
      ),
    );
  };

  const handleCancelRequest = async () => {
    if (!activeId) {
      goToRequestList();
      return;
    }
    
    const record = surgeryRequests.find((item) => item.id === activeId);
    if (!record) {
      goToRequestList();
      return;
    }

    if (record.isPersisted && record.backendId) {
      await deleteSurgeryById(record.backendId);
    }

    setSurgeryRequests((current) => current.filter((item) => item.id !== activeId));
    goToRequestList();
  };

  const handleSelectTab = (id: AppTabId) => {
    setActiveTab(id);
    if (id === 'requests') {
      goToRequestList();
    }
    if (id === 'contracts') {
      setContractView('LIBRARY');
    }
    if (id === 'staff') {
      setStaffView('DIRECTORY');
      setSelectedStaffId(null);
    }
    if (id === 'hr-pool') {
      setHrPoolView('directory');
    }
    if (id === 'non-human-pool') {
      setNhPoolView('dashboard');
      setSelectedNhPoolId(null);
    }
  };

  const handleLogout = useCallback(() => {
    clearAuthSession();
    pushToast('Signed out.');
    setActiveTab('surgery-control-center');
  }, [pushToast]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface">
        <AuthPage onAuthenticated={() => {}} />
        <ToastHost toast={toast} />
        <ModalHost modal={modal} onClose={closeModal} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar activeTab={activeTab} onSelectTab={handleSelectTab} orgName={activeOrgName} />
      <TopNav
        title={headerTitle(activeTab)}
        user={shellUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onLogout={handleLogout}
      />

      <main className="ml-72 pt-24 px-6 lg:px-8 pb-16">
        {activeTab === 'requests' && (
          <SurgeryRequestsWorkspace
            mode={requestsView}
            records={filteredSurgeryRequests}
            totalRequestCount={surgeryRequests.length}
            onClearSearch={() => setSearchQuery('')}
            activeId={activeId}
            activeRecord={activeRecord}
            isNew={isNewRequest}
            planningBusy={planningSubmit}
            step={step}
            onViewRequest={openRequestViewer}
            onEditRequest={openRequestEditor}
            onNewRequest={startNewRequest}
            onBackToList={goToRequestList}
            onStepChange={setStep}
            updateData={patchActiveRequest}
            onNavigateToResource={handleNavigateToResource}
            onCancelRequest={() => {
              handleCancelRequest().catch((e: any) => {
                pushToast({ message: `Delete failed: ${e?.message ?? 'Unknown error'}`, variant: 'error' });
              });
            }}
            onSaveDraft={() => {
              if (!activeRecord) return;
              persistRequestRecord(activeRecord, 'DRAFT')
                .then(async () => {
                  setIsNewRequest(false);
                  await loadSurgeryRequests();
                  pushToast('Draft saved.');
                  goToRequestList();
                })
                .catch((e: any) => {
                  pushToast({ message: `Save failed: ${e?.message ?? 'Unknown error'}`, variant: 'error' });
                });
            }}
            onSaveForLater={() => {
              if (!activeRecord) return;
              persistRequestRecord(activeRecord, 'DRAFT')
                .then((savedRecord) => {
                  setActiveId(savedRecord.id);
                  setIsNewRequest(false);
                  pushToast('Draft saved for later.');
                })
                .catch((e: any) => {
                  pushToast({ message: `Save failed: ${e?.message ?? 'Unknown error'}`, variant: 'error' });
                });
            }}
            onSubmitRequest={() => {
              if (!activeRecord || planningSubmit) return;
              persistRequestRecord(activeRecord, 'ESTIMATED')
                .then(async (saved) => {
                  setIsNewRequest(false);
                  setActiveId(saved.id);
                  setSurgeryRequests((current) =>
                    current.map((row) =>
                      row.id === saved.id
                        ? { ...row, status: 'PLANNING', planResult: null, updatedAt: new Date().toISOString() }
                        : row,
                    ),
                  );
                  setRequestsView('viewer');
                  setPlanningSubmit(true);
                  pushToast('Request submitted. Planning this surgery…');
                  const results = await runPlanningForSurgeries(requestOrgId, [saved.referenceCode]);
                  await loadSurgeryRequests();
                  const scheduled = results.some((row) => {
                    const unwrapped = unwrapPlanResultPayload(row.result, saved.referenceCode);
                    return Boolean(unwrapped?.planned_start) || Boolean(unwrapped?.resources_assigned);
                  });
                  if (scheduled) {
                    pushToast('Surgery scheduled.');
                  } else {
                    pushToast({
                      message: 'Planning finished but this surgery was not scheduled. Check feasibility or try again.',
                      variant: 'error',
                    });
                  }
                })
                .catch((e: any) => {
                  pushToast({ message: `Submit failed: ${e?.message ?? 'Unknown error'}`, variant: 'error' });
                })
                .finally(() => {
                  setPlanningSubmit(false);
                });
            }}
          />
        )}

        {activeTab !== 'requests' && <div className="max-w-7xl mx-auto">
          {activeTab === 'surgery-control-center' && (
            <ControlCenterPage
              organizationId={requestOrgId}
              onRefreshSurgeries={refreshSurgeries}
              onCompleteSurgery={(record) => {
                if (record.backendId == null) {
                  pushToast({ message: 'Cannot complete: this surgery is not saved on the server.', variant: 'error' });
                  return;
                }
                updateSurgeryById(record.backendId, { status: 'DONE' })
                  .then(() => loadSurgeryRequests())
                  .then(() => pushToast('Surgery marked complete.'))
                  .catch((e: any) => {
                    pushToast({ message: `Complete failed: ${e?.message ?? 'Unknown error'}`, variant: 'error' });
                  });
              }}
            />
          )}
          {activeTab === 'surgery-analytics' && <AnalyticsPage />}
          {activeTab === 'settings' && <SettingsPage />}
          {activeTab === 'activity-log' && <ActivityLogPage />}
          {activeTab === 'non-renewable-resources' && <NonRenewableResourcesPage />}
          {activeTab === 'admin-organizations' && <OrganizationsAdminPage />}
          {activeTab === 'admin-users' && <UsersAdminPage />}
          {activeTab === 'admin-roles' && <RolesAdminPage />}
          {activeTab === 'contracts' && (
            contractView === 'LIBRARY' ? (
              <ContractLibrary onNavigate={navigateContracts} onEditContract={editContract} onViewContract={viewContract} />
            ) : (
              <CreateContract 
                type={contractView === 'CREATE_STATIC' ? 'STATIC' : 'DYNAMIC'} 
                onNavigate={navigateContracts}
                contractId={activeContractId}
                mode={contractMode}
                onRequestEdit={() => setContractMode('edit')}
              />
            )
          )}
          {activeTab === 'staff' && (
            staffView === 'DIRECTORY' ? (
              <StaffDirectory
                staff={store.staff || []}
                onViewProfile={(id) => {
                  setSelectedStaffId(id);
                  setStaffView('DETAIL');
                }}
                onCreateNew={() => setStaffView('CREATE')}
              />
            ) : staffView === 'CREATE' ? (
              <CreateProfile
                onAdd={(member) => {
                  upsertStaff(member);
                  setStaffView('DIRECTORY');
                }}
                onCancel={() => setStaffView('DIRECTORY')}
              />
            ) : selectedStaffId ? (
              <ProfileDetail
                member={(store.staff || []).find(s => s.id === selectedStaffId)!}
                rosteringFocus={staffRosteringFocus}
                onArchive={async (id) => {
                  try {
                    await deleteStaffById(id);
                    replaceStaff((store.staff || []).filter((m) => m.id !== id));
                    setStaffRosteringFocus(null);
                    setSelectedStaffId(null);
                    setStaffView('DIRECTORY');
                    pushToast('Staff member deleted successfully.');
                  } catch (e: any) {
                    pushToast({ message: `Delete failed: ${e?.message ?? 'Unknown error'}`, variant: 'error' });
                  }
                }}
                onUpdate={async (member) => {
                  try {
                    const staffId = member.employeeId.replace(/^#/, '');
                    const weekly_template = member.weeklySchedule.reduce<Record<string, any[]>>((acc, b) => {
                      const key = (b.day || '').toLowerCase();
                      if (!key) return acc;
                      acc[key] = acc[key] ?? [];
                      acc[key].push({
                        start: b.startTime,
                        end: b.endTime,
                        role: normalizeScheduleRoleName(b.role),
                      });
                      return acc;
                    }, {});

                    const role_distribution = member.effortRoles.reduce<Record<string, number>>((acc, r) => {
                      const key = r.description || r.type;
                      acc[key] = (r.percentage || 0) / 100;
                      return acc;
                    }, {});

                    await updateStaffById(member.id, {
                      personal_details: {
                        staff_id: staffId,
                        name: member.name,
                        email: member.email,
                      },
                      professional_primary_details: {
                        designation: member.title,
                        contract_id: member.contractId,
                        supervisor: member.supervisor,
                      },
                      professional_secondary_details: {
                        skills: member.skills,
                        roles: member.effortRoles.map((r) => r.description),
                        role_distribution,
                        weekly_template,
                        pool_assignments: member.pools.map((p) => ({ pool_id: p })),
                      },
                    });

                    upsertStaff(member);
                    pushToast('Staff member updated successfully.');
                  } catch (e: any) {
                    pushToast({ message: `Update failed: ${e?.message ?? 'Unknown error'}`, variant: 'error' });
                  }
                }}
                onBack={() => {
                  setStaffRosteringFocus(null);
                  setStaffView('DIRECTORY');
                }}
              />
            ) : null
          )}
          {activeTab === 'hr-pool' && (
            hrPoolView === 'directory' ? (
              <PoolDirectory
                onNavigate={navigateHrPool}
                onSelectPool={(poolId) => {
                  setSelectedHrPoolId(poolId);
                  navigateHrPool('pool-detail');
                }}
              />
            ) : hrPoolView === 'new-pool' ? (
              <NewResourcePool
                onNavigate={navigateHrPool}
                onPoolCreated={(poolId) => setSelectedHrPoolId(poolId)}
                draftForm={draftHrPoolForm}
                onDraftFormChange={setDraftHrPoolForm}
                draftDemandMatrix={draftHrPoolDemandMatrix}
                onResetDraftDemand={resetHrPoolCreateDraft}
                shifts={shiftList}
                setShifts={setShiftList}
                members={memberList}
                setMembers={setMemberList}
              />
            ) : hrPoolView === 'pool-demand' ? (
              selectedHrPoolId ? (
                <PoolDemand
                  poolId={selectedHrPoolId}
                  onBack={() => navigateHrPool('pool-detail')}
                  shiftMeta={shiftList.map((s) => ({ name: s.name, start: s.start, end: s.end }))}
                />
              ) : (
                <PoolDemand
                  onBack={() => navigateHrPool('new-pool')}
                  draftMatrix={draftHrPoolDemandMatrix}
                  onDraftMatrixChange={setDraftHrPoolDemandMatrix}
                  shiftNames={shiftList.map((s) => s.name)}
                  shiftMeta={shiftList.map((s) => ({ name: s.name, start: s.start, end: s.end }))}
                />
              )
            ) : hrPoolView === 'pool-detail' ? (
              selectedHrPoolId ? (
                <PoolDetail
                  poolId={selectedHrPoolId}
                  onBack={() => navigateHrPool('directory')}
                  onEditDemand={() => navigateHrPool('pool-demand')}
                  shiftMeta={shiftList.map((s) => ({ name: s.name, start: s.start, end: s.end }))}
                  onOpenStaffRostering={(focus) => {
                    const employeeId = String(focus.employeeId ?? '').trim();
                    const staffMatch = (store.staff || []).find((s) => String(s.employeeId ?? '').replace(/^#/, '') === employeeId);
                    if (!staffMatch) {
                      setActiveTab('staff');
                      setStaffView('DIRECTORY');
                      setSelectedStaffId(null);
                      setStaffRosteringFocus(null);
                      pushToast({ message: `Staff profile not found for ${employeeId}`, variant: 'error' });
                      return;
                    }
                    setStaffRosteringFocus(focus);
                    setActiveTab('staff');
                    setSelectedStaffId(staffMatch.id);
                    setStaffView('DETAIL');
                  }}
                />
              ) : (
                <PoolDirectory
                  onNavigate={navigateHrPool}
                  onSelectPool={(poolId) => {
                    setSelectedHrPoolId(poolId);
                    navigateHrPool('pool-detail');
                  }}
                />
              )
            ) : null
          )}
          {activeTab === 'non-human-pool' && (
            nhPoolView === 'dashboard' ? (
              <DashboardView
                pools={nhPools}
                loading={nhPoolsLoading}
                error={nhPoolsError}
                onCreateNew={() => setNhPoolView('create')}
                onSelectPool={(poolId) => {
                  setSelectedNhPoolId(poolId);
                  setNhPoolView('details');
                }}
              />
            ) : nhPoolView === 'create' ? (
              <CreatePoolView
                onCancel={() => setNhPoolView('dashboard')}
                onCreated={(poolId) => {
                  setSelectedNhPoolId(poolId);
                  setNhPoolView('details');
                }}
              />
            ) : nhPoolView === 'details' && selectedNhPoolId ? (
              <PoolDetailsView
                poolId={selectedNhPoolId}
                initialUnitId={selectedNhUnitId}
                onBack={() => {
                  setNhPoolView('dashboard');
                  setSelectedNhUnitId(null);
                  loadNhPools().catch(() => {});
                }}
              />
            ) : null
          )}
        </div>}
      </main>

      <ToastHost toast={toast} />
      <ModalHost modal={modal} onClose={closeModal} />

      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 glass border border-white/20 px-6 py-4 rounded-full shadow-2xl flex items-center gap-8 z-50">
        <button type="button" className="flex flex-col items-center gap-1 text-primary">
          <PlusSquare size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Details</span>
        </button>
        <button type="button" className="flex flex-col items-center gap-1 text-outline opacity-40">
          <Wrench size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Tools</span>
        </button>
        <button type="button" className="flex flex-col items-center gap-1 text-outline opacity-40">
          <Library size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Items</span>
        </button>
      </div>
    </div>
  );
}
