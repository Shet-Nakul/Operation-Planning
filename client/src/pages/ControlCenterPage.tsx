import React from 'react';
import { motion } from 'motion/react';
import { Activity, Calendar, MoreVertical, AlertTriangle, CheckCircle2, User, History, BarChart3, CalendarDays, Users, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const ongoingSurgeries = [
  {
    id: 'OR-04',
    patient: 'Elias Thorne',
    surgeon: 'Dr. Aris Thorne',
    specialty: 'Cardiovascular',
    elapsed: '1h 45m',
    estimated: '2h 15m',
    progress: 78,
    status: 'on-track'
  },
  {
    id: 'OR-09',
    patient: 'Sarah Jenkins',
    surgeon: 'Dr. Mira Kalu',
    specialty: 'Orthopedic',
    elapsed: '0h 40m',
    estimated: '3h 00m',
    progress: 22,
    status: 'on-track'
  },
  {
    id: 'OR-02',
    patient: 'Robert Chen',
    surgeon: 'Dr. Samuel Lee',
    specialty: 'Neuro',
    elapsed: '4h 10m',
    estimated: '3h 30m',
    progress: 100,
    status: 'overtime'
  }
];

const backlogItems = [
  {
    name: 'Alice Marigold',
    uid: '#772-B',
    surgeon: 'Dr. Helen Wu',
    priority: 'EMERGENCY',
    window: 'EXPIRED',
    deadline: '08:30 AM',
    feasibility: 'Critical Delay',
    status: 'error'
  },
  {
    name: 'Markus Vane',
    uid: '#910-S',
    surgeon: 'Dr. Peter Gantz',
    priority: 'MANDATORY',
    window: '11:00 AM - 01:30 PM',
    deadline: 'Next Slot: 11:15 AM',
    feasibility: 'High (OR-05)',
    status: 'success'
  },
  {
    name: 'Sienna Blake',
    uid: '#441-X',
    surgeon: 'Dr. Laura Singh',
    priority: 'ELECTIVE',
    window: '02:00 PM - 03:00 PM',
    deadline: 'Scheduled: Today',
    feasibility: 'Awaiting Staff',
    status: 'warning'
  }
];

export default function ControlCenterPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 space-y-10"
    >
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1 font-manrope">Operational Control Center</h1>
        <p className="text-slate-500 text-sm font-medium">Live systemic overview of active, planned, and archived surgical units.</p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="text-blue-700 w-5 h-5" />
            Ongoing Surgeries
          </h2>
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">3 Active Units</span>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {ongoingSurgeries.map((surgery) => (
            <div key={surgery.id} className={cn(
              "bg-white p-6 rounded-xl relative overflow-hidden group border border-slate-200",
              surgery.status === 'overtime' && "border-l-4 border-rose-500"
            )}>
              <div className="absolute top-0 right-0 p-3">
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded",
                  surgery.status === 'overtime' ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                )}>{surgery.id}</span>
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-1">{surgery.patient}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {surgery.surgeon} • {surgery.specialty}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-semibold">
                  <span className={cn(surgery.status === 'overtime' ? "text-rose-600 font-bold" : "text-slate-500")}>
                    Elapsed: {surgery.elapsed} {surgery.status === 'overtime' && '(Overtime)'}
                  </span>
                  <span className="text-blue-700">Est: {surgery.estimated}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      surgery.status === 'overtime' ? "bg-rose-500" : "bg-gradient-to-r from-blue-600 to-blue-400"
                    )}
                    style={{ width: `${surgery.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-manrope">Today's Operating Schedule</h3>
            <p className="text-sm text-slate-500">Active and confirmed procedures for Tuesday, Oct 24.</p>
          </div>
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
            <button className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 rounded-md">Timeline View</button>
            <button className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">OR List</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="text-center bg-blue-700 text-white px-3 py-2 rounded-lg">
                  <p className="text-[10px] font-bold uppercase">Oct</p>
                  <p className="text-xl font-bold font-manrope">24</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Tuesday</h4>
                  <p className="text-xs text-slate-500">6 Procedures Scheduled</p>
                </div>
              </div>
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <img 
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white" 
                    src={`https://picsum.photos/seed/doc${i}/100/100`}
                    referrerPolicy="no-referrer"
                  />
                ))}
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold border-2 border-white text-slate-500">+4</div>
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              <ScheduleItem 
                time="08:00 AM" 
                duration="120 min" 
                title="Total Hip Arthroplasty" 
                status="Post-Op" 
                room="OR Suite 4" 
                surgeon="Dr. Julian Thorne"
                color="emerald"
              />
              <ScheduleItem 
                time="10:30 AM" 
                duration="90 min" 
                title="Appendectomy" 
                status="In Progress" 
                room="OR Suite 2" 
                surgeon="Dr. Sarah Chen"
                color="blue"
              />
              <ScheduleItem 
                time="01:15 PM" 
                duration="180 min" 
                title="Coronary Artery Bypass Graft" 
                status="Confirmed" 
                room="OR Suite 1" 
                surgeon="Dr. Alistair Vance"
                color="slate"
                dimmed
              />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white rounded-xl p-6 relative overflow-hidden group">
              <div className="relative z-10">
                <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">OR Occupancy</h5>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-manrope font-extrabold">84%</span>
                  <span className="text-emerald-400 text-xs font-bold pb-1 flex items-center">
                    <Activity className="w-3 h-3 mr-1" /> +5%
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Optimal range reached (75-90%)</p>
                <div className="mt-6 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[84%]"></div>
                </div>
              </div>
              <BarChart3 className="absolute -right-8 -bottom-8 text-white/10 w-32 h-32 group-hover:scale-110 transition-transform" />
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h5 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 font-inter">Surgical Staff On-Site</h5>
              <div className="space-y-4">
                <StaffRow label="Surgeons" count="12 / 14" color="bg-emerald-500" />
                <StaffRow label="Anesthesiologists" count="08 / 08" color="bg-emerald-500" />
                <StaffRow label="Nurses (Surgical)" count="28 / 32" color="bg-orange-500" />
              </div>
              <button className="w-full mt-6 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                View Staff Roster
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-rose-900 leading-tight">Sterilization Delay</p>
                <p className="text-xs text-rose-700 mt-1">Instrument set for OR 2 is delayed. Potential 15-min shift in start time.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="text-slate-600 w-5 h-5" />
            Operation Backlog
          </h2>
          <div className="flex gap-2">
            <button className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors">Optimize Schedule</button>
            <button className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded hover:bg-slate-200 transition-colors">Export Manifest</button>
          </div>
        </div>
        <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Patient Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Lead Surgeon</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Preferred Window</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Feasibility</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {backlogItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold">{item.name}</p>
                    <p className="text-[10px] text-slate-500">UID: {item.uid}</p>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-medium">{item.surgeon}</td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "text-[10px] font-black px-2 py-1 rounded",
                      item.priority === 'EMERGENCY' ? "bg-rose-100 text-rose-700" :
                      item.priority === 'MANDATORY' ? "bg-blue-100 text-blue-700" :
                      "bg-slate-100 text-slate-600"
                    )}>{item.priority}</span>
                  </td>
                  <td className="px-6 py-5">
                    <p className={cn("text-sm font-bold", item.window === 'EXPIRED' ? "text-rose-600" : "text-slate-900")}>{item.window}</p>
                    <p className="text-[10px] text-slate-500">{item.deadline}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        item.status === 'error' ? "bg-rose-500" :
                        item.status === 'success' ? "bg-emerald-500" :
                        "bg-amber-500"
                      )}></div>
                      <span className={cn(
                        "text-xs font-bold",
                        item.status === 'error' ? "text-rose-600" : "text-slate-600"
                      )}>{item.feasibility}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="text-slate-400 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-full transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <History className="text-slate-400 w-5 h-5" />
            Surgery History
          </h2>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last 24 Hours</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HistoryItem name="Jonathan Reed" lead="Dr. Vance • Cholecystectomy" time="07:15 AM" deviation="-5m (Ahead)" status="success" />
          <HistoryItem name="Maria Gonzales" lead="Dr. Kalu • Joint Revision" time="06:40 AM" deviation="+18m (Delay)" status="error" />
          <HistoryItem name="Oliver Quinn" lead="Dr. Thorne • Hernia Repair" time="05:22 AM" deviation="On Schedule" status="success" />
          <HistoryItem name="Beatrix Kiddo" lead="Dr. Wu • ACL Reconstruction" time="04:10 AM" deviation="On Schedule" status="success" />
        </div>
      </section>
    </motion.div>
  );
}

