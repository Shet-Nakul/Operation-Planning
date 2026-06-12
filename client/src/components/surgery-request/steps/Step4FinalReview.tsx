import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Droplets,
  Flag,
  Library,
  Package,
  Syringe,
  Thermometer,
  User,
  Wrench,
} from 'lucide-react';
import { useAppStore } from '../../../context/AppStoreContext';
import { cn } from '../../../lib/utils';
import type { Priority, SurgeryRequest, SurgeryRequestStatus } from '../../../types';

type Step4Props = {
  data: SurgeryRequest;
  recordStatus: SurgeryRequestStatus;
  onBack: () => void;
  onSaveDraft: () => void;
  onSubmitRequest: () => void;
};

function formatDateLabel(iso: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso + 'T12:00:00');
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  } catch {
    return iso;
  }
}

function priorityLabel(p: Priority) {
  if (p === 'emergency') return 'Emergency';
  if (p === 'mandatory') return 'Mandatory';
  return 'Elective';
}

function ResourceIcon({ icon }: { icon: string }) {
  if (icon === 'meds') return <Syringe className="text-secondary" size={18} />;
  if (icon === 'blood') return <Droplets className="text-secondary" size={18} />;
  if (icon === 'kit') return <Wrench className="text-secondary" size={18} />;
  if (icon === 'supply') return <Package className="text-secondary" size={18} />;
  return <Thermometer className="text-secondary" size={18} />;
}

