import { useState, useMemo } from 'react';
import { Filter, Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { SurgeryRequestRecord, SurgeryRequestStatus, Priority } from '../../types';

const statusStyles: Record<SurgeryRequestStatus, string> = {
  draft: 'text-slate-600',
  in_review: 'text-blue-600',
  scheduled: 'text-emerald-600',
};

const statusBadgeStyles: Record<SurgeryRequestStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  in_review: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-emerald-100 text-emerald-700',
};

const statusLabel: Record<SurgeryRequestStatus, string> = {
  draft: 'Draft',
  in_review: 'In review',
  scheduled: 'Scheduled',
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
  onSelect: (id: string) => void;
  onNewRequest?: () => void;
  /** stack: single column; grid: responsive card grid for full-page list */
  layout?: 'stack' | 'grid';
};

export function SurgeryRequestListPanel({
  records,
  totalRequestCount,
  onClearSearch,
  activeId,
  onSelect,
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
          <p className="text-xs text-outline mt-1">Select a request to view or edit details.</p>
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
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="scheduled">Scheduled</option>
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
          <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Procedure Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Surgeon</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time Windows</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec) => {
                  const patientName = rec.data.patientName?.trim() || 'Patient TBD';
                  const procedureType = rec.data.operationType?.trim() || 'Untitled procedure';
                  const surgeon = rec.data.primarySurgeon?.trim() || '—';
                  const priority = rec.data.priority || 'elective';
                  const initials = getInitials(patientName);
                  const avatarColor = getAvatarColor(rec.id);
                  const selected = rec.id === activeId;
                  
                  const priorityDisplay =
                    priority === 'emergency'
                      ? 'Emergency'
                      : priority === 'mandatory'
                        ? 'Mandatory'
                        : 'Elective';

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => onSelect(rec.id)}
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
                            <p className="text-xs text-slate-500">ID: {rec.referenceCode}</p>
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
                        <span
                          className={`flex items-center gap-1.5 font-bold text-xs ${
                            rec.status === 'draft'
                              ? 'text-slate-600'
                              : rec.status === 'in_review'
                                ? 'text-blue-600'
                                : 'text-emerald-600'
                          }`}
                        >
                          {rec.status === 'in_review' ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                          ) : rec.status === 'scheduled' ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                          )}
                          {statusLabel[rec.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="text-blue-700 font-bold text-xs hover:underline transition-colors">
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
