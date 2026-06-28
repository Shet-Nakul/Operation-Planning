import React from 'react';
import { motion } from 'motion/react';
import {
  ChevronRight,
  History,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  User,
} from 'lucide-react';
import { MOCK_UNITS } from './constants';
import { ResourcePool } from './types';

interface PoolDetailsViewProps {
  pool: ResourcePool;
  onBack: () => void;
}

export const PoolDetailsView = ({ pool, onBack }: PoolDetailsViewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-8 lg:p-12 overflow-y-auto pb-32"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-8">
          <div>
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <button onClick={onBack} className="hover:text-blue-700 transition-colors">Resources</button>
              <ChevronRight size={14} />
              <span className="text-blue-700 font-semibold">{pool.name} Pool</span>
            </nav>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Bed Pool Management</h1>
          </div>
          <div className="flex gap-12">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Current Occupancy</p>
              <div className="flex items-baseline justify-end gap-2">
                <span className="text-5xl font-black text-blue-700">32</span>
                <span className="text-2xl text-slate-400">/ 40</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Utilization Rate</p>
              <span className="text-5xl font-black text-teal-700">80%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 bg-slate-50 rounded-xl p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Unit Map: Intensive Care Unit</h3>
              <div className="flex gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-teal-700"></span>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span>Occupied</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {MOCK_UNITS.map((unit) => (
                <div
                  key={unit.id}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center border-b-2 shadow-sm transition-all hover:scale-105 cursor-pointer ${
                    unit.status === 'available'
                      ? 'bg-white border-teal-700'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <span className={`text-[10px] font-bold ${unit.status === 'available' ? 'text-slate-400' : 'text-red-600'}`}>
                    {unit.id}
                  </span>
                  {unit.status === 'available' ? (
                    <CheckCircle2 size={16} className="text-teal-700" />
                  ) : (
                    <User size={16} className="text-red-500 fill-red-500" />
                  )}
                </div>
              ))}
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
                      defaultValue="40"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Beds</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 italic">Changing the total pool capacity will trigger an enterprise-wide resource sync and may affect active scheduling workflows.</p>
                <button className="w-full bg-blue-700 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors shadow-md active:scale-95">
                  Apply Changes
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Resource Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Maintenance Schedule</span>
                  <span className="bg-teal-100/80 text-teal-700 px-2 py-0.5 rounded text-[10px] font-bold">OPTIMAL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Turnover Time</span>
                  <span className="text-sm font-bold text-slate-900">14.2 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Projected Load (24h)</span>
                  <span className="text-sm font-bold text-red-600">92%</span>
                </div>
              </div>
              <div className="mt-6">
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '80%' }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                    className="h-full bg-gradient-to-r from-blue-700 to-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 pt-6">
          <div className="flex items-center gap-3 text-slate-500">
            <History size={16} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-tighter">Last Modified</p>
              <p className="text-xs font-medium">Today, 14:22 by Dr. Aris Thorne</p>
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
