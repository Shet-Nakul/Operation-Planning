import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronRight,
  History,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  User,
  X,
  Calendar,
  Ban,
  Clock,
} from 'lucide-react';
import {
  addRenewableResourceUnitsToPool,
  getRenewableResourcePoolById,
  updateRenewableResourcePoolWeeklyTemplate,
  updateRenewableResourceUnit,
  type RenewableResourceWeeklyTemplate,
  type BlockBooking,
  type WeeklyBlockBooking,
  type DateRangeBlockBooking,
  type BlockBookingDay,
  type ServerRenewableResourceUnit,
} from '../../lib/api';
import { ResourcePoolDetail, UnitStatus } from './types';

interface PoolDetailsViewProps {
  poolId: string;
  onBack: () => void;
  initialUnitId?: string | null;
}

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

type DayRangeInput = { start: string; end: string };

type DayTemplateInput = {
  enabled: boolean;
  ranges: DayRangeInput[];
};

const DAY_KEYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => Number(n));
  return h * 60 + m;
}

function buildDraftFromTemplate(input: RenewableResourceWeeklyTemplate | null | undefined): Record<DayKey, DayTemplateInput> {
  const result = {} as Record<DayKey, DayTemplateInput>;
  for (const day of DAY_KEYS) {
    const hours = (input as any)?.[day]?.hours;
    const ranges = Array.isArray(hours)
      ? hours
          .filter((h: any) => Array.isArray(h) && h.length === 2)
          .map((h: any) => ({ start: String(h[0] ?? ''), end: String(h[1] ?? '') }))
      : [];
    result[day] = {
      enabled: ranges.length > 0,
      ranges: ranges.length > 0 ? ranges : [{ start: '08:00', end: '17:00' }],
    };
  }
  return result;
}

function validateAndBuildWeeklyTemplate(
  draft: Record<DayKey, DayTemplateInput>,
): { weekly_template: RenewableResourceWeeklyTemplate; error: string | null } {
  const weekly_template: RenewableResourceWeeklyTemplate = {};

  for (const day of DAY_KEYS) {
    const dayDraft = draft[day];
    if (!dayDraft?.enabled) continue;

    const ranges = dayDraft.ranges
      .map((r) => ({ start: String(r.start || '').trim(), end: String(r.end || '').trim() }))
      .filter((r) => r.start && r.end);
    const normalizedForSort: Array<{ start: string; end: string; startMin: number; endMin: number }> = [];

    for (const range of ranges) {
      if (!TIME_PATTERN.test(range.start) || !TIME_PATTERN.test(range.end)) {
        return { weekly_template: {}, error: `Invalid time format on ${day}. Use HH:mm.` };
      }
      const startMin = toMinutes(range.start);
      const endMin = toMinutes(range.end);
      if (startMin >= endMin) {
        return { weekly_template: {}, error: `Start time must be before end time on ${day}.` };
      }
      normalizedForSort.push({ ...range, startMin, endMin });
    }

    normalizedForSort.sort((a, b) => a.startMin - b.startMin);
    for (let i = 1; i < normalizedForSort.length; i++) {
      if (normalizedForSort[i].startMin < normalizedForSort[i - 1].endMin) {
        return { weekly_template: {}, error: `Overlapping time ranges on ${day}.` };
      }
    }

    weekly_template[day] = {
      hours: normalizedForSort.map((r) => [r.start, r.end]),
    };
  }

  return { weekly_template, error: null };
}

