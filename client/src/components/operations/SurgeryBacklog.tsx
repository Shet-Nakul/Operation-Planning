import { Fragment, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Users, Activity, AlertTriangle, MapPin } from 'lucide-react';
import { useAppStore } from '../../context/AppStoreContext';
import { cn } from '../../lib/utils';
import type { TodayScheduleSlot, UnscheduledBacklogRow } from '../../types/store';

type SurgeryBacklogProps = {
  onNewRequest?: () => void;
};

/** Decorative donut — 84% occupied */
function OccupancyDonutDecor() {
  const r = 70;
  const circumference = 2 * Math.PI * r;
  const occupiedPct = 0.84;
  const dash = occupiedPct * circumference;
  return (
    <svg width={240} height={240} viewBox="-100 -100 200 200" aria-hidden className="overflow-visible">
      <circle r={r} fill="none" stroke="#1e293b" strokeWidth={20} />
      <circle
        r={r}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={20}
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform="rotate(-90)"
      />
    </svg>
  );
}

export function SurgeryBacklog({ onNewRequest }: SurgeryBacklogProps) {
  const { store, pushToast, scheduleUnscheduledRow } = useAppStore();
  const [scheduleView, setScheduleView] = useState<'timeline' | 'orlist'>('timeline');

  const header = store.scheduleHeader;
  const orList = [...new Set(store.todaySchedule.map((s) => s.or))];

  return (
    <div className="space-y-10">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface font-headline">Surgery Backlog (Unscheduled)</h1>
          <p className="text-on-surface-variant text-sm font-medium mt-1">Queue of validated, plannable procedures awaiting allocation.</p>
        </div>
        <button
          type="button"
          onClick={onNewRequest}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 shrink-0"
        >
          <Plus size={20} />
          New Request
        </button>
      </header>

      <section>
        <div className="bg-white rounded-2xl overflow-hidden border border-surface-container-high shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Patient Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Procedure Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Surgeon</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Priority</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Target Window</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {store.unscheduledBacklog.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                    Unscheduled backlog is empty.
                  </td>
                </tr>
              )}
              {store.unscheduledBacklog.map((row) => (
                <Fragment key={row.id}>
                  <BacklogTableRow row={row} onSchedule={() => scheduleUnscheduledRow(row.id)} />
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-xl font-bold font-headline">Today&apos;s Operating Schedule</h3>
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-surface-container-high shadow-sm">
              <button
                type="button"
                onClick={() => setScheduleView('timeline')}
                className={cn(
                  'px-4 py-2 text-xs font-bold rounded-lg transition-colors',
                  scheduleView === 'timeline' ? 'bg-primary/5 text-primary' : 'text-on-surface-variant hover:text-primary',
                )}
              >
                Timeline View
              </button>
              <button
                type="button"
                onClick={() => setScheduleView('orlist')}
                className={cn(
                  'px-4 py-2 text-xs font-bold rounded-lg transition-colors',
                  scheduleView === 'orlist' ? 'bg-primary/5 text-primary' : 'text-on-surface-variant hover:text-primary',
                )}
              >
                OR List
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
            <div className="p-6 border-b border-surface-container flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="text-center bg-primary text-on-primary px-4 py-2 rounded-xl shadow-md">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{header.monthLabel}</p>
                  <p className="text-2xl font-black font-headline leading-none">{header.dayOfMonth}</p>
                </div>
                <div>
                  <h4 className="font-bold text-on-surface text-lg">{header.weekday}</h4>
                  <p className="text-xs text-on-surface-variant font-medium">{header.subtitle}</p>
                </div>
              </div>
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <img
                    key={i}
                    src={`https://picsum.photos/seed/doc${i}/100/100`}
                    className="w-10 h-10 rounded-full border-4 border-white shadow-sm"
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                ))}
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold border-4 border-white text-on-surface-variant">
                  +4
                </div>
              </div>
            </div>

            {scheduleView === 'timeline' ? (
              <div className="divide-y divide-surface-container">
                {store.todaySchedule.map((slot) => (
                  <Fragment key={slot.id}>
                    <TimelineItem slot={slot} />
                  </Fragment>
                ))}
              </div>
            ) : (
              <div className="p-6 space-y-3">
                <p className="text-sm font-bold text-on-surface">Rooms in use today</p>
                <ul className="list-disc pl-5 text-sm text-on-surface-variant space-y-1">
                  {orList.map((or) => (
                    <li key={or}>{or}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden group shadow-xl">
            <div className="relative z-10">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">OR Occupancy</h5>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-black font-headline">84%</span>
                <span className="text-emerald-400 text-sm font-bold pb-2 flex items-center gap-1">
                  <Activity size={16} /> +5%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-3 font-medium">Optimal range reached (75-90%)</p>

              <div className="mt-8 w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '84%' }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="bg-blue-500 h-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                />
              </div>
            </div>
            <div className="absolute -right-12 -bottom-12 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <OccupancyDonutDecor />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-surface-container-high shadow-sm">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-6">Surgical Staff On-Site</h5>
            <div className="space-y-5">
              {store.staffOnSite.map((s) => (
                <Fragment key={s.id}>
                  <StaffRow label={s.label} current={s.current} total={s.total} color={s.color} />
                </Fragment>
              ))}
            </div>
            <button
              type="button"
              onClick={() => pushToast('Staff roster: opening directory (demo).')}
              className="w-full mt-8 py-3 border border-surface-container-high rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-all"
            >
              View Staff Roster
            </button>
          </div>

          <div className="bg-error-container/30 border border-error/10 rounded-2xl p-5 flex gap-4">
            <AlertTriangle className="text-error shrink-0" size={24} />
            <div>
              <p className="text-sm font-bold text-error leading-tight">Sterilization Delay</p>
              <p className="text-xs text-on-surface-variant mt-1.5 font-medium leading-relaxed">
                Instrument set for OR 2 is delayed. Potential 15-min shift in start time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function BacklogTableRow({ row, onSchedule }: { row: UnscheduledBacklogRow; onSchedule: () => void }) {
  const { name, caseId, initials, procedure, surgeon, priority, window, status, color } = row;
  return (
    <tr className="hover:bg-surface-container-low transition-colors group">
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm',
              color === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700',
            )}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">{name}</p>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">{caseId}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-5 text-sm text-on-surface-variant font-semibold">{procedure}</td>
      <td className="px-6 py-5 text-sm text-on-surface-variant font-medium">{surgeon}</td>
      <td className="px-6 py-5">
        <span
          className={cn(
            'text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider',
            priority === 'EMERGENCY' ? 'bg-error-container text-error' : priority === 'MANDATORY' ? 'bg-yellow-100 text-yellow-700' : 'bg-surface-container-high text-on-surface-variant',
          )}
        >
          {priority}
        </span>
      </td>
      <td className="px-6 py-5 text-sm text-on-surface-variant font-medium">{window}</td>
      <td className="px-6 py-5">
        <span className={cn('flex items-center gap-2 font-bold text-xs', color === 'emerald' ? 'text-emerald-600' : 'text-rose-600')}>
          <span className={cn('w-1.5 h-1.5 rounded-full', color === 'emerald' ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600')} />
          {status}
        </span>
      </td>
      <td className="px-6 py-5 text-center">
        <button
          type="button"
          disabled={color !== 'emerald'}
          onClick={onSchedule}
          className={cn(
            'text-xs font-bold transition-all',
            color === 'emerald' ? 'text-primary hover:underline' : 'text-on-surface-variant/40 cursor-not-allowed',
          )}
        >
          {color === 'emerald' ? 'Schedule' : 'Resolve Issue'}
        </button>
      </td>
    </tr>
  );
}

function TimelineItem({ slot }: { slot: TodayScheduleSlot }) {
  const { time, duration, title, tag, tagColor, or, surgeon, isFuture } = slot;
  return (
    <div className={cn('p-6 flex items-start gap-8 hover:bg-surface-container-low transition-colors', isFuture && 'opacity-60')}>
      <div className="w-20 pt-1 shrink-0">
        <p className="text-sm font-bold text-on-surface">{time}</p>
        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-1">{duration}</p>
      </div>
      <div
        className={cn(
          'flex-1 rounded-2xl p-5 border-l-4 shadow-sm',
          tagColor === 'emerald' ? 'bg-emerald-50/50 border-l-emerald-500' : tagColor === 'primary' ? 'bg-primary/5 border-l-primary' : 'bg-white border-l-slate-300 border border-surface-container',
        )}
      >
        <div className="flex justify-between items-start mb-4">
          <h5 className="text-base font-bold text-on-surface font-headline leading-tight">{title}</h5>
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest',
              tagColor === 'emerald' ? 'bg-emerald-100 text-emerald-700' : tagColor === 'primary' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant',
            )}
          >
            {tag}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-6 text-xs font-semibold text-on-surface-variant">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="opacity-50" />
            {or}
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} className="opacity-50" />
            {surgeon}
          </div>
        </div>
      </div>
    </div>
  );
}

function StaffRow({ label, current, total, color }: { label: string; current: number; total: number; color: 'emerald' | 'orange' }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn('w-2 h-2 rounded-full', color === 'emerald' ? 'bg-emerald-500' : 'bg-orange-500')} />
        <span className="text-sm font-semibold text-on-surface-variant">{label}</span>
      </div>
      <span className="text-sm font-black font-headline">
        {current.toString().padStart(2, '0')} / {total.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
