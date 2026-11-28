import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ServerEmployeeRosteringByDate } from '../../services/api-rosterings';

type CalendarShift = { name: string; alias?: string | null; start_time?: string; end_time?: string };

type EmployeeCalendarProps = {
  assignments: ServerEmployeeRosteringByDate;
  shifts: CalendarShift[];
  month: Date;
  selectedDate: string | null;
  loading: boolean;
  error?: string | null;
  requestError?: string;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: string) => void;
};

export default function EmployeeCalendar({ assignments, shifts, month, selectedDate, loading, error, requestError, onMonthChange, onSelectDate }: EmployeeCalendarProps) {
  const shiftVisual = (shift = '') => {
    const raw = shift.trim();
    const code = raw.slice(0, 1).toUpperCase();
    if (raw === 'V') return { code: 'V', label: 'Leave', time: '', badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
    if (!raw || raw === 'O' || raw.toLowerCase() === 'off') return { code: 'O', label: 'Off', time: '', badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200' };
    const meta = shifts.find(item => item.alias === raw || item.name.toLowerCase() === raw.toLowerCase())
      ?? shifts.find(item => item.name.slice(0, 1).toUpperCase() === code);
    const label = meta?.name || raw;
    const name = label.toLowerCase();
    const badgeClass = name.includes('night') ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
      : /late|afternoon|evening/.test(name) ? 'bg-orange-50 text-orange-800 border border-orange-200'
      : /early|morning/.test(name) ? 'bg-amber-50 text-amber-800 border border-amber-200'
      : name.includes('day') ? 'bg-blue-50 text-blue-800 border border-blue-200'
      : 'bg-slate-50 text-slate-800 border border-slate-200';
    return { code: meta?.alias || code, label, time: meta?.start_time && meta.end_time ? `${meta.start_time} - ${meta.end_time}` : '', badgeClass };
  };
  const legend = new Map<string, ReturnType<typeof shiftVisual>>();
  for (const assignment of Object.values(assignments)) {
    if (!assignment.shift?.trim()) continue;
    const visual = shiftVisual(assignment.shift);
    legend.set(visual.code || visual.label, visual);
  }
  if (!legend.size) legend.set('O', shiftVisual('O'));
  const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const today = new Date();
  const selected = selectedDate ? assignments[selectedDate] : undefined;
  const selectedVisual = shiftVisual(selected?.shift);

  return <section aria-label="Employee Calendar" className="bg-white rounded-[2rem] p-4 sm:p-8 shadow-sm border border-slate-100">
    {requestError && <p role="alert" className="text-sm text-red-700 mb-4">{requestError}</p>}
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Employee Calendar</h3>
        <p className="text-sm text-slate-500">Monthly assignments from rostering results.</p>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Previous calendar month" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="p-2 text-slate-400 hover:text-slate-600"><ChevronLeft size={16} /></button>
        <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900">{new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(month)}</div>
        <button type="button" aria-label="Next calendar month" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="p-2 text-slate-400 hover:text-slate-600"><ChevronRight size={16} /></button>
      </div>
    </div>
    {loading ? <p role="status" className="py-10 text-center text-slate-500 font-medium">Loading employee rostering...</p>
      : error ? <p role="alert" className="py-10 text-center text-rose-700 font-semibold">{error}</p>
      : <>
        {!Object.keys(assignments).length && <p className="mb-4 text-sm text-slate-500">No saved roster assignments for this staff member.</p>}
        <div className="flex flex-wrap gap-2 mb-6">
          {[...legend.values()].sort((a, b) => a.label.localeCompare(b.label)).map(visual => <div key={`${visual.code}-${visual.label}`} className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-xl', visual.badgeClass)}>
            <span className="text-[10px] font-black uppercase tracking-widest">{visual.code}</span>
            <span className="text-xs font-extrabold">{visual.label}</span>
            <span className="text-xs font-semibold opacity-70">{visual.time}</span>
          </div>)}
        </div>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 text-center mb-4 min-w-[560px]">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{day}</div>)}
            {Array.from({ length: offset }, (_, index) => <div key={`pad-${index}`} className="aspect-square" />)}
            {Array.from({ length: days }, (_, index) => {
              const day = index + 1;
              const iso = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const assignment = assignments[iso];
              const visual = shiftVisual(assignment?.shift);
              const focused = selectedDate === iso;
              const isToday = today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth() && today.getDate() === day;
              return <button type="button" key={iso} aria-label={`Assignments for ${iso}`} aria-pressed={focused} onClick={() => onSelectDate(iso)} className={cn('aspect-[5/4] min-w-0 rounded-xl border text-left p-2 flex flex-col justify-between transition-colors', focused ? 'border-blue-600 bg-blue-50/40' : 'border-slate-200 hover:bg-slate-50', isToday && 'ring-2 ring-blue-600/20')}>
                <div className={cn('text-sm font-extrabold', focused ? 'text-blue-700' : 'text-slate-900')}>{day}</div>
                {assignment?.shift || assignment?.pool ? <div className="mt-1 space-y-1 min-w-0">
                  <div className={cn('inline-flex flex-wrap items-center gap-1 px-2 py-1 rounded-lg w-fit', visual.badgeClass)}>
                    <span className="text-[10px] font-black uppercase tracking-widest">{visual.code}</span>
                    <span className="text-[11px] font-extrabold">{visual.label}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-600 truncate">{assignment.pool || '-'}</div>
                  <div className="text-[11px] font-semibold text-slate-400 truncate">{visual.time || '-'}</div>
                </div> : <div className="text-xs font-bold text-slate-300">-</div>}
              </button>;
            })}
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected Day</div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm font-bold text-slate-900">{selectedDate || '-'}</div>
            <div className="flex flex-wrap items-center gap-2">
              {!selected?.shift && !selected?.pool ? <span className="text-xs font-semibold text-slate-400">No assignment</span> : <>
                <span className="text-xs font-extrabold text-slate-800">Shift: {selectedVisual.label} ({selectedVisual.code})</span>
                <span className="text-xs font-extrabold text-slate-800">Pool: {selected.pool || '-'}</span>
                <span className="text-xs font-extrabold text-slate-800">Time: {selectedVisual.time || '-'}</span>
              </>}
            </div>
          </div>
        </div>
      </>}
  </section>;
}
