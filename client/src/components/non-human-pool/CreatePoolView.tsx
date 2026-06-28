import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Cpu, Package, Rocket } from 'lucide-react';
import { createRenewableResourcePool } from '../../lib/api';
import { RenewableResourceType } from './types';

interface CreatePoolViewProps {
  onCancel: () => void;
  onCreated: (poolId: string) => void;
}

export const CreatePoolView = ({ onCancel, onCreated }: CreatePoolViewProps) => {
  const [poolName, setPoolName] = useState('');
  const [resourceType, setResourceType] = useState<RenewableResourceType>('BED');
  const [totalCapacity, setTotalCapacity] = useState<number>(1);
  const [unitPrefix, setUnitPrefix] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = useMemo(() => {
    if (saving) return false;
    if (!poolName.trim()) return false;
    if (!Number.isFinite(totalCapacity) || totalCapacity <= 0) return false;
    return true;
  }, [poolName, saving, totalCapacity]);

  const onSubmit = async () => {
    if (!canCreate) return;
    setSaving(true);
    setError(null);
    try {
      const res = await createRenewableResourcePool({
        organization_id: 1,
        pool_name: poolName.trim(),
        resource_type: resourceType,
        department: department.trim() ? department.trim() : undefined,
        location: location.trim() ? location.trim() : undefined,
        total_capacity: Math.floor(totalCapacity),
        unit_prefix: unitPrefix.trim() ? unitPrefix.trim() : undefined,
        metadata: notes.trim() ? { notes: notes.trim() } : undefined,
      });
      const poolId = String((res as any)?.pool_id ?? '');
      if (!poolId) throw new Error('Pool created but missing pool_id');
      onCreated(poolId);
    } catch (e: any) {
      setError(String(e?.message ?? 'Create failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-8 py-12 lg:px-12 max-w-4xl mx-auto w-full pb-32"
    >
      <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
        <span>Resource Pools</span>
        <ChevronRight size={14} />
        <span className="text-slate-900 font-medium">New Non-Human Pool</span>
      </nav>

      <div className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3">Create Non-Human Pool</h1>
        <p className="text-slate-500 max-w-2xl leading-relaxed">
          Define a new inventory cluster for clinical assets. This will allow for granular tracking of surgical kits, portable imaging units, or sterilized equipment batches across St. Mary's General.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8 space-y-10">
          <div className="group">
            <label className="block text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">Pool Name</label>
            <input
              className="w-full bg-white border-0 border-b-2 border-slate-200 focus:border-blue-700 focus:ring-0 text-xl font-bold transition-all placeholder:text-slate-300 py-4 text-slate-900"
              placeholder="e.g., Cardiology Ventilator Fleet"
              type="text"
              value={poolName}
              onChange={(e) => setPoolName(e.target.value)}
            />
          </div>
          <div className="group">
            <label className="block text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">Resource Type</label>
            <select
              className="w-full bg-white border-0 border-b-2 border-slate-200 focus:border-blue-700 focus:ring-0 text-lg font-semibold transition-all py-4 text-slate-900"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value as RenewableResourceType)}
            >
              <option value="BED">Bed</option>
              <option value="ROOM">Room</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="DEVICE">Device</option>
              <option value="VEHICLE">Vehicle</option>
            </select>
          </div>
          <div className="group">
            <label className="block text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">Total Unit Count</label>
            <div className="flex items-center gap-6">
              <input
                className="w-32 bg-white border-0 border-b-2 border-slate-200 focus:border-blue-700 focus:ring-0 text-3xl font-bold transition-all py-4 text-slate-900"
                min="1"
                type="number"
                value={String(totalCapacity)}
                onChange={(e) => setTotalCapacity(Number(e.target.value))}
              />
              <span className="text-slate-400 font-medium italic">Individual operational units available for dispatch.</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group">
              <label className="block text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">Unit Prefix</label>
              <input
                className="w-full bg-white border-0 border-b-2 border-slate-200 focus:border-blue-700 focus:ring-0 text-lg font-semibold transition-all placeholder:text-slate-300 py-4 text-slate-900"
                placeholder="e.g., ICU"
                type="text"
                value={unitPrefix}
                onChange={(e) => setUnitPrefix(e.target.value)}
              />
            </div>
            <div className="group">
              <label className="block text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">Department</label>
              <input
                className="w-full bg-white border-0 border-b-2 border-slate-200 focus:border-blue-700 focus:ring-0 text-lg font-semibold transition-all placeholder:text-slate-300 py-4 text-slate-900"
                placeholder="e.g., ICU"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className="group md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">Location</label>
              <input
                className="w-full bg-white border-0 border-b-2 border-slate-200 focus:border-blue-700 focus:ring-0 text-lg font-semibold transition-all placeholder:text-slate-300 py-4 text-slate-900"
                placeholder="e.g., Building A • Floor 3"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
          <div className="group">
            <label className="block text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">Special Notes</label>
            <textarea
              className="w-full bg-white border-0 border-b-2 border-slate-200 focus:border-blue-700 focus:ring-0 text-lg leading-relaxed transition-all placeholder:text-slate-300 py-4 resize-none text-slate-900"
              placeholder="Enter maintenance schedules, sterilization requirements, or specific departmental restrictions..."
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            {error ? <div className="mt-3 text-sm font-semibold text-red-600">{error}</div> : null}
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-50 rounded-xl p-6 relative overflow-hidden border border-slate-200">
            <div className="relative z-10">
              <Cpu size={32} className="text-teal-700 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Automated Indexing</h3>
              <p className="text-sm text-slate-500 leading-relaxed">All pools created will be automatically indexed for surgical Gantt charts and OR allocation cycles.</p>
            </div>
            <Package size={120} className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none" />
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">Inventory Preview</h3>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Classification</span>
              <span className="text-sm font-semibold text-slate-900">Non-Human</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Visibility</span>
              <span className="text-sm font-semibold text-slate-900">Global</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-600">Tracking</span>
              <span className="text-sm font-semibold text-teal-700">RFID Enabled</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-slate-200 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="text-slate-500 font-semibold hover:text-red-500 transition-colors px-6 py-3 rounded-lg hover:bg-red-50"
        >
          Cancel
        </button>
        <button
          disabled={!canCreate}
          onClick={onSubmit}
          className="bg-gradient-to-br from-blue-700 to-blue-800 text-white font-bold px-10 py-4 rounded-lg shadow-lg shadow-blue-700/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
        >
          <span>Create Pool</span>
          <Rocket size={18} />
        </button>
      </div>
    </motion.div>
  );
};
