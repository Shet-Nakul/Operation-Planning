import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ChevronRight,
  History,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  User,
} from 'lucide-react';
import {
  addRenewableResourceUnitsToPool,
  getRenewableResourcePoolById,
  getRenewableResourcePoolHealth,
  updateRenewableResourcePoolCapacity,
  updateRenewableResourceUnit,
} from '../../lib/api';
import { ResourcePoolDetail, UnitStatus } from './types';

interface PoolDetailsViewProps {
  poolId: string;
  onBack: () => void;
}

const statusColor = (status: UnitStatus) => {
  const s = String(status || '').toUpperCase();
  if (s === 'AVAILABLE') return { bg: 'bg-white', border: 'border-teal-700', text: 'text-slate-400', icon: 'teal' as const };
  if (s === 'IN_USE') return { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-600', icon: 'red' as const };
  if (s === 'MAINTENANCE') return { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700', icon: 'amber' as const };
  return { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-500', icon: 'slate' as const };
};

export const PoolDetailsView = ({ poolId, onBack }: PoolDetailsViewProps) => {
  const [detail, setDetail] = useState<ResourcePoolDetail | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capacityInput, setCapacityInput] = useState<string>('');
  const [savingCapacity, setSavingCapacity] = useState(false);
  const [addingUnits, setAddingUnits] = useState(false);
  const [addPrefix, setAddPrefix] = useState('');
  const [addCount, setAddCount] = useState<number>(1);
  const [addVariant, setAddVariant] = useState<string>('STANDARD');

  const utilizationPct = useMemo(() => {
    if (!detail) return 0;
    const denom = detail.total_capacity > 0 ? detail.total_capacity : 1;
    return Math.round((detail.in_use / denom) * 100);
  }, [detail]);

  const occupancy = useMemo(() => {
    if (!detail) return { inUse: 0, total: 0 };
    return { inUse: detail.in_use, total: detail.total_capacity };
  }, [detail]);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await getRenewableResourcePoolById(poolId);
      setDetail(d as any);
      setCapacityInput(String((d as any)?.total_capacity ?? ''));
      const metaPrefix = String((d as any)?.metadata?.unit_prefix ?? '');
      setAddPrefix(metaPrefix);
      const h = await getRenewableResourcePoolHealth(poolId);
      setHealth(h);
    } catch (e: any) {
      setError(String(e?.message ?? 'Failed to load pool'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload().catch(() => {});
  }, [poolId]);

  const refreshHealthOnly = async () => {
    try {
      const h = await getRenewableResourcePoolHealth(poolId);
      setHealth(h);
    } catch (e: any) {
      setError(String(e?.message ?? 'Health refresh failed'));
    }
  };

  const applyCapacity = async () => {
    if (!detail) return;
    const next = Number(capacityInput);
    if (!Number.isFinite(next) || next <= 0) {
      setError('Total capacity must be a positive number.');
      return;
    }
    setSavingCapacity(true);
    setError(null);
    try {
      await updateRenewableResourcePoolCapacity(poolId, { total_capacity: Math.floor(next) });
      await reload();
    } catch (e: any) {
      setError(String(e?.message ?? 'Capacity update failed'));
    } finally {
      setSavingCapacity(false);
    }
  };

  const cycleStatus = (s: UnitStatus): UnitStatus => {
    const u = String(s || '').toUpperCase();
    if (u === 'AVAILABLE') return 'IN_USE';
    if (u === 'IN_USE') return 'MAINTENANCE';
    return 'AVAILABLE';
  };

  const onUnitClick = async (unitId: string) => {
    if (!detail) return;
    const idx = detail.units.findIndex((u) => u.unit_id === unitId);
    if (idx < 0) return;
    const current = detail.units[idx];
    const nextStatus = cycleStatus(current.status);
    const nextUnits = detail.units.slice();
    nextUnits[idx] = { ...current, status: nextStatus };
    setDetail({ ...detail, units: nextUnits } as any);
    setError(null);
    try {
      await updateRenewableResourceUnit(unitId, { status: nextStatus });
      await reload();
    } catch (e: any) {
      setError(String(e?.message ?? 'Unit update failed'));
      await reload();
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
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Utilization Rate</p>
              <span className="text-5xl font-black text-teal-700">{utilizationPct}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 bg-slate-50 rounded-xl p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Unit Map</h3>
              <div className="flex gap-4 text-xs font-semibold">
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
              </div>
            </div>
            <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {loading ? (
                <div className="col-span-full text-sm text-slate-500 font-semibold">Loading units…</div>
              ) : null}
              {!loading && detail?.units?.length ? null : !loading ? (
                <div className="col-span-full text-sm text-slate-500 font-semibold">No units found in this pool.</div>
              ) : null}
              {(detail?.units ?? []).map((unit) => {
                const c = statusColor(unit.status);
                return (
                <div
                  key={unit.unit_id}
                  onClick={() => onUnitClick(unit.unit_id)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center border-b-2 shadow-sm transition-all hover:scale-105 cursor-pointer ${c.bg} ${c.border}`}
                >
                  <span className={`text-[10px] font-bold ${c.text}`}>
                    {unit.unit_id}
                  </span>
                  {String(unit.status || '').toUpperCase() === 'AVAILABLE' ? (
                    <CheckCircle2 size={16} className="text-teal-700" />
                  ) : String(unit.status || '').toUpperCase() === 'MAINTENANCE' ? (
                    <RefreshCw size={16} className="text-amber-600" />
                  ) : (
                    <User size={16} className="text-red-500 fill-red-500" />
                  )}
                </div>
              )})}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl p-6 border-b-2 border-blue-700 shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Total Pool Capacity</h3>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Units Available</label>
                  <div className="relative">
                    <input
                      className="w-full bg-slate-50 border-none border-b-2 border-slate-200 focus:border-blue-700 focus:ring-0 text-2xl font-bold p-3 text-slate-900"
                      type="number"
                      value={capacityInput}
                      onChange={(e) => setCapacityInput(e.target.value)}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Units</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 italic">Changing the total pool capacity will trigger an enterprise-wide resource sync and may affect active scheduling workflows.</p>
                <button
                  disabled={savingCapacity}
                  onClick={applyCapacity}
                  className="w-full bg-blue-700 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors shadow-md active:scale-95 disabled:opacity-60"
                >
                  {savingCapacity ? 'Applying…' : 'Apply Changes'}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Resource Health</h3>
                <button
                  onClick={refreshHealthOnly}
                  className="text-xs font-bold text-blue-700 hover:underline"
                  type="button"
                >
                  Refresh
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Maintenance Schedule</span>
                  <span className="bg-teal-100/80 text-teal-700 px-2 py-0.5 rounded text-[10px] font-bold">
                    {String(health?.maintenance?.status ?? '—')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Turnover Time</span>
                  <span className="text-sm font-bold text-slate-900">
                    {typeof health?.turnover?.avg_minutes === 'number' ? `${health.turnover.avg_minutes} min` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Projected Load (24h)</span>
                  <span className="text-sm font-bold text-red-600">
                    {typeof health?.projections?.load_24h === 'number' ? `${Math.round(health.projections.load_24h * 100)}%` : '—'}
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${utilizationPct}%` }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                    className="h-full bg-gradient-to-r from-blue-700 to-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Add Units</h3>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-7">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prefix</label>
                  <input
                    className="w-full mt-2 bg-slate-50 border-none border-b-2 border-slate-200 focus:border-blue-700 focus:ring-0 text-lg font-semibold p-3 text-slate-900"
                    value={addPrefix}
                    onChange={(e) => setAddPrefix(e.target.value)}
                    placeholder="e.g., ICU"
                  />
                </div>
                <div className="col-span-5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Count</label>
                  <input
                    className="w-full mt-2 bg-slate-50 border-none border-b-2 border-slate-200 focus:border-blue-700 focus:ring-0 text-lg font-semibold p-3 text-slate-900"
                    type="number"
                    min={1}
                    value={String(addCount)}
                    onChange={(e) => setAddCount(Number(e.target.value))}
                  />
                </div>
                <div className="col-span-12">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Variant</label>
                  <input
                    className="w-full mt-2 bg-slate-50 border-none border-b-2 border-slate-200 focus:border-blue-700 focus:ring-0 text-lg font-semibold p-3 text-slate-900"
                    value={addVariant}
                    onChange={(e) => setAddVariant(e.target.value)}
                    placeholder="STANDARD"
                  />
                </div>
              </div>
              <button
                disabled={addingUnits}
                onClick={onAddUnits}
                className="mt-6 w-full bg-blue-700 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors shadow-md active:scale-95 disabled:opacity-60"
              >
                {addingUnits ? 'Adding…' : 'Add Units'}
              </button>
            </div>
          </div>
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
    </motion.div>
  );
};
