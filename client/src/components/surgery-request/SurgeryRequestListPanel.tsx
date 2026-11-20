import { useState, type KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Priority, SurgeryRequestRecord } from '../../types/surgery';
import {
  getExpectedEnd, getPlannedStart, getSurgeryRequestDisplayStatus, isSurgeryStarted,
  parseSolverDate, type SurgeryRequestDisplayStatus,
} from '../../lib/surgeryTimeline';
import { getAssignedLead } from '../../lib/surgeryDisplay';
import { useResourceCatalog } from '../../hooks/useResourceCatalog';
import { useSurgeryRequestClock } from '../../hooks/useSurgeryRequestClock';

export type SurgeryRequestStage = Exclude<SurgeryRequestDisplayStatus, 'ESTIMATED' | 'CANCELLED'>;

const stages = [
  { id: 'PLANNING', label: 'Planning', description: 'Submitted requests waiting for a confirmed plan.' },
  { id: 'PLANNED', label: 'Planned', description: 'Upcoming surgeries with a scheduled slot and plan details.' },
  { id: 'IN_PROGRESS', label: 'In progress', description: 'Surgeries in their planned execution window or marked in progress.' },
  { id: 'AWAITING_COMPLETION', label: 'Awaiting completion', description: 'The planned window has ended. Review the case and confirm completion.' },
  { id: 'DONE', label: 'Completed', description: 'Surgeries with recorded completion.' },
  { id: 'DRAFT', label: 'Drafts', description: 'Requests that have not been submitted for planning.' },
] as const satisfies readonly { id: SurgeryRequestStage; label: string; description: string }[];

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const priorityStyles: Record<Priority, string> = {
  emergency: 'bg-rose-100 text-rose-700',
  mandatory: 'bg-amber-100 text-amber-800',
  elective: 'bg-slate-100 text-slate-700',
};

type Props = {
  records: SurgeryRequestRecord[];
  hasSearch: boolean;
  stage: SurgeryRequestStage;
  onStageChange: (stage: SurgeryRequestStage) => void;
  onClearSearch: () => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onNewRequest: () => void;
};

