import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Cpu, Package, Rocket } from 'lucide-react';

interface CreatePoolViewProps {
  onCancel: () => void;
}

export const CreatePoolView = ({ onCancel }: CreatePoolViewProps) => {
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
            />
          </div>
          <div className="group">
            <label className="block text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">Total Unit Count</label>
            <div className="flex items-center gap-6">
              <input
                className="w-32 bg-white border-0 border-b-2 border-slate-200 focus:border-blue-700 focus:ring-0 text-3xl font-bold transition-all py-4 text-slate-900"
                min="1"
                type="number"
                defaultValue="1"
              />
              <span className="text-slate-400 font-medium italic">Individual operational units available for dispatch.</span>
            </div>
          </div>
          <div className="group">
            <label className="block text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">Special Notes</label>
            <textarea
              className="w-full bg-white border-0 border-b-2 border-slate-200 focus:border-blue-700 focus:ring-0 text-lg leading-relaxed transition-all placeholder:text-slate-300 py-4 resize-none text-slate-900"
              placeholder="Enter maintenance schedules, sterilization requirements, or specific departmental restrictions..."
              rows={5}
            />
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
        <button className="bg-gradient-to-br from-blue-700 to-blue-800 text-white font-bold px-10 py-4 rounded-lg shadow-lg shadow-blue-700/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
          <span>Create Pool</span>
          <Rocket size={18} />
        </button>
      </div>
    </motion.div>
  );
};
