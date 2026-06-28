import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import { 
  Fingerprint, 
  Calendar, 
  Plus, 
  Minus, 
  ChevronRight,
  Clock,
  AlertCircle,
  FileText,
  Settings,
  ShieldCheck,
  TrendingUp,
  Moon,
  Repeat,
  LayoutGrid,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  DEFAULT_FORBIDDEN_PATTERNS,
  DEFAULT_SHIFTS
} from '../../types/settings';
import { ViewState, Contract } from './types';
import StaticContractCreate from './StaticContractCreate';
import { AppStoreContext } from '../../context/AppStoreContext';
import { createContract } from '../../lib/api';

interface CreateContractProps {
  type: 'STATIC' | 'DYNAMIC';
  onNavigate: (view: ViewState) => void;
}

interface ScheduleDay {
  day: string;
  start: string;
  end: string;
  breakMin: number;
  active: boolean;
}

export function CreateContract({ type, onNavigate }: CreateContractProps) {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error('AppStoreContext not found');
  const { store, upsertContract, pushToast } = context;
  const existingContracts = store.contracts || [];

  const isDynamic = type === 'DYNAMIC';

  if (!isDynamic) {
    return <StaticContractCreate onNavigate={onNavigate} />;
  }

  // State for Identity
  const [contractId, setContractId] = useState('');
  const [contractName, setContractName] = useState('');
  const [staffTags, setStaffTags] = useState(isDynamic ? ['Surgeon', 'Resident Doctor'] : ['Surgeon']);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const staffTagsInitRef = useRef(false);

  useEffect(() => {
    if (staffTagsInitRef.current) return;
    const tags = store.settings?.catalogs?.staffTags?.map((t) => t.name).filter(Boolean) ?? [];
    if (tags.length === 0) return;
    staffTagsInitRef.current = true;
    setStaffTags(isDynamic ? tags.slice(0, 2) : [tags[0]]);
  }, [isDynamic, store.settings?.catalogs?.staffTags]);

  useEffect(() => {
    // Generate unique ID
    let newId = '';
    let isUnique = false;
    const prefix = isDynamic ? 'D' : 'S';
    while (!isUnique) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      newId = `${prefix}-${rand}`;
      isUnique = !existingContracts.some(c => c.id === newId);
    }
    setContractId(newId);
  }, [existingContracts, isDynamic]);

  // State for Entitlements
  const [leaves, setLeaves] = useState(isDynamic ? 25 : 28);
  const [credits, setCredits] = useState(12);

  // State for Dynamic Rules
  const [completeWeekends, setCompleteWeekends] = useState(false);
  const [identicalShifts, setIdenticalShifts] = useState(true);

  // State for Patterns
  const [unwantedPatterns, setUnwantedPatterns] = useState(
    DEFAULT_FORBIDDEN_PATTERNS.filter(p => p.enabled).map(p => p.pattern)
  );
  const [patternSearch, setPatternSearch] = useState('');

  const availablePatterns = DEFAULT_FORBIDDEN_PATTERNS.map(p => p.pattern);

  const filteredPatterns = availablePatterns.filter(p => 
    p.toLowerCase().includes(patternSearch.toLowerCase()) && 
    !unwantedPatterns.includes(p)
  );

  const addPattern = (pattern: string) => {
    if (pattern && !unwantedPatterns.includes(pattern)) {
      setUnwantedPatterns([...unwantedPatterns, pattern]);
      setPatternSearch('');
    }
  };

  const removePattern = (pattern: string) => {
    setUnwantedPatterns(unwantedPatterns.filter(p => p !== pattern));
  };

  // State for Assignment Limits
  const [limits, setLimits] = useState({
    monthly: { min: 18, max: 22 },
    workingStreak: { min: 2, max: 5 },
    restStreak: { min: 1, max: 4 },
    workWeekends: { min: 1, max: 8 }
  });

  const [limitModes, setLimitModes] = useState<Record<string, 'HARD' | 'SOFT'>>({
    monthly: 'HARD',
    workingStreak: 'HARD',
    restStreak: 'HARD',
    workWeekends: 'HARD'
  });

  // State for Static Schedule
  const [schedule, setSchedule] = useState<ScheduleDay[]>(
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => {
      const dayShift = DEFAULT_SHIFTS.find(s => s.type === 'Day');
      return {
        day,
        start: dayShift?.startTime || '08:00',
        end: dayShift?.endTime || '17:00',
        breakMin: 60,
        active: idx < 5
      };
    })
  );

  const calculateNetHours = (day: ScheduleDay) => {
    if (!day.active) return 0;
    const [startH, startM] = day.start.split(':').map(Number);
    const [endH, endM] = day.end.split(':').map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM) - day.breakMin;
    return Math.max(0, totalMinutes / 60);
  };

  const totalWeeklyHours = useMemo(() => {
    return schedule.reduce((acc, day) => acc + calculateNetHours(day), 0);
  }, [schedule]);

  const updateSchedule = (index: number, updates: Partial<ScheduleDay>) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], ...updates };
    setSchedule(newSchedule);
  };

  const handleCreate = async () => {
    if (!contractName.trim()) {
      alert('Please enter a contract name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createContract({
        organization_id: 1,
        name: contractName,
        type: 'DYNAMIC',
        status: 'Active',
        staff_tags: staffTags,
        configuration: {
          entitlements: { leaves, credits },
          rules: { completeWeekends, identicalShifts },
          patterns: { unwantedPatterns, limitModes },
          limits,
          schedule,
          totals: { totalWeeklyHours },
        },
      });
      const fmt = (iso: string) =>
        new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      const newContract: Contract = {
        id: String(created.id),
        name: created.name,
        type: created.type,
        status: (created.status as any) || 'Active',
        staffTags: created.staff_tags ?? [],
        createdAt: fmt(created.created_at),
        updatedAt: fmt(created.updated_at),
      };
      upsertContract(newContract);
      pushToast('Contract created (backend).');
      onNavigate('LIBRARY');
    } catch (e: any) {
      pushToast(`Create failed: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-6xl mx-auto p-8 space-y-10"
    >
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest mb-3">
            <button onClick={() => onNavigate('LIBRARY')} className="hover:underline">Contracts</button>
            <ChevronRight size={10} />
            <span className="text-slate-400">Create New</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-headline">
            Create {isDynamic ? 'Dynamic Framework' : 'Static Contract'}
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl leading-relaxed">
            {isDynamic 
              ? 'Define clinical staffing constraints, scheduling logic, and pattern rules to ensure surgical precision in resource allocation.'
              : 'Define a recurring weekly workload and annual entitlements for clinical staff with absolute precision.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => onNavigate('LIBRARY')}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-surface-container-high hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button 
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-primary border-2 border-primary/20 hover:bg-primary/5 transition-all"
          >
            Save Draft
          </button>
          <button 
            onClick={handleCreate}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-60 disabled:hover:brightness-100"
          >
            Create Contract
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Identity & Entitlements */}
        <div className="lg:col-span-1 space-y-8">
          {/* Identity */}
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm space-y-6">
            <h2 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <Fingerprint size={16} />
              Contract Identity
            </h2>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Contract ID</label>
                <input 
                  type="text" 
                  readOnly 
                  value={contractId || 'Generating...'}
                  className="w-full bg-slate-50 border-none border-b-2 border-outline-variant/20 focus:border-primary focus:ring-0 text-slate-900 font-bold px-4 py-3 rounded-t-xl transition-all"
                />
                <p className="text-[9px] text-slate-400 mt-1 italic px-1">Auto-generated unique identifier</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Contract Name</label>
                <input 
                  type="text" 
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  placeholder={isDynamic ? "e.g. Senior Surgeon Standard Q3" : "e.g. Senior Surgeon Standard 40h"}
                  className="w-full bg-slate-50 border-none border-b-2 border-outline-variant/20 focus:border-primary focus:ring-0 text-slate-900 font-medium px-4 py-3 rounded-t-xl transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Staff Type Tags</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {staffTags.map(tag => (
                    <Tag 
                      key={tag} 
                      label={tag} 
                      active 
                      onRemove={() => setStaffTags(staffTags.filter(t => t !== tag))} 
                    />
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input 
                    type="text" 
                    placeholder="Add new tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTagInput.trim()) {
                        if (!staffTags.includes(newTagInput.trim())) {
                          setStaffTags([...staffTags, newTagInput.trim()]);
                        }
                        setNewTagInput('');
                      }
                    }}
                    className="flex-1 bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-primary"
                  />
                  <button 
                    onClick={() => {
                      if (newTagInput.trim()) {
                        if (!staffTags.includes(newTagInput.trim())) {
                          setStaffTags([...staffTags, newTagInput.trim()]);
                        }
                        setNewTagInput('');
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold hover:brightness-110 transition-all"
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Entitlements */}
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm space-y-6">
            <h2 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <Calendar size={16} />
              Annual Entitlements
            </h2>
            <div className="space-y-4">
              <EntitlementItem 
                label="Yearly Entitled Leaves" 
                value={leaves} 
                unit="days" 
                onIncrement={() => setLeaves(l => l + 1)}
                onDecrement={() => setLeaves(l => Math.max(0, l - 1))}
              />
              <EntitlementItem 
                label="Yearly Entitled Preferred Shifts" 
                value={credits} 
                unit="credits" 
                onIncrement={() => setCredits(c => c + 1)}
                onDecrement={() => setCredits(c => Math.max(0, c - 1))}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Rules & Constraints */}
        <div className="lg:col-span-2 space-y-8">
          {isDynamic ? (
            <>
              {/* Dynamic Rules */}
              <div className="bg-white p-8 rounded-2xl border border-outline-variant/10 shadow-sm space-y-8">
                <h2 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                  <Settings size={16} />
                  Scheduling Rules
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 px-1">Weekend Definition</label>
                    <select className="w-full bg-slate-50 border-none rounded-xl h-12 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 appearance-none transition-all">
                      <option>Saturday/Sunday</option>
                      <option>Friday/Saturday/Sunday</option>
                    </select>
                  </div>
                  <ToggleItem 
                    title="Complete Weekends" 
                    description="Staff must work entire weekend or none" 
                    checked={completeWeekends}
                    onToggle={() => setCompleteWeekends(!completeWeekends)}
                  />
                  <ToggleItem 
                    title="Identical Shift Types During Weekend" 
                    description="Force consistency across weekend shifts" 
                    checked={identicalShifts}
                    onToggle={() => setIdenticalShifts(!identicalShifts)}
                  />
                </div>
              </div>

              {/* Assignment Limits */}
              <div className="bg-white p-8 rounded-2xl border border-outline-variant/10 shadow-sm space-y-8">
                <h2 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                  <LayoutGrid size={16} />
                  Assignment Limits
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <LimitCard 
                    icon={<Calendar size={14} />} 
                    label="Monthly" 
                    min={limits.monthly.min} 
                    max={limits.monthly.max} 
                    mode={limitModes.monthly}
                    onModeChange={(mode) => setLimitModes({ ...limitModes, monthly: mode })}
                    color="primary" 
                    onChange={(min, max) => setLimits({ ...limits, monthly: { min, max } })}
                  />
                  <LimitCard 
                    icon={<TrendingUp size={14} />} 
                    label="Working Streak" 
                    min={limits.workingStreak.min} 
                    max={limits.workingStreak.max} 
                    mode={limitModes.workingStreak}
                    onModeChange={(mode) => setLimitModes({ ...limitModes, workingStreak: mode })}
                    color="secondary" 
                    onChange={(min, max) => setLimits({ ...limits, workingStreak: { min, max } })}
                  />
                  <LimitCard 
                    icon={<Moon size={14} />} 
                    label="Rest Streak" 
                    min={limits.restStreak.min} 
                    max={limits.restStreak.max} 
                    mode={limitModes.restStreak}
                    onModeChange={(mode) => setLimitModes({ ...limitModes, restStreak: mode })}
                    color="tertiary" 
                    onChange={(min, max) => setLimits({ ...limits, restStreak: { min, max } })}
                  />
                  <LimitCard 
                    icon={<Repeat size={14} />} 
                    label="Work Weekends" 
                    min={limits.workWeekends.min} 
                    max={limits.workWeekends.max} 
                    mode={limitModes.workWeekends}
                    onModeChange={(mode) => setLimitModes({ ...limitModes, workWeekends: mode })}
                    color="slate" 
                    onChange={(min, max) => setLimits({ ...limits, workWeekends: { min, max } })}
                  />
                </div>
              </div>

              {/* Pattern Constraints */}
              <div className="bg-white p-8 rounded-2xl border border-outline-variant/10 shadow-sm space-y-8">
                <h2 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={16} />
                  Pattern Constraints
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase px-1">Search & Add Patterns</label>
                    <div className="relative">
                      <div className="relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text"
                          placeholder="Search patterns (e.g. Night -> Day)..."
                          value={patternSearch}
                          onChange={(e) => setPatternSearch(e.target.value)}
                          className="w-full bg-slate-50 border-none rounded-xl h-12 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                      
                      {patternSearch && filteredPatterns.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-2xl border border-outline-variant/10 z-30 overflow-hidden py-2">
                          {filteredPatterns.map(p => (
                            <button 
                              key={p}
                              onClick={() => addPattern(p)}
                              className="w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 font-bold text-slate-700 transition-colors flex items-center justify-between group"
                            >
                              {p}
                              <Plus size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 bg-primary/5 rounded-xl border-l-4 border-primary italic">
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        "Forbidden patterns are strictly enforced. Unwanted patterns are soft constraints."
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unwanted Pattern List</p>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                      {unwantedPatterns.length > 0 ? (
                        unwantedPatterns.map(p => (
                          <PatternItem key={p} label={p} onRemove={() => removePattern(p)} />
                        ))
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No patterns defined</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Static Schedule Template */
            <div className="bg-white p-8 rounded-2xl border border-outline-variant/10 shadow-sm space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={16} />
                  Weekly Schedule Template
                </h2>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Weekly Commitment</p>
                  <p className="text-4xl font-black text-primary tracking-tighter">{totalWeeklyHours.toFixed(1)} <span className="text-sm font-bold">hrs</span></p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <div className="col-span-4">Day of Week</div>
                  <div className="col-span-2">Start</div>
                  <div className="col-span-2">End</div>
                  <div className="col-span-2 text-center">Break</div>
                  <div className="col-span-2 text-right">Net</div>
                </div>
                
                {schedule.map((day, idx) => (
                  <ScheduleRow 
                    key={day.day}
                    day={day.day} 
                    start={day.start} 
                    end={day.end} 
                    breakMin={day.breakMin} 
                    net={calculateNetHours(day).toFixed(1)} 
                    active={day.active}
                    onToggle={() => updateSchedule(idx, { active: !day.active })}
                    onStartChange={(val) => updateSchedule(idx, { start: val })}
                    onEndChange={(val) => updateSchedule(idx, { end: val })}
                    onBreakChange={(val) => updateSchedule(idx, { breakMin: val })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Summary */}
      <div className="bg-slate-900 p-8 rounded-2xl text-white flex flex-wrap gap-12 items-center shadow-2xl">
        <div className="flex-1 min-w-[240px]">
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Contract Validation</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            This {isDynamic ? 'dynamic framework' : 'static template'} will automatically generate shifts for all assigned individuals following the {isDynamic ? 'rule-based logic' : 'weekly logic'} defined above.
          </p>
        </div>
        <div className="flex gap-12 items-center flex-wrap">
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Calculated FTE</p>
            <p className="text-3xl font-black">{(totalWeeklyHours / 40).toFixed(1)} <span className="text-sm font-medium opacity-50">Full Time</span></p>
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Compliance Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim shadow-[0_0_8px_rgba(111,216,200,0.5)]"></div>
              <p className="text-xl font-bold">Compliant</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-primary-container border border-primary-container hover:bg-transparent transition-all">
              Preview PDF Schedule
            </button>
            <button className="px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-primary border border-primary hover:bg-transparent transition-all">
              Create {isDynamic ? 'Dynamic' : 'Static'} Contract
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Tag({ label, active, onRemove }: { label: string, active?: boolean, onRemove?: () => void, key?: React.Key }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
      active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
    }`}>
      {label}
      {onRemove && (
        <button 
          onClick={onRemove}
          className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
        >
          <Minus size={10} />
        </button>
      )}
    </span>
  );
}

