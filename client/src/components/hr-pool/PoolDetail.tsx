import React from 'react';
import {
  ChevronRight,
  Edit,
  Plus,
  ChevronLeft,
  Sun,
  CloudSun,
  Moon,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Info
} from 'lucide-react';
import { MOCK_MEMBERS } from '../hr-pool/constants';
import { motion } from 'motion/react';

export const PoolDetail: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 pb-20">
      <div className="flex-1 space-y-8">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <span>Resource Pools</span>
              <ChevronRight className="w-3 h-3" />
              <span className="font-bold text-blue-700">Trauma Surgical Team</span>
            </nav>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Trauma Surgical Team</h1>
            <p className="text-slate-500 mt-1 font-medium">Surgical Services • North Wing Level 4</p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center gap-2 hover:bg-slate-200 transition-all">
              <Edit className="w-4 h-4" /> Edit Config
            </button>
            <button className="px-5 py-3 rounded-xl bg-gradient-to-br from-blue-700 to-blue-800 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-700/20 hover:scale-[1.02] transition-all">
              <Plus className="w-4 h-4" /> Assign Resource
            </button>
          </div>
        </section>

        <section className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">Current Week Planning</h2>
            <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
              <button className="p-1 hover:bg-slate-50 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-bold">Oct 23 - Oct 29, 2023</span>
              <button className="p-1 hover:bg-slate-50 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
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
                <tr className="bg-white group hover:shadow-md transition-all">
                  <td className="p-4 rounded-l-2xl font-bold border-l-4 border-blue-500">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-blue-500" />
                      Morning
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">06:00 - 14:00</span>
                  </td>
                  <td className="p-4"><div className="flex flex-col"><span className="text-lg font-extrabold">12/12</span><span className="text-[10px] text-teal-700 font-bold uppercase">Fulfilled</span></div></td>
                  <td className="p-4"><div className="flex flex-col"><span className="text-lg font-extrabold">12/12</span><span className="text-[10px] text-teal-700 font-bold uppercase">Fulfilled</span></div></td>
                  <td className="p-4 bg-red-50/50"><div className="flex flex-col"><span className="text-lg font-extrabold text-red-600">9/12</span><span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Shortage</span></div></td>
                  <td className="p-4"><div className="flex flex-col"><span className="text-lg font-extrabold">12/12</span><span className="text-[10px] text-teal-700 font-bold uppercase">Fulfilled</span></div></td>
                  <td className="p-4"><div className="flex flex-col"><span className="text-lg font-extrabold">12/12</span><span className="text-[10px] text-teal-700 font-bold uppercase">Fulfilled</span></div></td>
                  <td className="p-4"><div className="flex flex-col"><span className="text-lg font-extrabold">8/8</span><span className="text-[10px] text-teal-700 font-bold uppercase">Fulfilled</span></div></td>
                  <td className="p-4 rounded-r-2xl"><div className="flex flex-col"><span className="text-lg font-extrabold">8/8</span><span className="text-[10px] text-teal-700 font-bold uppercase">Fulfilled</span></div></td>
                </tr>
                <tr className="bg-white group hover:shadow-md transition-all">
                  <td className="p-4 rounded-l-2xl font-bold border-l-4 border-orange-400">
                    <div className="flex items-center gap-2">
                      <CloudSun className="w-4 h-4 text-orange-400" />
                      Afternoon
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">14:00 - 22:00</span>
                  </td>
                  <td className="p-4"><span className="text-lg font-extrabold">10/10</span></td>
                  <td className="p-4"><span className="text-lg font-extrabold">10/10</span></td>
                  <td className="p-4"><span className="text-lg font-extrabold">10/10</span></td>
                  <td className="p-4 bg-red-50/50"><div className="flex flex-col"><span className="text-lg font-extrabold text-red-600">7/10</span><span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Shortage</span></div></td>
                  <td className="p-4"><span className="text-lg font-extrabold">10/10</span></td>
                  <td className="p-4"><span className="text-lg font-extrabold">6/6</span></td>
                  <td className="p-4 rounded-r-2xl"><span className="text-lg font-extrabold">6/6</span></td>
                </tr>
                <tr className="bg-white group hover:shadow-md transition-all">
                  <td className="p-4 rounded-l-2xl font-bold border-l-4 border-indigo-700">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-700" />
                      Night
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">22:00 - 06:00</span>
                  </td>
                  <td className="p-4"><span className="text-lg font-extrabold">6/6</span></td>
                  <td className="p-4 bg-red-50/50"><div className="flex flex-col"><span className="text-lg font-extrabold text-red-600">4/6</span><span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Shortage</span></div></td>
                  <td className="p-4"><span className="text-lg font-extrabold">6/6</span></td>
                  <td className="p-4"><span className="text-lg font-extrabold">6/6</span></td>
                  <td className="p-4"><span className="text-lg font-extrabold">6/6</span></td>
                  <td className="p-4"><span className="text-lg font-extrabold">4/4</span></td>
                  <td className="p-4 rounded-r-2xl"><span className="text-lg font-extrabold">4/4</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
              Active Resources
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">28 People Assigned</span>
            </h3>
            <div className="space-y-4">
              {MOCK_MEMBERS.slice(0, 3).map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-200">
                  <div className="flex items-center gap-4">
                    <img className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm" src={member.avatar} alt={member.name} />
                    <div>
                      <p className="font-bold text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{member.role}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${
                    member.type === 'STATIC' ? 'bg-teal-100/50 text-teal-700' : 'bg-blue-100 text-blue-700'
                  }`}>{member.type}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-50/30 rounded-2xl p-8 relative overflow-hidden border border-red-200/50">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-red-600 mb-6">
                <AlertCircle className="w-6 h-6 fill-red-600 text-white" />
                <h3 className="font-bold text-lg">Critical Shortages</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-red-500">
                  <p className="text-sm font-bold text-slate-900">Wed - Morning Shift</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">3 Surgeons missing. Demand high due to elective overflow.</p>
                  <button className="mt-4 text-[10px] font-bold text-blue-700 flex items-center gap-1 uppercase tracking-widest hover:gap-2 transition-all">
                    Request Reinforcements <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-red-500">
                  <p className="text-sm font-bold text-slate-900">Thu - Afternoon Shift</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">2 Scrub Nurses missing. Staff on sick leave.</p>
                  <button className="mt-4 text-[10px] font-bold text-blue-700 flex items-center gap-1 uppercase tracking-widest hover:gap-2 transition-all">
                    Request Reinforcements <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-red-500/5 rounded-full blur-3xl"></div>
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
                <span className="font-extrabold text-blue-700">65%</span>
              </div>
              <div className="w-full h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-blue-700 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="font-bold text-slate-700">Dynamic / Float</span>
                <span className="font-extrabold text-blue-600">35%</span>
              </div>
              <div className="w-full h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Weekly Capacity</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-blue-700 tracking-tighter">1,120</span>
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
    </div>
  );
};
