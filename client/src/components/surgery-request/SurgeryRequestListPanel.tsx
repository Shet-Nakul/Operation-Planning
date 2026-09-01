import { useState, useMemo } from 'react';
import { Filter, Plus, X, Clock, CheckCircle, Activity, FileText, Users, Bed } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { SurgeryRequestRecord, SurgeryRequestStatus, Priority } from '../../types/surgery';

const statusStyles: Record<SurgeryRequestStatus, string> = {
  DRAFT: 'text-slate-600',
  ESTIMATED: 'text-amber-600',
  PLANNING: 'text-blue-600',
  PLANNED: 'text-emerald-600',
  IN_PROGRESS: 'text-indigo-600',
  DONE: 'text-emerald-700',
  CANCELLED: 'text-rose-600',
};

const statusBadgeStyles: Record<SurgeryRequestStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  ESTIMATED: 'bg-amber-100 text-amber-700',
  PLANNING: 'bg-blue-100 text-blue-700',
  PLANNED: 'bg-emerald-100 text-emerald-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  DONE: 'bg-emerald-200 text-emerald-800',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

const statusLabel: Record<SurgeryRequestStatus, string> = {
  DRAFT: 'Draft',
  ESTIMATED: 'Estimated',
  PLANNING: 'Planning',
  PLANNED: 'Scheduled',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

const avatarStyles: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  pink: 'bg-pink-100 text-pink-700',
  green: 'bg-green-100 text-green-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  amber: 'bg-amber-100 text-amber-700',
};

function formatShortDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
  } catch {
    return '';
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

function getAvatarColor(id: string): string {
  const colors = ['blue', 'purple', 'orange', 'pink', 'green', 'indigo', 'amber'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const index = hash % colors.length;
  return colors[index];
}

type SurgeryRequestListPanelProps = {
  records: SurgeryRequestRecord[];
  totalRequestCount: number;
  onClearSearch?: () => void;
  activeId: string | null;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onNewRequest?: () => void;
  /** stack: single column; grid: responsive card grid for full-page list */
  layout?: 'stack' | 'grid';
};

export function SurgeryRequestListPanel({
  records,
  totalRequestCount,
  onClearSearch,
  activeId,
  onView,
  onEdit,
  onNewRequest,
  layout = 'stack',
}: SurgeryRequestListPanelProps) {
  const [statusFilter, setStatusFilter] = useState<SurgeryRequestStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchStatus = statusFilter === 'all' || rec.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || rec.data.priority === priorityFilter;
      return matchStatus && matchPriority;
    });
  }, [records, statusFilter, priorityFilter]);

  // Group records by status category for visual separation
  const groupedRecords = useMemo(() => {
    const planned = filteredRecords.filter((r) => r.status === 'PLANNED');
    const planning = filteredRecords.filter((r) => r.status === 'PLANNING');
    const inProgress = filteredRecords.filter((r) => r.status === 'IN_PROGRESS');
    const pending = filteredRecords.filter((r) => ['DRAFT', 'ESTIMATED'].includes(r.status));
    const completed = filteredRecords.filter((r) => ['DONE', 'CANCELLED'].includes(r.status));
    return { planned, planning, inProgress, pending, completed };
  }, [filteredRecords]);

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all';

  const clearFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-wrap items-end justify-between gap-4 shrink-0 mb-6">
        <div>
          <h2 className="text-lg font-bold text-on-surface font-headline tracking-tight">Surgery requests</h2>
          <p className="text-xs text-outline mt-1">View request details or edit the form.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onNewRequest ? (
            <button
              type="button"
              onClick={onNewRequest}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 shrink-0"
            >
              <Plus size={18} />
              New Request
            </button>
          ) : null}
          <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-xl border border-surface-container-high">
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
              <Filter size={14} />
              Filters
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white text-xs font-bold text-on-surface py-1.5 px-3 rounded-lg border border-surface-container-high outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ESTIMATED">Estimated</option>
              <option value="PLANNING">Planning</option>
              <option value="PLANNED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="bg-white text-xs font-bold text-on-surface py-1.5 px-3 rounded-lg border border-surface-container-high outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="all">All Priorities</option>
              <option value="emergency">Emergency</option>
              <option value="mandatory">Mandatory</option>
              <option value="elective">Elective</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-error hover:bg-error/5 rounded-lg transition-colors"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {filteredRecords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-surface-container-lowest/60 p-8 text-center text-sm text-outline">
            {totalRequestCount > 0 ? (
              <>
                <p className="font-semibold text-on-surface">No cases match your selection.</p>
                <p className="mt-1">Try adjusting your filters or search query.</p>
                {(onClearSearch || hasActiveFilters) && (
                  <div className="mt-4 flex items-center justify-center gap-3">
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-primary font-bold hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                    {onClearSearch && (
                      <button
                        type="button"
                        onClick={onClearSearch}
                        className="text-primary font-bold hover:underline"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="font-semibold text-on-surface">No surgery requests yet.</p>
                <p className="mt-1">No requests loaded yet.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* In Progress Section */}
            {groupedRecords.inProgress.length > 0 && (
              <SurgeryGroup
                title="Currently In Progress"
                subtitle="Surgeries being performed right now"
                icon={<Activity className="w-4 h-4" />}
                accentColor="indigo"
                records={groupedRecords.inProgress}
                activeId={activeId}
                onView={onView}
                onEdit={onEdit}
                showResources={false}
              />
            )}

            {/* Planned Section */}
            {groupedRecords.planned.length > 0 && (
              <SurgeryGroup
                title="Scheduled"
                subtitle="Resources allocated by solver, ready for execution"
                icon={<CheckCircle className="w-4 h-4" />}
                accentColor="emerald"
                records={groupedRecords.planned}
                activeId={activeId}
                onView={onView}
                onEdit={onEdit}
                showResources={true}
              />
            )}

            {/* Planning Section */}
            {groupedRecords.planning.length > 0 && (
              <SurgeryGroup
                title="Planning in Progress"
                subtitle="Being processed by the scheduling solver"
                icon={<Clock className="w-4 h-4 animate-pulse" />}
                accentColor="blue"
                records={groupedRecords.planning}
                activeId={activeId}
                onView={onView}
                onEdit={onEdit}
                showResources={false}
              />
            )}

            {/* Pending Section */}
            {groupedRecords.pending.length > 0 && (
              <SurgeryGroup
                title="Pending Requests"
                subtitle="Draft or awaiting scheduling"
                icon={<FileText className="w-4 h-4" />}
                accentColor="amber"
                records={groupedRecords.pending}
                activeId={activeId}
                onView={onView}
                onEdit={onEdit}
                showResources={false}
              />
            )}

            {/* Completed Section */}
            {groupedRecords.completed.length > 0 && (
              <SurgeryGroup
                title="Completed & Cancelled"
                subtitle="Historical records"
                icon={<CheckCircle className="w-4 h-4" />}
                accentColor="slate"
                records={groupedRecords.completed}
                activeId={activeId}
                onView={onView}
                onEdit={onEdit}
                showResources={false}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to extract allocated resource names from plan result
function getResourceSummary(rec: SurgeryRequestRecord): string[] {
  const resources: string[] = [];
  const planResult = rec.planResult?.result;
  if (!planResult) return resources;
  
  const assignments = planResult.resources_assigned as Record<string, unknown> | undefined;
  if (!assignments) return resources;
  
  for (const [role, value] of Object.entries(assignments)) {
    const roleLabel = role.replace(/_/g, ' ');
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === 'string') {
          resources.push(`${roleLabel}: ${item}`);
        } else if (item && typeof item === 'object') {
          const name = (item as Record<string, unknown>).name || 
                       (item as Record<string, unknown>).staffName ||
                       (item as Record<string, unknown>).staff_name;
          if (name) resources.push(`${roleLabel}: ${name}`);
        }
      });
    } else if (typeof value === 'string') {
      resources.push(`${roleLabel}: ${value}`);
    } else if (value && typeof value === 'object') {
      const name = (value as Record<string, unknown>).name;
      if (name) resources.push(`${roleLabel}: ${name}`);
    }
  }
  
  // Get assigned OR/room if available
  if (rec.runtime?.assignedOr) {
    resources.push(`OR: ${rec.runtime.assignedOr}`);
  }
  
  return resources.slice(0, 4); // Limit to 4 for display
}

type SurgeryGroupProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: 'emerald' | 'blue' | 'indigo' | 'amber' | 'slate';
  records: SurgeryRequestRecord[];
  activeId: string | null;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  showResources: boolean;
};

const accentStyles = {
  emerald: {
    header: 'bg-emerald-50 border-emerald-200',
    icon: 'bg-emerald-100 text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  blue: {
    header: 'bg-blue-50 border-blue-200',
    icon: 'bg-blue-100 text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
  },
  indigo: {
    header: 'bg-indigo-50 border-indigo-200',
    icon: 'bg-indigo-100 text-indigo-700',
    badge: 'bg-indigo-100 text-indigo-700',
  },
  amber: {
    header: 'bg-amber-50 border-amber-200',
    icon: 'bg-amber-100 text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
  },
  slate: {
    header: 'bg-slate-50 border-slate-200',
    icon: 'bg-slate-100 text-slate-600',
    badge: 'bg-slate-100 text-slate-600',
  },
};

function SurgeryGroup({
  title,
  subtitle,
  icon,
  accentColor,
  records,
  activeId,
  onView,
  onEdit,
  showResources,
}: SurgeryGroupProps) {
  const styles = accentStyles[accentColor];
  
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Group Header */}
      <div className={cn('px-6 py-4 border-b flex items-center justify-between gap-4', styles.header)}>
        <div className="flex items-center gap-3">
          <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', styles.icon)}>
            {icon}
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', styles.badge)}>
          {records.length} {records.length === 1 ? 'surgery' : 'surgeries'}
        </span>
      </div>
      
      {/* Table */}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100">
            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patient</th>
            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Procedure</th>
            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Surgeon</th>
            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority</th>
            {showResources && (
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Allocated Resources</th>
            )}
            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time Window</th>
            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {records.map((rec) => {
            const patientName = rec.data.patientName?.trim() || 'Patient TBD';
            const procedureType = rec.data.operationType?.trim() || 'Untitled procedure';
            const surgeon = rec.data.primarySurgeon?.trim() || '—';
            const priority = rec.data.priority || 'elective';
            const initials = getInitials(patientName);
            const avatarColor = getAvatarColor(rec.id);
            const selected = rec.id === activeId;
            const resourceSummary = showResources ? getResourceSummary(rec) : [];
            
            const priorityDisplay =
              priority === 'emergency'
                ? 'Emergency'
                : priority === 'mandatory'
                  ? 'Mandatory'
                  : 'Elective';

            return (
              <tr
                key={rec.id}
                onClick={() => onView(rec.id)}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-slate-50/50',
                  selected && 'bg-slate-50'
                )}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                        avatarStyles[avatarColor] ?? 'bg-slate-100 text-slate-700',
                      )}
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{patientName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{rec.referenceCode}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-700">{procedureType}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{surgeon}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      priority === 'emergency'
                        ? 'bg-rose-100 text-rose-700'
                        : priority === 'mandatory'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {priorityDisplay}
                  </span>
                </td>
                {showResources && (
                  <td className="px-6 py-4">
                    {resourceSummary.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {resourceSummary.map((res, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100"
                          >
                            <Users className="w-3 h-3" />
                            {res}
                          </span>
                        ))}
                        {resourceSummary.length === 4 && (
                          <span className="text-[10px] text-slate-400 px-1">+more</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No allocations</span>
                    )}
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold text-slate-700">
                      {rec.data.earliestDate ? formatShortDate(rec.data.earliestDate) : 'TBD'}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">
                      to {rec.data.endDate ? formatShortDate(rec.data.endDate) : 'TBD'}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(rec.id);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest transition-colors"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(rec.id);
                      }}
                      disabled={rec.status === 'CANCELLED'}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                        rec.status === 'CANCELLED'
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'text-white bg-primary hover:opacity-90 shadow-sm shadow-primary/20',
                      )}
                    >
                      {rec.status === 'DRAFT' ? 'Continue' : 'Edit'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
