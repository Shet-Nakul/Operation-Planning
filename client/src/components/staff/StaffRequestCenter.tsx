import React, { useState, useMemo } from 'react';
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
  Heart,
  X,
  Edit,
  ShieldAlert,
  Clock,
  CheckCircle,
  AlertCircle,
  Award,
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
import type { StaffMember } from './types';

interface UserProfile {
  name: string;
  department: string;
  role: string;
  avatarUrl: string;
}

type RequestStatus = 'Urgent Review' | 'Pending' | 'Approved' | 'Under Review' | 'Rejected' | 'Draft';

interface LeaveRequest {
  id: string;
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
}

interface Colleague {
  id: string;
  name: string;
  department: string;
  role: string;
  avatarUrl: string;
}

type PreferenceType = 'preferred' | 'neutral' | 'avoid';

interface ShiftPreference {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  shiftType: 'Morning' | 'Swing' | 'Night';
  preference: PreferenceType;
}

interface DashboardPendingRequest {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  badgeType: 'review' | 'approved' | 'draft';
  progress?: { current: number; total: number };
  details?: string;
}

const CALENDAR_SHIFTS_MAY_2024 = [
  { day: 1, label: 'OR Shift (08:00)', type: 'or-shift' },
  { day: 3, label: 'Consultation', type: 'consultation' },
  { day: 6, label: 'OR Shift (08:00)', type: 'or-shift', selected: true },
  { day: 8, label: 'Admin Half-Day', type: 'admin' },
];

