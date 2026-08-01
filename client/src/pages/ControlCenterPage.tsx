import React, { useMemo } from 'react';
import { usePlanningState } from '../hooks/usePlanningState';
import { motion } from 'motion/react';
import {
  Activity,
  Calendar,
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
  User,
  History,
  BarChart3,
  CalendarDays,
  Users,
  AlertCircle,
  Clock,
  XCircle,
  CheckCheck,
  Play,
  RotateCcw,
  ThumbsUp,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../context/AppStoreContext';
import type { SurgeryRequestRecord, Priority } from '../types/surgery';
import { SurgeryResourceLockStatus } from '../components/surgery/SurgeryResourceLockStatus';

function priorityLabel(p: Priority): string {
  if (p === 'emergency') return 'Emergency';
  if (p === 'mandatory') return 'Mandatory';
  return 'Elective';
}

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return iso;
  }
}

export default function ControlCenterPage() {
  const { isRunning, startPlanning } = usePlanningState();
  const {
    ongoingSurgeriesDerived,
    pendingCompletionSurgeries,
    todayScheduleDerived,
    backlogDerived,
    historyDerived,
    bumpSurgeryProgress,
    markSurgeryPendingCompletion,
    confirmSurgeryCompletion,
    revertSurgeryToInProgress,
    startSurgery,
    pushToast,
    optimizeSchedulingQueue,
    exportFullStore,
    removeSchedulingQueueRow,
    store,
  } = useAppStore();

  const todayDateMeta = useMemo(() => {
    const d = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return {
      monthLabel: months[d.getMonth()],
      dayOfMonth: d.getDate().toString(),
      weekday: days[d.getDay()],
    };
  }, []);

  const scheduleCount = todayScheduleDerived.length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 space-y-10"
    >
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1 font-manrope">Operational Control Center</h1>
        <p className="text-slate-500 text-sm font-medium">Live systemic overview of active, planned, and archived surgical units.</p>
      </div>

      {/* Ongoing Surgeries */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="text-blue-700 w-5 h-5" />
            Ongoing Surgeries
          </h2>
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {ongoingSurgeriesDerived.length} Active {ongoingSurgeriesDerived.length === 1 ? 'Unit' : 'Units'}
          </span>
        </div>
        {ongoingSurgeriesDerived.length === 0 ? (
          <EmptyState
            icon={<Activity className="w-10 h-10 text-slate-300" />}
            title="No current ongoing surgeries"
            description="Planned surgeries that are actively being performed will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {ongoingSurgeriesDerived.map((surgery) => (
              <OngoingCard
                key={surgery.id}
                record={surgery}
                onProgressBump={(delta) => bumpSurgeryProgress(surgery.id, delta)}
                onMarkComplete={() => markSurgeryPendingCompletion(surgery.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Awaiting Completion Confirmation */}
      {pendingCompletionSurgeries.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CheckCheck className="text-amber-600 w-5 h-5" />
              Awaiting Completion Confirmation
            </h2>
            <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {pendingCompletionSurgeries.length} {pendingCompletionSurgeries.length === 1 ? 'Case' : 'Cases'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingCompletionSurgeries.map((surgery) => (
              <CompletionConfirmCard
                key={surgery.id}
                record={surgery}
                onConfirm={() => confirmSurgeryCompletion(surgery.id)}
                onRevert={() => revertSurgeryToInProgress(surgery.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Today's Operating Schedule */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-manrope">Today&apos;s Operating Schedule</h3>
            <p className="text-sm text-slate-500">
              Active and confirmed procedures for {todayDateMeta.weekday}, {todayDateMeta.monthLabel} {todayDateMeta.dayOfMonth}.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
            <button className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 rounded-md">Timeline View</button>
            <button className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">OR List</button>
            <button
              className={`px-3 py-1.5 text-xs font-bold ${isRunning ? 'bg-gray-200 text-gray-500' : 'bg-green-50 text-green-700'} rounded-md`}
              disabled={isRunning}
              onClick={() => startPlanning(1)}
            >
              {isRunning ? 'Planning...' : 'Run Planning'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="text-center bg-blue-700 text-white px-3 py-2 rounded-lg">
                  <p className="text-[10px] font-bold uppercase">{todayDateMeta.monthLabel}</p>
                  <p className="text-xl font-bold font-manrope">{todayDateMeta.dayOfMonth}</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{todayDateMeta.weekday}</h4>
                  <p className="text-xs text-slate-500">{scheduleCount} Procedures Scheduled</p>
                </div>
              </div>
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <img
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white"
                    src={`https://picsum.photos/seed/doc${i}/100/100`}
                    referrerPolicy="no-referrer"
                    alt={`Surgeon ${i}`}
                  />
                ))}
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold border-2 border-white text-slate-500">+4</div>
              </div>
            </div>

            {scheduleCount === 0 ? (
              <div className="p-12 text-center">
                <EmptyStateInline
                  icon={<CalendarDays className="w-10 h-10 text-slate-300" />}
                  title="No surgeries scheduled today"
                  description="Once surgery requests are planned, they will appear in today's schedule."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {todayScheduleDerived.map((surgery) => {
                  const plannedStart = surgery.planResult?.result?.planned_start as string | undefined;
                  const statusLabel =
                    surgery.status === 'IN_PROGRESS'
                      ? (surgery.runtime?.progress ?? 0) >= 100
                        ? 'Completing'
                        : 'In Progress'
                      : 'Confirmed';
                  const color =
                    surgery.status === 'IN_PROGRESS'
                      ? (surgery.runtime?.progress ?? 0) >= 100
                        ? 'amber'
                        : 'blue'
                      : 'slate';
                  return (
                    <ScheduleItem
                      key={surgery.id}
                      time={plannedStart ? formatDateTime(plannedStart).split(', ').pop() ?? 'TBD' : 'TBD'}
                      duration={surgery.runtime?.estimatedTime ?? '—'}
                      title={surgery.data.operationType || 'Procedure'}
                      status={statusLabel}
                      room={surgery.runtime?.assignedRoom ?? 'OR Suite 1'}
                      surgeon={surgery.data.primarySurgeon || 'Unassigned'}
                      color={color as any}
                      dimmed={surgery.status === 'PLANNED' && !plannedStart}
                      canStart={surgery.status === 'PLANNED'}
                      onStart={() => startSurgery(surgery.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white rounded-xl p-6 relative overflow-hidden group">
              <div className="relative z-10">
                <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">OR Occupancy</h5>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-manrope font-extrabold">
                    {scheduleCount > 0 ? Math.min(95, Math.round((scheduleCount / 8) * 100)) : 0}%
                  </span>
                  <span className="text-emerald-400 text-xs font-bold pb-1 flex items-center">
                    <Activity className="w-3 h-3 mr-1" /> {scheduleCount} rooms
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {scheduleCount > 0 ? `${scheduleCount} active procedure${scheduleCount === 1 ? '' : 's'}` : 'No active bookings'}
                </p>
                <div className="mt-6 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all"
                    style={{ width: `${Math.min(100, scheduleCount * 12)}%` }}
                  />
                </div>
              </div>
              <BarChart3 className="absolute -right-8 -bottom-8 text-white/10 w-32 h-32 group-hover:scale-110 transition-transform" />
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h5 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 font-inter">Surgical Staff On-Site</h5>
              <div className="space-y-4">
                {store.staffOnSite.length > 0 ? (
                  store.staffOnSite.map((s) => (
                    <StaffRow
                      key={s.id}
                      label={s.label}
                      count={`${s.current.toString().padStart(2, '0')} / ${s.total.toString().padStart(2, '0')}`}
                      color={s.color === 'emerald' ? 'bg-emerald-500' : 'bg-orange-500'}
                    />
                  ))
                ) : (
                  <StaffRow label="Surgeons" count="12 / 14" color="bg-emerald-500" />
                )}
              </div>
              <button
                onClick={() => pushToast('Opening staff roster (demo).')}
                className="w-full mt-6 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                View Staff Roster
              </button>
            </div>

            {ongoingSurgeriesDerived.some((r) => r.runtime?.isOvertime) && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-rose-900 leading-tight">Overtime Alert</p>
                  <p className="text-xs text-rose-700 mt-1">
                    {ongoingSurgeriesDerived.filter((r) => r.runtime?.isOvertime).length} surgery case
                    {ongoingSurgeriesDerived.filter((r) => r.runtime?.isOvertime).length === 1 ? '' : 's'} running over estimated time.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Operation Backlog */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="text-slate-600 w-5 h-5" />
            Operation Backlog
          </h2>
          <div className="flex gap-2">
            <button
              onClick={optimizeSchedulingQueue}
              className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors"
            >
              Optimize Schedule
            </button>
            <button
              onClick={exportFullStore}
              className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded hover:bg-slate-200 transition-colors"
            >
              Export Manifest
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Patient Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Lead Surgeon</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Preferred Window</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {backlogDerived.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <EmptyStateInline
                      icon={<Calendar className="w-8 h-8 text-slate-300" />}
                      title="No surgeries in backlog"
                      description="New surgery requests in DRAFT, ESTIMATED, or PLANNING status will appear here."
                    />
                  </td>
                </tr>
              ) : (
                backlogDerived.map((surgery) => (
                  <tr key={surgery.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold">{surgery.data.patientName || 'Unnamed Patient'}</p>
                      <p className="text-[10px] text-slate-500 font-mono">UID: {surgery.referenceCode}</p>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                      {surgery.data.primarySurgeon || 'Unassigned'}
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        'text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider',
                        surgery.data.priority === 'emergency'
                          ? 'bg-rose-100 text-rose-700'
                          : surgery.data.priority === 'mandatory'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600',
                      )}>
                        {priorityLabel(surgery.data.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-900">
                        {surgery.data.earliestDate || '—'} → {surgery.data.endDate || '—'}
                      </p>
                      <p className="text-[10px] text-slate-500">Window status: In range</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          surgery.status === 'PLANNING'
                            ? 'bg-blue-500 animate-pulse'
                            : surgery.status === 'ESTIMATED'
                              ? 'bg-amber-500'
                              : 'bg-slate-400',
                        )} />
                        <span className={cn(
                          'text-xs font-bold',
                          surgery.status === 'DRAFT' ? 'text-slate-600' : 'text-slate-600',
                        )}>
                          {surgery.status === 'DRAFT'
                            ? 'Draft — Not submitted'
                            : surgery.status === 'ESTIMATED'
                              ? 'Queued for optimization'
                              : 'Solver processing'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          pushToast(`${surgery.data.patientName}: status ${surgery.status} — reference ${surgery.referenceCode}`);
                        }}
                        className="text-slate-400 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-full transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Surgery History */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <History className="text-slate-400 w-5 h-5" />
            Surgery History
          </h2>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recently Completed</span>
        </div>
        {historyDerived.length === 0 && store.surgeryHistory.length === 0 ? (
          <EmptyState
            icon={<History className="w-10 h-10 text-slate-300" />}
            title="No completed surgeries yet"
            description="Once surgeries are confirmed as complete, they will appear here for review."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {historyDerived.map((surgery) => (
              <HistoryItem
                key={surgery.id}
                name={surgery.data.patientName || 'Patient'}
                lead={`${surgery.data.primarySurgeon || 'Lead'} • ${surgery.data.operationType || 'Procedure'}`}
                time={formatDateTime(surgery.runtime?.completedAt || surgery.updatedAt)}
                deviation={surgery.runtime?.isOvertime ? '+15m (Delay)' : 'On Schedule'}
                status={surgery.runtime?.isOvertime ? 'error' : 'success'}
              />
            ))}
            {store.surgeryHistory
              .filter((h) => !historyDerived.some((r) => r.data.patientName === h.name))
              .slice(0, Math.max(0, 4 - historyDerived.length))
              .map((h) => (
                <HistoryItem
                  key={h.id}
                  name={h.name}
                  lead={h.details}
                  time={h.time}
                  deviation={h.deviation}
                  status={h.status}
                />
              ))}
          </div>
        )}
      </section>

      {/* Resource Lock & Schedule Status (Aggregate) */}
      <section>
        <SurgeryResourceLockStatus view="full" showHeader={true} />
      </section>
    </motion.div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-sm font-bold text-slate-700 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-md mx-auto">{description}</p>
    </div>
  );
}

function EmptyStateInline({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-3">{icon}</div>
      <h3 className="text-sm font-bold text-slate-500 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mx-auto">{description}</p>
    </div>
  );
}

function OngoingCard({
  record,
  onProgressBump,
  onMarkComplete,
}: {
  record: SurgeryRequestRecord;
  onProgressBump: (delta: number) => void;
  onMarkComplete: () => void;
}) {
  const { data, runtime, referenceCode } = record;
  const progress = runtime?.progress ?? 0;
  const isOvertime = runtime?.isOvertime ?? false;
  const or = runtime?.assignedOr ?? 'OR-XX';
  const elapsed = runtime?.elapsedTime ?? '0h 00m';
  const est = runtime?.estimatedTime ?? '1h 30m';
  return (
    <div
      className={cn(
        'bg-white p-6 rounded-xl relative overflow-hidden group border border-slate-200',
        isOvertime && 'border-l-4 border-rose-500',
      )}
    >
      <div className="absolute top-0 right-0 p-3">
        <span
          className={cn(
            'text-[10px] font-bold px-2 py-0.5 rounded',
            isOvertime ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700',
          )}
        >
          {or}
        </span>
      </div>
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-1">{data.patientName || 'Unnamed Patient'}</h3>
        <p className="text-sm text-slate-500 flex items-center gap-1">
          <User className="w-3 h-3" />
          {data.primarySurgeon || 'Unassigned'} • {data.operationType || data.department || 'General'}
        </p>
        <p className="text-[10px] text-slate-400 mt-1 font-mono">{referenceCode}</p>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between text-xs font-semibold">
          <span className={cn(isOvertime ? 'text-rose-600 font-bold' : 'text-slate-500')}>
            Elapsed: {elapsed} {isOvertime && '(Overtime)'}
          </span>
          <span className="text-blue-700">Est: {est}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-1000',
              isOvertime ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-600 to-blue-400',
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
          <span>{Math.round(progress)}% complete</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onProgressBump(-5)}
              className="px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold"
            >
              −5%
            </button>
            <button
              type="button"
              onClick={() => onProgressBump(5)}
              className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold"
            >
              +5%
            </button>
            {progress >= 95 && (
              <button
                type="button"
                onClick={onMarkComplete}
                className="px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" /> Mark done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompletionConfirmCard({
  record,
  onConfirm,
  onRevert,
}: {
  record: SurgeryRequestRecord;
  onConfirm: () => void;
  onRevert: () => void;
}) {
  const { data, runtime, referenceCode } = record;
  return (
    <div className="bg-white rounded-xl border-2 border-amber-200 p-6 relative overflow-hidden shadow-sm shadow-amber-100">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              Pending Confirmation
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">{data.patientName || 'Unnamed Patient'}</h3>
          <p className="text-sm text-slate-500">
            {data.primarySurgeon || 'Unassigned'} • {data.operationType || 'Procedure'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">{referenceCode}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-bold uppercase text-slate-400">Completed at</p>
          <p className="text-sm font-bold text-slate-800">
            {runtime?.completedAt ? formatDateTime(runtime.completedAt) : formatDateTime(new Date().toISOString())}
          </p>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20"
        >
          <ThumbsUp className="w-4 h-4" /> Confirm completion
        </button>
        <button
          type="button"
          onClick={onRevert}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Revert to in-progress
        </button>
      </div>
    </div>
  );
}

function HistoryItem({
  name,
  lead,
  time,
  deviation,
  status,
}: {
  name: string;
  lead: string;
  time: string;
  deviation: string;
  status: 'success' | 'error';
}) {
  return (
    <div
      className={cn(
        'bg-slate-50 p-5 rounded-lg flex items-center justify-between border-l-2',
        status === 'success' ? 'border-emerald-500' : 'border-rose-500/30',
      )}
    >
      <div>
        <p className="text-sm font-bold">{name}</p>
        <p className="text-xs text-slate-500">{lead}</p>
      </div>
      <div className="text-right">
        <p className={cn('text-sm font-bold', status === 'success' ? 'text-emerald-700' : 'text-slate-900')}>
          Completed {time}
        </p>
        <p className={cn('text-[10px] font-bold', status === 'error' ? 'text-rose-600' : 'text-slate-500')}>
          Deviation: {deviation}
        </p>
      </div>
    </div>
  );
}

function ScheduleItem({
  time,
  duration,
  title,
  status,
  room,
  surgeon,
  color,
  dimmed = false,
  canStart = false,
  onStart,
}: {
  time: string;
  duration: string;
  title: string;
  status: string;
  room: string;
  surgeon: string;
  color: 'emerald' | 'blue' | 'slate' | 'amber';
  dimmed?: boolean;
  canStart?: boolean;
  onStart?: () => void;
}) {
  return (
    <div className="p-6 flex items-start gap-6 hover:bg-slate-50/50 transition-colors">
      <div className="w-20 pt-1 shrink-0">
        <p className={cn('text-sm font-bold', dimmed ? 'text-slate-400' : 'text-slate-900')}>{time}</p>
        <p className="text-xs text-slate-400">{duration}</p>
      </div>
      <div
        className={cn(
          'flex-1 rounded-xl p-4 border-l-4',
          color === 'emerald'
            ? 'bg-slate-50 border-emerald-500'
            : color === 'blue'
              ? 'bg-blue-50 border-blue-500'
              : color === 'amber'
                ? 'bg-amber-50 border-amber-500'
                : 'bg-white border-slate-300 border',
          dimmed && 'opacity-60',
        )}
      >
        <div className="flex justify-between items-start mb-2 gap-3 flex-wrap">
          <h5 className="text-sm font-bold text-slate-900">{title}</h5>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase',
                color === 'emerald'
                  ? 'bg-emerald-100 text-emerald-700'
                  : color === 'blue'
                    ? 'bg-blue-100 text-blue-700'
                    : color === 'amber'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-500',
              )}
            >
              {status}
            </span>
            {canStart && onStart && (
              <button
                type="button"
                onClick={onStart}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-700 transition-colors"
              >
                <Play className="w-3 h-3" /> Start
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3 h-3 text-slate-400" />
            <span className="text-slate-600">{room}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-slate-400" />
            <span className="text-slate-600">{surgeon}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StaffRow({ label, count, color }: { label: string; count: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn('w-2 h-2 rounded-full', color)} />
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <span className="text-sm font-bold">{count}</span>
    </div>
  );
}
