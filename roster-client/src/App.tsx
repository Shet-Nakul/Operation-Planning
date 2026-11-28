import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ClipboardList, FileText, LogOut, Settings, Users, Briefcase, ScrollText, Hospital, PanelLeftClose, PanelLeftOpen, UserRound } from 'lucide-react';
import AuthPage from './pages/AuthPage';
import StaffPortalPage from './pages/StaffPortalPage';
import SuperAdminPortal from './pages/SuperAdminPortal';
import SupervisorRequestsPage from './pages/SupervisorRequestsPage';
import UsersAdminPage from './pages/UsersAdminPage';
import ActivityLogPage from './pages/ActivityLogPage';
import SettingsPage from './pages/SettingsPage';
import OrganizationPage from './pages/OrganizationPage';
import { ContractLibrary } from './components/contracts/ContractLibrary';
import { CreateContract } from './components/contracts/CreateContract';
import type { Contract, ViewState as ContractView } from './components/contracts/types';
import StaffDirectory from './components/staff/StaffDirectory';
import CreateProfile from './components/staff/CreateProfile';
import ProfileDetail from './components/staff/ProfileDetail';
import { normalizeScheduleRoleName, type StaffMember } from './components/staff/types';
import { PoolDirectory } from './components/hr-pool/PoolDirectory';
import { NewResourcePool } from './components/hr-pool/NewResourcePool';
import { PoolDemand } from './components/hr-pool/PoolDemand';
import { PoolDetail } from './components/hr-pool/PoolDetail';
import { EMPTY_HR_POOL_CREATE_DRAFT, type Member, type Shift, type ViewState as PoolView } from './components/hr-pool/types';
import { ToastHost } from './components/ui/ToastHost';
import { Brand } from './components/layout/Brand';
import { displayName } from './lib/displayName';
import { useAppStore } from './context/AppStoreContext';
import { usePendingStaffRequests } from './hooks/usePendingStaffRequests';
import {
  clearAuthSession, deleteStaffById, getOrganizationById, getStaff, readAuthSession,
  subscribeAuthSession, updateStaffById, type ServerPoolDemandMatrixItem, type ServerStaff,
} from './lib/api';

type Tab = 'pools' | 'staff' | 'contracts' | 'approvals' | 'settings' | 'organization' | 'users' | 'activity';
type Focus = { orgId: number; employeeId: string; dateIso: string; shiftKey: string; poolId: string };

function mapStaff(row: ServerStaff): StaffMember {
  const skills = Array.isArray(row.skills) ? row.skills.filter((value: unknown): value is string => typeof value === 'string') : [];
  const distribution: Record<string, number> = row.role_distribution && typeof row.role_distribution === 'object' ? row.role_distribution : {};
  const roles = new Set([...Object.keys(distribution), ...(Array.isArray(row.roles) ? row.roles.filter((value: unknown): value is string => typeof value === 'string') : [])]);
  const weeklySchedule = row.weekly_template && typeof row.weekly_template === 'object'
    ? Object.entries(row.weekly_template as Record<string, unknown>).flatMap(([day, blocks]) =>
      Array.isArray(blocks) ? blocks.map((block, index) => ({
        id: `${row.id}-${day}-${index}`, day: day.charAt(0).toUpperCase() + day.slice(1),
        startTime: String(block?.start ?? ''), endTime: String(block?.end ?? ''),
        role: normalizeScheduleRoleName(String(block?.role ?? '')),
      })) : [])
    : [];
  return {
    id: String(row.id), employeeId: row.staff_id.startsWith('#') ? row.staff_id : `#${row.staff_id}`,
    name: row.name, title: row.designation || 'Clinical Staff', specialization: skills.length ? skills : ['General'],
    contractId: row.contract_id || '', departmentId: row.department_id ?? undefined, department: row.department ?? undefined,
    supervisor: row.supervisor || 'Hospital Admin', status: 'Active', email: row.email || '',
    skills: skills.length ? skills : ['General Medicine'], weeklySchedule,
    effortRoles: [...roles].map(role => ({ id: `${row.id}-${role}`, type: 'CLINICAL', description: role, percentage: Math.round((distribution[role] || 0) * 100) })),
    pools: Array.isArray(row.pool_assignments) ? row.pool_assignments.map(item => typeof item?.pool_id === 'string' ? item.pool_id : '').filter(Boolean) : [],
  };
}