const INITIAL_PREFERENCES: ShiftPreference[] = [
  { day: 'Mon', shiftType: 'Morning', preference: 'preferred' },
  { day: 'Mon', shiftType: 'Swing', preference: 'neutral' },
  { day: 'Mon', shiftType: 'Night', preference: 'avoid' },
  { day: 'Tue', shiftType: 'Morning', preference: 'neutral' },
  { day: 'Tue', shiftType: 'Swing', preference: 'neutral' },
  { day: 'Tue', shiftType: 'Night', preference: 'neutral' },
  { day: 'Wed', shiftType: 'Morning', preference: 'preferred' },
  { day: 'Wed', shiftType: 'Swing', preference: 'neutral' },
  { day: 'Wed', shiftType: 'Night', preference: 'neutral' },
  { day: 'Thu', shiftType: 'Morning', preference: 'neutral' },
  { day: 'Thu', shiftType: 'Swing', preference: 'avoid' },
  { day: 'Thu', shiftType: 'Night', preference: 'neutral' },
  { day: 'Fri', shiftType: 'Morning', preference: 'neutral' },
  { day: 'Fri', shiftType: 'Swing', preference: 'neutral' },
  { day: 'Fri', shiftType: 'Night', preference: 'preferred' },
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

const DEFAULT_COLLEAGUES: Colleague[] = [
  { id: 'col-1', name: 'Dr. Sarah Chen', department: 'Surgery Dept.', role: 'Senior Resident', avatarUrl: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?q=80&w=120&auto=format&fit=crop' },
  { id: 'col-2', name: 'Dr. Marcus Thorne', department: 'Surgery Dept.', role: 'Attending Physician', avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=120&auto=format&fit=crop' },
  { id: 'col-3', name: 'Dr. Helen Smith', department: 'Surgery Dept.', role: 'Chief Resident', avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=120&auto=format&fit=crop' },
  { id: 'col-4', name: 'Dr. David Okoro', department: 'Surgical Medicine', role: 'Pathology Specialist', avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=120&auto=format&fit=crop' },
];

interface StaffRequestCenterProps {
  member: StaffMember;
}

type SubTab = 'dashboard' | 'leave' | 'availability' | 'shift-swap';

export default function StaffRequestCenter({ member }: StaffRequestCenterProps) {
  const [subTab, setSubTab] = useState<SubTab>('dashboard');

  const user: UserProfile = {
    name: member.name,
    department: String(member.department ?? '').trim() || 'Surgery Dept.',
    role: member.title,
    avatarUrl: member.avatarUrl || '',
  };

  const [requests, setRequests] = useState<LeaveRequest[]>(INITIAL_REQUESTS);
  const [dashboardRequests, setDashboardRequests] = useState<DashboardPendingRequest[]>(INITIAL_DASHBOARD_REQUESTS);
  const [resumeColleagueId, setResumeColleagueId] = useState<string | null>(null);

  const handleSubmitLeaveRequest = (newReq: Partial<LeaveRequest>) => {
    const freshId = `req-${Date.now()}`;
    const constructed: LeaveRequest = {
      id: freshId,
      staffName: user.name,
      staffCategory: user.role,
      department: user.department,
      avatarUrl: user.avatarUrl,
      category: newReq.category || 'leave',
      type: newReq.type || 'Leave Submission',
      startDate: newReq.startDate || '2024-05-20',
      endDate: newReq.endDate || '2024-05-20',
      notes: newReq.notes || '',
      status: newReq.status || 'Pending',
      dateSubmitted: new Date().toISOString().slice(0, 10),
      targetColleague: newReq.targetColleague,
      originalShift: newReq.originalShift,
      targetShift: newReq.targetShift,
    };
    setRequests(prev => [constructed, ...prev]);
    if (newReq.status === 'Draft') {
      const dashReq: DashboardPendingRequest = {
        id: `dash-${freshId}`,
        title: 'SHIFT SWAP (DRAFT)',
        subtitle: `With ${newReq.targetColleague || 'colleague'}`,
        badgeText: 'Draft',
        badgeType: 'draft',
      };
      setDashboardRequests(prev => [dashReq, ...prev]);
    } else {
      const dashReq: DashboardPendingRequest = {
        id: `dash-${freshId}`,
        title: (newReq.type || 'Annual Leave').toUpperCase(),
        subtitle: `${newReq.startDate} - ${newReq.endDate}`,
        badgeText: 'Under Review',
        badgeType: 'review',
        progress: { current: 1, total: 3 },
      };
      setDashboardRequests(prev => [dashReq, ...prev]);
    }
  };

  const handleSelectSwapDraft = () => {
    setResumeColleagueId('col-3');
    setSubTab('shift-swap');
  };

  const handleUpdateStatus = (requestId: string, nextStatus: RequestStatus) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: nextStatus } : r));
    const matchingReq = requests.find(r => r.id === requestId);
    if (matchingReq) {
      setDashboardRequests(prev => prev.map(dr => {
        if (dr.subtitle.includes(matchingReq.startDate) || dr.title.toLowerCase().includes(matchingReq.type.toLowerCase())) {
          return {
            ...dr,
            badgeText: nextStatus === 'Approved' ? 'Approved' : 'Rejected',
            badgeType: nextStatus === 'Approved' ? 'approved' : 'draft',
            progress: undefined,
            details: `Updated on ${new Date().toISOString().slice(0, 10)}`,
          };
        }
        return dr;
      }));
    }
  };

  const navigateTo = (tabId: string) => {
    if (tabId === 'leave-preferences') setSubTab('leave');
    else if (tabId === 'leave-preferences-avail') setSubTab('availability');
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
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Staff Request Center</h2>
            <p className="text-slate-600 max-w-2xl text-sm leading-relaxed">
              Manage clinical availability, schedule adjustments, leave requests, shift swaps, and administrative credentials for this staff member.
            </p>
          </div>
        </div>

        <div className="bg-slate-100 p-1.5 rounded-2xl h-auto w-full max-w-xl flex gap-1">
          {[
            { id: 'dashboard', label: 'Overview', icon: Activity },
            { id: 'leave', label: 'Leave', icon: CalendarDays },
            { id: 'availability', label: 'Preferences', icon: Heart },
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
        </div>
      </div>

      {subTab === 'dashboard' && (
        <DashboardView
          user={user}
          pendingRequests={dashboardRequests}
          onNavigateToTab={navigateTo}
          onSelectSwapDraft={handleSelectSwapDraft}
          onSubmitLeaveRequest={handleSubmitLeaveRequest}
          requests={requests}
          onUpdateRequestStatus={handleUpdateStatus}
        />
      )}

      {subTab === 'leave' && (
        <AvailabilityLeaveView
          initialPreferences={INITIAL_PREFERENCES}
          activeSubTab="leave"
          onSubmitLeaveRequest={handleSubmitLeaveRequest}
          onNavigateToTab={navigateTo}
        />
      )}

      {subTab === 'availability' && (
        <AvailabilityLeaveView
          initialPreferences={INITIAL_PREFERENCES}
          activeSubTab="availability"
          onSubmitLeaveRequest={handleSubmitLeaveRequest}
          onNavigateToTab={navigateTo}
        />
      )}

      {subTab === 'shift-swap' && (
        <ShiftSwapWizardView
          colleagues={DEFAULT_COLLEAGUES}
          preSelectedColleagueId={resumeColleagueId}
          onSubmitLeaveRequest={handleSubmitLeaveRequest}
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
  user: UserProfile;
  pendingRequests: DashboardPendingRequest[];
  onNavigateToTab: (tabId: string) => void;
  onSelectSwapDraft: () => void;
  onSubmitLeaveRequest: (req: Partial<LeaveRequest>) => void;
  requests: LeaveRequest[];
  onUpdateRequestStatus: (id: string, s: RequestStatus) => void;
}

function DashboardView({ user, pendingRequests, onNavigateToTab, onSelectSwapDraft, onSubmitLeaveRequest, requests, onUpdateRequestStatus }: DashboardViewProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(6);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
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

  const getShiftForDay = (dayNum: number) => CALENDAR_SHIFTS_MAY_2024.find(s => s.day === dayNum);
  const calendarDays = [
    { day: 29, isPrevMonth: true },
    { day: 30, isPrevMonth: true },
    ...Array.from({ length: 31 }, (_, i) => ({ day: i + 1, isPrevMonth: false })),
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

  const handleAction = (id: string, status: RequestStatus, name: string) => {
    onUpdateRequestStatus(id, status);
    setBannerAlert(`Roster synchronized! ${name}'s request set to ${status}.`);
    setTimeout(() => setBannerAlert(''), 3000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row gap-8">
        <div className="flex-1 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Schedule & Time-Off</h3>
                <p className="text-xs text-slate-500 font-medium">May 2024 roster view and shifts</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-slate-50 border border-slate-100 text-slate-800 px-4 py-1.5 rounded-lg text-xs font-bold">May 2024</span>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-600 cursor-not-allowed" disabled><ChevronLeft size={16} /></button>
                  <button className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-600 cursor-not-allowed" disabled><ChevronRight size={16} /></button>
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
                    const isSelected = !isPrevMonth && selectedDay === day;
                    return (
                      <div
                        key={index}
                        onClick={() => !isPrevMonth && setSelectedDay(day)}
                        className={`min-h-[100px] p-2.5 rounded-xl border transition-soft cursor-pointer flex flex-col justify-between relative ${
                          isPrevMonth ? 'bg-slate-50/50 border-slate-50 text-slate-300 pointer-events-none' :
                          isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/10' :
                          'bg-white border-slate-100 text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <span className={`text-xs font-bold ${isPrevMonth ? 'text-slate-300' : isSelected ? 'text-white' : 'text-slate-400'}`}>{day}</span>
                        {shift && (
                          <div className="mt-2">
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
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

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
            <button onClick={() => onNavigateToTab('leave-preferences-avail')} className="group text-left bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-soft cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 transition-soft group-hover:scale-110">
                <Heart size={20} />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors">Preferred Shift</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Configure weekly recurring shift parameters for scheduling.</p>
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
            <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-4xl font-extrabold text-teal-600">94%</span>
                <p className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 mt-1">COVERAGE RATE</p>
              </div>
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center font-bold">%</div>
            </div>
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
              <table className="w-full text-left border-collapse">
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
                        }`}>{req.status}</span>
                      </td>
                      <td className="p-4 text-right px-6">
                        {req.status === 'Approved' || req.status === 'Rejected' ? (
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block py-2">Resolved</span>
                        ) : (
                          <div className="flex items-center justify-end gap-2.5">
                            <button onClick={() => handleAction(req.id, 'Approved', req.staffName)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 px-3 rounded-lg text-xs transition-soft flex items-center gap-1.5 cursor-pointer">
                              <Check size={14} /> Accept
                            </button>
                            <button onClick={() => handleAction(req.id, 'Rejected', req.staffName)} className="border border-slate-200/60 hover:bg-red-50 hover:text-red-700 text-slate-600 font-bold p-2 px-3 rounded-lg text-xs transition-soft flex items-center gap-1.5 cursor-pointer">
                              <X size={14} /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-slate-400">No pending approval requests matching the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500 font-medium">
              <span>Showing {filteredRequests.length} entries</span>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-80 shrink-0 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
              <h4 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider">Pending Requests</h4>
            </div>
            <div className="space-y-6">
              {pendingRequests.map((req) => (
                <div key={req.id} className="border-b border-slate-50 pb-5 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h5 className="text-[12px] font-extrabold text-slate-900 tracking-tight leading-none">{req.title}</h5>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider leading-none ${
                      req.badgeType === 'review' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      req.badgeType === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
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
                  {req.badgeType === 'draft' && (
                    <button onClick={onSelectSwapDraft} className="mt-2 w-full inline-flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-amber-100 hover:text-amber-800 transition-soft text-slate-600 px-3 py-2 rounded-xl text-xs font-bold">
                      <Edit3 size={14} /> Resume Editing
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => onNavigateToTab('leave-preferences')} className="mt-6 w-full py-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-xs font-bold text-slate-600 text-center transition-soft">
              View All Activity
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-blue-950 text-white rounded-2xl p-6 relative overflow-hidden shadow-md shadow-blue-900/10">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Info size={144} /></div>
            <div className="relative z-10 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Info size={20} className="text-blue-200" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-base tracking-tight">Policy Update</h4>
                <p className="text-blue-100/85 text-xs leading-relaxed">
                  Holiday request deadlines for July/August must be submitted 30 days in advance to ensure department and emergency department clinical coverage.
                </p>
              </div>
              <button onClick={() => setShowPolicyModal(true)} className="bg-white/10 hover:bg-white text-blue-100 hover:text-blue-900 transition-soft text-xs font-bold px-4 py-2 rounded-xl">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPolicyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 max-w-lg w-full shadow-2xl relative animate-scale-up">
            <button onClick={() => setShowPolicyModal(false)} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"><Info size={20} /></div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Hospital Submission Guidelines</h3>
                <p className="text-xs text-slate-500">Unit 4-B North • Operations</p>
              </div>
            </div>
            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed my-4 pb-4 border-b border-slate-100">
              <p>To maintain a safe nurse-to-patient ratio, the Central Hospital Board requires all clinical leave applications for the peak summer cycle (July 1st — August 31st) to be submitted 30 days in advance.</p>
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-50 text-blue-800 text-[11px] font-medium leading-relaxed">
                <strong>Crucial Note:</strong> Max consecutive approved leaves is 14 days. Any extension requires department supervisor signature.
              </div>
              <p>Schedules for the Summer Cycle will be finalized and posted on June 15th. Check your <strong>Annual Entitlement</strong> balance in the Availability panel before completing submissions.</p>
            </div>
            <button onClick={() => setShowPolicyModal(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-soft">
              Acknowledge Guidelines
            </button>
          </div>
        </div>
      )}

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
  initialPreferences: ShiftPreference[];
  onSubmitLeaveRequest: (req: Partial<LeaveRequest>) => void;
  onNavigateToTab: (tabId: string) => void;
  activeSubTab?: 'leave' | 'availability';
}

function AvailabilityLeaveView({ initialPreferences, onSubmitLeaveRequest, onNavigateToTab, activeSubTab = 'leave' }: AvailabilityLeaveProps) {
  const [subTab, setSubTab] = useState<'leave' | 'availability'>(activeSubTab);
  const [category, setCategory] = useState<'leave' | 'shift'>('leave');
  const [requestType, setRequestType] = useState('Vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showCoverageCheck, setShowCoverageCheck] = useState(false);
  const [preferences, setPreferences] = useState<ShiftPreference[]>(initialPreferences);
  const [savedPrefs, setSavedPrefs] = useState(false);

  const handleCyclePreference = (day: string, shiftType: string) => {
    const updated = preferences.map((p) => {
      if (p.day === day && p.shiftType === shiftType) {
        let nextPref: PreferenceType = 'neutral';
        if (p.preference === 'neutral') nextPref = 'preferred';
        else if (p.preference === 'preferred') nextPref = 'avoid';
        return { ...p, preference: nextPref };
      }
      return p;
    });
    setPreferences(updated);
  };

  const getPrefObj = (day: string, shiftType: string) => {
    return preferences.find(p => p.day === day && p.shiftType === shiftType) || { preference: 'neutral' as PreferenceType };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert('Please designate baseline Start and End dates for administrative log.');
      return;
    }
    setIsSubmitting(true);
    setSubmitMessage('Analyzing department schedules & checking roster collision...');
    setTimeout(() => {
      onSubmitLeaveRequest({ category, type: requestType, startDate, endDate, notes: notes || 'Submitted scheduled absence request.', status: 'Pending' });
      setIsSubmitting(false);
      setSubmitMessage('Absence logged! Forwarded to supervisor approvals.');
      setStartDate(''); setEndDate(''); setNotes('');
      setTimeout(() => { setSubmitMessage(''); onNavigateToTab('dashboard'); }, 2000);
    }, 1500);
  };

  const preferCount = preferences.filter(p => p.preference === 'preferred').length;
  const avoidCount = preferences.filter(p => p.preference === 'avoid').length;
  let matchProbability = 90 - (avoidCount * 4) + (preferCount * 3);
  if (matchProbability > 100) matchProbability = 100;
  if (matchProbability < 40) matchProbability = 40;

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight mb-2">Availability & Leave</h2>
          <p className="text-slate-600 max-w-lg text-sm leading-relaxed">
            Manage clinical schedule, request time off, and set shift preferences for the upcoming planning cycle.
          </p>
        </div>
        <div className="bg-slate-100 p-1.5 rounded-xl flex self-start lg:self-auto shrink-0 border border-slate-200/50">
          <button onClick={() => setSubTab('leave')} className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-soft cursor-pointer ${
            subTab === 'leave' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
          }`}>Time Off (Leave)</button>
          <button onClick={() => setSubTab('availability')} className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-soft cursor-pointer ${
            subTab === 'availability' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
          }`}>Availability Preferences</button>
        </div>
      </div>

      {subTab === 'leave' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <CalendarIcon size={20} className="text-blue-600" /> New Request
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2.5">Request Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as 'leave' | 'shift')}
                    className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-3 px-4 text-slate-800 font-medium text-xs focus:outline-none">
                    <option value="leave">Leave (Time-Off)</option>
                    <option value="shift">Shift Duty Modification</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2.5">Request Type</label>
                  <select value={requestType} onChange={(e) => setRequestType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-3 px-4 text-slate-800 font-medium text-xs focus:outline-none">
                    <option>Vacation</option>
                    <option>Sick Leave</option>
                    <option>Study Leave</option>
                    <option>CME Request</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2.5">Start Date</label>
                  <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-3 px-4 text-slate-800 text-xs font-medium focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2.5">End Date</label>
                  <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-3 px-4 text-slate-800 text-xs font-medium focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2.5">Notes & Justification</label>
                <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Briefly describe the reason for leave (e.g., attending surgical conference or scheduling CME units)..."
                  className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-3 px-4 text-slate-800 text-xs font-medium focus:outline-none" />
              </div>
              {submitMessage && (
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 text-orange-800 text-xs font-medium animate-pulse text-center">{submitMessage}</div>
              )}
              <div className="pt-4 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                <button type="button" onClick={() => setShowCoverageCheck(true)}
                  className="inline-flex items-center justify-center gap-2 text-blue-700 font-extrabold text-xs hover:bg-blue-50/50 px-4 py-3 rounded-xl transition-colors border border-dashed border-blue-200/60">
                  <Activity size={16} /> Check Unit Coverage
                </button>
                <button type="submit" disabled={isSubmitting}
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
                  <p className="text-blue-100 text-[10px] font-extrabold uppercase tracking-widest">Annual Entitlement</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-5xl font-extrabold tracking-tight">12</span>
                    <span className="text-sm font-semibold text-blue-100">days left</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-white h-full w-[60%]"></div>
                  </div>
                  <p className="text-[10px] text-blue-100 font-bold">18 of 30 days used this period</p>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-10"><CalendarIcon size={176} /></div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4">
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-none">Shift Credits</p>
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-2xl font-extrabold text-slate-900">4</span>
                  <span className="text-[11px] font-bold text-slate-500 ml-1.5">pending swaps</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-teal-600">+12</span>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider leading-none">Balance</p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between text-xs font-bold">
                <span className="text-slate-500">Shift Match Rate</span>
                <span className="text-blue-700">92%</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4">
              <h4 className="font-extrabold text-sm text-slate-900">Recent Activity</h4>
              <div className="space-y-4">
                {[
                  { icon: Activity, color: 'blue', title: 'Night Shift Swap Requested', date: 'Nov 12 (Pending Approval)' },
                  { icon: CheckCircle, color: 'emerald', title: 'Annual Leave Approved', date: 'Oct 12 - Oct 15 (3 days)' },
                  { icon: Clock, color: 'indigo', title: 'CME Request Pending', date: 'Nov 04 - Nov 06 (2 days)' },
                  { icon: FileText, color: 'slate', title: 'Sick Leave Logged', date: 'Sep 20 (1 day)' },
                ].map((item, i) => (
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
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Weekly Preferences</h3>
                <p className="text-xs text-slate-500">Set your ideal shift distribution for Cycle Q4.</p>
              </div>
              <div className="flex flex-wrap gap-3.5">
                <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-teal-700 tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block"></span> Preferred
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-200 inline-block"></span> Neutral
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-red-700 tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span> Avoid
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-2">
                <thead>
                  <tr>
                    <th className="p-1 px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-1/4">Shift</th>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                      <th key={day} className="p-3 text-xs font-bold text-slate-800 text-center bg-slate-50 rounded-t-xl">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(['Morning', 'Swing', 'Night'] as const).map((shiftType) => (
                    <tr key={shiftType} className="group">
                      <td className="p-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-800">{shiftType}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                          {shiftType === 'Morning' && '07:00 — 15:00'}
                          {shiftType === 'Swing' && '15:00 — 23:00'}
                          {shiftType === 'Night' && '23:00 — 07:00'}
                        </span>
                      </td>
                      {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const).map((day) => {
                        const cell = getPrefObj(day, shiftType);
                        return (
                          <td key={day} className="p-1">
                            <button type="button" onClick={() => handleCyclePreference(day, shiftType)}
                              className={`w-full h-16 rounded-xl flex flex-col items-center justify-center transition-soft outline-none border cursor-pointer active:scale-95 ${
                                cell.preference === 'preferred' ? 'bg-teal-600 border-teal-600 text-white shadow-sm shadow-teal-600/10' :
                                cell.preference === 'avoid' ? 'bg-red-600 border-red-600 text-white shadow-sm shadow-red-600/10' :
                                'bg-slate-50 border-slate-200/40 text-slate-400 hover:bg-slate-100'
                              }`} title="Click to cycle: Neutral ⇄ Preferred ⇄ Avoid">
                              {cell.preference === 'preferred' && <Heart size={20} className="fill-current shrink-0" />}
                              {cell.preference === 'avoid' && <ShieldAlert size={20} className="shrink-0" />}
                              {cell.preference === 'neutral' && <span className="w-2.5 h-2.5 rounded-full border border-slate-300"></span>}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-8 flex justify-between items-center pt-4 border-t border-slate-50">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">* Click cells to cycle preferred daily slots</span>
              <button type="button" onClick={() => { setSavedPrefs(true); setTimeout(() => setSavedPrefs(false), 2000); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-soft active:scale-98 cursor-pointer">
                {savedPrefs ? 'Saved!' : 'Save Preferences'}
              </button>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
              <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest mb-6 block self-start">Scheduling Impact</p>
              <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                <svg className="w-full h-full -rotate-90">
                  <circle className="text-slate-100" cx="72" cy="72" fill="transparent" r="62" stroke="currentColor" strokeWidth="8"></circle>
                  <circle className="text-blue-600 transition-soft" cx="72" cy="72" fill="transparent" r="62" stroke="currentColor" strokeWidth="8"
                    strokeDasharray="389.5" strokeDashoffset={389.5 - (389.5 * matchProbability) / 100}></circle>
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-slate-900">{matchProbability}%</span>
                </div>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Match Probability</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Your selections align perfectly with surgical unit minimum rules and staff availability requirements.
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Award size={16} className="text-slate-400" /> Active Unit Rules
              </h4>
              <ul className="space-y-4 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0 mt-1.5"></span>
                  <p>Minimum of 2 weekend shifts per month required for all active senior surgeons.</p>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0 mt-1.5"></span>
                  <p>Maximum of 3 consecutive Night shifts unless overridden by medical affairs.</p>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0 mt-1.5"></span>
                  <p>Cycle Q4 schedule starts on October 28th (Bids lock September 30th).</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

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
  colleagues: Colleague[];
  preSelectedColleagueId?: string | null;
  onSubmitLeaveRequest: (req: Partial<LeaveRequest>) => void;
  onNavigateToTab: (tabId: string) => void;
}

function ShiftSwapWizardView({ colleagues, preSelectedColleagueId, onSubmitLeaveRequest, onNavigateToTab }: ShiftSwapWizardProps) {
  const [selectedMyShift, setSelectedMyShift] = useState<'shift-a' | 'shift-b'>('shift-a');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColleagueId, setSelectedColleagueId] = useState<string>(preSelectedColleagueId || 'col-1');
  const [targetDay, setTargetDay] = useState<number>(24);
  const [targetShiftTime, setTargetShiftTime] = useState<'day' | 'night'>('night');
  const [justification, setJustification] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charLimit = 250;
  const filteredColleagues = useMemo(() => {
    return colleagues.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [colleagues, searchQuery]);

  const activeColleague = colleagues.find(c => c.id === selectedColleagueId);

  const handleSubmit = (status: 'Pending' | 'Draft') => {
    if (!selectedColleagueId) {
      setErrorMessage('Please select a colleague to initiate the trade.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    setTimeout(() => {
      const replacementShiftDetail = targetShiftTime === 'day' ? 'Day Shift' : 'Night Shift';
      const myOriginalShift = selectedMyShift === 'shift-a' ? 'Surgery A Night' : 'ER Overflow Swing';
      onSubmitLeaveRequest({
        staffName: 'Dr. Julian Vane',
        staffCategory: 'Senior Surgeon',
        department: 'Surgery Dept.',
        avatarUrl: '',
        category: 'shift',
        type: 'Shift Swap',
        startDate: `2024-10-${targetDay}`,
        endDate: `2024-10-${targetDay}`,
        notes: justification || `Requested shift trade with ${activeColleague?.name || 'colleague'}.`,
        status,
        targetColleague: activeColleague?.name,
        originalShift: myOriginalShift,
        targetShift: replacementShiftDetail,
      });
      setIsSubmitting(false);
      setSuccessMessage(status === 'Draft' ? 'Saved swap trade as Draft!' : 'Shift swap requested successfully!');
      setJustification('');
      setTimeout(() => { setSuccessMessage(''); onNavigateToTab('dashboard'); }, 2000);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-blue-800 text-[10px] uppercase font-extrabold tracking-widest flex items-center gap-1.5 mb-1.5">
          <ArrowRightLeft size={14} /> Swap Protocol
        </p>
        <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight mb-2">Shift Swap Request</h2>
        <p className="text-slate-600 max-w-2xl text-sm leading-relaxed">
          Coordinate shift exchanges with colleagues. All swaps are subject to department head approval and must comply with labor regulations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-50 text-blue-700 flex items-center justify-center rounded-lg text-xs font-bold leading-none">1</span>
              Your Shift
              <span className="ml-auto bg-teal-50 border border-teal-100 text-teal-700 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Active</span>
            </h3>
            <div className="space-y-3">
              {[
                { id: 'shift-a' as const, label: 'Night Shift - Surgery A', sub: '22:00 — 06:00', date: 'Mon, Oct 24' },
                { id: 'shift-b' as const, label: 'Swing Shift - ER Overflow', sub: '14:00 — 22:00', date: 'Wed, Oct 26' },
              ].map(opt => (
                <div key={opt.id} onClick={() => setSelectedMyShift(opt.id)}
                  className={`p-4 rounded-xl border transition-soft cursor-pointer text-left ${
                    selectedMyShift === opt.id ? 'border-blue-600 bg-blue-50/20' : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-1"><span>{opt.date}</span></div>
                  <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{opt.label}</h4>
                  <p className="text-[10px] text-slate-500 mt-1">{opt.sub}</p>
                </div>
              ))}
            </div>
            <button type="button" className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors py-1.5">
              • View All Upcoming •
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-50 text-blue-700 flex items-center justify-center rounded-lg text-xs font-bold leading-none">2</span>
              Colleague
            </h3>
            <div className="relative">
              <Search size={16} className="text-slate-400 absolute left-3 top-2.5" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or specialty..."
                className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 rounded-xl py-2 pl-9 pr-4 text-xs font-medium" />
            </div>
            <div className="space-y-3 max-h-[220px] overflow-y-auto">
              {filteredColleagues.map((col) => {
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
                      <p className="text-[10px] text-slate-500 truncate">{col.department} • {col.role}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredColleagues.length === 0 && <p className="text-center text-xs text-slate-400 py-4">No matching partners found</p>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-50 text-blue-700 flex items-center justify-center rounded-lg text-xs font-bold leading-none">3</span>
                Target Shift
                <span className="text-[11px] font-medium text-slate-500 normal-case">
                  Select the shift you want to take from {activeColleague?.name || 'Colleague'}
                </span>
              </h3>
              <div className="flex items-center gap-3 sm:self-auto self-start">
                <button className="p-1 rounded-lg border border-slate-100 hover:bg-slate-50" disabled><ChevronLeft size={16} className="text-slate-400" /></button>
                <span className="text-xs font-extrabold text-slate-800">October 2024</span>
                <button className="p-1 rounded-lg border border-slate-100 hover:bg-slate-50" disabled><ChevronRight size={16} className="text-slate-400" /></button>
              </div>
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 p-2 text-center text-[10px] font-extrabold text-slate-400">
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 text-center p-2 gap-1 bg-white">
                {[
                  { d: 26, isPrev: true }, { d: 27, isPrev: true }, { d: 28, isPrev: true }, { d: 29, isPrev: true }, { d: 30, isPrev: true },
                  { d: 1, isPrev: false }, { d: 2, isPrev: false },
                  { d: 21, isPrev: false }, { d: 22, isPrev: false }, { d: 23, isPrev: false, hasShifts: true }, { d: 24, isPrev: false, hasShifts: true },
                  { d: 25, isPrev: false }, { d: 26, isPrev: false }, { d: 27, isPrev: false },
                ].map((item, index) => {
                  const isSelectedDay = item.d === targetDay && !item.isPrev;
                  return (
                    <div key={index} onClick={() => !item.isPrev && item.hasShifts && setTargetDay(item.d)}
                      className={`min-h-[72px] p-2 rounded-xl flex flex-col justify-between text-left relative transition-soft ${
                        item.isPrev ? 'text-slate-300 bg-slate-50/20' :
                        isSelectedDay ? 'bg-blue-50 border border-blue-400 ring-1 ring-blue-400' :
                        item.hasShifts ? 'bg-white border border-slate-100 hover:border-slate-300 cursor-pointer' :
                        'bg-white text-slate-800'
                      }`}>
                      <span className="text-[11px] font-extrabold text-slate-400">{item.d}</span>
                      {item.d === 23 && !item.isPrev && (
                        <div className="p-1 bg-sky-50 text-sky-700 text-[8px] font-bold tracking-tight rounded-md mt-1 leading-none uppercase">Day Shift</div>
                      )}
                      {item.d === 24 && !item.isPrev && (
                        <div className="space-y-1">
                          <button type="button" onClick={(e) => { e.stopPropagation(); setTargetDay(24); setTargetShiftTime('day'); }}
                            className={`w-full block p-1 text-[8px] font-bold tracking-tight rounded-md leading-none uppercase text-left transition-colors ${
                              targetShiftTime === 'day' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}>Day Shift</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setTargetDay(24); setTargetShiftTime('night'); }}
                            className={`w-full block p-1 text-[8px] font-bold tracking-tight rounded-md leading-none uppercase text-left transition-colors ${
                              targetShiftTime === 'night' ? 'bg-blue-600 text-white font-extrabold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}>Night Shift</button>
                        </div>
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

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center"><ArrowRightLeft size={20} /></div>
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase">Your Shift</p>
                  <p className="text-xs font-bold text-slate-800">Oct 24, 22:00 (Night Shift)</p>
                </div>
              </div>
              <div className="text-slate-300 bg-white border border-slate-200/50 p-1.5 rounded-full rotate-90 sm:rotate-0">
                <ArrowRight size={16} />
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase">Colleague's Shift</p>
                  <p className="text-xs font-bold text-slate-800">Oct 24, {targetShiftTime === 'day' ? '06:00 (Day)' : '22:00 (Night)'}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                  {(activeColleague?.name || 'CO').split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-50 text-blue-700 flex items-center justify-center rounded-lg text-xs font-bold leading-none">4</span>
              Justification
            </h3>
            <div className="relative">
              <textarea rows={3} required maxLength={charLimit} value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Briefly explain the reason for this swap request (optional)..."
                className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 rounded-xl py-3 px-4 text-xs font-medium" />
              <span className="absolute bottom-3 right-3 text-[10px] font-bold text-slate-400">{justification.length} / {charLimit} characters</span>
            </div>
            {errorMessage && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-800 text-xs text-center animate-pulse">{errorMessage}</div>}
            {successMessage && <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs text-center font-bold">{successMessage}</div>}
            <div className="pt-4 border-t border-slate-50 flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-4">
              <button type="button" onClick={() => handleSubmit('Draft')}
                className="hover:bg-slate-100 text-slate-600 border border-slate-100 px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-soft text-center">
                Save as Draft
              </button>
              <button type="button" onClick={() => handleSubmit('Pending')} disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 cursor-pointer transition-soft text-center">
                {isSubmitting ? 'Submitting trade...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
