import { useEffect, useMemo, useState } from 'react';
import { LogOut, CalendarCheck, Home, Users, ClipboardList, PanelLeftClose, PanelLeftOpen, UserRound } from 'lucide-react';
import { getStaff, readAuthSession, type ServerStaff } from '../lib/api';
import StaffRequestCenter from '../components/staff/StaffRequestCenter';
import StaffCalendar from '../components/staff/StaffCalendar';
import StaffSelfProfile from '../components/staff/StaffSelfProfile';
import type { StaffMember } from '../components/staff/types';
import SupervisorRequestsPage from './SupervisorRequestsPage';

const karmarkerLogo = new URL('../assets/karmarkar_color_logo.png', import.meta.url).href;

type StaffPortalPageProps = {
  orgName?: string;
  onLogout: () => void;
  pendingApprovals: number;
  notificationError: string;
};

function toStaffMember(row: ServerStaff): StaffMember {
  const pools = Array.isArray(row.pool_assignments)
    ? row.pool_assignments.map((assignment: any) => String(assignment?.pool_id ?? assignment)).filter(Boolean)
    : [];
  return {
    id: String(row.id),
    name: row.name,
    title: row.designation || 'Clinical Staff',
    specialization: ['General'],
    contractId: row.contract_id || '',
    department: row.department || undefined,
    departmentId: typeof row.department_id === 'number' ? row.department_id : undefined,
    supervisor: row.supervisor || 'Hospital Admin',
    status: 'Active',
    email: row.email || '',
    employeeId: row.staff_id.startsWith('#') ? row.staff_id : `#${row.staff_id}`,
    skills: ['General Medicine'],
    weeklySchedule: [],
    effortRoles: [],
    pools,
  };
}

