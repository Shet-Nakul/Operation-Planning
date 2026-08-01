import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Stethoscope,
  Bed,
  Wrench,
  Package,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Circle,
  Lock,
  Unlock,
  User,
  MapPin,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../../context/AppStoreContext';
import { cn } from '../../lib/utils';
import type {
  SurgeryRequestRecord,
  LockedResourceEntry,
} from '../../types/surgery';

type ResourceStatus = LockedResourceEntry['status'];

const STATUS_STYLES: Record<ResourceStatus, { label: string; icon: React.ReactNode; dot: string; badge: string }> = {
  'locked': {
    label: 'Locked',
    icon: <Lock className="w-3 h-3" />,
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  'scheduled': {
    label: 'Scheduled',
    icon: <Calendar className="w-3 h-3" />,
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  'in-use': {
    label: 'In Use',
    icon: <Activity className="w-3 h-3" />,
    dot: 'bg-indigo-500 animate-pulse',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  'released': {
    label: 'Released',
    icon: <Unlock className="w-3 h-3" />,
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

const TYPE_META: Record<LockedResourceEntry['type'], { label: string; icon: React.ReactNode; iconBg: string }> = {
  staff: { label: 'Staff', icon: <Users className="w-4 h-4" />, iconBg: 'bg-indigo-100 text-indigo-700' },
  room: { label: 'Room / OR', icon: <Bed className="w-4 h-4" />, iconBg: 'bg-amber-100 text-amber-700' },
  equipment: { label: 'Equipment', icon: <Wrench className="w-4 h-4" />, iconBg: 'bg-purple-100 text-purple-700' },
  device: { label: 'Device', icon: <Stethoscope className="w-4 h-4" />, iconBg: 'bg-teal-100 text-teal-700' },
  supply: { label: 'Supplies', icon: <Package className="w-4 h-4" />, iconBg: 'bg-rose-100 text-rose-700' },
};

type Props = {
  recordId?: string;
  record?: SurgeryRequestRecord;
  view?: 'compact' | 'detailed' | 'full';
  showHeader?: boolean;
  className?: string;
};

function collectAllResources(
  record: SurgeryRequestRecord,
): (LockedResourceEntry & { sourcePhase?: string })[] {
  const direct = (record.lockedResources ?? []).map((r) => ({ ...r }));
  const fromPhases: (LockedResourceEntry & { sourcePhase?: string })[] = [];
  const phaseMap: Record<string, string> = {
    preOp: 'Pre-operative',
    operative: 'Operative',
    postOp: 'Post-operative',
    sterilization: 'Sterilization',
    recovery: 'Recovery',
  };
  (Object.keys(record.data.phases) as (keyof typeof record.data.phases)[]).forEach((phaseKey) => {
    const phase = record.data.phases[phaseKey];
    phase.resources.forEach((res, idx) => {
      const isAllocated = ['PLANNED', 'IN_PROGRESS', 'DONE'].includes(record.status);
      fromPhases.push({
        id: `${record.id}-phase-${phaseKey}-${idx}`,
        name: res.name,
        type: 'staff',
        role: res.roles?.join(', ') || phaseMap[phaseKey] + ' team',
        status:
          record.status === 'DONE'
            ? 'released'
            : record.status === 'IN_PROGRESS'
              ? 'in-use'
              : isAllocated
                ? 'scheduled'
                : 'locked',
        phase: phaseMap[phaseKey],
        count: res.count,
        sourcePhase: phaseMap[phaseKey],
      });
    });
  });
  const plan = record.planResult?.result?.resources_assigned;
  const planResources: (LockedResourceEntry & { sourcePhase?: string })[] = [];
  if (plan && typeof plan === 'object') {
    Object.entries(plan as Record<string, unknown>).forEach(([key, val], idx) => {
      const isRoom = /(room|suite|or_|operating|theatre|theater)/i.test(key);
      const isStaff = /(surgeon|nurse|anesth|staff|role|doctor|physician|tech)/i.test(key);
      const type: LockedResourceEntry['type'] = isRoom ? 'room' : isStaff ? 'staff' : 'equipment';
      let displayName = `Allocated ${key.replace(/_/g, ' ')}`;
      if (Array.isArray(val) && val.length > 0) {
        const first = val[0];
        if (typeof first === 'string') {
          displayName = val.join(', ');
        } else if (first && typeof first === 'object') {
          const anyName = (first as Record<string, unknown>).name;
          displayName = anyName ? String(anyName) : `${val.length} assigned`;
        } else {
          displayName = `${val.length} assigned`;
        }
      } else if (typeof val === 'string') {
        displayName = val;
      } else if (val && typeof val === 'object') {
        const anyName = (val as Record<string, unknown>).name;
        if (anyName) displayName = String(anyName);
      }
      planResources.push({
        id: `${record.id}-plan-${idx}-${key}`,
        name: displayName,
        type,
        role: key.replace(/_/g, ' '),
        status:
          record.status === 'DONE'
            ? 'released'
            : record.status === 'IN_PROGRESS'
              ? 'in-use'
              : 'scheduled',
        phase: 'Solver assignment',
      });
    });
  }
  const merged: Map<string, LockedResourceEntry & { sourcePhase?: string }> = new Map();
  [...direct, ...planResources, ...fromPhases].forEach((r) => {
    const key = `${r.type}|${r.name}|${r.role ?? ''}`;
    if (!merged.has(key)) merged.set(key, r);
  });
  return Array.from(merged.values());
}

export function SurgeryResourceLockStatus({
  recordId,
  record: recordProp,
  view = 'full',
  showHeader = true,
  className,
}: Props) {
  const { store, ongoingSurgeriesDerived, todayScheduleDerived, historyDerived, startSurgery } = useAppStore();

  const singleRecord = useMemo<SurgeryRequestRecord | null>(() => {
    if (recordProp) return recordProp;
    if (recordId) return store.surgeryRequests.find((r) => r.id === recordId) ?? null;
    return null;
  }, [recordProp, recordId, store.surgeryRequests]);

  const records = useMemo<SurgeryRequestRecord[]>(() => {
    if (singleRecord) return [singleRecord];
    return [...ongoingSurgeriesDerived, ...todayScheduleDerived, ...historyDerived].filter(
      (r, i, arr) => arr.findIndex((x) => x.id === r.id) === i,
    );
  }, [singleRecord, ongoingSurgeriesDerived, todayScheduleDerived, historyDerived]);

  const summary = useMemo(() => {
    const counts: Record<ResourceStatus, number> = {
      locked: 0,
      scheduled: 0,
      'in-use': 0,
      released: 0,
    };
    const typeCounts: Record<LockedResourceEntry['type'], number> = {
      staff: 0,
      room: 0,
      equipment: 0,
      device: 0,
      supply: 0,
    };
    records.forEach((r) => {
      collectAllResources(r).forEach((res) => {
        counts[res.status] += 1;
        typeCounts[res.type] += res.count ?? 1;
      });
    });
    const total = counts.locked + counts.scheduled + counts['in-use'] + counts.released;
    return { counts, typeCounts, total };
  }, [records]);

  if (view === 'compact') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {(['in-use', 'scheduled', 'locked', 'released'] as ResourceStatus[]).map((st) =>
          summary.counts[st] > 0 ? (
            <span
              key={st}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold',
                STATUS_STYLES[st].badge,
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_STYLES[st].dot)} />
              {STATUS_STYLES[st].icon}
              <span>{summary.counts[st]}</span>
            </span>
          ) : null,
        )}
        {summary.total === 0 && (
          <span className="text-[11px] font-bold text-slate-400">No resources allocated</span>
        )}
      </div>
    );
  }

  if (view === 'detailed' && singleRecord) {
    return <DetailedSingleView record={singleRecord} showHeader={showHeader} className={className} />;
  }

  return (
    <div className={cn('bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm', className)}>
      {showHeader && (
        <div className="px-6 py-5 border-b border-slate-100 bg-surface-container-lowest/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 font-headline">
                Resource Lock &amp; Schedule Status
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {singleRecord
                  ? `Allocations for ${singleRecord.data.patientName || 'this procedure'}`
                  : `${summary.total} resource${summary.total === 1 ? '' : 's'} across ${records.length} procedure${records.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['in-use', 'scheduled', 'locked', 'released'] as ResourceStatus[]).map((st) => (
              <div
                key={st}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold',
                  STATUS_STYLES[st].badge,
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_STYLES[st].dot)} />
                {STATUS_STYLES[st].icon}
                <span className="uppercase">{STATUS_STYLES[st].label}</span>
                <span className="ml-1 tabular-nums">{summary.counts[st]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="divide-y divide-slate-50">
        {records.length === 0 ? (
          <div className="p-10 text-center">
            <Lock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500 mb-1">No resources currently allocated</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Once surgeries are planned or started, their allocated staff, rooms, and equipment will appear here.
            </p>
          </div>
        ) : (
          records.map((r) => (
            <RecordResourceRow key={r.id} record={r} onStart={() => startSurgery(r.id)} />
          ))
        )}
      </div>
    </div>
  );
}

function RecordResourceRow({
  record,
  onStart,
}: {
  record: SurgeryRequestRecord;
  onStart: () => void;
}) {
  const resources = collectAllResources(record);
  const byType = useMemo(() => {
    const g: Record<LockedResourceEntry['type'], typeof resources> = {
      staff: [],
      room: [],
      equipment: [],
      device: [],
      supply: [],
    };
    resources.forEach((r) => {
      if (!g[r.type]) g[r.type] = [];
      g[r.type].push(r);
    });
    return g;
  }, [resources]);

  const statusBadgeColor =
    record.status === 'IN_PROGRESS'
      ? (record.runtime?.progress ?? 0) >= 100
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
      : record.status === 'PLANNED'
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : record.status === 'DONE'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <div className="px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-base font-bold text-slate-900 truncate">
              {record.data.patientName || 'Unnamed patient'}
            </h3>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              {record.referenceCode}
            </span>
            <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider', statusBadgeColor)}>
              <span className={cn('w-1.5 h-1.5 rounded-full',
                record.status === 'IN_PROGRESS' ? 'bg-indigo-500 animate-pulse' :
                record.status === 'PLANNED' ? 'bg-blue-500' :
                record.status === 'DONE' ? 'bg-emerald-500' : 'bg-slate-400'
              )} />
              {record.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {record.data.operationType || 'Procedure'}
            {record.data.primarySurgeon ? ` • Lead: ${record.data.primarySurgeon}` : ''}
            {record.runtime?.assignedOr ? ` • ${record.runtime.assignedOr}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {record.status === 'PLANNED' && (
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" /> Start &amp; lock
            </button>
          )}
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="px-4 py-3 rounded-lg bg-slate-50/50 text-center">
          <p className="text-xs font-bold text-slate-400">No resource allocations yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {(Object.keys(byType) as (LockedResourceEntry['type'])[]).map((type) => {
            const items = byType[type];
            if (items.length === 0) return null;
            return (
              <div
                key={type}
                className="rounded-xl border border-slate-100 bg-slate-50/40 p-3"
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', TYPE_META[type].iconBg)}>
                    {TYPE_META[type].icon}
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {TYPE_META[type].label}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">
                      {items.reduce((acc, r) => acc + (r.count ?? 1), 0)} allocated
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {items.map((r) => (
                    <ResourceChip key={r.id} resource={r} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResourceChip({ resource }: { resource: LockedResourceEntry & { sourcePhase?: string } }) {
  const st = STATUS_STYLES[resource.status];
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-100 hover:shadow-sm transition-shadow">
      <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', st.dot)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-xs font-bold text-slate-800 truncate">{resource.name}</p>
          {resource.count && resource.count > 1 && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              ×{resource.count}
            </span>
          )}
        </div>
        {(resource.role || resource.phase) && (
          <p className="text-[10px] text-slate-500 truncate mt-0.5">
            {resource.role || ''}
            {resource.role && resource.phase ? ' • ' : ''}
            {resource.phase || ''}
          </p>
        )}
      </div>
    </div>
  );
}

function DetailedSingleView({
  record,
  showHeader,
  className,
}: {
  record: SurgeryRequestRecord;
  showHeader: boolean;
  className?: string;
}) {
  const resources = collectAllResources(record);
  const counts: Record<ResourceStatus, number> = { locked: 0, scheduled: 0, 'in-use': 0, released: 0 };
  resources.forEach((r) => counts[r.status]++);

  return (
    <div className={cn('rounded-2xl border border-slate-100 bg-white overflow-hidden', className)}>
      {showHeader && (
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
              <Lock className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-indigo-600">Resource allocations</p>
              <p className="text-sm font-bold text-slate-900">
                {resources.length} item{resources.length === 1 ? '' : 's'} locked or scheduled
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {(['in-use', 'scheduled', 'locked', 'released'] as ResourceStatus[]).map(
              (st) =>
                counts[st] > 0 && (
                  <span
                    key={st}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-bold',
                      STATUS_STYLES[st].badge,
                    )}
                  >
                    {STATUS_STYLES[st].icon} {counts[st]}
                  </span>
                ),
            )}
          </div>
        </div>
      )}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {resources.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-white hover:shadow-sm transition-all"
          >
            <span className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', TYPE_META[r.type].iconBg)}>
              {TYPE_META[r.type].icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-bold text-slate-800 truncate">{r.name}</p>
                {r.count && r.count > 1 && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                    ×{r.count}
                  </span>
                )}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider',
                    STATUS_STYLES[r.status].badge,
                  )}
                >
                  <span className={cn('w-1 h-1 rounded-full', STATUS_STYLES[r.status].dot)} />
                  {STATUS_STYLES[r.status].label}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                {[r.role, r.phase].filter(Boolean).join(' • ') || TYPE_META[r.type].label}
              </p>
            </div>
          </div>
        ))}
        {resources.length === 0 && (
          <div className="md:col-span-2 p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
            <Unlock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">No allocations</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Submit this request for planning to lock resources.</p>
          </div>
        )}
      </div>
    </div>
  );
}
