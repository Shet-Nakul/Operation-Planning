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
import { useAppStore } from './context/AppStoreContext';
import { createBlankSurgeryRequest, createRequestRecord } from './data/surgeryRequestDefaults';
import { ContractLibrary } from './components/contracts/ContractLibrary';
import { CreateContract } from './components/contracts/CreateContract';
import { type Contract as UiContract, type ViewState } from './components/contracts/types';
import StaffDirectory from './components/staff/StaffDirectory';
import CreateProfile from './components/staff/CreateProfile';
import ProfileDetail from './components/staff/ProfileDetail';
import { INITIAL_STAFF } from './components/staff/constants';
import { type StaffMember } from './components/staff/types';
import { PoolDirectory } from './components/hr-pool/PoolDirectory';
import { NewResourcePool } from './components/hr-pool/NewResourcePool';
import { PoolDemand } from './components/hr-pool/PoolDemand';
import { PoolDetail } from './components/hr-pool/PoolDetail';
import { MOCK_SHIFTS } from './components/hr-pool/constants';
import { type Member, type Shift, type ViewState as HRPoolViewState } from './components/hr-pool/types';
import { DashboardView } from './components/non-human-pool/DashboardView';
import { CreatePoolView } from './components/non-human-pool/CreatePoolView';
import { PoolDetailsView } from './components/non-human-pool/PoolDetailsView';
import { type ResourcePoolSummary } from './components/non-human-pool/types';
import { clearAuthSession, deleteStaffById, getCatalogShifts, getRenewableResourcePools, getStaff, readAuthSession, subscribeAuthSession, type AuthUser, type ServerPoolDemandMatrixItem, type ServerShift, updateStaffById } from './lib/api';

type RequestsViewMode = 'list' | 'editor';
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