export function Step4FinalReview({
  data,
  recordStatus,
  onBack,
  onSaveDraft,
  onSubmitRequest,
}: Step4Props) {
  const { pushToast } = useAppStore();
  const [feasibilityChecked, setFeasibilityChecked] = useState(false);

  const shortages = useMemo(() => data.resources.filter((r) => r.status === 'shortage'), [data.resources]);

  const phaseRows = useMemo(
    () =>
      (
        [
          { key: 'preOp', label: 'Pre-op', bg: 'bg-slate-50' },
          { key: 'operative', label: 'Operative', bg: 'bg-white' },
          { key: 'postOp', label: 'Post-op', bg: 'bg-slate-50' },
          { key: 'recovery', label: 'Recovery', bg: 'bg-slate-50' },
        ] as const
      ).map((row) => {
        const ph = data.phases[row.key];
        const tags = ph.resources.map((r) => `${r.name} ×${r.count}`);
        const icu = row.key === 'recovery' ? ph.icuProbability : undefined;
        return { ...row, duration: ph.duration, tags, icu };
      }),
    [data.phases],
  );

  const statusLabel =
    recordStatus === 'scheduled' ? 'Scheduled' : recordStatus === 'in_review' ? 'In review' : 'Draft';

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-on-surface font-bold text-sm transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back to Resource Planning
      </button>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <span>Request Workflow</span>
            <ChevronRight size={12} />
            <span className="text-on-surface font-semibold">Final Review</span>
          </nav>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1">Final Review</h1>
          <p className="text-on-surface-variant font-medium">Step 4 of 4: Confirm Surgery Specifications</p>
          <p className="text-xs font-mono text-outline mt-2">Case status: {statusLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn('w-8 h-2 rounded-full transition-all', i === 3 ? 'bg-primary' : 'bg-primary-container opacity-40')}
            />
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-9 h-9 rounded-lg bg-primary-container/25 flex items-center justify-center shrink-0">
                <User className="text-primary" size={20} />
              </span>
              <h2 className="text-xl font-bold tracking-tight">Patient & Scheduling</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Patient Name</label>
                <span className="text-lg font-semibold">{data.patientName || '—'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Procedure</label>
                <span className="text-lg font-semibold">{data.operationType || '—'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Attending Surgeon</label>
                <span className="text-lg font-semibold">{data.primarySurgeon || '—'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Priority Status</label>
                <div className="flex">
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1',
                      data.priority === 'emergency' && 'bg-error-container text-on-error-container',
                      data.priority === 'mandatory' && 'bg-secondary-container/30 text-secondary',
                      data.priority === 'elective' && 'bg-surface-container-high text-on-surface-variant',
                    )}
                  >
                    {data.priority === 'emergency' && <AlertTriangle size={12} />}
                    {priorityLabel(data.priority)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Infection Status</label>
                <span className="text-lg font-semibold flex items-center gap-2 text-on-surface">
                  <CheckCircle2 className="text-tertiary" size={18} />
                  {data.infectionStatus || 'Not specified'}
                </span>
              </div>
              <div className="md:col-span-2 flex flex-col gap-1 bg-slate-50 p-4 rounded-lg">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Optimal Window</label>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Earliest</span>
                    <span className="font-bold">{formatDateLabel(data.earliestDate)}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                  <div className="flex flex-col">
                    <span className="text-xs text-error">Deadline</span>
                    <span className="font-bold text-error">{formatDateLabel(data.endDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="text-primary" size={20} />
              <h2 className="text-xl font-bold tracking-tight">Phase Resource Configuration</h2>
            </div>
            <div className="space-y-4">
              {phaseRows.map((phase) => (
                <div key={phase.key} className={cn('grid grid-cols-12 gap-4 items-center p-4 rounded-lg border border-slate-100', phase.bg)}>
                  <div className="col-span-3">
                    <span className="font-bold text-on-surface">{phase.label}</span>
                    <p className="text-xs text-slate-500">{phase.duration}</p>
                  </div>
                  <div className="col-span-9 flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      {phase.tags.length === 0 && <span className="text-xs text-slate-400">No resources assigned</span>}
                      {phase.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-slate-200 text-xs font-medium rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {phase.icu != null && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-secondary uppercase tracking-tight">ICU Probability</span>
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-secondary" style={{ width: `${phase.icu}%` }} />
                        </div>
                        <span className="text-xs font-bold text-secondary">{phase.icu}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <section className="bg-white p-8 rounded-xl border-l-4 border-error shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Feasibility Check</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Flag className="text-error" size={18} />
                  <span className="text-error font-bold">
                    {feasibilityChecked ? 'Review complete — see flags below' : 'Status: Run feasibility'}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Conflicts are based on resource shortages in this request. Run the check to unlock submission.
              </p>
              <div className="space-y-3">
                {shortages.map((r) => (
                  <div key={r.id} className="flex items-start gap-3 bg-error-container/20 p-3 rounded-lg">
                    <Droplets className="text-error shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-bold text-on-error-container">Shortage: {r.name}</p>
                      <p className="text-xs text-on-error-container/70">
                        Required {r.required} • Stockpile {r.stockpile}
                      </p>
                    </div>
                  </div>
                ))}
                {shortages.length === 0 && (
                  <div className="flex items-start gap-3 bg-tertiary-container/10 p-3 rounded-lg border border-tertiary/20">
                    <CheckCircle2 className="text-tertiary shrink-0" size={18} />
                    <p className="text-sm font-medium text-on-surface">No stock shortages flagged on this case.</p>
                  </div>
                )}
                <div className="flex items-start gap-3 bg-surface-container-low p-3 rounded-lg">
                  <Calendar className="text-on-surface-variant shrink-0" size={18} />
                  <div>
                    <p className="text-sm font-bold text-on-surface">OR slot validation</p>
                    <p className="text-xs text-on-surface-variant">
                      {feasibilityChecked
                        ? 'No hard scheduling conflicts recorded for this demo build.'
                        : 'Pending — run feasibility to clear this gate.'}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => pushToast('Alternate OR windows: 06:00, 13:30, 19:00 (demo suggestion).')}
                className="w-full py-2 text-primary font-bold text-sm border border-primary/20 rounded-lg hover:bg-primary/5 transition-all"
              >
                View Alternate Slots
              </button>
            </div>
          </section>

          <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <Library className="text-primary" size={20} />
              <h2 className="text-xl font-bold tracking-tight">Supplies & Stock</h2>
            </div>
            <div className="space-y-3">
              {data.resources.length === 0 && <p className="text-sm text-slate-500">No line items on this request.</p>}
              {data.resources.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-50 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <ResourceIcon icon={item.icon} />
                    <span className="text-sm font-medium truncate">{item.name}</span>
                  </div>
                  <span className={cn('text-sm font-bold shrink-0', item.status === 'shortage' && 'text-error')}>
                    req {item.required} / stk {item.stockpile}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 glass border-t border-slate-200 px-8 py-6 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-end gap-4">
          <div className="flex flex-wrap items-center gap-3 justify-end">
            <button
              type="button"
              onClick={() => {
                onSaveDraft();
              }}
              className="px-6 py-3 font-bold text-primary hover:bg-primary/5 rounded-xl transition-all"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => {
                setFeasibilityChecked(true);
                pushToast(
                  shortages.length
                    ? `Feasibility: ${shortages.length} shortage(s) logged — you may still proceed if clinically approved.`
                    : 'Feasibility: no shortages detected for this request.',
                );
              }}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2"
            >
              <CheckCircle2 size={20} />
              Check Feasibility
            </button>
            <button
              type="button"
              disabled={!feasibilityChecked}
              onClick={() => {
                onSubmitRequest();
              }}
              className={cn(
                'px-10 py-3 rounded-xl font-bold flex items-center gap-2 transition-all',
                feasibilityChecked
                  ? 'bg-tertiary text-white shadow-lg hover:opacity-90'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed',
              )}
            >
              <CheckCircle2 size={20} />
              Submit Surgery Request
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
