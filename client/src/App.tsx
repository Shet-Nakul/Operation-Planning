import { useMemo, useState } from 'react';
import { Library, PlusSquare, Wrench } from 'lucide-react';
import { Sidebar, type AppTabId } from './components/layout/Sidebar';
import { TopNav, type ShellUser } from './components/layout/TopNav';
import ControlCenterPage from './pages/ControlCenterPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import { SurgeryRequestsWorkspace } from './components/surgery-request/SurgeryRequestsWorkspace';
import { ToastHost } from './components/ui/ToastHost';
import { useAppStore } from './context/AppStoreContext';
import { createBlankSurgeryRequest, createRequestRecord } from './data/surgeryRequestDefaults';
import { ContractLibrary } from './components/contracts/ContractLibrary';
import { CreateContract } from './components/contracts/CreateContract';
import { type ViewState } from './components/contracts/types';
import StaffDirectory from './components/staff/StaffDirectory';
import CreateProfile from './components/staff/CreateProfile';
import ProfileDetail from './components/staff/ProfileDetail';
import { INITIAL_STAFF } from './components/staff/constants';
import { type StaffMember } from './components/staff/types';
import { PoolDirectory } from './components/hr-pool/PoolDirectory';
import { NewResourcePool } from './components/hr-pool/NewResourcePool';
import { PoolDemand } from './components/hr-pool/PoolDemand';
import { PoolDetail } from './components/hr-pool/PoolDetail';
import { MOCK_POOLS, MOCK_SHIFTS, MOCK_MEMBERS } from './components/hr-pool/constants';
import { type ViewState as HRPoolViewState } from './components/hr-pool/types';
import { DashboardView } from './components/non-human-pool/DashboardView';
import { CreatePoolView } from './components/non-human-pool/CreatePoolView';
import { PoolDetailsView } from './components/non-human-pool/PoolDetailsView';
import { MOCK_POOLS as MOCK_POOLS_NH } from './components/non-human-pool/constants';
import { type ResourcePool as ResourcePoolNH } from './components/non-human-pool/types';

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
    'settings': 'System Settings',
  };
  return titles[tab];
}

export default function App() {
  const {
    store,
    toast,
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
    deleteStaff,
    upsertResourcePool,
    deleteResourcePool,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<AppTabId>('surgery-control-center');
  const [requestsView, setRequestsView] = useState<RequestsViewMode>('list');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isNewRequest, setIsNewRequest] = useState(false);
  const [step, setStep] = useState(1);
  const [contractView, setContractView] = useState<ViewState>('LIBRARY');
  const [staffView, setStaffView] = useState<StaffViewMode>('DIRECTORY');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [hrPoolView, setHrPoolView] = useState<HRPoolViewState>('directory');
  const [poolList, setPoolList] = useState(MOCK_POOLS);
  const [shiftList, setShiftList] = useState(MOCK_SHIFTS);
  const [memberList, setMemberList] = useState(MOCK_MEMBERS);
  const [nhPoolView, setNhPoolView] = useState<'dashboard' | 'create' | 'details'>('dashboard');
  const [selectedNhPool, setSelectedNhPool] = useState<ResourcePoolNH | null>(null);

  const activeRecord = useMemo(() => store.surgeryRequests.find((r) => r.id === activeId) ?? null, [store.surgeryRequests, activeId]);

  const shellUser: ShellUser = useMemo(() => {
    if (activeTab === 'surgery-control-center') {
      return { name: 'Dr. Julian Vance', role: 'Head of Surgery', avatar: AVATAR_STATUS };
    }
    return { name: 'Dr. Julian Vance', role: 'Clinical Lead', avatar: AVATAR_DEFAULT };
  }, [activeTab]);

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
      setSelectedNhPool(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar activeTab={activeTab} onSelectTab={handleSelectTab} />
      <TopNav
        title={headerTitle(activeTab)}
        user={shellUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showNewRequest={activeTab === 'requests'}
        onNewRequest={openNewRequestFromAnywhere}
      />

      <main className="ml-72 pt-24 px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'surgery-control-center' && <ControlCenterPage />}
          {activeTab === 'surgery-analytics' && <AnalyticsPage />}
          {activeTab === 'settings' && <SettingsPage />}
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
              <ContractLibrary onNavigate={setContractView} />
            ) : (
              <CreateContract 
                type={contractView === 'CREATE_STATIC' ? 'STATIC' : 'DYNAMIC'} 
                onNavigate={setContractView}
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
                onDelete={deleteStaff}
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
                onUpdate={upsertStaff}
                onBack={() => setStaffView('DIRECTORY')}
              />
            ) : null
          )}
          {activeTab === 'hr-pool' && (
            hrPoolView === 'directory' ? (
              <PoolDirectory onNavigate={setHrPoolView} />
            ) : hrPoolView === 'new-pool' ? (
              <NewResourcePool
                onNavigate={setHrPoolView}
                shifts={shiftList}
                setShifts={setShiftList}
                members={memberList}
                setMembers={setMemberList}
              />
            ) : hrPoolView === 'pool-demand' ? (
              <PoolDemand onNavigate={setHrPoolView} />
            ) : hrPoolView === 'pool-detail' ? (
              <PoolDetail />
            ) : null
          )}
          {activeTab === 'non-human-pool' && (
            nhPoolView === 'dashboard' ? (
              <DashboardView
                onCreateNew={() => setNhPoolView('create')}
                onSelectPool={(pool) => {
                  setSelectedNhPool(pool);
                  setNhPoolView('details');
                }}
              />
            ) : nhPoolView === 'create' ? (
              <CreatePoolView onCancel={() => setNhPoolView('dashboard')} />
            ) : nhPoolView === 'details' && selectedNhPool ? (
              <PoolDetailsView
                pool={selectedNhPool}
                onBack={() => setNhPoolView('dashboard')}
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