export default function App() {
  const { store, toast, pushToast, replaceStaff, upsertStaff } = useAppStore();
  const [session, setSession] = useState(readAuthSession);
  const [tab, setTab] = useState<Tab>('pools');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [staffView, setStaffView] = useState<'directory' | 'create' | 'detail'>('directory');
  const [staffId, setStaffId] = useState<string | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [poolView, setPoolView] = useState<PoolView>('directory');
  const [poolId, setPoolId] = useState<string | null>(null);
  const [rebuild, setRebuild] = useState(false);
  const [draft, setDraft] = useState(EMPTY_HR_POOL_CREATE_DRAFT);
  const [demand, setDemand] = useState<ServerPoolDemandMatrixItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [contractView, setContractView] = useState<ContractView>('LIBRARY');
  const [contractId, setContractId] = useState<string | null>(null);
  const [contractMode, setContractMode] = useState<'create' | 'edit' | 'view'>('create');
  const user = session.user;
  const orgId = user?.organization_id ?? 0;
  const isAuthenticated = Boolean(session.accessToken);
  const approvals = usePendingStaffRequests(session.accessToken && orgId && user?.role !== 'SUPERADMIN' ? `${user?.id}:${orgId}` : null);

  useEffect(() => subscribeAuthSession(setSession), []);
  useEffect(() => {
    setTab('pools'); setStaffView('directory'); setPoolView('directory'); setStaffId(null); setFocus(null);
    setOrgName('');
    if (!session.accessToken || !orgId || user?.role === 'SUPERADMIN') return;
    let cancelled = false;
    getOrganizationById(orgId).then(org => { if (!cancelled) setOrgName(org.name); })
      .catch(error => { if (!cancelled) pushToast({ message: `Unable to load organization: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'error' }); });
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id, user?.role, orgId, pushToast]);

  const loadStaff = useCallback(async () => {
    const accountId = user?.id;
    const isCurrentAccount = () => {
      const current = readAuthSession();
      return Boolean(current.accessToken) && current.user?.id === accountId && current.user?.organization_id === orgId;
    };
    try {
      const rows = await getStaff({ orgId });
      if (isCurrentAccount()) replaceStaff(rows.map(mapStaff));
    } catch (error) {
      if (isCurrentAccount()) pushToast({ message: `Unable to load staff: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'error' });
    }
  }, [orgId, user?.id, replaceStaff, pushToast]);
  useEffect(() => {
    if (session.accessToken && orgId && user?.role === 'ADMIN') void loadStaff();
  }, [session.accessToken, orgId, user?.role, loadStaff]);
  useEffect(() => {
    setShifts(store.settings.catalogs.shifts.map(shift => ({
      id: `catalog-${shift.id}`, name: shift.name, start: shift.start_time, end: shift.end_time,
      typical: `${shift.start_time} - ${shift.end_time}`, icon: 'Clock', color: 'text-slate-500',
    })));
  }, [store.settings.catalogs.shifts]);
  const shiftMeta = useMemo(() => shifts.map(shift => ({ name: shift.name, start: shift.start, end: shift.end })), [shifts]);
  const shiftNames = useMemo(() => shifts.map(shift => shift.name), [shifts]);

  const logout = () => { clearAuthSession(); setTab('pools'); };
  if (!session.accessToken) return <><AuthPage onAuthenticated={() => {}} /><ToastHost toast={toast} /></>;
  if (!user) return <div className="p-8">Your session has no user information. <button className="underline" onClick={logout}>Sign out</button> and sign in again.</div>;
  if (user.role === 'SUPERADMIN') return <SuperAdminPortal onLogout={logout} />;
  if (!orgId) return <div className="p-8">Your account is not associated with an organization. Contact an administrator. <button className="underline" onClick={logout}>Sign out</button></div>;
  if (user.role === 'USER') return <StaffPortalPage orgName={orgName} onLogout={logout} pendingApprovals={approvals.count} notificationError={approvals.error} />;
  if (user.role !== 'ADMIN') return <div className="p-8">This role is not supported in the rostering client. <button className="underline" onClick={logout}>Sign out</button></div>;

  const navigatePool = (view: PoolView) => {
    if (view === 'new-pool' && poolView === 'directory') {
      setPoolId(null); setDraft(EMPTY_HR_POOL_CREATE_DRAFT); setDemand([]); setMembers([]);
    }
    if (view !== 'pool-detail' && view !== 'pool-demand') setRebuild(false);
    setPoolView(view);
  };
  const selectedStaff = store.staff.find(member => member.id === staffId);
  const nav = [
    { id: 'pools' as const, label: 'Staff pools & rosters', icon: CalendarDays },
    { id: 'staff' as const, label: 'Staff library', icon: Users },
    { id: 'contracts' as const, label: 'Staff contracts', icon: FileText },
    { id: 'approvals' as const, label: 'My team', icon: ClipboardList },
    { id: 'settings' as const, label: 'Rostering settings', icon: Settings },
    { id: 'organization' as const, label: 'Organization', icon: Briefcase },
    { id: 'users' as const, label: 'Users', icon: Briefcase },
    { id: 'activity' as const, label: 'Activity log', icon: ScrollText },
  ];
  return <div className="min-h-screen bg-slate-50">
    <aside className={`fixed inset-y-0 left-0 z-40 w-20 ${sidebarCollapsed ? '' : 'sm:w-72'} bg-white border-r border-slate-200 flex flex-col px-3 py-6 transition-[width] motion-reduce:transition-none`}>
      <div className="mb-8 px-1"><Brand collapsed={sidebarCollapsed} /></div>
      <nav aria-label="Rostering navigation" className="flex-1 min-h-0 overflow-y-auto space-y-1">
        {nav.map(item => <button key={item.id} type="button" onClick={() => {
          setTab(item.id);
          if (item.id === 'staff') { setStaffView('directory'); setFocus(null); void loadStaff(); }
          if (item.id === 'pools') navigatePool('directory');
          if (item.id === 'contracts') setContractView('LIBRARY');
        }} aria-label={item.label} title={item.label} aria-current={tab === item.id ? 'page' : undefined}
          className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold ${tab === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
          <item.icon size={20} className="shrink-0" /><span className={sidebarCollapsed ? 'hidden' : 'hidden sm:inline'}>{item.label}</span>
          {item.id === 'approvals' && approvals.count > 0 && <span className="rounded-full bg-red-600 px-2 text-white">{approvals.count}</span>}
        </button>)}
      </nav>
      <div className="border-t border-slate-200 pt-4">
        <button type="button" onClick={logout} aria-label="Sign out" title="Sign out" className="flex w-full items-center gap-3 rounded-xl p-3 text-red-700 text-sm font-bold hover:bg-red-50"><LogOut size={20} /><span className={sidebarCollapsed ? 'hidden' : 'hidden sm:inline'}>Sign out</span></button>
        <button type="button" onClick={() => setSidebarCollapsed(previous => !previous)} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!sidebarCollapsed} className="hidden sm:flex w-full items-center gap-3 rounded-xl p-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
          {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          {!sidebarCollapsed && <span>Collapse sidebar</span>}
        </button>
      </div>
    </aside>
    <div className={`ml-20 ${sidebarCollapsed ? '' : 'sm:ml-72'} transition-[margin] motion-reduce:transition-none`}>
      <header className="sticky top-0 z-30 h-16 bg-white/95 border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0 text-primary"><Hospital size={22} className="shrink-0" aria-hidden="true" /><strong className="truncate">{orgName || 'Staff Rostering'}</strong></div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right min-w-0"><p className="text-sm font-bold text-slate-900 truncate max-w-36 sm:max-w-52">{displayName([user.first_name, user.last_name].filter(Boolean).join(' ')) || user.email}</p><p className="text-xs text-slate-500">{displayName(user.role)}</p></div>
          <div role="img" aria-label="User avatar" className="w-10 h-10 rounded-full bg-blue-50 text-primary flex items-center justify-center"><UserRound size={20} /></div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        {approvals.error && <p role="alert" className="mb-4 text-red-700">Unable to refresh approval notifications: {approvals.error}</p>}
        {tab === 'users' && <UsersAdminPage />}
        {tab === 'activity' && <ActivityLogPage />}
        {tab === 'settings' && <SettingsPage />}
        {tab === 'organization' && <OrganizationPage onSaved={setOrgName} />}
        {tab === 'approvals' && <SupervisorRequestsPage onViewProfile={id => { setStaffId(id); setFocus(null); setStaffView('detail'); setTab('staff'); }} />}
        {tab === 'contracts' && (contractView === 'LIBRARY'
          ? <ContractLibrary onNavigate={setContractView} onEditContract={(contract: Contract) => { setContractId(contract.id); setContractMode('edit'); setContractView(contract.type === 'STATIC' ? 'CREATE_STATIC' : 'CREATE_DYNAMIC'); }} onViewContract={(contract: Contract) => { setContractId(contract.id); setContractMode('view'); setContractView(contract.type === 'STATIC' ? 'CREATE_STATIC' : 'CREATE_DYNAMIC'); }} />
          : <CreateContract type={contractView === 'CREATE_STATIC' ? 'STATIC' : 'DYNAMIC'} onNavigate={view => { setContractView(view); if (view === 'LIBRARY') { setContractId(null); setContractMode('create'); } }} contractId={contractId} mode={contractMode} onRequestEdit={() => setContractMode('edit')} />)}
        {tab === 'staff' && (staffView === 'directory'
          ? <StaffDirectory staff={store.staff} onViewProfile={id => { setStaffId(id); setFocus(null); setStaffView('detail'); }} onCreateNew={() => setStaffView('create')} />
          : staffView === 'create'
            ? <CreateProfile onAdd={member => { upsertStaff(member); setStaffView('directory'); }} onCancel={() => setStaffView('directory')} />
            : selectedStaff ? <ProfileDetail member={selectedStaff} rosteringFocus={focus} onBack={() => { setFocus(null); setStaffView('directory'); }}
              onArchive={async id => { try { await deleteStaffById(id); replaceStaff(store.staff.filter(member => member.id !== id)); setStaffView('directory'); pushToast('Staff member deleted successfully.'); } catch (error) { pushToast({ message: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'error' }); } }}
              onUpdate={async member => {
                try {
                  const weekly_template = member.weeklySchedule.reduce<Record<string, { start: string; end: string; role: string }[]>>((result, block) => {
                    const day = block.day.toLowerCase(); if (day) (result[day] ??= []).push({ start: block.startTime, end: block.endTime, role: normalizeScheduleRoleName(block.role) }); return result;
                  }, {});
                  const role_distribution = member.effortRoles.reduce<Record<string, number>>((result, role) => { result[role.description || role.type] = role.percentage / 100; return result; }, {});
                  await updateStaffById(member.id, { personal_details: { staff_id: member.employeeId.replace(/^#/, ''), name: member.name, email: member.email },
                    professional_primary_details: { designation: member.title, contract_id: member.contractId, supervisor: member.supervisor },
                    professional_secondary_details: { skills: member.skills, roles: member.effortRoles.map(role => role.description), role_distribution, weekly_template, pool_assignments: member.pools.map(pool_id => ({ pool_id })) } });
                  upsertStaff(member); pushToast('Staff member updated successfully.');
                } catch (error) { pushToast({ message: `Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'error' }); }
              }} /> : <p role="alert">Staff profile not found. <button className="underline" onClick={() => setStaffView('directory')}>Back to staff</button></p>)}
        {tab === 'pools' && (poolView === 'directory'
          ? <PoolDirectory onNavigate={navigatePool} onSelectPool={id => { setPoolId(id); setPoolView('pool-detail'); }} />
          : poolView === 'new-pool'
            ? <NewResourcePool onNavigate={navigatePool} onPoolCreated={setPoolId} draftForm={draft} onDraftFormChange={setDraft} draftDemandMatrix={demand} onResetDraftDemand={() => setDemand([])} shifts={shifts} setShifts={setShifts} members={members} setMembers={setMembers} />
            : poolView === 'pool-demand'
              ? <PoolDemand poolId={poolId ?? undefined} onBack={() => navigatePool(poolId ? 'pool-detail' : 'new-pool')} draftMatrix={demand} onDraftMatrixChange={setDemand} shiftNames={shiftNames} shiftMeta={shiftMeta} onSaved={() => { setRebuild(true); setPoolView('pool-detail'); }} />
              : poolId && <PoolDetail poolId={poolId} onBack={() => navigatePool('directory')} onEditDemand={() => navigatePool('pool-demand')} rebuildPending={rebuild} onRebuildResolved={() => setRebuild(false)} shiftMeta={shiftMeta}
                onOpenStaffRostering={next => { const match = store.staff.find(member => member.employeeId.replace(/^#/, '') === next.employeeId.replace(/^#/, '')); if (!match) { pushToast({ message: `Staff profile not found for ${next.employeeId}`, variant: 'error' }); return; } setStaffId(match.id); setFocus(next); setStaffView('detail'); setTab('staff'); }} />)}
      </main>
    </div>
    <ToastHost toast={toast} />
  </div>;
}
