import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  Edit,
  Plus,
  ChevronLeft,
  Sun,
  CloudSun,
  Moon,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  getPoolById,
  getPoolDemand,
  getStaff,
  updateStaffById,
  type ServerPoolDemandResponse,
  type ServerPoolDetailResponse,
  type ServerStaff
} from '../../lib/api';
import { getPoolRostering, type ServerPoolRosteringByDate } from '../../lib/rostering/api';
import { useAppStore } from '../../context/AppStoreContext';

type PoolDetailProps = {
  poolId: string;
  onBack: () => void;
  onEditDemand: () => void;
  shiftMeta?: { name: string; start: string; end: string }[];
  onOpenStaffRostering?: (focus: { orgId: number; employeeId: string; dateIso: string; shiftKey: string; poolId: string }) => void;
};

function isoTodayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseIsoDateUtc(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

function isoFromDateUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDaysIsoUtc(iso: string, days: number): string {
  const d = parseIsoDateUtc(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return isoFromDateUtc(d);
}

function startOfWeekIsoUtc(iso: string): string {
  const d = parseIsoDateUtc(iso);
  const dow = d.getUTCDay();
  const offset = (dow + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offset);
  return isoFromDateUtc(d);
}

function normalizeShiftKey(value: string): string {
  return String(value ?? '').trim().toLowerCase();
}

export const PoolDetail: React.FC<PoolDetailProps> = ({ poolId, onBack, onEditDemand, shiftMeta, onOpenStaffRostering }) => {
  const { pushToast, store } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ServerPoolDetailResponse | null>(null);
  const [demand, setDemand] = useState<ServerPoolDemandResponse | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ServerPoolRosteringByDate | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignQuery, setAssignQuery] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffRows, setStaffRows] = useState<ServerStaff[]>([]);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [showScheduleExample, setShowScheduleExample] = useState(false);
  const [weekStartIso, setWeekStartIso] = useState(() => startOfWeekIsoUtc(isoTodayUtc()));
  const [rosterCellOpen, setRosterCellOpen] = useState(false);
  const [rosterCell, setRosterCell] = useState<{
    dateIso: string;
    shiftKey: string;
    displayName: string;
    staffIds: string[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [d, dm] = await Promise.allSettled([getPoolById(poolId), getPoolDemand(poolId)]);
        if (cancelled) return;
        if (d.status === 'fulfilled') setDetail(d.value);
        else throw d.reason;
        if (dm.status === 'fulfilled') setDemand(dm.value);
        else setDemand(null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? 'Failed to load pool');
        setDetail(null);
        setDemand(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [poolId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setScheduleLoading(true);
      setScheduleError(null);
      try {
        const orgId = typeof detail?.organization_id === 'number' ? detail.organization_id : 1;
        const data = await getPoolRostering({ orgId, poolId });
        if (cancelled) return;
        setSchedule(data);
      } catch (e: any) {
        if (cancelled) return;
        setSchedule(null);
        setScheduleError(e?.message ?? 'Failed to load schedule output');
      } finally {
        if (!cancelled) setScheduleLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detail?.organization_id, poolId]);

  const shiftMetaMap = useMemo(() => {
    const rows = Array.isArray(shiftMeta) ? shiftMeta : [];
    return new Map(rows.map((s) => [String(s.name), { start: String(s.start), end: String(s.end) }]));
  }, [shiftMeta]);

  const departmentNameById = useMemo(() => {
    const rows = store.settings?.catalogs?.departments ?? [];
    return new Map(rows.map((d) => [Number(d.id), String(d.name)]));
  }, [store.settings?.catalogs?.departments]);

  const departmentLabel = useMemo(() => {
    const byName = typeof (detail as any)?.department === 'string' ? String((detail as any).department).trim() : '';
    if (byName) return byName;
    const id = (detail as any)?.department_id;
    return typeof id === 'number' ? (departmentNameById.get(Number(id)) ?? '—') : '—';
  }, [departmentNameById, detail]);

  const shiftIcon = (shift: string) => {
    const s = String(shift || '').toLowerCase();
    if (s.includes('night')) return Moon;
    if (s.includes('afternoon') || s.includes('late') || s.includes('evening')) return CloudSun;
    if (s.includes('morning') || s.includes('day') || s.includes('early')) return Sun;
    return Sun;
  };

  const shiftAccent = (shift: string) => {
    const s = String(shift || '').toLowerCase();
    if (s.includes('night')) return { border: 'border-indigo-700', icon: 'text-indigo-700' };
    if (s.includes('afternoon') || s.includes('late') || s.includes('evening')) return { border: 'border-orange-500', icon: 'text-orange-500' };
    if (s.includes('morning') || s.includes('day') || s.includes('early')) return { border: 'border-blue-700', icon: 'text-blue-700' };
    return { border: 'border-slate-400', icon: 'text-slate-500' };
  };

  const scheduleDates = useMemo(() => {
    const s = schedule && typeof schedule === 'object' ? schedule : {};
    return Object.keys(s).sort();
  }, [schedule]);

  const scheduleDateSet = useMemo(() => new Set(scheduleDates), [scheduleDates]);

  const scheduleRange = useMemo(() => {
    if (scheduleDates.length === 0) return null;
    const minIso = scheduleDates[0];
    const maxIso = scheduleDates[scheduleDates.length - 1];
    return {
      minIso,
      maxIso,
      minWeekStartIso: startOfWeekIsoUtc(minIso),
      maxWeekStartIso: startOfWeekIsoUtc(maxIso),
    };
  }, [scheduleDates]);

  const canPrevWeek = !scheduleRange || weekStartIso > scheduleRange.minWeekStartIso;
  const canNextWeek = !scheduleRange || weekStartIso < scheduleRange.maxWeekStartIso;

  const scheduleShifts = useMemo(() => {
    const s = schedule && typeof schedule === 'object' ? schedule : {};
    const set = new Set<string>();
    for (const date of Object.keys(s)) {
      const byShift = (s as any)[date];
      if (!byShift || typeof byShift !== 'object') continue;
      for (const shift of Object.keys(byShift)) set.add(String(shift));
    }
    return Array.from(set).sort();
  }, [schedule]);

  useEffect(() => {
    if (scheduleDates.length === 0) return;
    setWeekStartIso(startOfWeekIsoUtc(scheduleDates[0]));
  }, [scheduleDates]);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDaysIsoUtc(weekStartIso, i));
  }, [weekStartIso]);

  const weekLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: '2-digit' });
    const start = parseIsoDateUtc(weekDates[0]);
    const end = parseIsoDateUtc(weekDates[6]);
    const year = String(end.getUTCFullYear());
    return `${fmt.format(start)} - ${fmt.format(end)}, ${year}`;
  }, [weekDates]);

  const shiftNameByAlias = useMemo(() => {
    const m = new Map<string, string>();
    const add = (name: string) => {
      const s = String(name ?? '').trim();
      const key = s.slice(0, 1).toUpperCase();
      if (!key) return;
      if (!m.has(key)) m.set(key, s);
    };
    for (const row of demand?.demand_matrix ?? []) add(String((row as any)?.shift ?? ''));
    for (const row of Array.isArray(shiftMeta) ? shiftMeta : []) add(String((row as any)?.name ?? ''));
    return m;
  }, [demand?.demand_matrix, shiftMeta]);

  const demandByShiftKey = useMemo(() => {
    const m = new Map<string, any>();
    for (const row of demand?.demand_matrix ?? []) {
      const shift = String((row as any)?.shift ?? '').trim();
      if (!shift) continue;
      m.set(normalizeShiftKey(shift), row);
      m.set(shift.toUpperCase(), row);
      const alias = shift.slice(0, 1).toUpperCase();
      if (alias) m.set(alias, row);
    }
    return m;
  }, [demand?.demand_matrix]);

  const shiftKeysForTable = useMemo(() => {
    const ordered: string[] = [];
    const used = new Set<string>();
    const add = (k: string) => {
      const s = String(k ?? '').trim();
      if (!s || used.has(s)) return;
      used.add(s);
      ordered.push(s);
    };

    const scheduleSet = new Set(scheduleShifts);
    const demandRows = demand?.demand_matrix ?? [];
    if (demandRows.length > 0) {
      for (const r of demandRows) {
        const name = String((r as any)?.shift ?? '').trim();
        const alias = name.slice(0, 1).toUpperCase();
        if (alias && scheduleSet.has(alias)) add(alias);
        else if (name && scheduleSet.has(name)) add(name);
        else add(alias || name);
      }
    }

    for (const s of scheduleShifts) add(s);
    return ordered;
  }, [demand?.demand_matrix, scheduleShifts]);

  const resolveShiftDisplayName = (shiftKey: string) => {
    if (shiftMetaMap.has(shiftKey)) return shiftKey;
    return shiftNameByAlias.get(String(shiftKey ?? '').trim().toUpperCase()) ?? shiftKey;
  };

  const resolveShiftTime = (shiftKey: string, displayName: string) => {
    const meta = shiftMetaMap.get(shiftKey) ?? shiftMetaMap.get(displayName);
    return meta ? `${meta.start} - ${meta.end}` : '';
  };

  const requiredFor = (shiftKey: string, dayIndex: number): number => {
    const displayName = resolveShiftDisplayName(shiftKey);
    const row =
      demandByShiftKey.get(normalizeShiftKey(displayName)) ??
      demandByShiftKey.get(normalizeShiftKey(shiftKey)) ??
      demandByShiftKey.get(String(shiftKey ?? '').trim().toUpperCase());
    if (!row) return 0;
    const field = (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const)[dayIndex] ?? 'mon';
    const v = (row as any)?.[field];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const actualFor = (shiftKey: string, dateIso: string): number => {
    const row = (schedule ?? {})[dateIso] ?? {};
    const direct = (row as any)?.[shiftKey];
    if (Array.isArray(direct)) return direct.length;
    const displayName = resolveShiftDisplayName(shiftKey);
    const byName = (row as any)?.[displayName];
    if (Array.isArray(byName)) return byName.length;
    return 0;
  };

  const staffIdsFor = (shiftKey: string, dateIso: string): { key: string; staffIds: string[] } => {
    const row = (schedule ?? {})[dateIso] ?? {};
    const direct = (row as any)?.[shiftKey];
    if (Array.isArray(direct)) return { key: shiftKey, staffIds: direct.map((x: any) => String(x)) };
    const displayName = resolveShiftDisplayName(shiftKey);
    const byName = (row as any)?.[displayName];
    if (Array.isArray(byName)) return { key: displayName, staffIds: byName.map((x: any) => String(x)) };
    return { key: shiftKey, staffIds: [] };
  };

  const staffNameByEmployeeId = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of store.staff ?? []) {
      const raw = String((s as any)?.employeeId ?? '').trim().replace(/^#/, '');
      const name = String((s as any)?.name ?? '').trim();
      if (raw && name) m.set(raw, name);
    }
    for (const e of (detail as any)?.employees ?? []) {
      const raw = String((e as any)?.staff_id ?? '').trim();
      const name = String((e as any)?.name ?? '').trim();
      if (raw && name && !m.has(raw)) m.set(raw, name);
    }
    return m;
  }, [detail, store.staff]);

  const openRosterCell = (shiftKey: string, dateIso: string) => {
    const displayName = resolveShiftDisplayName(shiftKey);
    const { key, staffIds } = staffIdsFor(shiftKey, dateIso);
    setRosterCell({ dateIso, shiftKey: key, displayName, staffIds });
    setRosterCellOpen(true);
  };

  const scheduleExampleRows = useMemo(() => {
    const weekLabel = 'Oct 23 - Oct 29, 2023';
    const getTime = (name: string, fallback: string) => {
      const meta = shiftMetaMap.get(name);
      return meta ? `${meta.start} - ${meta.end}` : fallback;
    };
    return {
      weekLabel,
      rows: [
        {
          shift: 'Morning',
          time: getTime('Morning', '06:00 - 14:00'),
          days: [
            { actual: 12, required: 12 },
            { actual: 12, required: 12 },
            { actual: 9, required: 12 },
            { actual: 12, required: 12 },
            { actual: 12, required: 12 },
            { actual: 8, required: 8 },
            { actual: 8, required: 8 },
          ],
        },
        {
          shift: 'Afternoon',
          time: getTime('Afternoon', '14:00 - 22:00'),
          days: [
            { actual: 10, required: 10 },
            { actual: 10, required: 10 },
            { actual: 10, required: 10 },
            { actual: 7, required: 10 },
            { actual: 10, required: 10 },
            { actual: 6, required: 6 },
            { actual: 6, required: 6 },
          ],
        },
        {
          shift: 'Night',
          time: getTime('Night', '22:00 - 06:00'),
          days: [
            { actual: 6, required: 6 },
            { actual: 4, required: 6 },
            { actual: 6, required: 6 },
            { actual: 6, required: 6 },
            { actual: 6, required: 6 },
            { actual: 4, required: 4 },
            { actual: 4, required: 4 },
          ],
        },
      ],
    };
  }, [shiftMetaMap]);

  useEffect(() => {
    if (!assignOpen) return;
    let cancelled = false;
    (async () => {
      setStaffLoading(true);
      try {
        const orgId = typeof detail?.organization_id === 'number' ? detail.organization_id : 1;
        const rows = await getStaff({ orgId });
        if (cancelled) return;
        setStaffRows(Array.isArray(rows) ? rows : []);
      } catch (e: any) {
        if (cancelled) return;
        setStaffRows([]);
        pushToast({ message: e?.message ?? 'Failed to load staff', variant: 'error' });
      } finally {
        if (!cancelled) setStaffLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assignOpen, detail?.organization_id, pushToast]);

  const assignedStaffIds = useMemo(() => {
    const ids = (detail?.employees ?? []).map((e) => String(e.staff_id));
    return new Set(ids);
  }, [detail?.employees]);

  const availableCandidates = useMemo(() => {
    const q = assignQuery.trim().toLowerCase();
    return staffRows
      .filter((s) => !assignedStaffIds.has(String(s.staff_id)))
      .filter((s) => {
        if (!q) return true;
        const name = String(s.name ?? '').toLowerCase();
        const staffId = String(s.staff_id ?? '').toLowerCase();
        const role = String(s.designation ?? '').toLowerCase();
        return name.includes(q) || staffId.includes(q) || role.includes(q);
      })
      .slice(0, 20);
  }, [assignedStaffIds, assignQuery, staffRows]);

  const addMemberToPool = async (staff: ServerStaff) => {
    if (!detail) return;
    setAssigningId(staff.id);
    try {
      const raw = staff.pool_assignments;
      const existing = Array.isArray(raw) ? raw.filter((p) => p && typeof p === 'object') : [];
      const next = [
        ...existing.filter((p: any) => typeof p?.pool_id === 'string' && p.pool_id !== poolId),
        { pool_id: poolId, pool_name: detail.pool_name ?? poolId },
      ];

      await updateStaffById(staff.id, {
        professional_secondary_details: {
          pool_assignments: next,
        },
      });

      const refreshed = await getPoolById(poolId);
      setDetail(refreshed);
      setStaffRows((prev) => prev.map((r) => (r.id === staff.id ? { ...r, pool_assignments: next } : r)));
      pushToast('Member added to pool successfully.');
    } catch (e: any) {
      pushToast({ message: e?.message ?? 'Failed to add member', variant: 'error' });
    } finally {
      setAssigningId(null);
    }
  };

  const composition = useMemo(() => {
    const s = Number(detail?.static_pct ?? 50);
    const d = Number(detail?.dynamic_pct ?? 50);
    const total = Math.max(1, s + d);
    return {
      staticPct: Math.round((s / total) * 100),
      dynamicPct: Math.round((d / total) * 100),
    };
  }, [detail]);

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 pb-20">
      <div className="flex-1 space-y-8">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <button onClick={onBack} className="hover:text-blue-700 transition-colors">Resource Pools</button>
              <ChevronRight className="w-3 h-3" />
              <span className="font-bold text-blue-700">{detail?.pool_name ?? poolId}</span>
            </nav>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">{detail?.pool_name ?? 'Pool'}</h1>
            <p className="text-slate-500 mt-1 font-medium">
              {departmentLabel} • {(detail?.location ?? '—')}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onEditDemand}
              className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center gap-2 hover:bg-slate-200 transition-all"
            >
              <Edit className="w-4 h-4" /> Edit Config
            </button>
            <button
              onClick={() => setAssignOpen(true)}
              className="px-5 py-3 rounded-xl bg-gradient-to-br from-blue-700 to-blue-800 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-700/20 hover:scale-[1.02] transition-all"
            >
              <Plus className="w-4 h-4" /> Assign Resource
            </button>
          </div>
        </section>

        {assignOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-6 w-full max-w-2xl mx-4">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Add Members</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Select staff to add to {detail?.pool_name ?? poolId}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAssignOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, staff ID, or role..."
                  value={assignQuery}
                  onChange={(e) => setAssignQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-700/20"
                />
              </div>

              {staffLoading ? (
                <div className="py-10 text-center text-slate-500 font-medium">Loading staff…</div>
              ) : availableCandidates.length === 0 ? (
                <div className="py-10 text-center text-slate-400 font-medium">No staff available to add.</div>
              ) : (
                <div className="space-y-2 max-h-[55vh] overflow-auto pr-1">
                  {availableCandidates.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      disabled={assigningId === s.id}
                      onClick={() => addMemberToPool(s)}
                      className={`w-full flex items-center justify-between gap-4 p-4 rounded-2xl border transition-colors text-left ${
                        assigningId === s.id ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{s.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          {s.designation ?? '—'} • {s.staff_id}
                        </p>
                      </div>
                      <div className="text-blue-700 font-extrabold text-lg px-2">
                        {assigningId === s.id ? '…' : '+'}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAssignOpen(false)}
                  className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <section className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-slate-500 font-medium">
            Loading pool…
          </section>
        )}
        {!loading && error && (
          <section className="bg-red-50/30 rounded-2xl p-8 border border-red-200/50 text-red-700 font-medium">
            {error}
          </section>
        )}

        <section className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Schedule Output</h2>
            <button
              type="button"
              onClick={() => setShowScheduleExample((v) => !v)}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              {showScheduleExample ? 'Hide Example' : 'Preview Example'}
            </button>
          </div>
          {scheduleLoading ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-slate-600 font-medium">
              Loading schedule output…
            </div>
          ) : scheduleError ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-red-700 font-medium">
              {scheduleError}
            </div>
          ) : showScheduleExample ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h3 className="font-bold text-slate-900">Current Week Planning (Example)</h3>
                <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                  <button type="button" className="p-1 hover:bg-slate-50 rounded-lg transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold">{scheduleExampleRows.weekLabel}</span>
                  <button type="button" className="p-1 hover:bg-slate-50 rounded-lg transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                      <th className="px-4 pb-2">Shift Type</th>
                      <th className="px-4 pb-2">Mon</th>
                      <th className="px-4 pb-2">Tue</th>
                      <th className="px-4 pb-2">Wed</th>
                      <th className="px-4 pb-2">Thu</th>
                      <th className="px-4 pb-2">Fri</th>
                      <th className="px-4 pb-2">Sat</th>
                      <th className="px-4 pb-2">Sun</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {scheduleExampleRows.rows.map((row) => {
                      const Icon = shiftIcon(row.shift);
                      const accent = shiftAccent(row.shift);
                      return (
                        <tr key={row.shift} className="bg-white group hover:shadow-md transition-all">
                          <td className={`p-4 rounded-l-2xl font-bold border-l-4 ${accent.border}`}>
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${accent.icon}`} />
                              {row.shift}
                            </div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{row.time}</span>
                          </td>
                          {row.days.map((cell, i) => {
                            const isShort = Number(cell.actual) < Number(cell.required);
                            const label = isShort ? 'Shortage' : 'Fulfilled';
                            return (
                              <td key={i} className={`p-4 ${i === 6 ? 'rounded-r-2xl' : ''} ${isShort ? 'bg-red-50/50' : ''}`}>
                                <div className="flex flex-col">
                                  <span className={`text-lg font-extrabold ${isShort ? 'text-red-600' : ''}`}>
                                    {cell.actual}/{cell.required}
                                  </span>
                                  <span className={`text-[10px] font-bold uppercase ${isShort ? 'text-red-500 tracking-tighter' : 'text-teal-700'}`}>
                                    {label}
                                  </span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : scheduleDates.length > 0 && shiftKeysForTable.length > 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h3 className="font-bold text-slate-900">Current Week Planning</h3>
                <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                  <button
                    type="button"
                    onClick={() =>
                      setWeekStartIso((prev) => {
                        const next = addDaysIsoUtc(prev, -7);
                        if (!scheduleRange) return next;
                        return next < scheduleRange.minWeekStartIso ? scheduleRange.minWeekStartIso : next;
                      })
                    }
                    disabled={!canPrevWeek}
                    className={`p-1 rounded-lg transition-colors ${
                      canPrevWeek ? 'hover:bg-slate-50' : 'opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold">{weekLabel}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setWeekStartIso((prev) => {
                        const next = addDaysIsoUtc(prev, 7);
                        if (!scheduleRange) return next;
                        return next > scheduleRange.maxWeekStartIso ? scheduleRange.maxWeekStartIso : next;
                      })
                    }
                    disabled={!canNextWeek}
                    className={`p-1 rounded-lg transition-colors ${
                      canNextWeek ? 'hover:bg-slate-50' : 'opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                      <th className="px-4 pb-2">Shift Type</th>
                      <th className="px-4 pb-2">Mon</th>
                      <th className="px-4 pb-2">Tue</th>
                      <th className="px-4 pb-2">Wed</th>
                      <th className="px-4 pb-2">Thu</th>
                      <th className="px-4 pb-2">Fri</th>
                      <th className="px-4 pb-2">Sat</th>
                      <th className="px-4 pb-2">Sun</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {shiftKeysForTable.map((shiftKey) => {
                      const displayName = resolveShiftDisplayName(shiftKey);
                      const Icon = shiftIcon(displayName);
                      const accent = shiftAccent(displayName);
                      const time = resolveShiftTime(shiftKey, displayName);
                      return (
                        <tr key={shiftKey} className="bg-white group hover:shadow-md transition-all">
                          <td className={`p-4 rounded-l-2xl font-bold border-l-4 ${accent.border}`}>
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${accent.icon}`} />
                              {displayName}
                            </div>
                            {time ? (
                              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{time}</span>
                            ) : (
                              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{shiftKey}</span>
                            )}
                          </td>
                          {weekDates.map((dateIso, i) => {
                            const hasDataForDate = scheduleDateSet.has(dateIso);
                            const actual = actualFor(shiftKey, dateIso);
                            const required = requiredFor(shiftKey, i);
                            const isShort = hasDataForDate && Number(actual) < Number(required);
                            const label = !hasDataForDate ? 'No data' : isShort ? 'Shortage' : 'Fulfilled';
                            return (
                              <td
                                key={dateIso}
                                onClick={() => {
                                  if (!hasDataForDate) return;
                                  openRosterCell(shiftKey, dateIso);
                                }}
                                className={`p-4 ${i === 6 ? 'rounded-r-2xl' : ''} ${isShort ? 'bg-red-50/50' : ''} ${
                                  hasDataForDate ? 'cursor-pointer hover:bg-slate-50/50' : ''
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span
                                    className={`text-lg font-extrabold ${
                                      !hasDataForDate ? 'text-slate-300' : isShort ? 'text-red-600' : ''
                                    }`}
                                  >
                                    {hasDataForDate ? `${actual}/${required}` : '—'}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold uppercase ${
                                      !hasDataForDate
                                        ? 'text-slate-400 tracking-wider'
                                        : isShort
                                          ? 'text-red-500 tracking-tighter'
                                          : 'text-teal-700'
                                    }`}
                                  >
                                    {label}
                                  </span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-slate-600 font-medium">
              No stored schedule output found for this pool yet.
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold">Demand Baseline</h2>
            <button
              onClick={onEditDemand}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all"
            >
              Edit Demand
            </button>
          </div>

          {!demand || !Array.isArray(demand.demand_matrix) || demand.demand_matrix.length === 0 ? (
            <div className="text-slate-500 font-medium">No demand baseline configured.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="p-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-56">Shift</th>
                    <th className="p-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Mon</th>
                    <th className="p-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Tue</th>
                    <th className="p-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Wed</th>
                    <th className="p-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Thu</th>
                    <th className="p-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Fri</th>
                    <th className="p-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Sat</th>
                    <th className="p-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Sun</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {demand.demand_matrix.map((row) => {
                    const meta = shiftMetaMap.get(String(row.shift));
                    return (
                      <tr key={row.shift} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{row.shift}</span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {meta ? `${meta.start} - ${meta.end}` : ''}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center font-extrabold text-slate-900">{row.mon}</td>
                        <td className="p-4 text-center font-extrabold text-slate-900">{row.tue}</td>
                        <td className="p-4 text-center font-extrabold text-slate-900">{row.wed}</td>
                        <td className="p-4 text-center font-extrabold text-slate-900">{row.thu}</td>
                        <td className="p-4 text-center font-extrabold text-slate-900">{row.fri}</td>
                        <td className="p-4 text-center font-extrabold text-slate-900">{row.sat}</td>
                        <td className="p-4 text-center font-extrabold text-slate-900">{row.sun}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
              Active Resources
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {detail?.employees?.length ?? 0} People Assigned
              </span>
            </h3>
            <div className="space-y-4">
              {(detail?.employees ?? []).slice(0, 6).map((member) => (
                <div key={member.staff_id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 ring-2 ring-white shadow-sm flex items-center justify-center font-extrabold text-slate-500">
                      {String(member.name || '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{member.role ?? '—'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${
                    member.contract_type === 'STATIC' ? 'bg-teal-100/50 text-teal-700' : 'bg-blue-100 text-blue-700'
                  }`}>{member.contract_type ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-3">Alerts</h3>
            <p className="text-sm text-slate-600 font-medium">
              No alerts available yet. Alerts will appear after the solver generates schedules and coverage.
            </p>
          </div>
        </section>
      </div>

      <aside className="w-full lg:w-80 space-y-8">
        <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
          <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-6">Pool Composition</h3>
          <div className="space-y-8">
            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="font-bold text-slate-700">Static Contracts</span>
                <span className="font-extrabold text-blue-700">{composition.staticPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-blue-700 rounded-full" style={{ width: `${composition.staticPct}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="font-bold text-slate-700">Dynamic / Float</span>
                <span className="font-extrabold text-blue-600">{composition.dynamicPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${composition.dynamicPct}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Weekly Capacity</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-blue-700 tracking-tighter">{Number(detail?.weekly_hours ?? 0).toLocaleString()}</span>
            <span className="text-slate-400 font-bold text-lg">Hours</span>
          </div>
          <p className="text-xs text-slate-500 mt-6 leading-relaxed font-medium">
            Utilization is currently at <span className="text-teal-700 font-bold">92%</span>. This is within the optimal clinical range of 85-95%.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Compliance Status</h3>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-5 h-5 text-teal-700 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900">Certification Valid</p>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">All 28 resources have updated trauma credentials.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-5 h-5 text-teal-700 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900">Fatigue Protocol</p>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">Rest periods maintained for the last 14 days.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900">Junior Ratios</p>
                <p className="text-[10px] text-red-500 font-bold leading-tight mt-1">Warning: Resident-to-Senior ratio exceeded on Wed Night.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-blue-100/20 rounded-2xl flex flex-col items-center text-center border border-blue-200/50">
          <BarChart3 className="w-10 h-10 text-blue-700 mb-3" />
          <p className="text-sm font-bold text-blue-700">Need detailed analytics?</p>
          <p className="text-[10px] text-slate-600 mt-2 mb-6 font-medium">Generate a full utilization report for hospital administration.</p>
          <button className="w-full py-3 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-700/20">View Pool Report</button>
        </div>
      </aside>

      {rosterCellOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {rosterCell?.displayName || 'Shift'} — {rosterCell?.dateIso || ''}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Assigned staff for this shift.</p>
              </div>
              <button
                type="button"
                onClick={() => setRosterCellOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!rosterCell || rosterCell.staffIds.length === 0 ? (
              <div className="py-10 text-center text-slate-500 font-medium">No staff assigned.</div>
            ) : (
              <div className="space-y-2 max-h-[55vh] overflow-auto pr-1">
                {rosterCell.staffIds.map((empId) => {
                  const name = staffNameByEmployeeId.get(empId) ?? empId;
                  return (
                    <button
                      type="button"
                      key={empId}
                      onClick={() => {
                        const orgId = typeof detail?.organization_id === 'number' ? detail.organization_id : 1;
                        setRosterCellOpen(false);
                        onOpenStaffRostering?.({
                          orgId,
                          employeeId: empId,
                          dateIso: rosterCell.dateIso,
                          shiftKey: rosterCell.shiftKey,
                          poolId,
                        });
                      }}
                      className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{empId}</p>
                      </div>
                      <div className="text-blue-700 font-extrabold text-xs px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
                        View
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRosterCellOpen(false)}
                className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
