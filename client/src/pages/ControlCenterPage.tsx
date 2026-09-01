import React, { useEffect, useMemo, useState } from 'react';
import { usePlanningState } from '../hooks/usePlanningState';
import { motion } from 'motion/react';
import {
  Activity,
  Calendar,
  MoreVertical,
  AlertTriangle,
  History,
  BarChart3,
  CalendarDays,
  Users,
  AlertCircle,
  CheckCheck,
  User,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../context/AppStoreContext';
import type { SurgeryRequestRecord, Priority } from '../types/surgery';
import { useResourceCatalog } from '../hooks/useResourceCatalog';
import {
  getAssignedLead,
  getAssignedRoom,
  staffOnSiteFromRecords,
  uniqueRoomsInUse,
} from '../lib/surgeryDisplay';
import {
  classifySurgeryLane,
  formatDurationLabel,
  formatElapsedLabel,
  getExpectedEnd,
  getPlannedStart,
  occursOnCalendarDay,
  parseSolverDate,
  surgeryProgressPercent,
  totalSurgeryDurationMinutes,
} from '../lib/surgeryTimeline';

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

function formatClock(date: Date | null): string {
  if (!date) return 'TBD';
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);
}

type ControlCenterPageProps = {
  onCompleteSurgery?: (record: SurgeryRequestRecord) => void;
  onRefreshSurgeries?: () => void;
  organizationId?: number;
};