function EntitlementItem({ label, value, unit, onIncrement, onDecrement }: { label: string, value: number, unit: string, onIncrement: () => void, onDecrement: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-outline-variant/10">
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tighter">{value} <span className="text-sm font-medium text-slate-400">{unit}</span></p>
      </div>
      <div className="flex flex-col gap-1">
        <button 
          onClick={onIncrement}
          className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm text-primary hover:bg-primary hover:text-white transition-all"
        >
          <Plus size={14} />
        </button>
        <button 
          onClick={onDecrement}
          className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm text-primary hover:bg-primary hover:text-white transition-all"
        >
          <Minus size={14} />
        </button>
      </div>
    </div>
  );
}

function ToggleItem({ title, description, checked, onToggle }: { title: string, description: string, checked: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-outline-variant/10">
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-[10px] text-slate-500 font-medium">{description}</p>
      </div>
      <div 
        onClick={onToggle}
        className={`w-11 h-6 rounded-full relative transition-all cursor-pointer ${checked ? 'bg-primary' : 'bg-slate-200'}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${checked ? 'right-1' : 'left-1'}`}></div>
      </div>
    </div>
  );
}

function LimitCard({ 
  icon, 
  label, 
  min, 
  max, 
  mode,
  onModeChange,
  color, 
  onChange 
}: { 
  icon: React.ReactNode, 
  label: string, 
  min: number, 
  max: number, 
  mode: 'HARD' | 'SOFT',
  onModeChange: (mode: 'HARD' | 'SOFT') => void,
  color: string, 
  onChange: (min: number, max: number) => void 
}) {
  const colorClass = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    tertiary: 'text-tertiary',
    slate: 'text-slate-600'
  }[color as keyof typeof colorClass];

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-outline-variant/10">
      <div className="flex items-center justify-between mb-4">
        <p className={`text-[10px] font-bold uppercase flex items-center gap-1.5 ${colorClass}`}>
          {icon} {label}
        </p>
        <div className="flex bg-slate-200 rounded p-0.5">
          <button 
            onClick={() => onModeChange('HARD')}
            className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded transition-all ${
              mode === 'HARD' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'
            }`}
          >
            H
          </button>
          <button 
            onClick={() => onModeChange('SOFT')}
            className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded transition-all ${
              mode === 'SOFT' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'
            }`}
          >
            S
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] font-bold text-slate-400 block mb-1">MIN</label>
          <input 
            type="number" 
            value={min} 
            onChange={(e) => onChange(Number(e.target.value), max)}
            className="w-full bg-white border-none rounded-lg p-2 text-xs font-bold text-center focus:ring-1 focus:ring-primary" 
          />
        </div>
        <div>
          <label className="text-[9px] font-bold text-slate-400 block mb-1">MAX</label>
          <input 
            type="number" 
            value={max} 
            onChange={(e) => onChange(min, Number(e.target.value))}
            className="w-full bg-white border-none rounded-lg p-2 text-xs font-bold text-center focus:ring-1 focus:ring-primary" 
          />
        </div>
      </div>
    </div>
  );
}

