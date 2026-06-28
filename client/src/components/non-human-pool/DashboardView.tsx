import React from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  Filter,
  ArrowUpDown,
  PlusCircle,
  Bed,
  Stethoscope,
  Armchair,
  Microscope,
  Scan,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ResourcePoolSummary } from './types';

interface DashboardViewProps {
  pools: ResourcePoolSummary[];
  loading?: boolean;
  error?: string | null;
  onCreateNew: () => void;
  onSelectPool: (poolId: string) => void;
}

const StatusBadge = ({ status, utilizationRate }: { status: string; utilizationRate: number }) => {
  const s = String(status || '').toUpperCase();
  const urgent = utilizationRate >= 0.9;
  const colors: Record<string, string> = {
    OPERATIONAL: urgent ? 'bg-red-100/80 text-red-700' : 'bg-teal-100/80 text-teal-700',
    MAINTENANCE: 'bg-amber-100/80 text-amber-800',
    DECOMMISSIONED: 'bg-slate-100 text-slate-500',
  };

  return (
    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${colors[s] ?? 'bg-slate-100 text-slate-600'}`}>
      {urgent && s === 'OPERATIONAL' ? 'HIGH DEMAND' : s || 'UNKNOWN'}
    </span>
  );
};

const iconForType = (resourceType: string) => {
  const t = String(resourceType || '').toUpperCase();
  if (t === 'BED') return Bed;
  if (t === 'ROOM') return Stethoscope;
  if (t === 'EQUIPMENT') return Armchair;
  if (t === 'DEVICE') return Microscope;
  if (t === 'VEHICLE') return Scan;
  return Package;
};

export const DashboardView = ({ pools, loading, error, onCreateNew, onSelectPool }: DashboardViewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-8 py-10 lg:px-12 pb-32"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Non-Human Resource Library</h2>
          <p className="text-slate-500 text-lg">Inventory of medical facility assets and resource pools.</p>
        </div>
        <button
          onClick={onCreateNew}
          className="bg-gradient-to-br from-blue-700 to-blue-800 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-blue-700/20"
        >
          <Plus size={20} />
          Create New Pool
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col justify-between h-80 relative overflow-hidden">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-teal-100/60 text-teal-700 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-700 animate-pulse"></span>
              System Health
            </span>
            <h3 className="text-6xl font-bold text-slate-900">94<span className="text-3xl text-slate-400">%</span></h3>
            <p className="text-slate-500 mt-2 font-medium max-w-xs">Total resource utilization across all registered clinical pools today.</p>
          </div>
          <div className="relative z-10 flex gap-4 mt-auto">
            <div className="bg-slate-50 px-4 py-2 rounded-lg">
              <span className="block text-xs font-bold text-slate-400 uppercase">Active Units</span>
              <span className="text-xl font-bold text-blue-700">1,248</span>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-lg">
              <span className="block text-xs font-bold text-slate-400 uppercase">Maintenance</span>
              <span className="text-xl font-bold text-blue-600">32</span>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/2 opacity-5 pointer-events-none">
            <Package size={300} />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-blue-700 text-white rounded-2xl p-8 shadow-lg shadow-blue-700/20 flex flex-col h-80">
          <AlertTriangle size={40} className="mb-auto" />
          <div>
            <h3 className="text-4xl font-bold mb-2">ICU Critical</h3>
            <p className="text-blue-100 text-sm opacity-80 leading-relaxed mb-6">3 pools are currently reaching peak capacity limits. Immediate intervention suggested for OR scheduling.</p>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '88%' }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="bg-white h-full"
              />
            </div>
          </div>
        </div>

        <div className="col-span-12 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-bold text-slate-900">Active Resource Pools</h4>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <Filter size={18} className="text-slate-500" />
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <ArrowUpDown size={18} className="text-slate-500" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {error ? (
              <div className="col-span-full bg-white p-6 rounded-2xl border border-slate-200 text-sm text-red-600 font-semibold">
                {error}
              </div>
            ) : null}
            {loading ? (
              <div className="col-span-full bg-white p-6 rounded-2xl border border-slate-200 text-sm text-slate-500 font-semibold">
                Loading resource pools…
              </div>
            ) : null}
            {!loading && pools.length === 0 ? (
              <div className="col-span-full bg-white p-6 rounded-2xl border border-slate-200 text-sm text-slate-500 font-semibold">
                No pools yet. Create your first non-human resource pool.
              </div>
            ) : null}
            {pools.map((pool) => {
              const Icon = iconForType(pool.resource_type);
              return (
                <button
                  key={pool.pool_id}
                  onClick={() => onSelectPool(pool.pool_id)}
                  className="bg-white p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-700/10 border-b-2 border-transparent hover:border-blue-700 group text-left shadow-sm border border-slate-200"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                      <Icon size={24} className="text-blue-700" />
                    </div>
                    <StatusBadge status={pool.status} utilizationRate={pool.utilization_rate} />
                  </div>
                  <h5 className="font-bold text-lg mb-1 text-slate-900">{pool.pool_name}</h5>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-slate-900">{pool.total_capacity}</span>
                    <span className="text-slate-400 text-sm mb-1">Units Total</span>
                  </div>
                </button>
              );
            })}
            <button
              onClick={onCreateNew}
              className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 text-slate-400 group-hover:text-blue-700 transition-colors">
                <PlusCircle size={32} />
              </div>
              <span className="font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Define New Pool</span>
              <span className="text-xs text-slate-400 max-w-[120px] mt-1">Add specialized medical equipment or units</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
