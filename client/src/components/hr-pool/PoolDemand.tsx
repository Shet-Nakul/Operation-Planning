import React from 'react';
import {
  Save,
  Calendar,
  TrendingUp,
  Info,
  History,
  FileText,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { ViewState } from '../hr-pool/types';

interface PoolDemandProps {
  onNavigate: (view: ViewState) => void;
  lastSavedDate?: string;
  onSave?: () => void;
}

export const PoolDemand: React.FC<PoolDemandProps> = ({ 
  onNavigate, 
  lastSavedDate = "2025-01-20",
  onSave = () => {} 
}) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const shifts = [
    { name: 'Morning', time: '07:00 - 15:00', values: [12, 12, 14, 14, 12, 8, 8] },
    { name: 'Afternoon', time: '15:00 - 23:00', values: [10, 10, 12, 12, 10, 6, 6] },
    { name: 'Night', time: '23:00 - 07:00', values: [6, 6, 8, 8, 6, 4, 4] },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <button onClick={() => onNavigate('directory')} className="hover:text-blue-700 transition-colors">Resource Pools</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-700 font-semibold">Weekly Demand Matrix</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Weekly Demand Matrix</h1>
          <p className="text-slate-500 max-w-lg text-lg">Configure baseline headcount requirements per shift to drive automated scheduling.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => onNavigate('new-pool')}
            className="px-6 py-3 rounded-xl text-slate-600 bg-slate-100 font-bold transition-all hover:bg-slate-200"
          >
            Back to Config
          </button>
          <button
            onClick={onSave}
            className="px-8 py-3 rounded-xl text-white bg-blue-700 font-bold shadow-xl shadow-blue-700/20 transition-all hover:scale-[1.02] flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Demand Baseline
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-9 space-y-8">
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-blue-50/50">
              <h3 className="text-lg font-bold text-slate-900">Weekly Demand Matrix</h3>
              <div className="flex items-center gap-2">
                <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-[10px] font-bold border border-teal-300 uppercase tracking-widest">Active Draft</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50/30">
                    <th className="p-6 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-48">Shift Time</th>
                    {days.map(day => (
                      <th key={day} className={`p-6 text-center text-[10px] font-bold uppercase tracking-widest ${day === 'Sun' ? 'text-blue-700' : 'text-slate-400'}`}>{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {shifts.map((shift) => (
                    <tr key={shift.name} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="p-6 bg-blue-50/20">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{shift.name}</span>
                          <span className="text-[10px] font-bold text-slate-400">{shift.time}</span>
                        </div>
                      </td>
                      {shift.values.map((val, i) => (
                        <td key={i} className={`p-4 border-r border-slate-200/50 text-center ${i >= 5 ? 'bg-blue-50/30' : ''}`}>
                          <input
                            type="number"
                            defaultValue={val}
                            className="w-14 h-12 text-center text-lg font-extrabold bg-white border-0 border-b-2 border-slate-200 focus:border-blue-700 focus:ring-0 transition-all rounded-lg shadow-sm"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl flex items-center gap-6 border border-slate-200 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-blue-100/50 flex items-center justify-center text-blue-700">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Compliance Check</h4>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">Current configuration meets the 1:4 Nurse-to-Patient ratio mandatory for Ward A surgical protocols.</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl flex items-center gap-6 border border-slate-200 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-teal-100/50 flex items-center justify-center text-teal-700">
                <History className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Last Modified</h4>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">Admin (ID: 442) updated the Wed/Thu surge requirements 2 days ago.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-8">
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-5 h-5 text-blue-700" />
              <h3 className="font-bold text-slate-900">Demand Period</h3>
            </div>
            <div className="space-y-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Effective from</p>
                <p className="font-bold text-slate-900">{lastSavedDate}</p>
              </div>
              <div className="flex items-center gap-2 text-teal-700 bg-teal-100/30 px-4 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Baseline Validated</span>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-slate-900 to-blue-700 p-8 rounded-2xl text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="font-bold text-lg">Weekly Man-Hours</h3>
              <TrendingUp className="w-6 h-6 text-blue-300" />
            </div>
            <div className="mb-8 relative z-10">
              <span className="text-5xl font-extrabold tracking-tighter">1,456</span>
              <span className="text-blue-200/60 ml-2 font-bold text-lg">hrs</span>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-blue-100/70">Projected Budget</span>
                <span>$124,800</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full w-3/4 shadow-[0_0_10px_rgba(13,148,136,0.5)]"></div>
              </div>
              <p className="text-[10px] font-bold text-blue-200/50 uppercase tracking-widest">75% of quarterly allocation</p>
            </div>
          </section>

          <div className="bg-slate-100/50 p-6 rounded-2xl border border-slate-200/50">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-700 mt-0.5" />
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                Demand configurations set here will automatically populate the Schedule builder and trigger recruitment alerts if gaps exceed 15%.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 right-0 left-0 lg:left-64 h-12 bg-white/80 backdrop-blur-md flex items-center px-10 border-t border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest justify-between z-40">
        <div className="flex items-center gap-8">
          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> System Ready</span>
          <span>Ward Capacity: 32 Beds</span>
          <span>Nurse/Patient: 1:4</span>
        </div>
        <div>Clinical Curator v4.2.0</div>
      </footer>
    </div>
  );
};