function PatternItem({ label, onRemove }: { label: string, onRemove: () => void, key?: React.Key }) {
  return (
    <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-lg shadow-sm border-l-4 border-error/70">
      <div className="flex items-center gap-2">
        <AlertCircle size={12} className="text-error" />
        <span className="text-xs font-bold text-slate-700">{label}</span>
      </div>
      <button 
        onClick={onRemove}
        className="text-slate-400 hover:text-error transition-colors"
      >
        <Minus size={14} />
      </button>
    </div>
  );
}

interface ScheduleRowProps {
  key?: React.Key;
  day: string;
  start: string;
  end: string;
  breakMin: number;
  net: string;
  active: boolean;
  onToggle: () => void;
  onStartChange: (val: string) => void;
  onEndChange: (val: string) => void;
  onBreakChange: (val: number) => void;
}

function ScheduleRow({ day, start, end, breakMin, net, active, onToggle, onStartChange, onEndChange, onBreakChange }: ScheduleRowProps) {
  return (
    <div className={`grid grid-cols-12 items-center gap-4 px-4 py-4 border-b border-slate-100 last:border-0 transition-all ${
      active ? 'bg-white' : 'bg-slate-50/50 opacity-60 grayscale'
    }`}>
      <div className="col-span-4 flex items-center gap-3">
        <div 
          onClick={onToggle}
          className={`w-10 h-6 rounded-full relative transition-all cursor-pointer ${active ? 'bg-primary' : 'bg-slate-200'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${active ? 'right-1' : 'left-1'}`}></div>
        </div>
        <span className={`font-bold text-sm ${active ? 'text-slate-900' : 'text-slate-400'}`}>{day}</span>
      </div>
      <div className="col-span-2">
        <input 
          type="time" 
          value={start} 
          disabled={!active} 
          onChange={(e) => onStartChange(e.target.value)}
          className="w-full text-sm font-bold border-none p-0 focus:ring-0 bg-transparent" 
        />
      </div>
      <div className="col-span-2">
        <input 
          type="time" 
          value={end} 
          disabled={!active} 
          onChange={(e) => onEndChange(e.target.value)}
          className="w-full text-sm font-bold border-none p-0 focus:ring-0 bg-transparent" 
        />
      </div>
      <div className="col-span-2 text-center">
        <input 
          type="number" 
          value={breakMin} 
          disabled={!active} 
          onChange={(e) => onBreakChange(Number(e.target.value))}
          className="w-16 text-center text-sm font-bold border-none p-0 focus:ring-0 bg-transparent" 
        />
      </div>
      <div className="col-span-2 text-right">
        <span className={`px-3 py-1 font-black text-xs rounded ${
          active ? 'bg-tertiary-fixed-dim/20 text-tertiary' : 'bg-slate-200 text-slate-400'
        }`}>
          {net} hrs
        </span>
      </div>
    </div>
  );
}
