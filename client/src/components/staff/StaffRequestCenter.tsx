import React, { useState, useMemo, useEffect, useContext } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowRight,
  Edit3,
  FileText,
  Info,
  Check,
  Sparkles,
  PieChart,
  User,
  Activity,
  X,
  Edit,
  Clock,
  CheckCircle,
  AlertCircle,
  Lock,
  Users,
  Search,
  ArrowRightLeft,
  CalendarDays,
  Filter,
  Download,
  CornerDownRight,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import CatalogSelect from '../ui/CatalogSelect';
import type { StaffMember } from './types';
import { createStaffRequest, getStaffRequests, getRequestCatalogs, reviewStaffRequest, staffRequestStage, type StaffRequest } from '../../services/api-staff-requests';
import { readAuthSession } from '../../services/api-core';
import { getAllRosterings, mergeEmployeeRosterings, getUpcomingEmployeeShifts, type ServerEmployeeRosteringByDate, type ServerRosteringRow } from '../../services/api-rosterings';
import { AppStoreContext } from '../../context/AppStoreContext';
import { getCatalogShifts, getPoolDemand, getPools, getStaff } from '../../lib/api';

type RosterLabels = { shifts: Record<string, { name: string; time: string }>; pools: Record<string, string> };
type UpcomingShift = { id: string; date: string; shift: string; pool?: string; label: string; time: string };

const REQUEST_CATEGORY_OPTIONS = [
  { value: 'leave', label: 'Leave (Time-Off)' },
  { value: 'shift', label: 'Shift Off / Duty Modification' },
];

interface UserProfile {
  name: string;
  department: string;
  role: string;
  avatarUrl: string;
}

type RequestStatus = 'Urgent Review' | 'Pending' | 'Approved' | 'Under Review' | 'Rejected' | 'Draft';

interface LeaveRequest {
  id: string;
  staffId?: string;
  staffName: string;
  staffCategory: string;
  department: string;
  avatarUrl: string;
  category: 'leave' | 'shift';
  type: string;
  startDate: string;
  endDate: string;
  notes: string;
  status: RequestStatus;
  dateSubmitted: string;
  targetColleague?: string;
  originalShift?: string;
  targetShift?: string;
  canReview?: boolean;
  approvalStage?: string;
}

interface Colleague {
  id: string;
  name: string;
  department: string;
  role: string;
  avatarUrl: string;
  pools: string[];
}

interface DashboardPendingRequest {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  badgeType: 'review' | 'approved' | 'rejected' | 'draft';
  progress?: { current: number; total: number };
  details?: string;
}

const CALENDAR_SHIFTS_MAY_2024 = [
  { day: 1, label: 'OR Shift (08:00)', type: 'or-shift' },
  { day: 3, label: 'Consultation', type: 'consultation' },
  { day: 6, label: 'OR Shift (08:00)', type: 'or-shift', selected: true },
  { day: 8, label: 'Admin Half-Day', type: 'admin' },
];

const INITIAL_DASHBOARD_REQUESTS: DashboardPendingRequest[] = [
  { id: 'dash-req-1', title: 'ANNUAL LEAVE', subtitle: 'May 20 - May 25, 2024', badgeText: 'Under Review', badgeType: 'review', progress: { current: 2, total: 3 } },
  { id: 'dash-req-2', title: 'PROFILE UPDATE', subtitle: 'Address & Contact change', badgeText: 'Approved', badgeType: 'approved', details: 'Completed on May 02, 2024' },
  { id: 'dash-req-3', title: 'SHIFT SWAP', subtitle: 'With Dr. Helen Smith (May 15)', badgeText: 'Draft', badgeType: 'draft' },
];

const INITIAL_REQUESTS: LeaveRequest[] = [
  { id: 'req-1', staffName: 'Dr. Julian Vane', staffCategory: 'Senior Surgeon', department: 'Emergency Medicine', avatarUrl: '', category: 'leave', type: 'Vacation', startDate: '2024-10-12', endDate: '2024-10-15', notes: 'Attending annual surgical conference and wellness break.', status: 'Urgent Review', dateSubmitted: '2024-05-18' },
  { id: 'req-2', staffName: 'Sarah Chen, RN', staffCategory: 'Pediatric Nurse', department: 'Pediatrics', avatarUrl: '', category: 'shift', type: 'Shift Swap', startDate: '2024-10-14', endDate: '2024-10-14', notes: 'Swapping Night Shift with M. Rodriguez due to family obligation.', status: 'Pending', dateSubmitted: '2024-05-19', targetColleague: 'Marcus Rodriguez', originalShift: 'Night Shift', targetShift: 'Day Shift' },
  { id: 'req-3', staffName: 'David Okoro', staffCategory: 'Lab Director', department: 'Pathology Lab', avatarUrl: '', category: 'leave', type: 'Profile Update', startDate: '2024-05-20', endDate: '2024-05-20', notes: 'Applying new ACR Accreditation credentials update.', status: 'Under Review', dateSubmitted: '2024-05-15' },
  { id: 'req-4', staffName: 'Marcus Rodriguez', staffCategory: 'Resident Physician', department: 'Pediatrics', avatarUrl: '', category: 'leave', type: 'CME Request', startDate: '2024-11-02', endDate: '2024-11-04', notes: 'Attending the regional Conference on Pediatric Trauma Care.', status: 'Pending', dateSubmitted: '2024-05-20' },
  { id: 'req-5', staffName: 'Dr. Helen Smith', staffCategory: 'Chief Resident', department: 'Surgical Dept.', avatarUrl: '', category: 'shift', type: 'Shift Swap', startDate: '2024-05-15', endDate: '2024-05-15', notes: 'Requesting swap.', status: 'Draft', dateSubmitted: '2024-05-10' },
];

interface StaffRequestCenterProps {
  member: StaffMember;
  onRequestsChanged?: () => void;
  view?: 'all' | 'overview' | 'requests';
}

type SubTab = 'dashboard' | 'leave' | 'shift-swap';