const statusColor = (status: UnitStatus) => {
  const s = String(status || '').toUpperCase();
  if (s === 'AVAILABLE') return { bg: 'bg-white', border: 'border-teal-700', text: 'text-slate-400', icon: 'teal' as const, pill: 'bg-teal-100 text-teal-700 border-teal-200' };
  if (s === 'IN_USE') return { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-600', icon: 'red' as const, pill: 'bg-red-100 text-red-700 border-red-200' };
  if (s === 'MAINTENANCE') return { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700', icon: 'amber' as const, pill: 'bg-amber-100 text-amber-700 border-amber-200' };
  if (s === 'RESERVED') return { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-600', icon: 'indigo' as const, pill: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
  if (s === 'BLOCKED') return { bg: 'bg-slate-200', border: 'border-slate-500', text: 'text-slate-700', icon: 'slate' as const, pill: 'bg-slate-200 text-slate-700 border-slate-300' };
  return { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-500', icon: 'slate' as const, pill: 'bg-slate-100 text-slate-600 border-slate-200' };
};

type WeeklyBlockDraft = { start: string; end: string; reason: string };
type UnitWeeklyDraft = Record<BlockBookingDay, WeeklyBlockDraft[]>;

const BLOCK_BOOKING_DAYS: BlockBookingDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function emptyWeeklyDraft(): UnitWeeklyDraft {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };
}

function buildWeeklyDraftFromBlockBookings(bbs: BlockBooking[] | null | undefined): UnitWeeklyDraft {
  const draft = emptyWeeklyDraft();
  if (!Array.isArray(bbs)) return draft;
  for (const bb of bbs) {
    if (bb.type === 'weekly') {
      draft[bb.day].push({ start: bb.start, end: bb.end, reason: bb.reason ?? '' });
    }
  }
  return draft;
}

function extractDateRangeBlocks(bbs: BlockBooking[] | null | undefined): DateRangeBlockBooking[] {
  if (!Array.isArray(bbs)) return [];
  return bbs.filter((bb): bb is DateRangeBlockBooking => bb.type === 'date_range');
}

function validateBlockDrafts(draft: UnitWeeklyDraft): string | null {
  for (const day of BLOCK_BOOKING_DAYS) {
    for (const r of draft[day]) {
      if (!TIME_PATTERN.test(r.start) || !TIME_PATTERN.test(r.end)) {
        return `Invalid time format on ${day}. Use HH:mm.`;
      }
      if (toMinutes(r.start) >= toMinutes(r.end)) {
        return `Start time must be before end time on ${day}.`;
      }
    }
    const sorted = draft[day]
      .map((r) => ({ ...r, s: toMinutes(r.start), e: toMinutes(r.end) }))
      .sort((a, b) => a.s - b.s);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].s < sorted[i - 1].e) {
        return `Overlapping weekly blocks on ${day}.`;
      }
    }
  }
  return null;
}

