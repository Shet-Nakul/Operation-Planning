import { FileText } from 'lucide-react';

interface ValidationBarProps {
  hours: number;
}

export default function ValidationBar({ hours }: ValidationBarProps) {
  const fte = (hours / 40).toFixed(1);
  const isFullTime = hours >= 40;

  return (
    <div className="bg-slate-900 p-8 rounded-3xl text-white flex flex-wrap gap-12 items-center shadow-2xl shadow-slate-900/40 border border-white/5">
      <div className="flex-1 min-w-[280px]">
        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Contract Validation</h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          This static template will automatically generate shifts for all assigned individuals following the weekly logic defined above.
        </p>
      </div>
      
      <div className="flex flex-wrap gap-12 items-center">
        <div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Calculated FTE</p>
          <p className="text-3xl font-black tracking-tight">
            {fte} <span className="text-sm font-medium opacity-40">{isFullTime ? 'Full Time' : 'Part Time'}</span>
          </p>
        </div>
        
        <div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Compliance Status</p>
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${hours > 0 ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]' : 'bg-red-400'}`}></span>
            <p className="text-xl font-bold tracking-tight">{hours > 0 ? 'Compliant' : 'Non-Compliant'}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <button 
            onClick={() => alert('Generating PDF Schedule...')}
            className="px-8 py-4 rounded-2xl text-sm font-extrabold text-white bg-primary hover:bg-primary-container transition-all shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95"
          >
            <FileText className="w-4 h-4" />
            Preview PDF Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
