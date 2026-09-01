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
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../../context/AppStoreContext';
import { cn } from '../../lib/utils';
import { useResourceCatalog } from '../../hooks/useResourceCatalog';
import {
  resolveAssignedResource,
  toNavigationPayload,
  type ResolvedAssignedResource,
  type ResourceCatalog,
} from '../../lib/resolveAssignedResource';
import type {
  SurgeryRequestRecord,
  LockedResourceEntry,
  ResourceNavigationPayload,
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
  /** Callback when a resource is clicked for navigation */
  onNavigateToResource?: (payload: ResourceNavigationPayload) => void;
};

/** Extended resource entry with additional metadata for navigation */
type ExtendedResourceEntry = LockedResourceEntry & {
  sourcePhase?: string;
  /** Staff ID extracted from plan result */
  staffId?: string;
  /** Pool ID for pool-based assignments */
  poolId?: string;
  /** Whether this is a human resource (staff) vs equipment/room */
  isHumanResource?: boolean;
  /** Raw assignment data for tooltip/debug */
  rawAssignment?: unknown;
  resolved?: ResolvedAssignedResource | null;
};

function collectAllResources(
  record: SurgeryRequestRecord,
  catalog?: ResourceCatalog,
): ExtendedResourceEntry[] {
  const direct = (record.lockedResources ?? []).map((r) => ({ ...r } as ExtendedResourceEntry));
  const fromPhases: ExtendedResourceEntry[] = [];
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
      // Check if this resource has assignments
      const assignments = res.assignments ?? [];
      if (assignments.length > 0) {
        // Create an entry for each assignment
        assignments.forEach((assignment, assignIdx) => {
          const isPool = assignment.type === 'pool';
          fromPhases.push({
            id: `${record.id}-phase-${phaseKey}-${idx}-assign-${assignIdx}`,
            name: assignment.name,
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
            count: 1,
            sourcePhase: phaseMap[phaseKey],
            staffId: isPool ? undefined : assignment.id,
            poolId: assignment.poolId,
            isHumanResource: true,
          });
        });
      } else {
        // No specific assignments, show generic resource requirement
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
          isHumanResource: true,
        });
      }
    });
  });
  const plan = record.planResult?.result?.resources_assigned;
  const planResources: ExtendedResourceEntry[] = [];
  if (plan && typeof plan === 'object') {
    Object.entries(plan as Record<string, unknown>).forEach(([key, val], idx) => {
      const isRoom = /(room|suite|or_|operating|theatre|theater)/i.test(key);
      const isStaff = /(surgeon|nurse|anesth|staff|role|doctor|physician|tech)/i.test(key);
      const type: LockedResourceEntry['type'] = isRoom ? 'room' : isStaff ? 'staff' : 'equipment';
      const isHumanResource = isStaff;

      // Helper to extract resource ID and name from assignment object
      const extractResourceInfo = (item: unknown): { id: string; name: string; poolId?: string } | null => {
        if (typeof item === 'string') return { id: item, name: item };
        if (typeof item === 'number') return { id: String(item), name: String(item) };
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>;
          const idKeys = [
            'id', 'staffId', 'staff_id', 'employeeId', 'employee_id', 
            'resourceId', 'resource_id', 'unit_id', 'unitId', 
            'pool_id', 'poolId', 'assigned', 'assignedTo', 'assigned_to',
            'member_id', 'memberId', 'assigned_unit_id',
          ];
          const nameKeys = ['name', 'staffName', 'staff_name', 'displayName', 'display_name', 'fullName', 'full_name', 'employeeName', 'employee_name'];
          const poolIdKeys = ['pool_id', 'poolId', 'resourcePoolId', 'resource_pool_id'];
          
          let resourceId = '';
          let resourceName = '';
          let poolId = '';
          
          for (const k of idKeys) {
            if (obj[k] && typeof obj[k] === 'string') { resourceId = obj[k] as string; break; }
            if (obj[k] && typeof obj[k] === 'number') { resourceId = String(obj[k]); break; }
          }
          for (const k of nameKeys) {
            if (obj[k] && typeof obj[k] === 'string') { resourceName = obj[k] as string; break; }
          }
          for (const k of poolIdKeys) {
            if (obj[k] && typeof obj[k] === 'string') { poolId = obj[k] as string; break; }
          }
          
          if (resourceId || resourceName) {
            return { id: resourceId || resourceName, name: resourceName || resourceId, poolId: poolId || undefined };
          }
        }
        return null;
      };

      if (Array.isArray(val) && val.length > 0) {
        // Multiple resources assigned - create individual entries
        val.forEach((item, itemIdx) => {
          const info = extractResourceInfo(item);
          if (info) {
            planResources.push({
              id: `${record.id}-plan-${idx}-${key}-${itemIdx}`,
              name: info.name,
              type,
              role: key.replace(/_/g, ' '),
              status:
                record.status === 'DONE'
                  ? 'released'
                  : record.status === 'IN_PROGRESS'
                    ? 'in-use'
                    : 'scheduled',
              phase: 'Solver assignment',
              staffId: isHumanResource ? info.id : undefined,
              poolId: info.poolId || (isRoom || !isHumanResource ? info.id : undefined),
              isHumanResource,
              rawAssignment: item,
            });
          } else {
            // Fallback for unrecognized format
            const displayName = typeof item === 'string' ? item : `Assigned ${key.replace(/_/g, ' ')}`;
            planResources.push({
              id: `${record.id}-plan-${idx}-${key}-${itemIdx}`,
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
              isHumanResource,
              rawAssignment: item,
            });
          }
        });
      } else {
        // Single resource or object
        const info = extractResourceInfo(val);
        const displayName = info?.name || (typeof val === 'string' ? val : `Allocated ${key.replace(/_/g, ' ')}`);
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
          staffId: isHumanResource && info ? info.id : undefined,
          poolId: info?.poolId || (isRoom || !isHumanResource ? info?.id : undefined),
          isHumanResource,
          rawAssignment: val,
        });
      }
    });
  }
  const merged: Map<string, ExtendedResourceEntry> = new Map();
  [...direct, ...planResources, ...fromPhases].forEach((r) => {
    const key = `${r.type}|${r.name}|${r.role ?? ''}|${r.staffId ?? ''}|${r.poolId ?? ''}`;
    if (!merged.has(key)) merged.set(key, r);
  });
  return Array.from(merged.values()).map((r) => {
    if (!catalog) return r;
    const resolved = resolveAssignedResource(
      [r.staffId, r.poolId, r.name],
      `${r.role ?? ''} ${r.type ?? ''}`,
      catalog,
    );
    if (!resolved) return r;
    const type: LockedResourceEntry['type'] =
      resolved.kind === 'staff' || resolved.kind === 'hr-pool'
        ? 'staff'
        : resolved.navigationType === 'room'
          ? 'room'
          : resolved.navigationType === 'device'
            ? 'device'
            : 'equipment';
    return {
      ...r,
      name: resolved.displayName,
      type,
      staffId: resolved.kind === 'staff' ? resolved.resourceId : r.staffId,
      poolId: resolved.kind === 'staff' ? r.poolId : resolved.resourceId,
      isHumanResource: resolved.kind === 'staff' || resolved.kind === 'hr-pool',
      resolved,
    };
  });
}