export const PoolDetailsView = ({ poolId, onBack, initialUnitId }: PoolDetailsViewProps) => {
  const [detail, setDetail] = useState<ResourcePoolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingUnits, setAddingUnits] = useState(false);
  const [addPrefix, setAddPrefix] = useState('');
  const [addCount, setAddCount] = useState<number>(1);
  const [addVariant, setAddVariant] = useState<string>('STANDARD');
  const [weeklyTemplateDraft, setWeeklyTemplateDraft] = useState<Record<DayKey, DayTemplateInput>>(() =>
    buildDraftFromTemplate(undefined),
  );
  const [savingWeeklyTemplate, setSavingWeeklyTemplate] = useState(false);

  // ── Per-unit detail drawer ────────────────────────────────────────────
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [unitStatusDraft, setUnitStatusDraft] = useState<UnitStatus>('AVAILABLE');
  const [unitWeeklyDraft, setUnitWeeklyDraft] = useState<UnitWeeklyDraft>(emptyWeeklyDraft());
  const [unitDateRangeBlocks, setUnitDateRangeBlocks] = useState<DateRangeBlockBooking[]>([]);
  const [savingUnit, setSavingUnit] = useState(false);

  const selectedUnit = useMemo<ServerRenewableResourceUnit | null>(() => {
    if (!selectedUnitId || !detail) return null;
    const found = detail.units.find((u) => u.unit_id === selectedUnitId);
    return found ? (found as ServerRenewableResourceUnit) : null;
  }, [selectedUnitId, detail]);

  const [utilizationPct, occupancy] = useMemo<[
    number,
    { inUse: number; reservedOrBlocked: number; available: number; total: number },
  ]>(() => {
    if (!detail || !Array.isArray(detail.units)) {
      return [0, { inUse: 0, reservedOrBlocked: 0, available: 0, total: 0 }];
    }
    const counts = { AVAILABLE: 0, IN_USE: 0, MAINTENANCE: 0, RESERVED: 0, BLOCKED: 0 };
    for (const u of detail.units) {
      const key = String((u as any).current_status ?? u.status ?? '').toUpperCase();
      if (
        key === 'AVAILABLE' ||
        key === 'IN_USE' ||
        key === 'MAINTENANCE' ||
        key === 'RESERVED' ||
        key === 'BLOCKED'
      ) {
        counts[key as keyof typeof counts] = (counts[key as keyof typeof counts] ?? 0) + 1;
      }
    }
    const total = detail.units.length;
    const inUse = counts.IN_USE;
    const reservedOrBlocked = counts.RESERVED + counts.BLOCKED;
    const available = counts.AVAILABLE;
    const denom = total > 0 ? total : 1;
    const utilization = Math.round((inUse / denom) * 100);
    return [utilization, { inUse, reservedOrBlocked, available, total }];
  }, [detail]);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await getRenewableResourcePoolById(poolId);
      setDetail(d as any);
      setWeeklyTemplateDraft(buildDraftFromTemplate((d as any)?.weekly_template));
      const metaPrefix = String((d as any)?.metadata?.unit_prefix ?? '');
      setAddPrefix(metaPrefix);
    } catch (e: any) {
      setError(String(e?.message ?? 'Failed to load pool'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload().catch(() => {});
  }, [poolId]);

  useEffect(() => {
    if (!detail || !initialUnitId) return;
    const exists = detail.units?.some((u) => u.unit_id === initialUnitId);
    if (exists) setSelectedUnitId(initialUnitId);
  }, [detail, initialUnitId]);

  // Sync drafts into drawer fields whenever selection changes
  useEffect(() => {
    if (!selectedUnit) return;
    setUnitStatusDraft(selectedUnit.status);
    setUnitWeeklyDraft(buildWeeklyDraftFromBlockBookings(selectedUnit.block_bookings));
    setUnitDateRangeBlocks(extractDateRangeBlocks(selectedUnit.block_bookings));
  }, [selectedUnit?.unit_id]);

  const openUnitDrawer = (unitId: string) => {
    setSelectedUnitId(unitId);
  };

  const closeUnitDrawer = () => {
    setSelectedUnitId(null);
  };

  const addWeeklyBlock = (day: BlockBookingDay) => {
    setUnitWeeklyDraft((prev) => ({
      ...prev,
      [day]: [...prev[day], { start: '08:00', end: '17:00', reason: '' }],
    }));
  };

  const updateWeeklyBlock = (day: BlockBookingDay, idx: number, field: 'start' | 'end' | 'reason', value: string) => {
    setUnitWeeklyDraft((prev) => {
      const rows = prev[day].slice();
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...prev, [day]: rows };
    });
  };

  const removeWeeklyBlock = (day: BlockBookingDay, idx: number) => {
    setUnitWeeklyDraft((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== idx),
    }));
  };

  const addDateRangeBlock = () => {
    const today = new Date();
    const iso = (d: Date) => d.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    setUnitDateRangeBlocks((prev) => [
      ...prev,
      { type: 'date_range', from: iso(today), to: iso(tomorrow), reason: '' },
    ]);
  };

  const updateDateRangeBlock = (idx: number, field: 'from' | 'to' | 'reason', value: string) => {
    setUnitDateRangeBlocks((prev) => {
      const rows = prev.slice();
      rows[idx] = { ...rows[idx], [field]: value };
      return rows;
    });
  };

  const removeDateRangeBlock = (idx: number) => {
    setUnitDateRangeBlocks((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveUnitChanges = async () => {
    if (!selectedUnit) return;
    const verr = validateBlockDrafts(unitWeeklyDraft);
    if (verr) {
      setError(verr);
      return;
    }
    for (const dr of unitDateRangeBlocks) {
      if (!dr.from || !dr.to) {
        setError('All date range blocks require both From and To dates.');
        return;
      }
      if (dr.from > dr.to) {
        setError('Date range "From" must be before "To".');
        return;
      }
    }

    const weeklyBlocks: WeeklyBlockBooking[] = [];
    for (const day of BLOCK_BOOKING_DAYS) {
      for (const r of unitWeeklyDraft[day]) {
        if (r.start && r.end) {
          const bb: WeeklyBlockBooking = { type: 'weekly', day, start: r.start, end: r.end };
          if (r.reason.trim()) bb.reason = r.reason.trim();
          weeklyBlocks.push(bb);
        }
      }
    }
    const block_bookings: BlockBooking[] = [...weeklyBlocks, ...unitDateRangeBlocks];

    setSavingUnit(true);
    setError(null);
    try {
      await updateRenewableResourceUnit(selectedUnit.unit_id, {
        status: unitStatusDraft,
        block_bookings,
      });
      closeUnitDrawer();
      await reload();
    } catch (e: any) {
      setError(String(e?.message ?? 'Unit update failed'));
    } finally {
      setSavingUnit(false);
    }
  };

  const onAddUnits = async () => {
    if (!detail) return;
    const count = Math.floor(addCount);
    if (!Number.isFinite(count) || count <= 0) {
      setError('Units to add must be a positive number.');
      return;
    }
    const prefix = (addPrefix || String(detail.metadata?.unit_prefix || '') || String(detail.resource_type)).trim();
    if (!prefix) {
      setError('Unit prefix is required to generate unit IDs.');
      return;
    }

    const parseSuffix = (id: string) => {
      const parts = id.split('-');
      const last = parts[parts.length - 1] ?? '';
      const n = Number(last);
      return Number.isFinite(n) ? n : null;
    };

    const maxSuffix = detail.units.reduce((mx, u) => {
      const n = parseSuffix(String(u.unit_id));
      if (n === null) return mx;
      return Math.max(mx, n);
    }, 0);

    const units = Array.from({ length: count }, (_, i) => {
      const n = maxSuffix + 1 + i;
      return {
        unit_id: `${prefix}-${String(n).padStart(2, '0')}`,
        status: 'AVAILABLE' as const,
        variant: addVariant.trim() ? addVariant.trim() : 'STANDARD',
      };
    });

    setAddingUnits(true);
    setError(null);
    try {
      await addRenewableResourceUnitsToPool(poolId, { units });
      await reload();
    } catch (e: any) {
      setError(String(e?.message ?? 'Add units failed'));
    } finally {
      setAddingUnits(false);
    }
  };

  const labelForDay = (day: DayKey) => day[0].toUpperCase() + day.slice(1);

  const toggleDay = (day: DayKey) => {
    setWeeklyTemplateDraft((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  const updateRange = (day: DayKey, idx: number, field: 'start' | 'end', value: string) => {
    setWeeklyTemplateDraft((prev) => {
      const dayData = prev[day];
      const ranges = dayData.ranges.slice();
      ranges[idx] = { ...ranges[idx], [field]: value };
      return {
        ...prev,
        [day]: {
          ...dayData,
          ranges,
        },
      };
    });
  };

  const addRange = (day: DayKey) => {
    setWeeklyTemplateDraft((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        ranges: [...prev[day].ranges, { start: '08:00', end: '17:00' }],
      },
    }));
  };

  const removeRange = (day: DayKey, idx: number) => {
    setWeeklyTemplateDraft((prev) => {
      const currentRanges = prev[day].ranges;
      const nextRanges = currentRanges.filter((_, i) => i !== idx);
      return {
        ...prev,
        [day]: {
          ...prev[day],
          ranges: nextRanges.length > 0 ? nextRanges : [{ start: '08:00', end: '17:00' }],
        },
      };
    });
  };

  const saveWeeklyTemplate = async () => {
    const result = validateAndBuildWeeklyTemplate(weeklyTemplateDraft);
    if (result.error) {
      setError(result.error);
      return;
    }

    setSavingWeeklyTemplate(true);
    setError(null);
    try {
      await updateRenewableResourcePoolWeeklyTemplate(poolId, { weekly_template: result.weekly_template });
      await reload();
    } catch (e: any) {
      setError(String(e?.message ?? 'Weekly template update failed'));
    } finally {
      setSavingWeeklyTemplate(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-8 lg:p-12 overflow-y-auto pb-32"
    >
      <div className="max-w-7xl mx-auto">
        {error ? (
          <div className="mb-8 bg-white border border-red-200 text-red-700 font-semibold text-sm rounded-xl px-5 py-4">
            {error}
          </div>
        ) : null}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-8">
          <div>
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <button onClick={onBack} className="hover:text-blue-700 transition-colors">Resources</button>
              <ChevronRight size={14} />
              <span className="text-blue-700 font-semibold">{detail?.pool_name || poolId} Pool</span>
            </nav>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Pool Management</h1>
          </div>
          <div className="flex gap-12">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Current Occupancy</p>
              <div className="flex items-baseline justify-end gap-2">
                <span className="text-5xl font-black text-blue-700">{occupancy.inUse}</span>
                <span className="text-2xl text-slate-400">/ {occupancy.total || '—'}</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 mt-1 tracking-wide">
                Units currently IN_USE
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Utilization Rate</p>
              <span className="text-5xl font-black text-teal-700">{utilizationPct}%</span>
              <p className="text-[11px] font-semibold text-slate-400 mt-1 tracking-wide">
                IN_USE ÷ total units in grid
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-12 lg:col-span-8 self-start space-y-6">
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Unit Inventory</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Click a unit to view its details and configure its weekly availability blocks.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-teal-700"></span>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span>In Use</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span>Maintenance</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                    <span>Reserved</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-500"></span>
                    <span>Blocked</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3 min-h-[7.5rem]">
                {loading ? (
                  <div className="col-span-full text-sm text-slate-500 font-semibold">Loading units…</div>
                ) : null}
                {!loading && detail?.units?.length ? null : !loading ? (
                  <div className="col-span-full text-sm text-slate-500 font-semibold">No units found in this pool.</div>
                ) : null}
                {(detail?.units ?? []).map((unit) => {
                  const liveStatus = ((unit as any).current_status ?? unit.status) as UnitStatus;
                  const hasBlocks = Array.isArray((unit as any).block_bookings) && (unit as any).block_bookings.length > 0;
                  const c = statusColor(liveStatus);
                  return (
                  <div
                    key={unit.unit_id}
                    onClick={() => openUnitDrawer(unit.unit_id)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center border-b-2 shadow-sm transition-all hover:scale-105 cursor-pointer relative ${c.bg} ${c.border}`}
                    title={`${unit.unit_id} — Live: ${liveStatus}${hasBlocks ? ' (has blocks)' : ''}`}
                  >
                    {hasBlocks ? (
                      <Ban size={10} className="absolute top-1 right-1 text-slate-500/70" />
                    ) : null}
                    <span className={`text-[10px] font-bold ${c.text}`}>
                      {unit.unit_id}
                    </span>
                    {String(liveStatus || '').toUpperCase() === 'AVAILABLE' ? (
                      <CheckCircle2 size={16} className="text-teal-700" />
                    ) : String(liveStatus || '').toUpperCase() === 'MAINTENANCE' ? (
                      <RefreshCw size={16} className="text-amber-600" />
                    ) : String(liveStatus || '').toUpperCase() === 'RESERVED' ? (
                      <Clock size={16} className="text-indigo-600" />
                    ) : String(liveStatus || '').toUpperCase() === 'BLOCKED' ? (
                      <Ban size={16} className="text-slate-600" />
                    ) : (
                      <User size={16} className="text-red-500 fill-red-500" />
                    )}
                  </div>
                )})}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Add Units to Pool</h3>
              <p className="text-xs text-slate-500 -mt-3 mb-5">
                New units will be numbered sequentially after the highest existing suffix in this pool.
              </p>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Prefix</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
                    value={addPrefix}
                    onChange={(e) => setAddPrefix(e.target.value)}
                    placeholder="e.g., ICU"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Count</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
                    type="number"
                    min={1}
                    value={String(addCount)}
                    onChange={(e) => setAddCount(Number(e.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Variant</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
                    value={addVariant}
                    onChange={(e) => setAddVariant(e.target.value)}
                    placeholder="STANDARD"
                  />
                </div>
              </div>
              <button
                disabled={addingUnits || loading}
                onClick={onAddUnits}
                className="mt-6 w-full bg-blue-700 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors shadow-md active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {addingUnits ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Adding…
                  </>
                ) : (
                  '+ Add Units'
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Weekly Availability Template</h3>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-[140px_100px_1fr] gap-4 px-5 py-2.5 border-b border-slate-200 bg-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Day</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Status</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Hours</span>
            </div>
            <div className="divide-y divide-slate-200">
              {DAY_KEYS.map((day) => {
                const row = weeklyTemplateDraft[day];
                return (
                  <div key={day} className="flex flex-col sm:grid sm:grid-cols-[140px_100px_1fr] gap-3 sm:gap-4 items-start sm:items-center px-5 py-4 bg-white hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-wide">{labelForDay(day)}</span>
                    <button
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide border transition-colors w-24 text-center ${
                        row.enabled
                          ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700'
                          : 'bg-white text-slate-400 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {row.enabled ? 'Open' : 'Closed'}
                    </button>
                    {row.enabled ? (
                      <div className="flex flex-col gap-2 w-full">
                        {row.ranges.map((range, idx) => (
                          <div key={`${day}-${idx}`} className="flex items-end gap-2">
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">From</span>
                              <input
                                type="time"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
                                value={range.start}
                                onChange={(e) => updateRange(day, idx, 'start', e.target.value)}
                              />
                            </div>
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">To</span>
                              <input
                                type="time"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
                                value={range.end}
                                onChange={(e) => updateRange(day, idx, 'end', e.target.value)}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeRange(day, idx)}
                              className="shrink-0 self-end rounded-full w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors mb-0.5"
                              title="Remove"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addRange(day)}
                          className="self-start text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors pt-0.5"
                        >
                          + Add Range
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 italic">No hours set</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <button
            disabled={savingWeeklyTemplate}
            onClick={saveWeeklyTemplate}
            className="mt-6 w-full bg-blue-700 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors shadow-md active:scale-95 disabled:opacity-60"
          >
            {savingWeeklyTemplate ? 'Saving…' : 'Save Weekly Template'}
          </button>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 pt-6">
          <div className="flex items-center gap-3 text-slate-500">
            <History size={16} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-tighter">Last Modified</p>
              <p className="text-xs font-medium">{String(detail?.metadata?.lastModifiedBy ?? '—')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <RefreshCw size={16} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-tighter">Sync Status</p>
              <p className="text-xs font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-700"></span> Live Enterprise Sync
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <ShieldCheck size={16} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-tighter">Integrity</p>
              <p className="text-xs font-medium">Clinical Protocol Verified (v2.4)</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Unit Detail Drawer ───────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedUnit ? (
          <>
            <motion.div
              key={`backdrop-${selectedUnit.unit_id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              onClick={closeUnitDrawer}
            />
            <motion.aside
              key={`drawer-${selectedUnit.unit_id}`}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.28 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[560px] bg-white z-50 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/80">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-900 truncate">
                      Unit {selectedUnit.unit_id}
                    </h2>
                    <span
                      className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                        statusColor(selectedUnit.current_status).pill
                      }`}
                    >
                      Live: {selectedUnit.current_status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <Calendar size={12} />
                    Pool: {detail?.pool_name || poolId}
                    {selectedUnit.variant ? (
                      <span className="text-slate-400">
                        · Variant: <span className="font-semibold text-slate-600">{selectedUnit.variant}</span>
                      </span>
                    ) : null}
                    {selectedUnit.status_till ? (
                      <span className="text-slate-400 truncate">
                        · Status till: {selectedUnit.status_till.split('T')[0]}
                      </span>
                    ) : null}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeUnitDrawer}
                  className="shrink-0 ml-4 rounded-lg w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                {/* Stored Status */}
                <section>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">
                    Stored Status
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Base availability of this unit.  Live status also considers active reservations and block schedules below.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['AVAILABLE', 'IN_USE', 'MAINTENANCE'] as const).map((opt) => {
                      const active = String(unitStatusDraft || '').toUpperCase() === opt;
                      const c = statusColor(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setUnitStatusDraft(opt)}
                          className={`rounded-lg py-2.5 text-xs font-bold uppercase tracking-wide border transition-all ${
                            active
                              ? `${c.border} ${c.bg} text-slate-900 shadow-sm ring-2 ring-blue-200`
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {opt.replace('_', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Weekly Block Bookings — the per-unit "weekly template" */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                        Weekly Block Schedule
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Recurring time windows when this unit is <strong className="text-slate-700">blocked</strong> and cannot be reserved.  This is each unit's separate weekly template.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    {BLOCK_BOOKING_DAYS.map((day) => {
                      const rows = unitWeeklyDraft[day];
                      const label = day[0].toUpperCase() + day.slice(1);
                      return (
                        <div
                          key={day}
                          className="flex flex-col divide-y divide-slate-200 border-t border-slate-100 first:border-t-0"
                        >
                          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/70">
                            <div className="flex items-center gap-2.5">
                              <span className="text-sm font-bold text-slate-800 uppercase tracking-wide w-20">
                                {label}
                              </span>
                              {rows.length > 0 ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                  {rows.length} block{rows.length === 1 ? '' : 's'}
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100/80 text-teal-700 border border-teal-200">
                                  Open all day
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => addWeeklyBlock(day)}
                              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 px-2.5 py-1 rounded-md hover:bg-blue-50 transition-colors"
                            >
                              + Add block
                            </button>
                          </div>
                          {rows.length > 0 ? (
                            <div className="px-4 py-3 space-y-2">
                              {rows.map((r, idx) => (
                                <div
                                  key={`${day}-${idx}`}
                                  className="flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-2.5 border border-slate-200"
                                >
                                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">From</span>
                                    <input
                                      type="time"
                                      value={r.start}
                                      onChange={(e) => updateWeeklyBlock(day, idx, 'start', e.target.value)}
                                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">To</span>
                                    <input
                                      type="time"
                                      value={r.end}
                                      onChange={(e) => updateWeeklyBlock(day, idx, 'end', e.target.value)}
                                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-0.5 flex-[2] min-w-0">
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Reason (optional)</span>
                                    <input
                                      type="text"
                                      value={r.reason}
                                      onChange={(e) => updateWeeklyBlock(day, idx, 'reason', e.target.value)}
                                      placeholder="e.g. Maintenance, cleaning, QA"
                                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeWeeklyBlock(day, idx)}
                                    className="self-end rounded-md w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors mb-0.5"
                                    title="Remove this block"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Date Range Blocks */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                        Date-Range Blocks
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        One-off periods (e.g. scheduled repairs, deep-clean) when this unit is unavailable.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addDateRangeBlock}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 px-2.5 py-1 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      + Add date range
                    </button>
                  </div>

                  {unitDateRangeBlocks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 px-5 py-6 text-center">
                      <Calendar size={20} className="mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500">No one-off date-range blocks.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {unitDateRangeBlocks.map((dr, idx) => (
                        <div
                          key={`dr-${idx}`}
                          className="rounded-xl bg-slate-50 p-3 border border-slate-200"
                        >
                          <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-12 sm:col-span-5 flex flex-col gap-0.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">From</span>
                              <input
                                type="date"
                                value={dr.from}
                                onChange={(e) => updateDateRangeBlock(idx, 'from', e.target.value)}
                                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
                              />
                            </div>
                            <div className="col-span-12 sm:col-span-5 flex flex-col gap-0.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">To</span>
                              <input
                                type="date"
                                value={dr.to}
                                onChange={(e) => updateDateRangeBlock(idx, 'to', e.target.value)}
                                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
                              />
                            </div>
                            <div className="col-span-12 sm:col-span-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeDateRangeBlock(idx)}
                                className="self-end rounded-md w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 transition-colors"
                                title="Remove"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <div className="col-span-12 flex flex-col gap-0.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Reason (optional)</span>
                              <input
                                type="text"
                                value={dr.reason ?? ''}
                                onChange={(e) => updateDateRangeBlock(idx, 'reason', e.target.value)}
                                placeholder="e.g. Annual servicing, calibration"
                                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/80">
                <button
                  type="button"
                  onClick={closeUnitDrawer}
                  disabled={savingUnit}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveUnitChanges}
                  disabled={savingUnit}
                  className="px-5 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-md active:scale-95 transition-all disabled:opacity-60 disabled:active:scale-100 flex items-center gap-2"
                >
                  {savingUnit ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save Unit Changes'
                  )}
                </button>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};