function HistoryItem({ name, lead, time, deviation, status }: any) {
  return (
    <div className={cn(
      "bg-slate-50 p-5 rounded-lg flex items-center justify-between border-l-2",
      status === 'success' ? "border-emerald-500" : "border-rose-500/30"
    )}>
      <div>
        <p className="text-sm font-bold">{name}</p>
        <p className="text-xs text-slate-500">{lead}</p>
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-bold", status === 'success' ? "text-emerald-700" : "text-slate-900")}>Completed {time}</p>
        <p className={cn("text-[10px] font-bold", status === 'error' ? "text-rose-600" : "text-slate-500")}>Deviation: {deviation}</p>
      </div>
    </div>
  );
}

function ScheduleItem({ time, duration, title, status, room, surgeon, color, dimmed = false }: any) {
  return (
    <div className="p-6 flex items-start gap-6 hover:bg-slate-50/50 transition-colors">
      <div className="w-20 pt-1 shrink-0">
        <p className={cn("text-sm font-bold", dimmed ? "text-slate-400" : "text-slate-900")}>{time}</p>
        <p className="text-xs text-slate-400">{duration}</p>
      </div>
      <div className={cn(
        "flex-1 rounded-xl p-4 border-l-4",
        color === 'emerald' ? "bg-slate-50 border-emerald-500" :
        color === 'blue' ? "bg-blue-50 border-blue-500" :
        "bg-white border-slate-300 border",
        dimmed && "opacity-60"
      )}>
        <div className="flex justify-between items-start mb-2">
          <h5 className="text-sm font-bold text-slate-900">{title}</h5>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase",
            color === 'emerald' ? "bg-emerald-100 text-emerald-700" :
            color === 'blue' ? "bg-blue-100 text-blue-700" :
            "bg-slate-100 text-slate-500"
          )}>{status}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3 h-3 text-slate-400" />
            <span className="text-slate-600">{room}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-slate-400" />
            <span className="text-slate-600">{surgeon}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StaffRow({ label, count, color }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn("w-2 h-2 rounded-full", color)}></div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <span className="text-sm font-bold">{count}</span>
    </div>
  );
}