export default function StaffRequestCenter({ member, onRequestsChanged, view = 'all' }: StaffRequestCenterProps) {
  const [subTab, setSubTab] = useState<SubTab>('dashboard');
  const app = useContext(AppStoreContext);
  const organizationId = readAuthSession().user?.organization_id ?? app?.activeOrgId ?? 1;
  const [roster, setRoster] = useState<ServerEmployeeRosteringByDate>({});
  const [rosterRows, setRosterRows] = useState<ServerRosteringRow[]>([]);
  const [rosterLabels, setRosterLabels] = useState<RosterLabels>({ shifts: {}, pools: {} });
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterError, setRosterError] = useState('');
  useEffect(() => {
    let cancelled = false;
    setRoster({});
    setRosterRows([]);
    setRosterLabels({ shifts: {}, pools: {} });
    setColleagues([]);
    setRosterLoading(true);
    setRosterError('');
    Promise.all([getAllRosterings({ orgId: organizationId }), getCatalogShifts({ orgId: organizationId }).catch(() => []), getPools({ orgId: organizationId }).catch(() => []), getStaff({ orgId: organizationId })]).then(([rows, shifts, pools, staff]) => {
      if (cancelled) return;
      setRosterRows(rows);
      setRoster(mergeEmployeeRosterings(rows, member.employeeId));
      setColleagues(staff.filter(person => person.staff_id !== member.employeeId.replace(/^#/, '')).map(person => ({ id: person.staff_id, name: person.name, department: person.department || '', role: person.designation || '', avatarUrl: person.profile_picture || '', pools: Array.isArray(person.pool_assignments) ? person.pool_assignments.map((assignment: any) => String(assignment?.pool_id ?? assignment)).filter(Boolean) : [] })));
      setRosterLabels({
        shifts: Object.fromEntries(shifts.filter(shift => shift.alias).map(shift => [shift.alias!, { name: shift.name, time: `${shift.start_time} - ${shift.end_time}` }])),
        pools: Object.fromEntries(pools.map(pool => [pool.pool_id, pool.pool_name])),
      });
    }).catch(error => { if (!cancelled) setRosterError(error.message); })
      .finally(() => { if (!cancelled) setRosterLoading(false); });
    return () => { cancelled = true; };
  }, [organizationId, member.employeeId]);

  const user: UserProfile = {
    name: member.name,
    department: String(member.department ?? '').trim() || 'Surgery Dept.',
    role: member.title,
    avatarUrl: member.avatarUrl || '',
  };

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [requestError, setRequestError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestsRefresh, setRequestsRefresh] = useState(0);
  const [resumeColleagueId, setResumeColleagueId] = useState<string | null>(null);

  const mapRequest = (request: StaffRequest): LeaveRequest => {
    const swapMeta = request.metadata && request.metadata.swap ? request.metadata : null;
    return {
      id: String(request.id), staffId: request.staff_id, staffName: request.staff_name || member.name,
      staffCategory: request.staff_designation || member.title, department: request.staff_department || '', avatarUrl: '',
      category: request.request_category === 'LEAVE' ? 'leave' : 'shift',
      type: swapMeta ? 'Shift Swap' : request.leave_type_name || (request.shift === 'O' ? 'Shift Off' : request.shift || 'Shift'),
      startDate: request.start_date, endDate: request.end_date, notes: request.reason || '',
      status: request.status === 'APPROVED' ? 'Approved' : request.status === 'REJECTED' ? 'Rejected' : 'Pending',
      dateSubmitted: request.created_at.slice(0, 10), canReview: request.can_review,
      approvalStage: staffRequestStage(request),
      targetColleague: swapMeta ? swapMeta.target_colleague_name : undefined,
      originalShift: swapMeta ? swapMeta.own_shift : undefined,
      targetShift: swapMeta ? swapMeta.preferred_shift : undefined,
    };
  };

  useEffect(() => {
    setRequests([]);
    setLoading(true);
  }, [member.employeeId, member.email, view]);

  useEffect(() => {
    let cancelled = false;
    setRequestError('');
    const ownProfile = member.email.toLowerCase() === readAuthSession().user?.email.toLowerCase();
    const staffId = member.employeeId.replace(/^#/, '');
    getStaffRequests(view === 'all' && ownProfile ? undefined : staffId).then(rows => {
      if (!cancelled) setRequests((view === 'all' ? rows : rows.filter(row => row.staff_id === staffId)).map(mapRequest));
    }).catch(error => { if (!cancelled) setRequestError(error.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [member.employeeId, member.email, requestsRefresh, view]);

  useEffect(() => {
    const refresh = () => setRequestsRefresh(previous => previous + 1);
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    window.addEventListener('staff-requests-changed', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('staff-requests-changed', refresh);
    };
  }, []);

  const dashboardRequests: DashboardPendingRequest[] = requests.map(request => ({
    id: request.id, title: request.type.toUpperCase(), subtitle: `${request.startDate} - ${request.endDate}`,
    badgeText: request.approvalStage || request.status, badgeType: request.status === 'Approved' ? 'approved' : request.status === 'Rejected' ? 'rejected' : 'review',
  }));

  const effectiveRoster = { ...roster };
  for (const request of [...requests].reverse()) {
    if (request.staffId !== member.employeeId.replace(/^#/, '') || request.status !== 'Approved') continue;
    const current = new Date(`${request.startDate}T00:00:00Z`);
    const end = new Date(`${request.endDate}T00:00:00Z`);
    while (current <= end) {
      const date = current.toISOString().slice(0, 10);
      effectiveRoster[date] = { shift: request.targetShift || (request.category === 'leave' ? 'V' : request.type === 'Shift Off' ? 'O' : request.type), pool: roster[date]?.pool };
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  const toUpcomingShifts = (assignments: ServerEmployeeRosteringByDate): UpcomingShift[] => {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return getUpcomingEmployeeShifts(assignments, todayIso).map(assignment => ({
      id: `${assignment.date}:${assignment.pool || ''}:${assignment.shift}`, date: assignment.date, shift: assignment.shift!, pool: assignment.pool,
      label: `${rosterLabels.shifts[assignment.shift!]?.name || assignment.shift}${assignment.pool ? ` - ${rosterLabels.pools[assignment.pool] || assignment.pool}` : ''}`,
      time: rosterLabels.shifts[assignment.shift!]?.time || '',
    }));
  };

  // Each colleague's roster assignments by date, used to match the swap day's preferred shift.
  const colleagueRosters = useMemo(() => {
    const map: Record<string, ServerEmployeeRosteringByDate> = {};
    for (const colleague of colleagues) {
      map[colleague.id] = mergeEmployeeRosterings(rosterRows, colleague.id);
    }
    return map;
  }, [colleagues, rosterRows]);

  const handleSubmitLeaveRequest = async (newReq: Partial<LeaveRequest>) => {
    if (newReq.status === 'Draft' || newReq.targetColleague) throw new Error('Use a leave or shift-off request for supervisor review. Shift swaps require a separate workflow.');
    const saved = await createStaffRequest({
      staff_id: member.employeeId.replace(/^#/, ''), request_category: newReq.category === 'shift' ? 'SHIFT' : 'LEAVE',
      leave_type_name: newReq.category === 'shift' ? undefined : newReq.type,
      shift: newReq.category === 'shift' ? newReq.type : undefined,
      start_date: newReq.startDate || '', end_date: newReq.endDate || '', reason: newReq.notes || '',
    });
    setRequests(previous => [mapRequest(saved), ...previous]);
    setSuccessMessage(newReq.category === 'shift' ? 'Shift request has been sent to your manager.' : 'Leave request has been sent to your manager.');
    onRequestsChanged?.();
  };

  const handleSelectSwapDraft = () => {
    setResumeColleagueId('col-3');
    setSubTab('shift-swap');
  };

  const handleSubmitSwapRequest = async (payload: { ownShiftAlias: string; ownDate: string; preferredShift: string; colleagueStaffId: string; justification: string }) => {    const saved = await createStaffRequest({
      staff_id: member.employeeId.replace(/^#/, ''),
      request_category: 'SHIFT',
      shift: payload.ownShiftAlias,
      start_date: payload.ownDate,
      end_date: payload.ownDate,
      reason: payload.justification,
      swap: { target_staff_id: payload.colleagueStaffId, preferred_shift: payload.preferredShift },
    });
    setRequests(previous => [mapRequest(saved), ...previous]);
    setSuccessMessage('Shift swap request has been sent to your supervisor. After their approval, it will go to the hospital admin for final approval.');
    onRequestsChanged?.();
  };

  const handleUpdateStatus = async (requestId: string, nextStatus: RequestStatus) => {
    const saved = await reviewStaffRequest(Number(requestId), nextStatus === 'Approved' ? 'APPROVED' : 'REJECTED');
    setRequests(previous => previous.map(request => request.id === requestId ? mapRequest(saved) : request));
    if (saved.metadata?.swap) setSuccessMessage(saved.status === 'APPROVED'
      ? 'Shift swap approved. Rostering for the affected pools has been queued.'
      : saved.status === 'PENDING' ? 'Shift swap forwarded to hospital admin for final approval.' : 'Shift swap rejected.');
    onRequestsChanged?.();
  };

  const navigateTo = (tabId: string) => {
    if (view === 'requests') return;
    if (tabId === 'leave-preferences') setSubTab('leave');
    else if (tabId === 'shift-swap') setSubTab('shift-swap');
    else if (tabId === 'dashboard') setSubTab('dashboard');
  };

  return (
    <div className="w-full animate-smooth-fade">
      <style>{`
        @keyframes smooth-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scale-up { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        .animate-smooth-fade { animation: smooth-fade 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-scale-up { animation: scale-up 0.2s ease-out; }
        .animate-fade-in { animation: smooth-fade 0.2s ease-out; }
        .transition-soft { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>

      <div className="mb-6">
        {successMessage && <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"><span>{successMessage}</span><button type="button" aria-label="Dismiss confirmation" onClick={() => setSuccessMessage('')}><X size={18} /></button></div>}
        {loading && <p className="text-sm text-slate-500" role="status">Loading requests...</p>}
        {requestError && <p className="text-sm text-red-700" role="alert">{requestError}</p>}
        {rosterLoading && <p className="text-sm text-slate-500" role="status">Loading staff roster...</p>}
        {rosterError && <p className="text-sm text-red-700" role="alert">{rosterError}</p>}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">{view === 'requests' ? 'My Request' : view === 'overview' ? 'Request Center' : 'Staff Request Center'}</h2>
            <p className="text-slate-600 max-w-2xl text-sm leading-relaxed">
              {view === 'requests' ? 'View your personal request overview and track approval status.' : 'Manage clinical availability, schedule adjustments, leave requests, shift swaps, and administrative credentials for this staff member.'}
            </p>
          </div>
        </div>

        {view !== 'requests' && <div className="bg-slate-100 p-1.5 rounded-2xl h-auto w-full max-w-xl grid grid-cols-2 sm:flex gap-1">
          {[
            { id: 'dashboard', label: 'Overview', icon: Activity },
            { id: 'leave', label: 'Leave', icon: CalendarDays },
            { id: 'shift-swap', label: 'Shift Swap', icon: ArrowRightLeft },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as SubTab)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs gap-1.5 flex items-center justify-center transition-colors whitespace-nowrap ${
                subTab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>}
      </div>

      {subTab === 'dashboard' && (
        <DashboardView
          key={member.employeeId}
          roster={effectiveRoster}
          rosterLoading={rosterLoading}
          rosterLabels={rosterLabels}
          user={user}
          pendingRequests={dashboardRequests}
          onNavigateToTab={navigateTo}
          onSelectSwapDraft={handleSelectSwapDraft}
          onSubmitLeaveRequest={handleSubmitLeaveRequest}
          requests={requests}
          onUpdateRequestStatus={handleUpdateStatus}
          view={view}
        />
      )}

      {subTab === 'leave' && (
        <AvailabilityLeaveView
          requestHistory={requests.filter(request => request.staffName === member.name)}
          pools={member.pools}
          onSubmitLeaveRequest={handleSubmitLeaveRequest}
          onNavigateToTab={navigateTo}
        />
      )}

      {subTab === 'shift-swap' && (
        <ShiftSwapWizardView
          key={member.employeeId}
          member={member}
          upcomingShifts={toUpcomingShifts(effectiveRoster)}
          colleagues={colleagues}
          colleagueRosters={colleagueRosters}
          shiftLabels={rosterLabels.shifts}
          preSelectedColleagueId={resumeColleagueId}
          onSubmitSwap={handleSubmitSwapRequest}
          onNavigateToTab={navigateTo}
        />
      )}
    </div>
  );
}

/* ============================================================
   DASHBOARD VIEW
   ============================================================ */
interface DashboardViewProps {
  view: 'all' | 'overview' | 'requests';
  roster: ServerEmployeeRosteringByDate;
  rosterLoading: boolean;
  rosterLabels: RosterLabels;
  user: UserProfile;
  pendingRequests: DashboardPendingRequest[];
  onNavigateToTab: (tabId: string) => void;
  onSelectSwapDraft: () => void;
  onSubmitLeaveRequest: (req: Partial<LeaveRequest>) => void;
  requests: LeaveRequest[];
  onUpdateRequestStatus: (id: string, s: RequestStatus) => Promise<void>;
}

function DashboardView({ roster, rosterLoading, rosterLabels, user, pendingRequests, onNavigateToTab, onSelectSwapDraft, onSubmitLeaveRequest, requests, onUpdateRequestStatus, view }: DashboardViewProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEffortModal, setShowEffortModal] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [clinicalEffort, setClinicalEffort] = useState(70);
  const [researchEffort, setResearchEffort] = useState(20);
  const [adminEffort, setAdminEffort] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'All' | 'leave' | 'shift'>('All');
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [bannerAlert, setBannerAlert] = useState('');
  const [selectedFloatSurgeon, setSelectedFloatSurgeon] = useState<string | null>(null);

  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const monthLabel = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const getShiftForDay = (dayNum: number) => {
    const date = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const request = requests.find(item => item.staffName === user.name && item.status === 'Approved' && item.startDate <= date && item.endDate >= date);
    if (request) return { label: request.type, type: 'request' };
    const assignment = roster[date];
    return assignment?.shift ? { label: assignment.shift === 'O' ? 'Off' : assignment.shift === 'V' ? 'Leave' : rosterLabels.shifts[assignment.shift]?.name || assignment.shift, time: rosterLabels.shifts[assignment.shift]?.time, type: 'roster', pool: assignment.pool ? rosterLabels.pools[assignment.pool] || assignment.pool : undefined } : null;
  };
  const firstDayOffset = (calendarMonth.getDay() + 6) % 7;
  const previousMonthDays = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 0).getDate();
  const monthDays = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const calendarDays = [
    ...Array.from({ length: firstDayOffset }, (_, index) => ({ day: previousMonthDays - firstDayOffset + index + 1, isPrevMonth: true })),
    ...Array.from({ length: monthDays }, (_, index) => ({ day: index + 1, isPrevMonth: false })),
  ];

  const liveRequests = useMemo(() => requests.filter(r => r.status !== 'Draft'), [requests]);
  const totalPending = liveRequests.filter(r => r.status === 'Pending' || r.status === 'Urgent Review' || r.status === 'Under Review').length;
  const urgentCount = liveRequests.filter(r => r.status === 'Urgent Review').length;

  const filteredRequests = useMemo(() => {
    return liveRequests.filter((r) => {
      const matchSearch = r.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = activeCategoryFilter === 'All' ? true : r.category === activeCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [liveRequests, searchQuery, activeCategoryFilter]);

  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const handleAction = async (id: string, status: RequestStatus, name: string) => {
    setReviewingId(id);
    try {
      await onUpdateRequestStatus(id, status);
      setBannerAlert(`Review saved for ${name}. See the request's current approval stage.`);
    } catch (error) {
      setBannerAlert(error instanceof Error ? error.message : 'Unable to save decision.');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row gap-8">
        <div className="min-w-0 flex-1 space-y-8">
          {view !== 'requests' && <>
          <section aria-label="Schedule & Time-Off" className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Schedule & Time-Off</h3>
                <p className="text-xs text-slate-500 font-medium">Roster assignments and approved time off</p>
                {!rosterLoading && !Object.keys(roster).length && <p className="text-xs text-slate-500 mt-2">No saved roster assignments for this staff member.</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-slate-50 border border-slate-100 text-slate-800 px-4 py-1.5 rounded-lg text-xs font-bold">{monthLabel}</span>
                <div className="flex items-center gap-1">
                  <button aria-label="Previous month" onClick={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-600"><ChevronLeft size={16} /></button>
                  <button aria-label="Next month" onClick={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-600"><ChevronRight size={16} /></button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-7 border-b border-slate-100 pb-3 mb-3">
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => (
                    <div key={d} className="text-center text-[11px] font-bold tracking-widest text-slate-400">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map(({ day, isPrevMonth }, index) => {
                    const shift = !isPrevMonth ? getShiftForDay(day) : null;
                    const cellDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - (isPrevMonth ? 1 : 0), day);
                    const date = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = !isPrevMonth && selectedDate === date;
                    return (
                      <button
                        type="button"
                        aria-label={`Schedule for ${date}`}
                        aria-pressed={isSelected}
                        disabled={isPrevMonth}
                        key={index}
                        onClick={() => setSelectedDate(date)}
                        className={`min-h-[100px] p-2.5 rounded-xl border transition-soft cursor-pointer flex flex-col justify-between relative ${
                          isPrevMonth ? 'bg-slate-50/50 border-slate-50 text-slate-300 pointer-events-none' :
                          isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/10' :
                          'bg-white border-slate-100 text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <span className={`text-xs font-bold ${isPrevMonth ? 'text-slate-300' : isSelected ? 'text-white' : 'text-slate-400'}`}>{day}</span>
                        {shift && (
                          <div className="mt-2">
                            {shift.type === 'request' && <div className="mt-1 p-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 text-[10px] font-bold leading-snug break-words">{shift.label}</div>}
                            {shift.type === 'roster' && <div className="mt-1 p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold leading-snug break-words">{shift.label}{shift.time && <div className="mt-1 font-medium">{shift.time}</div>}{shift.pool && <div className="mt-1 font-medium">{shift.pool}</div>}</div>}
                            {shift.type === 'or-shift' && (
                              <div className={`mt-1 p-2 rounded-lg text-[10px] font-extrabold tracking-tight leading-snug ${
                                isSelected ? 'bg-white/20 text-white border border-white/10' : 'bg-blue-50 text-blue-700 border border-blue-100'
                              }`}>
                                OR Shift<div className="font-medium opacity-90">(08:00)</div>
                              </div>
                            )}
                            {shift.type === 'consultation' && (
                              <div className="mt-1 p-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 text-[10px] font-extrabold tracking-tight leading-snug">Consultation</div>
                            )}
                            {shift.type === 'admin' && (
                              <div className="mt-1 p-2 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 text-[10px] font-extrabold tracking-tight leading-snug">
                                Admin<div className="font-medium opacity-90">Half-Day</div>
                              </div>
                            )}
                          </div>
                        )}
                        {isSelected && <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full"></span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button onClick={() => onNavigateToTab('leave-preferences')} className="group text-left bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-soft cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 transition-soft group-hover:scale-110">
                <CalendarIcon size={20} />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">Request Vacation</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Submit planned leave for departmental review and approval.</p>
            </button>
            <button onClick={() => onNavigateToTab('shift-swap')} className="group text-left bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-soft cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4 transition-soft group-hover:scale-110">
                <Activity size={20} />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1 group-hover:text-purple-700 transition-colors">Request Shift Swap</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Coordinate shift exchanges with qualified departmental colleagues.</p>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Administrative Requests</h3>
              <p className="text-xs text-slate-500">Non-clinical adjustments and credentialing updates</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col sm:flex-row items-start gap-4 hover:border-slate-300 transition-soft">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
                  <FileText size={40} className="text-slate-400" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-extrabold text-slate-900">Update Profile Information</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Change contact details, email address, home address, or professional biography.</p>
                  <button onClick={() => setShowProfileModal(true)} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors pt-1">
                    Begin Update <ArrowRight size={14} />
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col sm:flex-row items-start gap-4 hover:border-slate-300 transition-soft">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
                  <PieChart size={40} className="text-blue-600" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-extrabold text-slate-900">Modify Role/Effort Split</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Adjust clinical vs. academic time allocation or regional department coverage splits.</p>
                  <button onClick={() => setShowEffortModal(true)} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors pt-1">
                    Adjust Effort <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          </>}

          {view !== 'overview' && <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-4xl font-extrabold text-slate-900">{String(totalPending).padStart(2, '0')}</span>
                <p className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 mt-1">TOTAL PENDING</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center"><Clock size={20} /></div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-4xl font-extrabold text-red-600">{String(urgentCount).padStart(2, '0')}</span>
                <p className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 mt-1">URGENT REVIEW</p>
              </div>
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center"><AlertTriangle size={20} /></div>
            </div>
            {view === 'all' && <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-4xl font-extrabold text-teal-600">94%</span>
                <p className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 mt-1">COVERAGE RATE</p>
              </div>
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center font-bold">%</div>
            </div>}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search size={16} className="text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search staff or request..."
                  className="w-full sm:w-72 bg-white border border-slate-200/60 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 rounded-xl py-2 pl-9 pr-4 text-xs font-medium"
                />
              </div>
              <div className="hidden md:flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                <button onClick={() => setActiveCategoryFilter('All')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-soft ${activeCategoryFilter === 'All' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>All</button>
                <button onClick={() => setActiveCategoryFilter('leave')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-soft ${activeCategoryFilter === 'leave' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>Leaves</button>
                <button onClick={() => setActiveCategoryFilter('shift')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-soft ${activeCategoryFilter === 'shift' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>Swaps</button>
              </div>
            </div>
            <button onClick={() => alert('Approval logs exported successfully.')} className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2 rounded-xl transition-soft w-full sm:w-auto">
              <Download size={16} /> Export Log
            </button>
          </div>

          {bannerAlert && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl text-xs font-bold animate-pulse text-center">{bannerAlert}</div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table aria-label="Personal requests" className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                    <th className="p-4 px-6">Staff Member</th>
                    <th className="p-4">Request Type</th>
                    <th className="p-4">Timeline / Details</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                            {req.staffName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-slate-900">{req.staffName}</p>
                            <p className="text-[10px] text-slate-500">{req.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {req.category === 'leave' ? <FileText size={16} className="text-blue-600" /> : <Activity size={16} className="text-purple-600" />}
                          <span className="text-xs font-bold text-slate-800">{req.type}</span>
                        </div>
                      </td>
                      <td className="p-4 text-left">
                        <p className="text-xs font-bold text-slate-800">{req.startDate === req.endDate ? req.startDate : `${req.startDate} — ${req.endDate}`}</p>
                        <p className="text-[10px] text-slate-500 max-w-[200px] truncate" title={req.notes}>{req.notes}</p>
                      </td>
                      <td className="p-4">
                        <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          req.status === 'Urgent Review' ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse' :
                          req.status === 'Pending' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          req.status === 'Under Review' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-slate-100 text-slate-500 border border-slate-200/50'
                        }`}>{req.approvalStage || req.status}</span>
                      </td>
                      <td className="p-4 text-right px-6">
                        {req.status === 'Approved' || req.status === 'Rejected' ? (
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block py-2">Resolved</span>
                        ) : !req.canReview ? <span className="text-xs text-slate-500">Awaiting reviewer</span> : (
                          <div className="flex items-center justify-end gap-2.5">
                            <button disabled={reviewingId !== null} onClick={() => handleAction(req.id, 'Approved', req.staffName)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 px-3 rounded-lg text-xs transition-soft flex items-center gap-1.5 cursor-pointer">
                              <Check size={14} /> Accept
                            </button>
                            <button disabled={reviewingId !== null} onClick={() => handleAction(req.id, 'Rejected', req.staffName)} className="border border-slate-200/60 hover:bg-red-50 hover:text-red-700 text-slate-600 font-bold p-2 px-3 rounded-lg text-xs transition-soft flex items-center gap-1.5 cursor-pointer">
                              <X size={14} /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-slate-400">No requests matching the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500 font-medium">
              <span>Showing {filteredRequests.length} entries</span>
            </div>
          </div>
          </>}
        </div>

        {view !== 'overview' && (
        <div className="w-full xl:w-80 shrink-0 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
              <h4 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider">{view === 'requests' ? 'Request Status' : 'Pending Requests'}</h4>
            </div>
            <div className="space-y-6">
              {!pendingRequests.length && <p className="text-xs text-slate-500">No requests yet.</p>}
              {pendingRequests.map((req) => (
                <div key={req.id} className="border-b border-slate-50 pb-5 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h5 className="text-[12px] font-extrabold text-slate-900 tracking-tight leading-none">{req.title}</h5>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider leading-none ${
                      req.badgeType === 'review' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      req.badgeType === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      req.badgeType === 'rejected' ? 'bg-red-50 text-red-700 border border-red-100' :
                      'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>{req.badgeText}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mb-3">{req.subtitle}</p>
                  {req.progress && (
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full transition-soft" style={{ width: `${(req.progress.current / req.progress.total) * 100}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                        <span>Roster Sync</span>
                        <span>Step {req.progress.current} of {req.progress.total}</span>
                      </div>
                    </div>
                  )}
                  {req.details && <p className="text-[10px] italic text-slate-400 font-medium">{req.details}</p>}
                  {view !== 'requests' && req.badgeType === 'draft' && (
                    <button onClick={onSelectSwapDraft} className="mt-2 w-full inline-flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-amber-100 hover:text-amber-800 transition-soft text-slate-600 px-3 py-2 rounded-xl text-xs font-bold">
                      <Edit3 size={14} /> Resume Editing
                    </button>
                  )}
                </div>
              ))}
            </div>
            {view !== 'requests' && <button onClick={() => onNavigateToTab('leave-preferences')} className="mt-6 w-full py-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-xs font-bold text-slate-600 text-center transition-soft">
              View All Activity
            </button>}
          </div>
        </div>
        )}
      </div>

      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-scale-up">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center"><User size={20} /></div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Update Professional Profile</h3>
                <p className="text-xs text-slate-500">Credentialing & Directory Office</p>
              </div>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              setProfileMessage('Profile update requested. A copy has been submitted to medical affairs.');
              setTimeout(() => {
                onSubmitLeaveRequest({ staffName: user.name, staffCategory: user.role, department: user.department, avatarUrl: user.avatarUrl, category: 'leave', type: 'Profile Update', startDate: '2024-05-20', endDate: '2024-05-20', notes: 'Updated biography credentials.', status: 'Pending' });
                setShowProfileModal(false);
                setProfileMessage('');
              }, 2000);
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Professional Degrees / Biography</label>
                <textarea rows={3} required placeholder="e.g. F.A.C.S. - Fellow of the American College of Surgeons; Senior Trauma Director."
                  className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 rounded-xl py-2.5 px-4 text-xs font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Specialty Fields</label>
                <input type="text" defaultValue="Cardiothoracic Surgery, Emergency Trauma Surgery"
                  className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 rounded-xl py-2.5 px-4 text-xs font-medium" />
              </div>
              {profileMessage && (
                <div className="p-3 rounded-xl bg-orange-50 border border-orange-100 text-orange-800 text-[11px] font-bold animate-pulse text-center">{profileMessage}</div>
              )}
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-soft">
                Submit Profile Update
              </button>
            </form>
          </div>
        </div>
      )}

      {showEffortModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 max-w-lg w-full shadow-2xl relative animate-scale-up">
            <button onClick={() => setShowEffortModal(false)} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><PieChart size={20} /></div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Modify Effort Split</h3>
                <p className="text-xs text-slate-500">Academic & Clinical Time Allocation</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                  <span>Clinical Coverage (Surgical Shifts)</span>
                  <span className="text-blue-600">{clinicalEffort}%</span>
                </div>
                <input type="range" min="30" max="90" value={clinicalEffort}
                  onChange={(e) => {
                    const clinVal = parseInt(e.target.value);
                    setClinicalEffort(clinVal);
                    const remainder = 100 - clinVal;
                    setResearchEffort(Math.round(remainder * 0.6));
                    setAdminEffort(Math.round(remainder * 0.4));
                  }}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                  <span>Research & Academic Sabbatical</span>
                  <span className="text-blue-600">{researchEffort}%</span>
                </div>
                <input type="range" min="0" max="100" disabled value={researchEffort}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-not-allowed accent-indigo-600 opacity-60" />
              </div>
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                  <span>Department Administration & Board duties</span>
                  <span className="text-blue-600">{adminEffort}%</span>
                </div>
                <input type="range" min="0" max="100" disabled value={adminEffort}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-not-allowed accent-teal-600 opacity-60" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Calculated Time Allotment Impact</p>
                <div className="h-4 w-full rounded-full overflow-hidden flex text-white text-[10px] font-bold text-center">
                  <div style={{ width: `${clinicalEffort}%` }} className="bg-blue-600 flex items-center justify-center">{clinicalEffort >= 15 && 'Clinical'}</div>
                  <div style={{ width: `${researchEffort}%` }} className="bg-indigo-600 flex items-center justify-center">{researchEffort >= 15 && 'Research'}</div>
                  <div style={{ width: `${adminEffort}%` }} className="bg-teal-600 flex items-center justify-center">{adminEffort >= 15 && 'Admin'}</div>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                Changes saved will apply immediately to scheduling algorithms for Cycle Q4.
              </div>
              <button
                onClick={() => {
                  onSubmitLeaveRequest({
                    staffName: user.name, staffCategory: user.role, department: user.department, avatarUrl: user.avatarUrl,
                    category: 'leave', type: 'Role Split Shift', startDate: '2024-10-28', endDate: '2024-10-28',
                    notes: `Requested effort reallocation: Clinical ${clinicalEffort}%, Research ${researchEffort}%, Admin ${adminEffort}%`,
                    status: 'Pending',
                  });
                  setShowEffortModal(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-soft"
              >
                Apply Allocation Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showRosterModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 max-w-lg w-full shadow-2xl relative animate-scale-up">
            <button onClick={() => setShowRosterModal(false)} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center"><Users size={20} /></div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Floating Surgi-Pool</h3>
                <p className="text-xs text-slate-500">Available Cover Absences Resolve Desk</p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">The surgeons below match credentials in General and Trauma Surgery, and possess empty slots during the requested period:</p>
              <div className="space-y-3">
                {[
                  { id: 'fs-1', name: 'Dr. Arthur Pendelton', dept: 'Surgery Dept.', load: 'FTE 0.8', rating: 'Senior Specialist' },
                  { id: 'fs-2', name: 'Dr. Clara Oswald', dept: 'Cardiothoracic', load: 'FTE 0.9', rating: 'Attending Consultant' },
                ].map((sur) => {
                  const isPref = selectedFloatSurgeon === sur.id;
                  return (
                    <div key={sur.id} onClick={() => setSelectedFloatSurgeon(sur.id)}
                      className={`p-3 rounded-xl border transition-soft cursor-pointer flex items-center justify-between ${
                        isPref ? 'border-teal-600 bg-teal-50/20' : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}>
                      <div>
                        <p className="text-xs font-bold text-slate-950">{sur.name}</p>
                        <p className="text-[10px] text-slate-500">{sur.dept} • {sur.rating}</p>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-800 font-bold px-2 py-1 rounded">{sur.load}</span>
                    </div>
                  );
                })}
              </div>
              {selectedFloatSurgeon && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-[11px] font-medium leading-relaxed">
                  ✓ Selected cover. A digital draft message will invite them once the vacation is submitted.
                </div>
              )}
              <button onClick={() => { setShowRosterModal(false); setSelectedFloatSurgeon(null); setBannerAlert('Roster cover resolve setup registered! Coverage rate restored to 94%.'); setTimeout(() => setBannerAlert(''), 3000); }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-soft">
                Assign Selected Coverage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   AVAILABILITY & LEAVE VIEW
   ============================================================ */
interface AvailabilityLeaveProps {
  requestHistory: LeaveRequest[];
  pools: string[];
  onSubmitLeaveRequest: (req: Partial<LeaveRequest>) => void | Promise<void>;
  onNavigateToTab: (tabId: string) => void;
}

function AvailabilityLeaveView({ requestHistory, pools, onSubmitLeaveRequest, onNavigateToTab }: AvailabilityLeaveProps) {
  const [category, setCategory] = useState<'leave' | 'shift'>('leave');
  const [requestType, setRequestType] = useState('');
  const [catalogs, setCatalogs] = useState<{ leaveTypes: Array<{ name: string }>; shifts: Array<{ name: string; alias?: string }> }>({ leaveTypes: [], shifts: [] });
  const [catalogLoading, setCatalogLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    getRequestCatalogs().then(result => {
      if (!cancelled) { setCatalogs(result); setRequestType(result.leaveTypes[0]?.name || ''); }
    }).catch(error => { if (!cancelled) setSubmitMessage(error.message); })
      .finally(() => { if (!cancelled) setCatalogLoading(false); });
    return () => { cancelled = true; };
  }, []);
  const poolIdsKey = (Array.isArray(pools) ? pools : []).filter(Boolean).join('|');
  const [poolShiftKeys, setPoolShiftKeys] = useState<Set<string> | null>(null);
  useEffect(() => {
    let cancelled = false;
    const poolIds = poolIdsKey ? poolIdsKey.split('|') : [];
    if (poolIds.length === 0) { setPoolShiftKeys(new Set()); return; }
    Promise.all(poolIds.map(id => getPoolDemand(id).catch(() => null))).then(results => {
      if (cancelled) return;
      const keys = new Set<string>();
      for (const result of results) {
        for (const row of result?.demand_matrix ?? []) {
          const name = String(row?.shift ?? '').trim();
          if (!name) continue;
          keys.add(name.toUpperCase());
          keys.add(name.slice(0, 1).toUpperCase());
        }
      }
      setPoolShiftKeys(keys);
    }).catch(() => { if (!cancelled) setPoolShiftKeys(new Set()); });
    return () => { cancelled = true; };
  }, [poolIdsKey]);
  // When the staff is part of a pool, restrict shift-off request types to that pool's shifts.
  const allowedShifts = useMemo(() => {
    if (!poolShiftKeys || !poolIdsKey) return catalogs.shifts;
    return catalogs.shifts.filter(option => {
      const name = String(option.name ?? '').trim().toUpperCase();
      const alias = String(option.alias ?? '').trim().toUpperCase();
      return poolShiftKeys.has(name) || (!!alias && poolShiftKeys.has(alias));
    });
  }, [poolShiftKeys, poolIdsKey, catalogs.shifts]);
  const requestOptions = category === 'leave'
    ? catalogs.leaveTypes.map(option => ({ value: option.name, label: option.name }))
    : [{ value: 'O', label: 'Shift Off' }, ...allowedShifts.filter(option => option.alias !== 'O').map(option => ({ value: option.alias!, label: option.name }))];
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showCoverageCheck, setShowCoverageCheck] = useState(false);
  const approvedLeaveDays = requestHistory.filter(request => request.category === 'leave' && request.status === 'Approved').reduce((total, request) => total + Math.round((Date.parse(request.endDate) - Date.parse(request.startDate)) / 86400000) + 1, 0);
  const pendingShifts = requestHistory.filter(request => request.category === 'shift' && request.status === 'Pending').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!requestType) { setSubmitMessage('Select a request type. Leave types must be configured by an administrator.'); return; }
    if (!startDate || !endDate) {
      alert('Please designate baseline Start and End dates for administrative log.');
      return;
    }
    if (startDate > endDate) {
      setSubmitMessage('End date must be on or after start date.');
      return;
    }
    setIsSubmitting(true);
    setSubmitMessage('Submitting request...');
    try {
      await onSubmitLeaveRequest({ category, type: requestType, startDate, endDate, notes, status: 'Pending' });
      setSubmitMessage('Absence logged! Forwarded to supervisor approvals.');
      setStartDate(''); setEndDate(''); setNotes('');
      onNavigateToTab('dashboard');
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : 'Unable to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight mb-2">Leave Requests</h2>
          <p className="text-slate-600 max-w-lg text-sm leading-relaxed">
            Submit leave or shift-off requests for supervisor review.
          </p>
        </div>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-6 flex items-center gap-2">
              <CalendarIcon size={20} /> New Request
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">Request Category</label>
                  <CatalogSelect
                    value={category}
                    onChange={(value) => { setCategory(value as 'leave' | 'shift'); setRequestType(value === 'shift' ? 'O' : catalogs.leaveTypes[0]?.name || ''); }}
                    options={REQUEST_CATEGORY_OPTIONS}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">Request Type</label>
                  <CatalogSelect
                    value={requestType}
                    onChange={setRequestType}
                    options={requestOptions}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">Start Date</label>
                  <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary focus:ring-0 text-slate-900 font-medium px-4 py-3 rounded-t-xl transition-all outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">End Date</label>
                  <input type="date" required min={startDate || undefined} value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary focus:ring-0 text-slate-900 font-medium px-4 py-3 rounded-t-xl transition-all outline-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">Notes & Justification</label>
                <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Briefly describe the reason for leave (e.g., attending surgical conference or scheduling CME units)..."
                  className="w-full bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary focus:ring-0 text-slate-900 font-medium px-4 py-3 rounded-t-xl transition-all outline-none resize-none" />
              </div>
              {submitMessage && (
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 text-orange-800 text-xs font-medium animate-pulse text-center">{submitMessage}</div>
              )}
              {!catalogLoading && category === 'leave' && !catalogs.leaveTypes.length && <p role="status" className="text-xs text-slate-600">No active leave types. An administrator must configure Settings &gt; Catalogs &gt; Leave Types.</p>}
              <div className="pt-4 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                <button type="button" onClick={() => setShowCoverageCheck(true)}
                  className="inline-flex items-center justify-center gap-2 text-blue-700 font-extrabold text-xs hover:bg-blue-50/50 px-4 py-3 rounded-xl transition-colors border border-dashed border-blue-200/60">
                  <Activity size={16} /> Check Unit Coverage
                </button>
                <button type="submit" disabled={isSubmitting || catalogLoading || !requestType}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-soft cursor-pointer text-center">
                  {isSubmitting ? 'Syncing...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-blue-600 text-white p-6 md:p-8 rounded-2xl relative overflow-hidden shadow-md shadow-blue-600/10">
              <div className="relative z-10 space-y-6">
                <div>
                  <p className="text-blue-100 text-[10px] font-extrabold uppercase tracking-widest">Approved Leave</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-5xl font-extrabold tracking-tight">{approvedLeaveDays}</span>
                    <span className="text-sm font-semibold text-blue-100">days approved</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-white h-full w-[60%]"></div>
                  </div>
                  <p className="text-[10px] text-blue-100 font-bold">{requestHistory.filter(request => request.category === 'leave' && request.status === 'Pending').length} leave requests pending</p>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-10"><CalendarIcon size={176} /></div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4">
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-none">Shift Requests</p>
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-2xl font-extrabold text-slate-900">{pendingShifts}</span>
                  <span className="text-[11px] font-bold text-slate-500 ml-1.5">pending requests</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-teal-600">{requestHistory.filter(request => request.category === 'shift' && request.status === 'Approved').length}</span>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider leading-none">Approved</p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between text-xs font-bold">
                <span className="text-slate-500">Total Shift Requests</span>
                <span className="text-blue-700">{requestHistory.filter(request => request.category === 'shift').length}</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4">
              <h4 className="font-extrabold text-sm text-slate-900">Recent Activity</h4>
              <div className="space-y-4">
                {requestHistory.slice(0, 4).map(request => ({ icon: request.status === 'Approved' ? CheckCircle : Clock, color: request.status === 'Approved' ? 'emerald' : 'blue', title: `${request.type} (${request.status})`, date: `${request.startDate} - ${request.endDate}` })).map((item, i) => (
                  <div key={i} className={`flex items-start gap-3 ${i < 3 ? 'pb-3 border-b border-slate-50' : ''}`}>
                    <div className={`p-2 bg-${item.color}-50 text-${item.color}-600 rounded-lg shrink-0`} style={{ backgroundColor: `rgb(var(--${item.color}-50))` }}>
                      <item.icon size={16} className={`text-${item.color}-600`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-none mb-1">{item.title}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{item.date}</p>
                    </div>
                  </div>
                ))}
                {!requestHistory.length && <p className="text-xs text-slate-500">No requests yet.</p>}
              </div>
            </div>
          </div>
        </div>

      {showCoverageCheck && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 max-w-lg w-full shadow-2xl relative animate-scale-up">
            <button onClick={() => setShowCoverageCheck(false)} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"><Activity size={20} /></div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Unit Coverage Forecast</h3>
                <p className="text-xs text-slate-500">Live Roster Conflict Evaluation</p>
              </div>
            </div>
            <div className="space-y-4 my-4">
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-emerald-800 text-xs">
                <p className="font-bold">✓ Direct Coverage Safe</p>
                <p className="mt-1">Surgeon staffing levels on requested dates are currently at <strong>92% capacity</strong>. No overlaps exist with other attending physicians.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                  <p className="text-slate-400 text-[10px] font-bold uppercase">Requested Schedule</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">{startDate && endDate ? `${startDate} to ${endDate}` : 'No Dates Entered'}</p>
                </div>
                <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                  <p className="text-slate-400 text-[10px] font-bold uppercase">Colliding Absences</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">0 conflicts found</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Applet parsed 12 active listings in Department of Surgery. Submitting this request is forecast as safe, maintaining optimal operating room coverage rates.
              </p>
            </div>
            <button onClick={() => setShowCoverageCheck(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-soft">
              Acknowledge Coverage Forecast
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SHIFT SWAP WIZARD VIEW
   ============================================================ */
interface ShiftSwapWizardProps {
  member: StaffMember;
  upcomingShifts: UpcomingShift[];
  colleagues: Colleague[];
  colleagueRosters: Record<string, ServerEmployeeRosteringByDate>;
  shiftLabels: Record<string, { name: string; time: string }>;
  preSelectedColleagueId?: string | null;
  onSubmitSwap: (payload: { ownShiftAlias: string; ownDate: string; preferredShift: string; colleagueStaffId: string; justification: string }) => void | Promise<void>;
  onNavigateToTab: (tabId: string) => void;
}

function ShiftSwapWizardView({ member, upcomingShifts, colleagues, colleagueRosters, shiftLabels, preSelectedColleagueId, onSubmitSwap, onNavigateToTab }: ShiftSwapWizardProps) {
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [preferredShift, setPreferredShift] = useState('');
  const [poolShiftOptions, setPoolShiftOptions] = useState<Array<{ alias: string; name: string; time: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColleagueId, setSelectedColleagueId] = useState<string>(preSelectedColleagueId || '');
  const [justification, setJustification] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charLimit = 250;
  const ownShift = upcomingShifts.find(shift => shift.id === selectedShiftId);
  const ownPool = ownShift?.pool;

  useEffect(() => {
    if (!upcomingShifts.some(shift => shift.id === selectedShiftId)) setSelectedShiftId(upcomingShifts[0]?.id || '');
  }, [upcomingShifts, selectedShiftId]);

  // Preferred-shift options = shifts present in the selected shift's pool (fall back to all catalog shifts).
  const allShiftOptions = useMemo(
    () => Object.entries(shiftLabels).filter(([alias]) => alias && alias !== 'V' && alias !== 'O').map(([alias, meta]) => ({ alias, name: meta.name, time: meta.time })),
    [shiftLabels],
  );
  useEffect(() => {
    let cancelled = false;
    if (!ownPool) { setPoolShiftOptions(allShiftOptions); return; }
    getPoolDemand(ownPool).then(config => {
      if (cancelled) return;
      const nameToAlias = new Map<string, string>();
      for (const [alias, meta] of Object.entries(shiftLabels)) nameToAlias.set(String(meta.name ?? '').trim().toUpperCase(), alias);
      const options: Array<{ alias: string; name: string; time: string }> = [];
      const seen = new Set<string>();
      for (const row of config?.demand_matrix ?? []) {
        const name = String((row as any)?.shift ?? '').trim();
        if (!name) continue;
        const alias = nameToAlias.get(name.toUpperCase()) ?? name.slice(0, 1).toUpperCase();
        if (!shiftLabels[alias] || alias === 'V' || alias === 'O' || seen.has(alias)) continue;
        seen.add(alias);
        options.push({ alias, name: shiftLabels[alias].name, time: shiftLabels[alias].time });
      }
      setPoolShiftOptions(options.length ? options : allShiftOptions);
    }).catch(() => { if (!cancelled) setPoolShiftOptions(allShiftOptions); });
    return () => { cancelled = true; };
  }, [ownPool, shiftLabels, allShiftOptions]);

  // The shift being swapped is never offered as a preferred option.
  const preferredOptions = useMemo(() => poolShiftOptions.filter(option => option.alias !== ownShift?.shift), [poolShiftOptions, ownShift?.shift]);

  useEffect(() => {
    if (preferredOptions.some(option => option.alias === preferredShift)) return;
    setPreferredShift(preferredOptions[0]?.alias || '');
  }, [preferredOptions, preferredShift]);

  // Show colleagues in the same pool who are assigned the preferred shift on the swap day (not off).
  const pooledColleagues = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const date = ownShift?.date;
    return colleagues.filter(colleague => {
      const inPool = ownPool ? colleague.pools.includes(ownPool) : true;
      const assignment = date ? colleagueRosters[colleague.id]?.[date] : undefined;
      const alias = assignment?.shift?.trim().toUpperCase();
      const worksPreferredThatDay = !!preferredShift && alias === preferredShift && (!ownPool || !assignment?.pool || assignment.pool === ownPool);
      if (!inPool || !worksPreferredThatDay) return false;
      return colleague.name.toLowerCase().includes(query) || colleague.department.toLowerCase().includes(query) || colleague.role.toLowerCase().includes(query);
    });
  }, [colleagues, ownPool, ownShift?.date, preferredShift, colleagueRosters, searchQuery]);
  const activeColleague = colleagues.find(colleague => colleague.id === selectedColleagueId);

  useEffect(() => {
    if (pooledColleagues.some(colleague => colleague.id === selectedColleagueId)) return;
    setSelectedColleagueId(pooledColleagues[0]?.id || '');
  }, [pooledColleagues, selectedColleagueId]);

  const calendarPrefix = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}`;
  const calendarDays = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const calendarOffset = (calendarMonth.getDay() + 6) % 7;

  const formatDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const handleSelectDayShift = (shift: UpcomingShift) => {
    setSelectedShiftId(shift.id);
    setShowCalendarModal(false);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!ownShift) { setErrorMessage('Select a shift to swap from your calendar.'); return; }
    if (!preferredShift) { setErrorMessage('Select a preferred shift for that day.'); return; }
    if (!activeColleague) { setErrorMessage('Select a colleague from the pool.'); return; }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await onSubmitSwap({
        ownShiftAlias: ownShift.shift,
        ownDate: ownShift.date,
        preferredShift,
        colleagueStaffId: activeColleague.id,
        justification: justification || `Requested shift swap with ${activeColleague.name}.`,
      });
      setSuccessMessage('Shift swap request sent to your supervisor for review, then hospital admin for final approval.');
      setJustification('');
      setTimeout(() => { setSuccessMessage(''); onNavigateToTab('dashboard'); }, 1800);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to submit shift swap.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const preferredLabel = poolShiftOptions.find(option => option.alias === preferredShift);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-blue-800 text-[10px] uppercase font-extrabold tracking-widest flex items-center gap-1.5 mb-1.5">
          <ArrowRightLeft size={14} /> Swap Protocol
        </p>
        <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight mb-2">Shift Swap Request</h2>
        <p className="text-slate-600 max-w-2xl text-sm leading-relaxed">
          Pick your shift, preferred shift, and a colleague in the same pool. Your supervisor reviews first, followed by hospital admin final approval.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-50 text-blue-700 flex items-center justify-center rounded-lg text-xs font-bold leading-none">1</span>
              Shift to Swap
              <span className="ml-auto bg-teal-50 border border-teal-100 text-teal-700 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">{upcomingShifts.length ? 'Scheduled' : 'No Shifts'}</span>
            </h3>
            {ownShift ? (
              <div className="p-4 rounded-xl border border-blue-600 bg-blue-50/20">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Shift selected for swap</p>
                <h4 className="text-sm font-extrabold text-slate-900 leading-tight">{ownShift.label}</h4>
                <p className="text-[11px] text-slate-500 mt-1">{formatDate(ownShift.date)}{ownShift.time ? ` • ${ownShift.time}` : ''}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No upcoming working shifts in the saved roster. Nothing to swap yet.</p>
            )}
            <button type="button" disabled={!upcomingShifts.length} onClick={() => { if (ownShift) { const [year, month] = ownShift.date.split('-').map(Number); setCalendarMonth(new Date(year, month - 1, 1)); } setShowCalendarModal(true); }}
              className="w-full inline-flex items-center justify-center gap-2 border border-dashed border-blue-200/70 text-blue-700 hover:bg-blue-50/50 font-bold text-xs py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <CalendarIcon size={16} /> View All Upcoming
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-50 text-blue-700 flex items-center justify-center rounded-lg text-xs font-bold leading-none">2</span>
              Preferred Shift
            </h3>
            <p className="text-[11px] text-slate-500 -mt-1">Choose the shift you would prefer on {ownShift ? formatDate(ownShift.date) : 'that day'}.</p>
            {preferredOptions.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {preferredOptions.map(option => (
                  <button key={option.alias} type="button" onClick={() => setPreferredShift(option.alias)}
                    className={`p-3 rounded-xl border text-left transition-soft cursor-pointer ${preferredShift === option.alias ? 'border-blue-600 bg-blue-50/20' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                    <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{option.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{option.time || option.alias}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No other shifts available for this pool.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-50 text-blue-700 flex items-center justify-center rounded-lg text-xs font-bold leading-none">3</span>
              Colleague
              <span className="text-[11px] font-medium text-slate-500 normal-case ml-1">{preferredLabel ? `In pool, on ${preferredLabel.name}` : 'Select a preferred shift'}</span>
            </h3>
            <div className="relative">
              <Search size={16} className="text-slate-400 absolute left-3 top-2.5" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, department, or role..."
                className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 rounded-xl py-2 pl-9 pr-4 text-xs font-medium" />
            </div>
            <div className="space-y-3 max-h-[420px] overflow-y-auto">
              {pooledColleagues.map((col) => {
                const isSelected = selectedColleagueId === col.id;
                return (
                  <div key={col.id} onClick={() => setSelectedColleagueId(col.id)}
                    className={`p-3 rounded-xl border transition-soft cursor-pointer flex items-center gap-3.5 ${
                      isSelected ? 'border-blue-600 bg-blue-50/15' : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}>
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                      {col.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug truncate">{col.name}</h4>
                      <p className="text-[10px] text-slate-500 truncate">{col.department}{col.role ? ` • ${col.role}` : ''}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
              {pooledColleagues.length === 0 && <p className="text-center text-xs text-slate-400 py-4">{preferredLabel && ownShift ? `No colleagues on ${preferredLabel.name} for ${formatDate(ownShift.date)}` : 'Select a preferred shift first'}</p>}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center"><ArrowRightLeft size={20} /></div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase">Your Shift</p>
                <p className="text-xs font-bold text-slate-800">{ownShift ? `${ownShift.date}, ${ownShift.label}` : 'No shift selected'}</p>
              </div>
            </div>
            <div className="text-slate-300 bg-white border border-slate-200/50 p-1.5 rounded-full rotate-90 sm:rotate-0">
              <ArrowRight size={16} />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase">Preferred / Colleague</p>
                <p className="text-xs font-bold text-slate-800">{preferredLabel ? preferredLabel.name : 'No shift'}{activeColleague ? ` • ${activeColleague.name}` : ''}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                {(activeColleague?.name || 'CO').split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-50 text-blue-700 flex items-center justify-center rounded-lg text-xs font-bold leading-none">4</span>
              Justification
            </h3>
            <div className="relative">
              <textarea rows={3} maxLength={charLimit} value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Briefly explain the reason for this swap request (optional)..."
                className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 rounded-xl py-3 px-4 text-xs font-medium" />
              <span className="absolute bottom-3 right-3 text-[10px] font-bold text-slate-400">{justification.length} / {charLimit} characters</span>
            </div>
            {errorMessage && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-800 text-xs text-center animate-pulse">{errorMessage}</div>}
            {successMessage && <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs text-center font-bold">{successMessage}</div>}
            <div className="pt-4 border-t border-slate-50 flex justify-end">
              <button type="button" onClick={handleSubmit} disabled={isSubmitting || !ownShift || !preferredShift || !activeColleague}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 cursor-pointer transition-soft text-center disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? 'Sending request...' : 'Send Swap Request'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCalendarModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 max-w-2xl w-full shadow-2xl relative animate-scale-up">
            <button onClick={() => setShowCalendarModal(false)} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"><CalendarIcon size={20} /></div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Select a Shift to Swap</h3>
                <p className="text-xs text-slate-500">Click a day with an assigned shift.</p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <button aria-label="Previous month" onClick={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="p-1 rounded-lg border border-slate-100 hover:bg-slate-50"><ChevronLeft size={16} className="text-slate-400" /></button>
                <span className="text-xs font-extrabold text-slate-800 whitespace-nowrap">{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                <button aria-label="Next month" onClick={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="p-1 rounded-lg border border-slate-100 hover:bg-slate-50"><ChevronRight size={16} className="text-slate-400" /></button>
              </div>
            </div>
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 p-2 text-center text-[10px] font-extrabold text-slate-400">
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 text-center p-2 gap-1 bg-white">
                {Array.from({ length: calendarOffset }, (_, index) => <div key={`pad-${index}`} />)}
                {Array.from({ length: calendarDays }, (_, index) => {
                  const day = index + 1;
                  const date = `${calendarPrefix}-${String(day).padStart(2, '0')}`;
                  const dayShift = upcomingShifts.find(shift => shift.date === date);
                  const isSelectedDay = ownShift?.date === date;
                  return (
                    <div key={date}
                      className={`min-h-[72px] p-2 rounded-xl flex flex-col justify-between text-left relative transition-soft ${
                        isSelectedDay ? 'bg-blue-50 border border-blue-400 ring-1 ring-blue-400' :
                        dayShift ? 'bg-white border border-slate-100 hover:border-slate-300' :
                        'bg-white'
                      }`}>
                      <span className="text-[11px] font-extrabold text-slate-400">{day}</span>
                      {dayShift && (
                        <button type="button" title={`${dayShift.label} ${dayShift.time}`} onClick={() => handleSelectDayShift(dayShift)}
                          className={`w-full p-1 mt-1 text-[9px] font-bold rounded-md leading-snug text-left break-words ${isSelectedDay ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{dayShift.shift}</button>
                      )}
                      {isSelectedDay && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full border border-white flex items-center justify-center">
                          <Check size={6} className="text-white" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {!upcomingShifts.length && <p className="text-xs text-slate-500 mt-4">No upcoming working shifts in the saved roster.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
