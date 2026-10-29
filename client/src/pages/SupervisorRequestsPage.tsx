import { useEffect, useState } from 'react';
import { Check, X, RefreshCw, UserRound, Users, ClipboardList, Clock, Search, ChevronLeft, ChevronRight, CalendarDays, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { getStaffRequests, getSupervisorTeam, reviewStaffRequest, staffRequestStage, type StaffRequest } from '../services/api-staff-requests';
import type { ServerStaff } from '../services/api-staff';

const PAGE_SIZE = 10;
const tableHeading = 'px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left';
const controlStyle = 'h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500';

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function requestTitle(request: StaffRequest) {
  return request.metadata?.swap ? 'Shift Swap' : request.leave_type_name || (request.shift === 'O' ? 'Shift Off' : request.shift || 'Shift Request');
}

function TablePagination({ page, count, label, onChange }: { page: number; count: number; label: string; onChange: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const firstPage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => firstPage + index);
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/30 px-6 py-4">
    <p className="text-xs text-slate-500">{count ? <>Showing <span className="font-bold text-slate-900">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, count)}</span> of <span className="font-bold text-slate-900">{count}</span> {label}</> : `No ${label} to show`}</p>
    <nav aria-label={`${label} pagination`} className="flex items-center gap-1">
      <button type="button" aria-label={`Previous ${label} page`} disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded p-2 text-slate-400 transition-colors hover:bg-slate-100 disabled:opacity-40"><ChevronLeft size={16} /></button>
      {pages.map(number => <button key={number} type="button" aria-label={`${label} page ${number}`} aria-current={page === number ? 'page' : undefined} onClick={() => onChange(number)} className={cn('h-8 w-8 rounded text-xs transition-colors', number === page ? 'bg-blue-700 font-bold text-white' : 'font-medium text-slate-600 hover:bg-slate-100')}>{number}</button>)}
      <button type="button" aria-label={`Next ${label} page`} disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="rounded p-2 text-slate-400 transition-colors hover:bg-slate-100 disabled:opacity-40"><ChevronRight size={16} /></button>
    </nav>
  </div>;
}