export function SurgeryResourceLockStatus({
  recordId,
  record: recordProp,
  view = 'full',
  showHeader = true,
  className,
  onNavigateToResource,
}: Props) {
  const { store, ongoingSurgeriesDerived, todayScheduleDerived, historyDerived, startSurgery } = useAppStore();
  const resourceCatalog = useResourceCatalog();

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
      collectAllResources(r, resourceCatalog).forEach((res) => {
        counts[res.status] += 1;
        typeCounts[res.type] += res.count ?? 1;
      });
    });
    const total = counts.locked + counts.scheduled + counts['in-use'] + counts.released;
    return { counts, typeCounts, total };
  }, [records, resourceCatalog]);

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
    return (
      <DetailedSingleView
        record={singleRecord}
        showHeader={showHeader}
        className={className}
        onNavigateToResource={onNavigateToResource}
        catalog={resourceCatalog}
      />
    );
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
            <RecordResourceRow
              key={r.id}
              record={r}
              onStart={() => startSurgery(r.id)}
              onNavigateToResource={onNavigateToResource}
              catalog={resourceCatalog}
            />
          ))
        )}
      </div>
    </div>
  );
}

function RecordResourceRow({
  record,
  onStart,
  onNavigateToResource,
  catalog,
}: {
  record: SurgeryRequestRecord;
  onStart: () => void;
  onNavigateToResource?: (payload: ResourceNavigationPayload) => void;
  catalog: ResourceCatalog;
}) {
  const resources = collectAllResources(record, catalog);
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

  // Extract surgery time info for navigation
  const surgeryStartTime = record.planResult?.result?.planned_start as string | undefined;
  const surgeryReference = record.referenceCode;

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
                    <ResourceChip
                      key={r.id}
                      resource={r}
                      onNavigateToResource={onNavigateToResource}
                      surgeryStartTime={surgeryStartTime}
                      surgeryReference={surgeryReference}
                    />
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

function ResourceChip({
  resource,
  onNavigateToResource,
  surgeryStartTime,
  surgeryReference,
}: {
  resource: ExtendedResourceEntry;
  onNavigateToResource?: (payload: ResourceNavigationPayload) => void;
  surgeryStartTime?: string;
  surgeryReference?: string;
}) {
  const st = STATUS_STYLES[resource.status];
  const resolved = resource.resolved;
  const displayName = resolved?.displayName || resource.name;
  const displayTitle = resolved?.subtitle || '';
  const isNavigable = Boolean(onNavigateToResource && resolved);

  const handleClick = () => {
    if (!onNavigateToResource || !resolved) return;
    onNavigateToResource(toNavigationPayload(resolved, {
      role: resource.role,
      surgeryStartTime,
      surgeryReference,
      phase: resource.phase,
    }));
  };

  const Wrapper = isNavigable ? 'button' : 'div';

  return (
    <Wrapper
      type={isNavigable ? 'button' : undefined}
      onClick={isNavigable ? handleClick : undefined}
      className={cn(
        'flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-100 transition-all w-full text-left',
        isNavigable && 'hover:shadow-md hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer group',
        !isNavigable && 'hover:shadow-sm',
      )}
      title={resolved ? `${displayName}${displayTitle ? ` — ${displayTitle}` : ''}` : undefined}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', st.dot)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className={cn(
            'text-xs font-bold truncate',
            isNavigable ? 'text-indigo-700 group-hover:text-indigo-800' : 'text-slate-800',
          )}>
            {displayName}
          </p>
          {displayTitle && (
            <span className="text-[10px] text-slate-500 font-normal">({displayTitle})</span>
          )}
          {resource.count && resource.count > 1 && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              ×{resource.count}
            </span>
          )}
          {isNavigable && (
            <ExternalLink className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
    </Wrapper>
  );
}