export default function StaffPortalPage({ orgName, onLogout, pendingApprovals, notificationError }: StaffPortalPageProps) {
  const session = readAuthSession();
  const authUser = session.user;
  const organizationId = authUser?.organization_id ?? 1;
  const [member, setMember] = useState<StaffMember | null>(null);
  const [staffRecord, setStaffRecord] = useState<ServerStaff | null>(null);
  const [profileRefresh, setProfileRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePage, setActivePage] = useState<'home' | 'team' | 'requests' | 'request-center' | 'profile'>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navLabelClass = sidebarCollapsed ? 'hidden' : 'hidden sm:inline';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setMember(null);
    setStaffRecord(null);
    getStaff({ orgId: organizationId })
      .then(rows => {
        if (cancelled) return;
        const email = authUser?.email?.toLowerCase() || '';
        const match = rows.find(row => (row.email || '').toLowerCase() === email);
        if (!match) { setError('No staff profile is linked to this account. Please contact an administrator.'); return; }
        setMember(toStaffMember(match));
        setStaffRecord(match);
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load your profile.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [organizationId, authUser?.email, profileRefresh]);

  const initials = useMemo(() => (authUser?.first_name || authUser?.email || 'U').slice(0, 1).toUpperCase(), [authUser]);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white p-3 transition-[width] duration-300 motion-reduce:transition-none ${sidebarCollapsed ? 'w-20' : 'w-20 sm:w-56 sm:p-5'}`}>
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <div className="relative w-12 h-12 shrink-0 overflow-hidden">
              <img
                src={karmarkerLogo}
                alt="Karmarker logo"
                className="absolute left-1/2 top-1/2 w-[246%] h-auto max-w-none -translate-x-1/2 -translate-y-1/2"
                style={{ clipPath: 'polygon(50.1% 17.2%, 70.4% 83.5%, 29.7% 83.5%)' }}
              />
            </div>
            <div className={sidebarCollapsed ? 'hidden' : 'hidden sm:block text-left'}>
              <h3 className="text-[9px] sm:text-[22px] font-black text-primary leading-none font-headline">Karmarker</h3>
              <p className="mt-1 text-[9px] sm:text-sm font-extrabold text-blue-700">Staff Portal</p>
            </div>
          </div>
        </div>
        <nav aria-label="Staff navigation" className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {[{ id: 'home' as const, label: 'Home', icon: Home }, { id: 'profile' as const, label: 'My Profile', icon: UserRound }, { id: 'request-center' as const, label: 'Request Center', icon: CalendarCheck }, { id: 'requests' as const, label: 'My Request', icon: ClipboardList }, { id: 'team' as const, label: 'My Team', icon: Users }].map(item => <button key={item.id} type="button" title={item.label} aria-current={activePage === item.id ? 'page' : undefined} aria-label={item.id === 'team' && pendingApprovals ? `My Team, ${pendingApprovals} requests require approval` : item.label} onClick={() => setActivePage(item.id)} className={`relative flex w-full items-center gap-3 rounded-xl p-3 text-sm font-bold ${activePage === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <item.icon size={20} className="shrink-0" /><span className={navLabelClass}>{item.label}</span>
            {item.id === 'team' && pendingApprovals > 0 && <span className={`absolute right-0 top-0 ${sidebarCollapsed ? '' : 'sm:static sm:ml-auto'} flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white`}>{pendingApprovals}</span>}
          </button>)}
        </nav>
        <div className="mt-auto shrink-0 border-t border-slate-200 pt-4 space-y-1">
          <button type="button" onClick={onLogout} aria-label="Sign out" title="Sign out" className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-bold text-red-700 hover:bg-red-50">
            <LogOut size={20} className="shrink-0" /><span className={navLabelClass}>Sign out</span>
          </button>
          <button type="button" onClick={() => setSidebarCollapsed(previous => !previous)} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!sidebarCollapsed} className="hidden sm:flex w-full items-center gap-3 rounded-xl p-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
            {sidebarCollapsed ? <PanelLeftOpen size={20} className="shrink-0" /> : <PanelLeftClose size={20} className="shrink-0" />}
            <span className={navLabelClass}>Collapse sidebar</span>
          </button>
        </div>
      </aside>
      <div className={`min-w-0 transition-[margin] duration-300 motion-reduce:transition-none ${sidebarCollapsed ? 'ml-20' : 'ml-20 sm:ml-56'}`}>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0"><CalendarCheck size={18} /></div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-900 truncate">{orgName || 'Staff Portal'}</p>
              <p className="text-[11px] text-slate-500 truncate">My Schedule & Requests</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="text-right leading-tight">
                <p className="text-xs font-bold text-slate-900">{[authUser?.first_name, authUser?.last_name].filter(Boolean).join(' ') || authUser?.email}</p>
                <p className="text-[10px] text-slate-400">{authUser?.email}</p>
              </div>
              <button type="button" aria-label="Profile avatar" title="View my profile" onClick={() => setActivePage('profile')} className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{initials}</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {notificationError && <p role="alert" className="mb-4 text-sm text-red-700">Unable to refresh approval notifications: {notificationError}</p>}
        {activePage === 'team' ? <SupervisorRequestsPage directReportsOnly /> : <>
          {loading && <p className="text-sm text-slate-500" role="status">Loading your staff information...</p>}
          {error && !loading && <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-4"><p role="alert">{error}</p><button type="button" onClick={() => setProfileRefresh(previous => previous + 1)} className="mt-3 font-bold underline">Retry loading profile</button></div>}
          {member && !loading && (activePage === 'profile' && staffRecord
            ? <StaffSelfProfile key={`${staffRecord.id}:${profileRefresh}`} staff={staffRecord} onRefresh={() => setProfileRefresh(previous => previous + 1)} refreshing={loading} />
            : activePage === 'home'
            ? <StaffCalendar key={member.employeeId} employeeId={member.employeeId} organizationId={organizationId} />
            : <StaffRequestCenter key={activePage} member={member} view={activePage === 'requests' ? 'requests' : 'overview'} />)}
        </>}
      </main>
      </div>
    </div>
  );
}