export default function SupervisorRequestsPage({ onViewProfile, directReportsOnly = false }: { onViewProfile?: (id: string) => void; directReportsOnly?: boolean }) {
  const [team, setTeam] = useState<ServerStaff[]>([]);
  const [ownStaff, setOwnStaff] = useState<ServerStaff[]>([]);
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [status, setStatus] = useState('PENDING');
  const [requestSearch, setRequestSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [requestPage, setRequestPage] = useState(1);
  const [teamPage, setTeamPage] = useState(1);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([getSupervisorTeam(), getStaffRequests()]).then(([members, rows]) => {
      if (cancelled) return;
      setTeam(members.staff);
      setOwnStaff(members.own_staff);
      setRequests(directReportsOnly ? rows.filter(request => members.staff.some(member => member.staff_id === request.staff_id)) : rows);
      setLoaded(true);
    }).catch(reason => { if (!cancelled) setError(reason.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshTick, directReportsOnly]);

  useEffect(() => {
    const refresh = () => setRefreshTick(previous => previous + 1);
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    window.addEventListener('staff-requests-changed', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('staff-requests-changed', refresh); };
  }, []);

  const review = async (request: StaffRequest, decision: 'APPROVED' | 'REJECTED') => {
    if (reviewingId !== null) return;
    setReviewingId(request.id);
    setError('');
    setSuccessMessage('');
    try {
      const saved = await reviewStaffRequest(request.id, decision);
      setSuccessMessage(saved.metadata?.swap
        ? saved.status === 'APPROVED' ? 'Shift swap approved. Rostering for the affected pools has been queued.'
          : saved.status === 'PENDING' ? 'Shift swap forwarded to hospital admin for final approval.' : 'Shift swap rejected.'
        : 'Request decision saved.');
      setRefreshTick(previous => previous + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save decision');
    } finally {
      setReviewingId(null);
    }
  };

  const visible = requests.filter(request => (status === 'ALL' || request.status === status) &&
    [request.staff_id, request.staff_name, request.staff_department, request.staff_designation, requestTitle(request), request.reason, request.metadata?.target_colleague_name]
      .some(value => String(value || '').toLowerCase().includes(requestSearch.trim().toLowerCase())));
  const filteredTeam = team.filter(member => [member.staff_id, member.name, member.department, member.designation, member.email]
    .some(value => (value || '').toLowerCase().includes(teamSearch.trim().toLowerCase())));
  const currentRequestPage = Math.min(requestPage, Math.max(1, Math.ceil(visible.length / PAGE_SIZE)));
  const currentTeamPage = Math.min(teamPage, Math.max(1, Math.ceil(filteredTeam.length / PAGE_SIZE)));
  const pendingCount = requests.filter(request => request.status === 'PENDING' && request.can_review).length;

  return <div className="min-w-0 space-y-8 pb-12">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900">My Team</h2>
        <p className="mt-2 text-sm text-slate-500">Manage staff requests, approvals, and direct reports</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onViewProfile && ownStaff.map(member => <button key={member.id} type="button" onClick={() => onViewProfile(String(member.id))} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"><UserRound size={16} />My Profile</button>)}
        <button type="button" title="Refresh team and requests" aria-label="Refresh team and requests" disabled={loading} onClick={() => setRefreshTick(previous => previous + 1)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Refresh</button>
      </div>
    </header>

    {error && <div role="alert" className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18} className="shrink-0" />{error}</div>}
    {successMessage && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">{successMessage}</p>}
    {loading && !loaded && <p role="status" className="text-sm text-slate-500">Loading team and requests...</p>}
    {loaded && directReportsOnly && !team.length && <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
      <Users size={32} className="mx-auto mb-3 text-slate-300" />
      <h3 className="text-lg font-bold text-slate-900">No direct reports</h3>
      <p className="mt-2 text-sm text-slate-500">You do not have any reportees assigned to you. Your team and their requests will appear here when you are assigned as a supervisor.</p>
    </section>}
    {loaded && (!directReportsOnly || team.length > 0) && <>
      <section aria-label="Team overview" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { label: 'Awaiting Your Approval', value: pendingCount, icon: Clock, color: 'bg-amber-50 text-amber-700' },
          { label: 'Direct Reports', value: team.length, icon: Users, color: 'bg-indigo-50 text-indigo-700' },
        ].map(metric => <div key={metric.label} className="flex items-center gap-4 rounded-2xl border border-slate-200/50 bg-white p-5 shadow-sm">
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', metric.color)}><metric.icon size={21} /></div>
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{metric.label}</p><p className="mt-1 text-2xl font-extrabold text-slate-900">{metric.value}</p></div>
        </div>)}
      </section>

      <section aria-labelledby="team-requests-heading" className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div><h3 id="team-requests-heading" className="flex items-center gap-2 text-base font-bold text-slate-900"><ClipboardList size={18} className="text-primary" />Staff Requests</h3><p className="mt-1 text-xs text-slate-500">Review leave, shift changes, and shift swaps</p></div>
          {pendingCount > 0 && <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">{pendingCount} requiring your approval</span>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/40 px-6 py-3">
          <div className="relative w-full sm:max-w-xs"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Search staff requests" placeholder="Search staff, request, or reason..." value={requestSearch} onChange={event => { setRequestSearch(event.target.value); setRequestPage(1); }} className={cn(controlStyle, 'w-full pl-9')} /></div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">Status<select aria-label="Request status" value={status} onChange={event => { setStatus(event.target.value); setRequestPage(1); }} className={controlStyle}><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="ALL">All</option></select></label>
        </div>
        <div className="overflow-x-auto">
          <table aria-label="Staff requests" className="w-full min-w-[980px] text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50/50">
              {['Staff ID', 'Name & Professional Title', 'Request', 'Dates & Reason', 'Status', 'Decision'].map(heading => <th key={heading} scope="col" className={cn(tableHeading, heading === 'Decision' && 'text-center')}>{heading}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {visible.slice((currentRequestPage - 1) * PAGE_SIZE, currentRequestPage * PAGE_SIZE).map(request => <tr key={request.id} className="group transition-colors hover:bg-slate-50/50">
                <td className="whitespace-nowrap px-6 py-5 font-mono text-xs text-slate-600">{request.staff_id}</td>
                <td className="px-6 py-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{initials(request.staff_name || '')}</div><div className="min-w-36"><p className="text-sm font-bold text-slate-900">{request.staff_name}</p><p className="mt-0.5 text-xs text-slate-500">{request.staff_designation || request.staff_department || '-'}</p></div></div></td>
                <td className="px-6 py-5"><div className="flex min-w-32 items-center gap-2 text-sm font-semibold text-slate-800">{request.metadata?.swap ? <ArrowRightLeft size={15} className="shrink-0 text-indigo-600" /> : <CalendarDays size={15} className="shrink-0 text-blue-600" />}{requestTitle(request)}</div>{request.metadata?.swap && <p className="mt-1 text-xs text-slate-500">With {request.metadata.target_colleague_name}</p>}</td>
                <td className="px-6 py-5"><p className="whitespace-nowrap text-xs font-semibold text-slate-700">{request.start_date} - {request.end_date}</p><p className="mt-1 max-w-xs whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-500">{request.reason || 'No reason provided'}</p></td>
                <td className="px-6 py-5"><span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold', request.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : request.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700')}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{staffRequestStage(request)}</span></td>
                <td className="px-6 py-5 text-center">{request.can_review ? <div className="flex items-center justify-center gap-2">
                  <button type="button" aria-label={`Approve request for ${request.staff_name}`} disabled={reviewingId !== null || loading} onClick={() => review(request, 'APPROVED')} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-on-primary transition-colors hover:opacity-90 disabled:opacity-50"><Check size={14} />Approve</button>
                  <button type="button" aria-label={`Reject request for ${request.staff_name}`} disabled={reviewingId !== null || loading} onClick={() => review(request, 'REJECTED')} className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"><X size={14} />Reject</button>
                </div> : <span className="whitespace-nowrap text-xs text-slate-400">{request.status === 'PENDING' ? 'Awaiting reviewer' : 'Reviewed'}</span>}</td>
              </tr>)}
              {!visible.length && <tr><td colSpan={6} className="px-6 py-12 text-center"><ClipboardList size={28} className="mx-auto mb-3 text-slate-300" /><p className="text-sm font-bold text-slate-700">{requests.length ? 'No matching requests' : 'No requests yet'}</p><p className="mt-1 text-xs text-slate-500">{requests.length ? 'Try another search or status filter.' : 'Staff requests will appear here when submitted.'}</p></td></tr>}
            </tbody>
          </table>
        </div>
        <TablePagination page={currentRequestPage} count={visible.length} label="requests" onChange={setRequestPage} />
      </section>

      <section aria-labelledby="team-reports-heading" className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5"><div><h3 id="team-reports-heading" className="flex items-center gap-2 text-base font-bold text-slate-900"><Users size={18} className="text-primary" />Direct Reports</h3><p className="mt-1 text-xs text-slate-500">Staff assigned to you as their supervisor</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{team.length} staff members</span></div>
        <div className="border-b border-slate-200 bg-slate-50/40 px-6 py-3"><div className="relative w-full sm:max-w-xs"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Search direct reports" placeholder="Search staff, title, or department..." value={teamSearch} onChange={event => { setTeamSearch(event.target.value); setTeamPage(1); }} className={cn(controlStyle, 'w-full pl-9')} /></div></div>
        <div className="overflow-x-auto">
          <table aria-label="Direct reports" className="w-full min-w-[700px] text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50/50">{['Staff ID', 'Name & Professional Title', 'Department', 'Contact', ...(onViewProfile ? ['Actions'] : [])].map(heading => <th key={heading} scope="col" className={cn(tableHeading, heading === 'Actions' && 'text-center')}>{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeam.slice((currentTeamPage - 1) * PAGE_SIZE, currentTeamPage * PAGE_SIZE).map(member => <tr key={member.id} className="transition-colors hover:bg-slate-50/50">
                <td className="whitespace-nowrap px-6 py-5 font-mono text-xs text-slate-600">{member.staff_id}</td>
                <td className="px-6 py-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{initials(member.name)}</div><div><p className="text-sm font-bold text-slate-900">{member.name}</p><p className="mt-0.5 text-xs text-slate-500">{member.designation || '-'}</p></div></div></td>
                <td className="px-6 py-5 text-sm text-slate-600">{member.department || '-'}</td>
                <td className="px-6 py-5 text-xs text-slate-500">{member.email || '-'}</td>
                {onViewProfile && <td className="px-6 py-5 text-center"><button type="button" onClick={() => onViewProfile(String(member.id))} className="whitespace-nowrap rounded px-3 py-2 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50">View Profile</button></td>}
              </tr>)}
              {!filteredTeam.length && <tr><td colSpan={onViewProfile ? 5 : 4} className="px-6 py-12 text-center"><Users size={28} className="mx-auto mb-3 text-slate-300" /><p className="text-sm font-bold text-slate-700">{team.length ? 'No matching staff members' : 'No direct reports assigned'}</p><p className="mt-1 text-xs text-slate-500">{team.length ? 'Try another name, staff ID, or department.' : 'Staff assigned to you as supervisor will appear here.'}</p></td></tr>}
            </tbody>
          </table>
        </div>
        <TablePagination page={currentTeamPage} count={filteredTeam.length} label="staff members" onChange={setTeamPage} />
      </section>
    </>}
  </div>;
}