function DetailedSingleView({
  record,
  showHeader,
  className,
  onNavigateToResource,
  catalog,
}: {
  record: SurgeryRequestRecord;
  showHeader: boolean;
  className?: string;
  onNavigateToResource?: (payload: ResourceNavigationPayload) => void;
  catalog: ResourceCatalog;
}) {
  const resources = collectAllResources(record, catalog);
  const counts: Record<ResourceStatus, number> = { locked: 0, scheduled: 0, 'in-use': 0, released: 0 };
  resources.forEach((r) => counts[r.status]++);

  const surgeryStartTime = record.planResult?.result?.planned_start as string | undefined;
  const surgeryReference = record.referenceCode;

  const handleResourceClick = (r: ExtendedResourceEntry) => {
    if (!onNavigateToResource || !r.resolved) return;
    onNavigateToResource(toNavigationPayload(r.resolved, {
      role: r.role,
      surgeryStartTime,
      surgeryReference,
      phase: r.phase,
    }));
  };

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
        {resources.map((r) => {
          const displayName = r.resolved?.displayName || r.name;
          const displayTitle = r.resolved?.subtitle || '';
          const isNavigable = Boolean(onNavigateToResource && r.resolved);
          const typeMeta = TYPE_META[r.type] ?? TYPE_META.equipment;
          const Wrapper = isNavigable ? 'button' : 'div';

          return (
            <Wrapper
              key={r.id}
              type={isNavigable ? 'button' : undefined}
              onClick={isNavigable ? () => handleResourceClick(r) : undefined}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl bg-slate-50/60 border border-slate-100 transition-all w-full text-left',
                isNavigable && 'hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-md cursor-pointer group',
                !isNavigable && 'hover:bg-white hover:shadow-sm',
              )}
              title={r.resolved ? `${displayName}${displayTitle ? ` — ${displayTitle}` : ''}` : undefined}
            >
              <span className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', typeMeta.iconBg)}>
                {typeMeta.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={cn(
                    'text-xs font-bold truncate',
                    isNavigable ? 'text-indigo-700 group-hover:text-indigo-800' : 'text-slate-800',
                  )}>
                    {displayName}
                  </p>
                  {displayTitle && (
                    <span className="text-[10px] text-slate-500 font-normal">({displayTitle})</span>
                  )}
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
                  {isNavigable && (
                    <ExternalLink className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                  {[r.role, r.phase].filter(Boolean).join(' • ') || typeMeta.label}
                </p>
              </div>
            </Wrapper>
          );
        })}
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