export default function ControlCenterPage({ onCompleteSurgery, onRefreshSurgeries, organizationId = 1 }: ControlCenterPageProps) {
  const { isRunning, startPlanning, result } = usePlanningState();
  const { store, pushToast } = useAppStore();
  const catalog = useResourceCatalog();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (result) onRefreshSurgeries?.();
  }, [result, onRefreshSurgeries]);

  const lanes = useMemo(() => {
    const ongoing: SurgeryRequestRecord[] = [];
    const awaiting: SurgeryRequestRecord[] = [];
    const today: SurgeryRequestRecord[] = [];
    const backlog: SurgeryRequestRecord[] = [];
    const history: SurgeryRequestRecord[] = [];

    for (const record of store.surgeryRequests) {
      const lane = classifySurgeryLane(record, now);
      if (lane === 'ongoing') {
        ongoing.push(record);
        if (occursOnCalendarDay(record, now) || !getPlannedStart(record)) today.push(record);
      } else if (lane === 'awaiting_complete') {
        awaiting.push(record);
        if (occursOnCalendarDay(record, now)) today.push(record);
      } else if (lane === 'today') {
        today.push(record);
      } else if (lane === 'backlog') {
        backlog.push(record);
      } else if (lane === 'history') {
        history.push(record);
      }
    }

    today.sort((a, b) => {
      const aStart = getPlannedStart(a)?.getTime() ?? 0;
      const bStart = getPlannedStart(b)?.getTime() ?? 0;
      return aStart - bStart;
    });
    history.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return { ongoing, awaiting, today, backlog, history };
  }, [store.surgeryRequests, now]);

  const todayDateMeta = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return {
      monthLabel: months[now.getMonth()],
      dayOfMonth: now.getDate().toString(),
      weekday: days[now.getDay()],
    };
  }, [now]);

  const scheduleCount = lanes.today.length;
  const roomsInUse = uniqueRoomsInUse([...lanes.ongoing, ...lanes.awaiting], catalog);
  const roomCapacity = Math.max(catalog.nhPools.filter((p) => /room|or|theatre|theater/i.test(`${p.pool_name} ${p.resource_type ?? ''}`)).length, 1);
  const occupancyPct = Math.min(100, Math.round((roomsInUse / Math.max(roomCapacity, scheduleCount || 1)) * 100));
  const staffRows = staffOnSiteFromRecords([...lanes.ongoing, ...lanes.awaiting, ...lanes.today], catalog);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 space-y-10"
    >
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1 font-manrope">Operational Control Center</h1>
        <p className="text-slate-500 text-sm font-medium">Live overview of allocated surgeries, operating windows, and completion.</p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="text-blue-700 w-5 h-5" />
            Ongoing Surgeries
          </h2>
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {lanes.ongoing.length} Active {lanes.ongoing.length === 1 ? 'Unit' : 'Units'}
          </span>
        </div>
        {lanes.ongoing.length === 0 ? (
          <EmptyState
            icon={<Activity className="w-10 h-10 text-slate-300" />}
            title="No current ongoing surgeries"
            description="Allocated surgeries appear here once their planned start time is reached."
          />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {lanes.ongoing.map((surgery) => (
              <OngoingCard key={surgery.id} record={surgery} now={now} catalog={catalog} />
            ))}
          </div>
        )}
      </section>

      {lanes.awaiting.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CheckCheck className="text-amber-600 w-5 h-5" />
              Awaiting Completion
            </h2>
            <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {lanes.awaiting.length} {lanes.awaiting.length === 1 ? 'Case' : 'Cases'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lanes.awaiting.map((surgery) => (
              <CompletionCard
                key={surgery.id}
                record={surgery}
                catalog={catalog}
                onComplete={() => onCompleteSurgery?.(surgery)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-manrope">Operating Schedule</h3>
            <p className="text-sm text-slate-500">
              Procedures planned for today. Later dates appear in the backlog.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
            <button
              className={`px-3 py-1.5 text-xs font-bold ${isRunning ? 'bg-gray-200 text-gray-500' : 'bg-green-50 text-green-700'} rounded-md`}
              disabled={isRunning}
              onClick={() => startPlanning(organizationId)}
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
            </div>

            {scheduleCount === 0 ? (
              <div className="p-12 text-center">
                <EmptyStateInline
                  icon={<CalendarDays className="w-10 h-10 text-slate-300" />}
                  title="No surgeries scheduled today"
                  description="Once a surgery is allocated with a start time for today, it will appear here."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {lanes.today.map((surgery) => {
                  const start = getPlannedStart(surgery);
                  const lane = classifySurgeryLane(surgery, now);
                  const statusLabel =
                    lane === 'awaiting_complete'
                      ? 'Awaiting complete'
                      : lane === 'ongoing'
                        ? 'In Progress'
                        : 'Confirmed';
                  const color =
                    lane === 'awaiting_complete' ? 'amber' : lane === 'ongoing' ? 'blue' : 'slate';
                  return (
                    <ScheduleItem
                      key={surgery.id}
                      time={start ? formatDateTime(start.toISOString()) : 'TBD'}
                      duration={formatDurationLabel(totalSurgeryDurationMinutes(surgery))}
                      title={surgery.data.patientName || surgery.data.operationType || 'Procedure'}
                      status={statusLabel}
                      room={getAssignedRoom(surgery, catalog)}
                      surgeon={getAssignedLead(surgery, catalog)}
                      color={color}
                      dimmed={false}
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
                  <span className="text-4xl font-manrope font-extrabold">{roomsInUse > 0 ? occupancyPct : 0}%</span>
                  <span className="text-emerald-400 text-xs font-bold pb-1 flex items-center">
                    <Activity className="w-3 h-3 mr-1" /> {roomsInUse} rooms
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {roomsInUse > 0
                    ? `${roomsInUse} operating room${roomsInUse === 1 ? '' : 's'} in use from allocated cases`
                    : 'No rooms currently assigned'}
                </p>
                <div className="mt-6 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all"
                    style={{ width: `${roomsInUse > 0 ? occupancyPct : 0}%` }}
                  />
                </div>
              </div>
              <BarChart3 className="absolute -right-8 -bottom-8 text-white/10 w-32 h-32 group-hover:scale-110 transition-transform" />
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h5 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 font-inter">Surgical Staff On-Site</h5>
              <div className="space-y-4">
                {staffRows.length === 0 ? (
                  <p className="text-sm text-slate-400">No staff allocated to today’s cases yet.</p>
                ) : (
                  staffRows.map((row) => (
                    <StaffRow
                      key={row.label}
                      label={row.label}
                      count={String(row.current).padStart(2, '0')}
                      color={row.color}
                    />
                  ))
                )}
              </div>
            </div>

            {lanes.awaiting.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-rose-900 leading-tight">Window elapsed</p>
                  <p className="text-xs text-rose-700 mt-1">
                    {lanes.awaiting.length} allocated {lanes.awaiting.length === 1 ? 'surgery has' : 'surgeries have'} passed the planned end time and need manual completion.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="text-slate-600 w-5 h-5" />
            Operation Backlog
          </h2>
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
              {lanes.backlog.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <EmptyStateInline
                      icon={<Calendar className="w-8 h-8 text-slate-300" />}
                      title="No surgeries in backlog"
                      description="Draft, queued, and surgeries planned for another day appear here."
                    />
                  </td>
                </tr>
              ) : (
                lanes.backlog.map((surgery) => (
                  <tr key={surgery.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold">{surgery.data.patientName || 'Unnamed Patient'}</p>
                      <p className="text-[10px] text-slate-500 font-mono">UID: {surgery.referenceCode}</p>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                      {getAssignedLead(surgery, catalog)}
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
                        {getPlannedStart(surgery)
                          ? formatDateTime(getPlannedStart(surgery)?.toISOString())
                          : `${surgery.data.earliestDate || '—'} → ${surgery.data.endDate || '—'}`}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {getPlannedStart(surgery)
                          ? 'Planned start'
                          : surgery.data.earliestDateTime
                            ? formatDateTime(surgery.data.earliestDateTime)
                            : 'No preferred start'}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          surgery.status === 'PLANNING'
                            ? 'bg-blue-500 animate-pulse'
                            : surgery.status === 'ESTIMATED'
                              ? 'bg-amber-500'
                              : surgery.status === 'PLANNED'
                                ? 'bg-emerald-500'
                                : 'bg-slate-400',
                        )} />
                        <span className="text-xs font-bold text-slate-600">
                          {surgery.status === 'DRAFT'
                            ? 'Draft — Not submitted'
                            : surgery.status === 'ESTIMATED'
                              ? 'Queued for optimization'
                              : surgery.status === 'PLANNING'
                                ? 'Solver processing'
                                : surgery.status === 'PLANNED'
                                  ? 'Scheduled — not today'
                                  : surgery.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          pushToast(`${surgery.data.patientName}: ${surgery.status} — ${surgery.referenceCode}`);
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

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <History className="text-slate-400 w-5 h-5" />
            Surgery History
          </h2>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Completed cases</span>
        </div>
        {lanes.history.length === 0 ? (
          <EmptyState
            icon={<History className="w-10 h-10 text-slate-300" />}
            title="No completed surgeries yet"
            description="After a case is manually completed, it will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lanes.history.map((surgery) => {
              const expected = getExpectedEnd(surgery);
              const completed = parseSolverDate(surgery.runtime?.completedAt || surgery.updatedAt);
              let deviation = 'On Schedule';
              let status: 'success' | 'error' = 'success';
              if (expected && completed) {
                const delta = Math.round((completed.getTime() - expected.getTime()) / 60_000);
                if (delta > 5) {
                  deviation = `+${delta}m (Delay)`;
                  status = 'error';
                } else if (delta < -5) {
                  deviation = `${delta}m (Ahead)`;
                }
              }
              return (
                <HistoryItem
                  key={surgery.id}
                  name={surgery.data.patientName || 'Patient'}
                  lead={`${getAssignedLead(surgery, catalog)} • ${surgery.data.operationType || 'Procedure'}`}
                  time={formatDateTime(surgery.runtime?.completedAt || surgery.updatedAt)}
                  deviation={deviation}
                  status={status}
                />
              );
            })}
          </div>
        )}
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
  now,
  catalog,
}: {
  record: SurgeryRequestRecord;
  now: Date;
  catalog: ReturnType<typeof useResourceCatalog>;
}) {
  const start = getPlannedStart(record);
  const elapsed = start ? formatElapsedLabel(start, now) : '0h 00m';
  const est = formatDurationLabel(totalSurgeryDurationMinutes(record));
  const progress = surgeryProgressPercent(record, now);
  const or = getAssignedRoom(record, catalog);
  const surgeon = getAssignedLead(record, catalog);

  return (
    <div className="bg-white p-6 rounded-xl relative overflow-hidden group border border-slate-200">
      <div className="absolute top-0 right-0 p-3">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
          {or}
        </span>
      </div>
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-1">{record.data.patientName || 'Unnamed Patient'}</h3>
        <p className="text-sm text-slate-500 flex items-center gap-1">
          <User className="w-3 h-3" />
          {surgeon} • {record.data.operationType || record.data.department || 'General'}
        </p>
        <p className="text-[10px] text-slate-400 mt-1 font-mono">{record.referenceCode}</p>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-500">Elapsed: {elapsed}</span>
          <span className="text-blue-700">Est: {est}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
          <span>{progress}% of planned window</span>
          <span>Started {formatClock(start)}</span>
        </div>
      </div>
    </div>
  );
}

function CompletionCard({
  record,
  catalog,
  onComplete,
}: {
  record: SurgeryRequestRecord;
  catalog: ReturnType<typeof useResourceCatalog>;
  onComplete?: () => void;
}) {
  const end = getExpectedEnd(record);
  return (
    <div className="bg-white rounded-xl border-2 border-amber-200 p-6 relative overflow-hidden shadow-sm shadow-amber-100">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              Planned window ended
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">{record.data.patientName || 'Unnamed Patient'}</h3>
          <p className="text-sm text-slate-500">
            {getAssignedLead(record, catalog)} • {record.data.operationType || 'Procedure'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">{record.referenceCode}</p>
          <p className="text-xs text-slate-500 mt-2">{getAssignedRoom(record, catalog)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-bold uppercase text-slate-400">Planned end</p>
          <p className="text-sm font-bold text-slate-800">{end ? formatDateTime(end.toISOString()) : '—'}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onComplete}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20"
      >
        <CheckCheck className="w-4 h-4" /> Complete
      </button>
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
}: {
  time: string;
  duration: string;
  title: string;
  status: string;
  room: string;
  surgeon: string;
  color: 'emerald' | 'blue' | 'slate' | 'amber';
  dimmed?: boolean;
}) {
  return (
    <div className="p-6 flex items-start gap-6 hover:bg-slate-50/50 transition-colors">
      <div className="w-28 pt-1 shrink-0">
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
          dimmed && 'opacity-70',
        )}
      >
        <div className="flex justify-between items-start mb-2 gap-3 flex-wrap">
          <h5 className="text-sm font-bold text-slate-900">{title}</h5>
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
