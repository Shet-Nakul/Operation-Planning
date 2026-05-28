import React from 'react';
import { motion } from 'motion/react';
import { 
  Timer, 
  CalendarX, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight,
  Stethoscope,
  Scissors,
  Brush
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';

const occupancyData = [
  { day: 'Mon', value: 60 },
  { day: 'Tue', value: 80 },
  { day: 'Wed', value: 75 },
  { day: 'Thu', value: 95 },
  { day: 'Fri', value: 85 },
  { day: 'Sat', value: 90 },
  { day: 'Sun', value: 88 },
];

const icuData = [
  { date: '01 Nov', value: 40 },
  { date: '05 Nov', value: 55 },
  { date: '10 Nov', value: 70 },
  { date: '15 Nov', value: 85 },
  { date: '20 Nov', value: 65 },
  { date: '25 Nov', value: 92 },
  { date: '30 Nov', value: 85 },
];

export default function AnalyticsPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8 max-w-7xl mx-auto"
    >
      <header className="flex justify-between items-end mb-4">
        <div>
          <span className="text-blue-700 font-bold text-sm tracking-widest uppercase">Live Operational Status</span>
          <h2 className="text-4xl font-extrabold text-slate-900 mt-2 tracking-tight font-manrope">Analytics Command</h2>
        </div>
        <div className="bg-white p-4 rounded-xl flex flex-col items-end shadow-sm border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">System Efficiency</span>
          <span className="text-2xl font-bold text-emerald-600">94.2%</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          icon={Timer} 
          label="Avg. Delay from Plan" 
          value="14.5m" 
          trend="+12% vs LW" 
          trendColor="text-rose-600" 
          trendBg="bg-rose-50"
          hoverPrimary
        />
        <MetricCard 
          icon={CalendarX} 
          label="Missed Deadlines" 
          value="3" 
          trend="-4% vs LW" 
          trendColor="text-emerald-600" 
          trendBg="bg-emerald-50"
        />
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-slate-900">OR Occupancy Trend</h4>
            <span className="text-xs font-medium text-slate-500">Current: 88%</span>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyData}>
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === occupancyData.length - 1 ? '#1d4ed8' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="md:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-rose-600 w-5 h-5" />
              <h4 className="text-sm font-bold text-slate-900">Low Stock Alerts</h4>
            </div>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">4 Critical</span>
          </div>
          <div className="space-y-3">
            <StockItem label="O- Blood Type" threshold="10 Units" current="2 Units" />
            <StockItem label="Propofol (20ml)" threshold="50 Vials" current="8 Vials" />
            <StockItem label="Surgical Gowns (L)" threshold="100 Qty" current="12 Qty" />
          </div>
          <button className="mt-auto text-[10px] font-bold text-blue-700 hover:underline flex items-center justify-center gap-1 pt-2">
            Refill Request <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-bold">Performed Procedures by Type</h3>
              <p className="text-xs text-slate-500">Monthly volume distribution across case urgency</p>
            </div>
            <div className="flex gap-4">
              <LegendItem color="bg-blue-700" label="Elective" />
              <LegendItem color="bg-slate-400" label="Mandatory" />
              <LegendItem color="bg-rose-500" label="Emergency" />
            </div>
          </div>
          <div className="space-y-8">
            <ProgressBar label="Elective Procedures" count="142 Cases" percent={65} color="bg-blue-700" />
            <ProgressBar label="Mandatory Procedures" count="58 Cases" percent={25} color="bg-slate-400" />
            <ProgressBar label="Emergency Surgeries" count="22 Cases" percent={10} color="bg-rose-500" />
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold mb-2">OR Time Distribution</h3>
          <p className="text-xs text-slate-500 mb-8">Average 24h utilization cycle</p>
          <div className="flex-1 flex flex-col justify-center gap-6">
            <TimeDistItem icon={Stethoscope} label="Surgery" percent={62} color="bg-blue-700" />
            <TimeDistItem icon={Scissors} label="Preparation" percent={23} color="bg-slate-400" />
            <TimeDistItem icon={Brush} label="Cleaning" percent={15} color="bg-emerald-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-blue-700 text-white p-8 rounded-xl flex flex-col justify-between shadow-lg shadow-blue-700/20">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase opacity-70">Current Load</span>
            <h3 className="text-4xl font-extrabold mt-2 font-manrope">ICU Unit</h3>
          </div>
          <div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-5xl font-extrabold">34</span>
              <span className="text-lg opacity-60 mb-1">/ 40 Beds</span>
            </div>
            <p className="text-sm opacity-80">85% Capacity Reached</p>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">ICU Bed Usage & Utility Rates</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs font-bold bg-slate-100 rounded-full">7 Days</button>
              <button className="px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-full transition-colors">30 Days</button>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={icuData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#1d4ed8" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <footer className="pt-12 border-t border-slate-200 flex justify-between text-xs text-slate-500 font-medium">
        <div className="flex gap-6">
          <span>Data Refresh: Real-time (Active)</span>
          <span>Last Sync: 12:44:02 PM</span>
        </div>
        <div className="flex gap-4">
          <button className="hover:text-blue-700 transition-colors">Export Comprehensive Report</button>
          <button className="hover:text-blue-700 transition-colors">Operational Settings</button>
        </div>
      </footer>
    </motion.div>
  );
}

function MetricCard({ icon: Icon, label, value, trend, trendColor, trendBg, hoverPrimary = false }: any) {
  return (
    <div className={cn(
      "bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between group transition-all duration-300",
      hoverPrimary && "hover:bg-blue-700 hover:border-blue-700"
    )}>
      <div className="flex justify-between items-start">
        <Icon className={cn("w-5 h-5 text-blue-700", hoverPrimary && "group-hover:text-white")} />
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", trendBg, trendColor)}>{trend}</span>
      </div>
      <div className="mt-8">
        <p className={cn("text-sm text-slate-500", hoverPrimary && "group-hover:text-blue-100")}>{label}</p>
        <h3 className={cn("text-3xl font-extrabold text-slate-900", hoverPrimary && "group-hover:text-white")}>{value}</h3>
      </div>
    </div>
  );
}

function StockItem({ label, threshold, current }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <span className="text-xs font-bold">{label}</span>
        <span className="text-[10px] text-slate-500">Threshold: {threshold}</span>
      </div>
      <div className="text-right">
        <span className="text-xs font-bold text-rose-600">{current}</span>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: any) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-3 h-3 rounded-full", color)}></div>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

function ProgressBar({ label, count, percent, color }: any) {
  return (
    <div className="relative">
      <div className="flex justify-between text-xs mb-2 text-slate-500 font-medium">
        <span>{label}</span>
        <span>{count}</span>
      </div>
      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        ></motion.div>
      </div>
    </div>
  );
}

function TimeDistItem({ icon: Icon, label, percent, color }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center bg-opacity-10", color.replace('bg-', 'bg-opacity-10 bg-'))}>
        <Icon className={cn("w-6 h-6", color.replace('bg-', 'text-'))} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-bold">{label}</span>
          <span>{percent}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className={cn("h-full rounded-full", color)}
          ></motion.div>
        </div>
      </div>
    </div>
  );
}