export function SurgeryRequestListPanel({ records, hasSearch, stage, onStageChange, onClearSearch, onView, onEdit, onNewRequest }: Props) {
  const [priority, setPriority] = useState<Priority | 'all'>('all');
  const now = useSurgeryRequestClock();
  const catalog = useResourceCatalog();
  const grouped = new Map<SurgeryRequestStage, SurgeryRequestRecord[]>();
  for (const record of records) {
    if (priority !== 'all' && record.data.priority !== priority) continue;
    const status = getSurgeryRequestDisplayStatus(record, now);
    if (status === 'CANCELLED') continue;
    const key = status === 'ESTIMATED' ? 'PLANNING' : status;
    const group = grouped.get(key);
    if (group) group.push(record);
    else grouped.set(key, [record]);
  }
  const activeStage = stages.find((item) => item.id === stage)!;
  const stageRecords = grouped.get(stage) ?? [];
  const showPlan = stage !== 'PLANNING' && stage !== 'DRAFT';
  const isCompleted = stage === 'DONE';
  const columns = [
    'Patient', 'Procedure', 'Priority',
    ...(showPlan ? ['Surgeon in charge'] : []),
    isCompleted ? 'Completion recorded' : 'Time window', 'Actions',
  ];

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'ArrowRight' ? (index + 1) % stages.length
      : event.key === 'ArrowLeft' ? (index - 1 + stages.length) % stages.length
        : event.key === 'Home' ? 0
          : event.key === 'End' ? stages.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    const id = stages[next].id;
    onStageChange(id);
    document.getElementById(`surgery-stage-${id}`)?.focus();
  }

  return (
    <section className="@container w-full min-w-0 space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-headline">Surgery requests</h1>
          <p className="mt-1 text-sm text-slate-600">Track each request from planning through completion.</p>
        </div>
        <button type="button" onClick={onNewRequest} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary hover:opacity-90">
          <Plus size={18} aria-hidden="true" /> New request
        </button>
      </header>

      <div className="rounded-2xl border border-slate-200/50 bg-white shadow-sm">
        <div role="tablist" aria-label="Surgery stages" className="grid w-full grid-cols-2 rounded-t-2xl border-b border-slate-200 bg-slate-50/50 @lg:grid-cols-3 @3xl:grid-cols-6">
          {stages.map(({ id, label }, index) => (
            <button
              key={id}
              id={`surgery-stage-${id}`}
              type="button"
              role="tab"
              aria-selected={stage === id}
              aria-controls={`surgery-panel-${id}`}
              tabIndex={stage === id ? 0 : -1}
              onClick={() => onStageChange(id)}
              onKeyDown={(event) => navigateTabs(event, index)}
              className={cn(
                'flex min-h-12 min-w-0 items-center justify-center gap-1.5 border-b-2 px-2 py-2 text-center text-xs font-bold transition-colors @3xl:text-sm',
                'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
                stage === id ? 'border-primary bg-primary/5 text-primary' : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-on-surface',
              )}
            >
              <span className="min-w-0">{label}</span>
              <span aria-hidden="true" className={cn('shrink-0 rounded-full px-1.5 text-xs tabular-nums', stage === id ? 'bg-primary/10' : 'bg-slate-200/70')}>
                {grouped.get(id)?.length ?? 0}
              </span>
            </button>
          ))}
        </div>

        {stages.map(({ id }) => (
          <div key={id} role="tabpanel" id={`surgery-panel-${id}`} aria-labelledby={`surgery-stage-${id}`} hidden={id !== stage} tabIndex={id === stage ? 0 : undefined}>
            {id === stage && (
              <>
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/40 px-4 py-3 @xl:px-6">
                  <div>
                    <h2 className="text-lg font-bold text-on-surface">{activeStage.label}</h2>
                    <p className="text-sm text-slate-600">{activeStage.description}</p>
                  </div>
                  <label className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                    Priority
                    <select value={priority} onChange={(event) => {
                      const value = event.target.value;
                      if (value === 'all' || value === 'emergency' || value === 'mandatory' || value === 'elective') setPriority(value);
                    }} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs focus:ring-2 focus:ring-primary">
                      <option value="all">All priorities</option>
                      <option value="emergency">Emergency</option>
                      <option value="mandatory">Mandatory</option>
                      <option value="elective">Elective</option>
                    </select>
                  </label>
                </header>
                {stageRecords.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-600">
                    <p>No requests in this stage{hasSearch || priority !== 'all' ? ' match your filters' : ''}.</p>
                    {(hasSearch || priority !== 'all') && (
                      <button type="button" className="mt-2 font-semibold text-primary underline" onClick={() => { setPriority('all'); onClearSearch(); }}>
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div role="region" aria-label={`${activeStage.label} table scroll area`} tabIndex={0} className="overflow-x-auto rounded-b-2xl focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-primary">
                    <table aria-label={`${activeStage.label} surgery requests`} className={cn('w-full text-left text-sm', showPlan ? 'min-w-[760px]' : 'min-w-[480px]')}>
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50">
                          {columns.map((column) => (
                            <th key={column} scope="col" className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 @xl:px-6">{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stageRecords.map((record) => {
                          const start = getPlannedStart(record);
                          const end = getExpectedEnd(record);
                          const deadline = parseSolverDate(record.data.endDateTime);
                          const completion = isCompleted
                            ? parseSolverDate(record.runtime?.completedAt) ?? parseSolverDate(record.completionRecordedAt)
                            : null;
                          const canEdit = stage === 'DRAFT' || ((stage === 'PLANNING' || stage === 'PLANNED') && !isSurgeryStarted(record, now));
                          return (
                            <tr key={record.id} className="hover:bg-slate-50/60">
                              <th scope="row" className="px-4 py-3 font-semibold text-on-surface @xl:px-6">
                                <span className="block [overflow-wrap:anywhere]">{record.data.patientName?.trim() || 'Unnamed patient'}</span>
                                <span className="block break-all font-mono text-xs font-normal text-slate-500">{record.referenceCode}</span>
                              </th>
                              <td className="px-4 py-3 text-slate-600 [overflow-wrap:anywhere] @xl:px-6">{record.data.operationType?.trim() || 'Procedure not specified'}</td>
                              <td className="px-4 py-3 @xl:px-6">
                                <span className={cn('rounded-full px-2 py-1 text-xs font-semibold capitalize', priorityStyles[record.data.priority])}>{record.data.priority}</span>
                              </td>
                              {showPlan && (
                                <td className="px-4 py-3 text-slate-600 [overflow-wrap:anywhere] @xl:px-6">
                                  {getAssignedLead(record, catalog)}
                                </td>
                              )}
                              <td className="min-w-[9rem] px-4 py-3 text-xs text-slate-600 @xl:px-6">
                                {isCompleted ? (
                                  completion ? <time dateTime={completion.toISOString()}>{dateTime.format(completion)}</time> : 'Not recorded'
                                ) : showPlan && start && end ? (
                                  <>
                                    <div><span className="font-semibold">Planned start:</span> {dateTime.format(start)}</div>
                                    <div className="mt-1"><span className="font-semibold">Expected end:</span> {dateTime.format(end)}</div>
                                  </>
                                ) : deadline ? (
                                  <div><span className="font-semibold">Requested by:</span> {dateTime.format(deadline)}</div>
                                ) : 'Not set'}
                              </td>
                              <td className="px-4 py-3 @xl:px-6">
                                <div className="flex flex-wrap gap-2 whitespace-nowrap">
                                  <button type="button" onClick={() => onView(record.id)} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/15">
                                    {stage === 'AWAITING_COMPLETION' ? 'Review completion' : stage === 'PLANNED' ? 'View plan' : 'View details'}
                                  </button>
                                  {canEdit && (
                                    <button type="button" onClick={() => onEdit(record.id)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Edit request</button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
