import { Clock, Plus, Minus } from 'lucide-react';
import { motion } from 'motion/react';

interface WeeklyCommitmentProps {
  hours: number;
  setHours: (val: number | ((prev: number) => number)) => void;
  breaks: number;
  setBreaks: (val: number | ((prev: number) => number)) => void;
  days: number;
  setDays: (val: number | ((prev: number) => number)) => void;
}

export default function WeeklyCommitment({ hours, setHours, breaks, setBreaks, days, setDays }: WeeklyCommitmentProps) {
  return (
    <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 min-h-[400px] flex flex-col justify-center items-center text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary to-primary/10 opacity-20"></div>
      
      <h2 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-12 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Total Weekly Commitment
      </h2>
      
      <div className="flex items-center gap-12">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setHours(p => Math.max(0, p - 0.5))}
          className="w-16 h-16 flex items-center justify-center bg-slate-50 hover:bg-primary hover:text-white text-slate-400 rounded-full transition-all shadow-inner border border-slate-100"
        >
          <Minus className="w-8 h-8" />
        </motion.button>
        
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-2">
            <span className="text-9xl font-black text-slate-900 tracking-tighter">{hours.toFixed(1)}</span>
            <span className="text-3xl font-bold text-primary">hrs</span>
          </div>
          <p className="text-slate-400 font-semibold mt-4 tracking-wide">Guaranteed hours per week</p>
        </div>
        
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setHours(p => p + 0.5)}
          className="w-16 h-16 flex items-center justify-center bg-slate-50 hover:bg-primary hover:text-white text-slate-400 rounded-full transition-all shadow-inner border border-slate-100"
        >
          <Plus className="w-8 h-8" />
        </motion.button>
      </div>
      
      <div className="mt-16 grid gap-8 w-full grid-cols-2 max-w-md">
        <SmallCounter 
          label="Weekly Break" 
          value={breaks.toFixed(1)} 
          unit="hrs" 
          onAdd={() => setBreaks(p => p + 0.5)}
          onRemove={() => setBreaks(p => Math.max(0, p - 0.5))}
        />
        <SmallCounter 
          label="Active Days" 
          value={days.toString()} 
          unit="/ 7" 
          onAdd={() => setDays(p => Math.min(7, p + 1))}
          onRemove={() => setDays(p => Math.max(1, p - 1))}
        />
      </div>
    </div>
  );
}

interface SmallCounterProps {
  label: string;
  value: string;
  unit: string;
  onAdd: () => void;
  onRemove: () => void;
}

function SmallCounter({ label, value, unit, onAdd, onRemove }: SmallCounterProps) {
  return (
    <div className="text-center p-5 bg-slate-50 rounded-2xl flex flex-col items-center gap-3 border border-slate-100/50">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="flex items-center gap-4">
        <button 
          onClick={onRemove}
          className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm text-primary hover:bg-primary hover:text-white transition-all border border-slate-100 active:scale-90"
        >
          <Minus className="w-4 h-4" />
        </button>
        <p className="text-xl font-extrabold text-slate-800">
          {value} <span className="text-xs font-medium opacity-50">{unit}</span>
        </p>
        <button 
          onClick={onAdd}
          className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm text-primary hover:bg-primary hover:text-white transition-all border border-slate-100 active:scale-90"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
