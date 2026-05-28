import { Fragment } from 'react';
import { motion } from 'motion/react';
import { User, Activity, Calendar, History as HistoryIcon, AlertCircle, Trash2, BarChart3, CalendarDays, Users } from 'lucide-react';
import { useAppStore } from '../../context/AppStoreContext';
import { cn } from '../../lib/utils';
import type { FeasibilityStatus, OngoingCase } from '../../types/store';

export function CurrentStatus() {
  const {
    store,
    pushToast,
    optimizeSchedulingQueue,
    exportFullStore,
    removeSchedulingQueueRow,
    bumpOngoingProgress,
  } = useAppStore();

  const activeCount = store.ongoingSurgeries.length;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface font-headline">Operational Control Center</h1>
        <p className="text-on-surface-variant text-sm font-medium mt-1">Live systemic overview of active, planned, and archived surgical units.</p>
      </header>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2 font-headline">
            <Activity className="text-primary" size={20} />
            Ongoing Surgeries
          </h2>
          <span className="bg-tertiary/10 text-tertiary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {activeCount} Active {activeCount === 1 ? 'Unit' : 'Units'}
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {store.ongoingSurgeries.map((c) => (
            <div key={c.id}>
              <SurgeryCard caseData={c} onBump={(delta) => bumpOngoingProgress(c.id, delta)} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-lg font-bold flex items-center gap-2 font-headline">
            <Calendar className="text-secondary" size={20} />
            Operation Backlog
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={optimizeSchedulingQueue}
              className="text-xs font-bold text-primary bg-primary/5 px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors"
            >
              Optimize Schedule
            </button>
            <button
              type="button"
              onClick={exportFullStore}
              className="text-xs font-bold text-on-surface bg-surface-container-high px-4 py-2 rounded-lg hover:bg-surface-container-highest transition-colors"
            >
              Export Manifest
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl overflow-hidden border border-surface-container-high shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Patient Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Lead Surgeon</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Priority</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Preferred Window</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Feasibility</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {store.schedulingQueue.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                    Scheduling queue is clear.
                  </td>
                </tr>
              )}
              {store.schedulingQueue.map((row) => (
                <Fragment key={row.id}>
                  <BacklogRow
                    row={row}
                    onInspect={() =>
                      pushToast(`${row.name} (${row.caseId}): ${row.feasibility} — ${row.deadline}`)
                    }
                    onRemove={() => removeSchedulingQueueRow(row.id)}
                  />
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-manrope">Today's Operating Schedule</h3>
            <p className="text-sm text-slate-500">Active and confirmed procedures for today.</p>
          </div>
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
            <button className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 rounded-md">Timeline View</button>
            <button className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">OR List</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="text-center bg-blue-700 text-white px-3 py-2 rounded-lg">
                  <p className="text-[10px] font-bold uppercase">Apr</p>
                  <p className="text-xl font-bold font-manrope">13</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Sunday</h4>
                  <p className="text-xs text-slate-500">6 Procedures Scheduled</p>
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

            <div className="divide-y divide-slate-50">
              <ScheduleItem 
                time="08:00 AM" 
                duration="120 min" 
                title="Total Hip Arthroplasty" 
                status="Post-Op" 
                room="OR Suite 4" 
                surgeon="Dr. Julian Thorne"
                color="emerald"
              />
              <ScheduleItem 
                time="10:30 AM" 
                duration="90 min" 
                title="Appendectomy" 
                status="In Progress" 
                room="OR Suite 2" 
                surgeon="Dr. Sarah Chen"
                color="blue"
              />
              <ScheduleItem 
                time="01:15 PM" 
                duration="180 min" 
                title="Coronary Artery Bypass Graft" 
                status="Confirmed" 
                room="OR Suite 1" 
                surgeon="Dr. Alistair Vance"
                color="slate"
                dimmed
              />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white rounded-xl p-6 relative overflow-hidden group">
              <div className="relative z-10">
                <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">OR Occupancy</h5>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-manrope font-extrabold">84%</span>
                  <span className="text-emerald-400 text-xs font-bold pb-1 flex items-center">
                    <Activity className="w-3 h-3 mr-1" /> +5%
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Optimal range reached (75-90%)</p>
                <div className="mt-6 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[84%]"></div>
                </div>
              </div>
              <BarChart3 className="absolute -right-8 -bottom-8 text-white/10 w-32 h-32 group-hover:scale-110 transition-transform" />
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h5 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 font-inter">Surgical Staff On-Site</h5>
              <div className="space-y-4">
                <StaffRow label="Surgeons" count="12 / 14" color="bg-emerald-500" />
                <StaffRow label="Anesthesiologists" count="08 / 08" color="bg-emerald-500" />
                <StaffRow label="Nurses (Surgical)" count="28 / 32" color="bg-orange-500" />
              </div>
              <button className="w-full mt-6 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                View Staff Roster
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-rose-900 leading-tight">Sterilization Delay</p>
                <p className="text-xs text-rose-700 mt-1">Instrument set for OR 2 is delayed. Potential 15-min shift in start time.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2 font-headline">
            <HistoryIcon className="text-on-surface-variant" size={20} />
            Surgery History
          </h2>
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Last 24 Hours</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {store.surgeryHistory.map((h) => (
            <Fragment key={h.id}>
              <HistoryCard name={h.name} details={h.details} time={h.time} deviation={h.deviation} status={h.status} />
            </Fragment>
          ))}
        </div>
      </section>
    </div>
  );
}

function SurgeryCard({ caseData, onBump }: { caseData: OngoingCase; onBump: (delta: number) => void }) {
  const { patient, surgeon, specialty, or, elapsed, est, progress, isOvertime } = caseData;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white p-6 rounded-2xl relative overflow-hidden border border-surface-container-high shadow-sm',
        isOvertime && 'border-l-4 border-l-error',
      )}
    >
      <div className="absolute top-0 right-0 p-4">
        <span
          className={cn(
            'text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider',
            isOvertime ? 'bg-error-container text-error' : 'bg-primary/10 text-primary',
          )}
        >
          {or}
        </span>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-bold text-on-surface font-headline">{patient}</h3>
        <p className="text-sm text-on-surface-variant flex items-center gap-1.5 mt-1 font-medium">
          <User size={14} className="opacity-50" />
          {surgeon} • {specialty}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-xs font-bold">
          <span className={isOvertime ? 'text-error' : 'text-on-surface-variant'}>
            Elapsed: {elapsed} {isOvertime && '(Overtime)'}
          </span>
          <span className="text-primary">Est: {est}</span>
        </div>
        <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
          <motion.div
            key={progress}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={cn('h-full rounded-full', isOvertime ? 'bg-error' : 'bg-gradient-to-r from-primary to-primary-container')}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => onBump(5)}
            className="text-[10px] font-bold px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/15"
          >
            +5% progress
          </button>
          <button
            type="button"
            onClick={() => onBump(-5)}
            className="text-[10px] font-bold px-2 py-1 rounded-md bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          >
            −5% progress
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function BacklogRow({
  row,
  onInspect,
  onRemove,
}: {
  row: {
    id: string;
    name: string;
    caseId: string;
    surgeon: string;
    priority: string;
    window: string;
    deadline: string;
    feasibility: string;
    status: FeasibilityStatus;
  };
  onInspect: () => void;
  onRemove: () => void;
}) {
  const { name, caseId, surgeon, priority, window: windowLabel, deadline, feasibility, status } = row;
  return (
    <tr className="hover:bg-surface-container-low transition-colors group">
      <td className="px-6 py-5">
        <p className="text-sm font-bold text-on-surface">{name}</p>
        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">{caseId}</p>
      </td>
      <td className="px-6 py-5 text-sm text-on-surface-variant font-semibold">{surgeon}</td>
      <td className="px-6 py-5">
        <span
          className={cn(
            'text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider',
            priority === 'EMERGENCY' ? 'bg-error-container text-error' : priority === 'MANDATORY' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary',
          )}
        >
          {priority}
        </span>
      </td>
      <td className="px-6 py-5">
        <p className={cn('text-sm font-bold', windowLabel === 'EXPIRED' ? 'text-error' : 'text-on-surface')}>{windowLabel}</p>
        <p className="text-[10px] text-on-surface-variant font-bold">{deadline}</p>
      </td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              status === 'error' ? 'bg-error' : status === 'warning' ? 'bg-amber-500' : 'bg-tertiary',
            )}
          />
          <span className={cn('text-xs font-bold', status === 'error' ? 'text-error' : 'text-on-surface-variant')}>{feasibility}</span>
        </div>
      </td>
      <td className="px-6 py-5 text-right">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            title="Case details"
            onClick={onInspect}
            className="text-on-surface-variant/50 hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/5"
          >
            <AlertCircle size={20} />
          </button>
          <button
            type="button"
            title="Remove from queue"
            onClick={() => {
              if (globalThis.confirm(`Remove ${name} from the scheduling queue?`)) onRemove();
            }}
            className="text-on-surface-variant/50 hover:text-error transition-colors p-2 rounded-full hover:bg-error/5"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function HistoryCard({
  name,
  details,
  time,
  deviation,
  status,
}: {
  name: string;
  details: string;
  time: string;
  deviation: string;
  status: 'success' | 'error';
}) {
  return (
    <div
      className={cn(
        'bg-surface-container-low p-5 rounded-xl flex items-center justify-between border-l-4',
        status === 'success' ? 'border-l-tertiary' : 'border-l-error/30',
      )}
    >
      <div>
        <p className="text-sm font-bold text-on-surface font-headline">{name}</p>
        <p className="text-xs text-on-surface-variant font-medium">{details}</p>
      </div>
      <div className="text-right">
        <p className={cn('text-sm font-bold', status === 'success' ? 'text-tertiary' : 'text-on-surface')}>{time}</p>
        <p
          className={cn(
            'text-[10px] font-bold uppercase tracking-tighter',
            status === 'error' ? 'text-error' : 'text-on-surface-variant',
          )}
        >
          {deviation}
        </p>
      </div>
    </div>
  );
}

function ScheduleItem({ time, duration, title, status, room, surgeon, color, dimmed = false }: any) {
  return (
    <div className="p-6 flex items-start gap-6 hover:bg-slate-50/50 transition-colors">
      <div className="w-20 pt-1 shrink-0">
        <p className={cn("text-sm font-bold", dimmed ? "text-slate-400" : "text-slate-900")}>{time}</p>
        <p className="text-xs text-slate-400">{duration}</p>
      </div>
      <div className={cn(
        "flex-1 rounded-xl p-4 border-l-4",
        color === 'emerald' ? "bg-slate-50 border-emerald-500" :
        color === 'blue' ? "bg-blue-50 border-blue-500" :
        "bg-white border-slate-300 border",
        dimmed && "opacity-60"
      )}>
        <div className="flex justify-between items-start mb-2">
          <h5 className="text-sm font-bold text-slate-900">{title}</h5>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase",
            color === 'emerald' ? "bg-emerald-100 text-emerald-700" :
            color === 'blue' ? "bg-blue-100 text-blue-700" :
            "bg-slate-100 text-slate-500"
          )}>{status}</span>
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

function StaffRow({ label, count, color }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn("w-2 h-2 rounded-full", color)}></div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <span className="text-sm font-bold">{count}</span>
    </div>
  );
}
