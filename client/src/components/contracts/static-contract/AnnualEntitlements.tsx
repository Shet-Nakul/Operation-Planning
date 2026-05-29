import { CalendarCheck, Plus, Minus } from 'lucide-react';

interface AnnualEntitlementsProps {
  leaves: number;
  setLeaves: (val: number | ((prev: number) => number)) => void;
  shifts: number;
  setShifts: (val: number | ((prev: number) => number)) => void;
}

export default function AnnualEntitlements({ leaves, setLeaves, shifts, setShifts }: AnnualEntitlementsProps) {
  return (
    <div className="bg-white p-6 rounded-2xl space-y-6 shadow-sm border border-slate-100">
      <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
        <CalendarCheck className="w-5 h-5" />
        Annual Entitlements
      </h2>
      
      <div className="space-y-4">
        <EntitlementItem 
          label="Yearly Leaves" 
          value={leaves.toString()} 
          unit="days" 
          onAdd={() => setLeaves(p => p + 1)}
          onRemove={() => setLeaves(p => Math.max(0, p - 1))}
        />
        <EntitlementItem 
          label="Preferred Shifts" 
          value={shifts.toString()} 
          unit="credits" 
          onAdd={() => setShifts(p => p + 1)}
          onRemove={() => setShifts(p => Math.max(0, p - 1))}
        />
      </div>
    </div>
  );
}

interface EntitlementItemProps {
  label: string;
  value: string;
  unit: string;
  onAdd: () => void;
  onRemove: () => void;
}

function EntitlementItem({ label, value, unit, onAdd, onRemove }: EntitlementItemProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100/50">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tighter">
          {value} <span className="text-sm font-medium text-slate-400">{unit}</span>
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <button 
          onClick={onAdd}
          className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm text-primary hover:bg-primary hover:text-white transition-all border border-slate-100 active:scale-90"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm text-primary hover:bg-primary hover:text-white transition-all border border-slate-100 active:scale-90"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