export default function App() {
  const {
    store,
    toast,
    pushToast,
    activeOrgName,
    searchQuery,
    setSearchQuery,
    filteredSurgeryRequests,
    updateRequestData,
    deleteSurgeryRequest,
    markRequestDraft,
    markRequestInReview,
    submitSurgeryRequest,
    upsertSurgeryRequest,
    resetStoreToSeed,
    upsertStaff,
    replaceStaff,
    deleteStaff,
    upsertResourcePool,
    deleteResourcePool,
  } = useAppStore();

  const [authSession, setAuthSessionState] = useState(() => readAuthSession());
  const authUser = authSession.user;
  const isAuthenticated = Boolean(authSession.accessToken);

  useEffect(() => subscribeAuthSession(setAuthSessionState), []);

  const [activeTab, setActiveTab] = useState<AppTabId>('surgery-control-center');
  const [requestsView, setRequestsView] = useState<RequestsViewMode>('list');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isNewRequest, setIsNewRequest] = useState(false);
  const [step, setStep] = useState(1);
  const [contractView, setContractView] = useState<ViewState>('LIBRARY');
  const [activeContractId, setActiveContractId] = useState<string | null>(null);
  const [contractMode, setContractMode] = useState<'create' | 'edit' | 'view'>('create');
  const [staffView, setStaffView] = useState<StaffViewMode>('DIRECTORY');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [hrPoolView, setHrPoolView] = useState<HRPoolViewState>('directory');
  const [selectedHrPoolId, setSelectedHrPoolId] = useState<string | null>(null);
  const [draftHrPoolDemandMatrix, setDraftHrPoolDemandMatrix] = useState<ServerPoolDemandMatrixItem[]>([]);
  const [shiftList, setShiftList] = useState(MOCK_SHIFTS);
  const [memberList, setMemberList] = useState<Member[]>([]);
  const [nhPoolView, setNhPoolView] = useState<'dashboard' | 'create' | 'details'>('dashboard');
  const [nhPools, setNhPools] = useState<ResourcePoolSummary[]>([]);
  const [nhPoolsLoading, setNhPoolsLoading] = useState(false);
  const [nhPoolsError, setNhPoolsError] = useState<string | null>(null);
  const [selectedNhPoolId, setSelectedNhPoolId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== 'staff' || staffView !== 'DIRECTORY') return;

    let cancelled = false;
    (async () => {
      try {
        const rows = await getStaff({ orgId: 1 });
        if (cancelled) return;

        const toTitleCase = (s: string) =>
          s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;

        const staff = rows.map((r) => {
          const rawSkills = r.skills;
          const skills = Array.isArray(rawSkills) ? rawSkills.filter((x) => typeof x === 'string') : [];

          const rawPools = r.pool_assignments;
          const pools =
            Array.isArray(rawPools)
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
                    role: String(b?.role ?? ''),
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

          return {
            id: String(r.id),
            name: r.name,
            title: r.designation || 'Clinical Staff',
            specialization: skills.length > 0 ? skills : ['General'],
            contractId: r.contract_id || '',
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

        replaceStaff(staff);
      } catch (e: any) {
        pushToast(`Staff sync failed: ${e?.message ?? 'Unknown error'}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, staffView, pushToast, replaceStaff]);

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
    loadNhPools().catch(() => {});
  }, [activeTab, nhPoolView, loadNhPools]);

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

  const navigateHrPool = useCallback((view: HRPoolViewState) => {
    if (view === 'new-pool') {
      setSelectedHrPoolId(null);
      setDraftHrPoolDemandMatrix([]);
      setMemberList([]);
      const fromStore = store.settings?.catalogs?.shifts ?? [];
      if (fromStore.length > 0) {
        setShiftList(fromStore.map((s: any) => toUiShift(s)));
      } else {
        setShiftList(MOCK_SHIFTS);
        loadCatalogShifts().catch(() => {});
      }
    }
    setHrPoolView(view);
  }, [loadCatalogShifts, store.settings?.catalogs?.shifts, toUiShift]);

  const activeRecord = useMemo(() => store.surgeryRequests.find((r) => r.id === activeId) ?? null, [store.surgeryRequests, activeId]);

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
    const rec = createRequestRecord(createBlankSurgeryRequest());
    upsertSurgeryRequest(rec);
    setActiveId(rec.id);
    setIsNewRequest(true);
    setStep(1);
    setRequestsView('editor');
  };

  const openNewRequestFromAnywhere = () => {
    setActiveTab('requests');
    startNewRequest();
  };

  const patchActiveRequest = (updates: Parameters<typeof updateRequestData>[1]) => {
    if (!activeId) return;
    updateRequestData(activeId, updates);
  };

  const handleCancelRequest = () => {
    if (!activeId) {
      goToRequestList();
      return;
    }
    
    // If it's a new request being cancelled or an existing one being deleted, remove it.
    // The confirmation dialog is now handled in Step1PatientScheduling top button.
    deleteSurgeryRequest(activeId);
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
        <ToastHost message={toast} />
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
        showNewRequest={activeTab === 'requests'}
        onNewRequest={openNewRequestFromAnywhere}
        onLogout={handleLogout}
      />

      <main className="ml-72 pt-24 px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'surgery-control-center' && <ControlCenterPage />}
          {activeTab === 'surgery-analytics' && <AnalyticsPage />}
          {activeTab === 'settings' && <SettingsPage />}
          {activeTab === 'activity-log' && <ActivityLogPage />}
          {activeTab === 'non-renewable-resources' && <NonRenewableResourcesPage />}
          {activeTab === 'admin-organizations' && <OrganizationsAdminPage />}
          {activeTab === 'admin-users' && <UsersAdminPage />}
          {activeTab === 'admin-roles' && <RolesAdminPage />}
          {activeTab === 'requests' && (
            <SurgeryRequestsWorkspace
              mode={requestsView}
              records={filteredSurgeryRequests}
              totalRequestCount={store.surgeryRequests.length}
              onClearSearch={() => setSearchQuery('')}
              activeId={activeId}
              activeRecord={activeRecord}
              isNew={isNewRequest}
              step={step}
              onSelectRequest={openRequestEditor}
              onNewRequest={startNewRequest}
              onBackToList={goToRequestList}
              onStepChange={setStep}
              updateData={patchActiveRequest}
              onCancelRequest={handleCancelRequest}
              onSaveDraft={() => activeId && markRequestDraft(activeId)}
              onSaveForLater={() => activeId && markRequestInReview(activeId)}
              onSubmitRequest={() => {
                if (!activeId) return;
                submitSurgeryRequest(activeId);
                goToRequestList();
              }}
            />
          )}
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
                onDelete={async (id) => {
                  try {
                    await deleteStaffById(id);
                    replaceStaff((store.staff || []).filter((m) => m.id !== id));
                    pushToast('Staff member deleted.');
                  } catch (e: any) {
                    pushToast(`Delete failed: ${e?.message ?? 'Unknown error'}`);
                  }
                }}
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
                onUpdate={async (member) => {
                  try {
                    const staffId = member.employeeId.replace(/^#/, '');
                    const weekly_template = member.weeklySchedule.reduce<Record<string, any[]>>((acc, b) => {
                      const key = (b.day || '').toLowerCase();
                      if (!key) return acc;
                      acc[key] = acc[key] ?? [];
                      acc[key].push({ start: b.startTime, end: b.endTime, role: b.role });
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
                    pushToast('Staff updated (backend).');
                  } catch (e: any) {
                    pushToast(`Update failed: ${e?.message ?? 'Unknown error'}`);
                  }
                }}
                onBack={() => setStaffView('DIRECTORY')}
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
                draftDemandMatrix={draftHrPoolDemandMatrix}
                onResetDraftDemand={() => setDraftHrPoolDemandMatrix([])}
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
                onBack={() => {
                  setNhPoolView('dashboard');
                  loadNhPools().catch(() => {});
                }}
              />
            ) : null
          )}
        </div>
      </main>

      <ToastHost message={toast} />

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
