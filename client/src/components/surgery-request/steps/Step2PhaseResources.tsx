import { useState, useEffect, useContext } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Droplets,
  Info,
  Plus,
  PlusCircle,
  Stethoscope,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../../lib/utils';
import { getPhaseDefaults, getAvailableDefaults } from '../../../lib/resourceDefaults';
import type { SurgeryRequest } from '../../../types';
import { AppStoreContext } from '../../../context/AppStoreContext';

type MainPhase = 'preOp' | 'operative' | 'postOp';

type Step2Props = {
  data: SurgeryRequest;
  updateData: (updates: Partial<SurgeryRequest>) => void;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
};

function priorityHeadline(p: SurgeryRequest['priority']): string {
  if (p === 'emergency') return 'Level 1 — Emergency';
  if (p === 'mandatory') return 'Level 2 — Urgent';
  return 'Level 3 — Elective';
}

/**
 * Parse duration string (e.g., "3 hr 30 min") to total minutes
 */
function parseDurationToMinutes(duration: string): number {
  let totalMinutes = 0;
  const dayMatch = duration.match(/(\d+)\s*day/);
  const hourMatch = duration.match(/(\d+)\s*hr/);
  const minMatch = duration.match(/(\d+)\s*min/);

  if (dayMatch) {
    totalMinutes += parseInt(dayMatch[1], 10) * 24 * 60;
  }
  if (hourMatch) {
    totalMinutes += parseInt(hourMatch[1], 10) * 60;
  }
  if (minMatch) {
    totalMinutes += parseInt(minMatch[1], 10);
  }

  return totalMinutes;
}

/**
 * Convert minutes to duration string (e.g., 210 => "3 hr 30 min", 1500 => "1 day 1 hr")
 */
function formatMinutesToDuration(minutes: number): string {
  if (minutes <= 0) return '0 min';

  const days = Math.floor(minutes / (24 * 60));
  const remainingMinutesAfterDays = minutes % (24 * 60);
  const hours = Math.floor(remainingMinutesAfterDays / 60);
  const mins = remainingMinutesAfterDays % 60;

  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days} day${days > 1 ? 's' : ''}`);
  }
  if (hours > 0) {
    parts.push(`${hours} hr`);
  }
  if (mins > 0 || parts.length === 0) {
    parts.push(`${mins} min`);
  }

  return parts.join(' ');
}

/**
 * Format minutes to time display (e.g., 90 => "1:30")
 */
function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get cumulative time in minutes up to (but not including) a phase
 */
function getPhaseStartTime(phaseId: MainPhase, phases: { preOp: any; operative: any; postOp: any; sterilization: any; recovery: any }): number {
  const phaseOrder = ['preOp', 'operative', 'postOp'];
  let cumulativeTime = 0;

  for (const phase of phaseOrder) {
    if (phase === phaseId) {
      return cumulativeTime;
    }
    cumulativeTime += parseDurationToMinutes(phases[phase as MainPhase].duration);
  }

  return cumulativeTime;
}

export function Step2PhaseResources({ data, updateData, onBack, onNext, onSaveDraft }: Step2Props) {
  const context = useContext(AppStoreContext);
  const settings = context?.store.settings;

  const [selectedPhaseForAdd, setSelectedPhaseForAdd] = useState<MainPhase | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ phaseId: MainPhase; resourceIndex: number; resourceName: string } | null>(null);
  const [activeSlider, setActiveSlider] = useState<string | null>(null);
  const [expandedResources, setExpandedResources] = useState<Record<string, boolean>>({});

  const toggleResourceExpand = (key: string) => {
    setExpandedResources(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const phases: {
    id: MainPhase;
    title: string;
    desc: string;
    active?: boolean;
  }[] = [
    {
      id: 'preOp',
      title: 'Pre-operative',
      desc: 'Initial stabilization and vitals monitoring.',
    },
    {
      id: 'operative',
      title: 'Operative',
      desc: 'Core surgical procedure and anesthesia.',
      active: true,
    },
    {
      id: 'postOp',
      title: 'Post-operative',
      desc: 'Initial emergence and recovery.',
    },
  ];

  const ster = data.phases.sterilization;
  const cleaning = ster.resources[0] ?? { name: 'Cleaning Crew', count: 2, icon: 'user' };
  const icu = data.phases.recovery.icuProbability ?? 35;

  const setCleaningCount = (count: number) => {
    const resources =
      ster.resources.length > 0
        ? ster.resources.map((r, i) => (i === 0 ? { ...r, count: Math.max(0, count) } : r))
        : [{ ...cleaning, count: Math.max(0, count) }];
    updateData({
      phases: {
        ...data.phases,
        sterilization: { ...ster, resources },
      },
    });
  };

  // Clear active slider on mouse/touch release
  useEffect(() => {
    const handleRelease = () => setActiveSlider(null);
    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('touchend', handleRelease);
    return () => {
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('touchend', handleRelease);
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-on-surface font-bold text-sm mb-6 transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back to Patient Details
      </button>
      <header className="mb-10">
        <div className="flex justify-between items-end">
          <div>
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
              <span>Request Workflow</span>
              <ChevronRight size={12} />
              <span className="text-on-surface font-semibold">Resource Phase Allocation</span>
            </nav>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface font-headline">Phase Resource Configuration</h1>
            <p className="mt-2 text-slate-600 max-w-2xl">Define clinical staff, room availability, and specialized equipment across the surgical lifecycle.</p>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-widest font-bold text-primary">Priority Level</span>
            <div className="text-2xl font-bold text-error">{priorityHeadline(data.priority)}</div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between relative">
          <div className="absolute h-0.5 bg-outline-variant/30 left-0 right-0 top-1/2 -translate-y-1/2 z-0" />
          {[
            { label: 'Patient Data', icon: Check, done: true },
            { label: 'Phases & Resources', icon: Activity, active: true },
            { label: 'Scheduling', icon: Clock },
            { label: 'Final Review', icon: CheckCircle2 },
          ].map((step, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center gap-2 group">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  step.done
                    ? 'bg-tertiary text-white shadow-lg'
                    : step.active
                      ? 'bg-primary text-white shadow-xl ring-4 ring-primary-container/20'
                      : 'bg-surface-container-highest text-outline',
                )}
              >
                <step.icon size={20} />
              </div>
              <span
                className={cn(
                  'text-xs font-bold',
                  step.done ? 'text-tertiary' : step.active ? 'text-primary' : 'text-outline',
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </header>

      <div className="space-y-8 pb-20">
        {phases.map((phase) => {
          const cfg = data.phases[phase.id];
          return (
            <div
              key={phase.id}
              className="bg-surface-container-lowest rounded-xl p-8 flex flex-col md:flex-row gap-8 relative overflow-hidden border border-slate-100 shadow-sm"
            >
              {phase.active && <div className="absolute top-0 right-0 w-2 h-full bg-primary-container" />}
              <div className="md:w-1/4">
                <h3 className="text-2xl font-bold font-headline mb-2">{phase.title}</h3>
                <p className="text-sm text-slate-500">{phase.desc}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary">
                  <Clock size={14} />
                  <div className="flex items-center gap-1 bg-surface-container-low px-1 py-1 rounded border border-outline-variant/30">
                    <button
                      type="button"
                      onClick={() => {
                        const minutes = Math.max(15, parseDurationToMinutes(cfg.duration) - 15);
                        const newDuration = formatMinutesToDuration(minutes);
                        updateData({
                          phases: {
                            ...data.phases,
                            [phase.id]: { ...cfg, duration: newDuration },
                          },
                        });
                      }}
                      className="p-0.5 hover:bg-surface-container rounded transition-colors"
                      aria-label="Decrease duration"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <span className="px-2 min-w-20 text-center">{cfg.duration}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const minutes = parseDurationToMinutes(cfg.duration) + 15;
                        const newDuration = formatMinutesToDuration(minutes);
                        updateData({
                          phases: {
                            ...data.phases,
                            [phase.id]: { ...cfg, duration: newDuration },
                          },
                        });
                      }}
                      className="p-0.5 hover:bg-surface-container rounded transition-colors"
                      aria-label="Increase duration"
                    >
                      <ChevronUp size={16} />
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400">(EST)</span>
                </div>
              </div>
              <div className="flex-1 flex items-start gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cfg.resources.map((res, i) => (
                    <div
                      key={`${phase.id}-${i}-${res.name}`}
                      className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-3 group hover:bg-surface-container transition-colors relative"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="text-tertiary">
                            <Stethoscope size={20} />
                          </div>
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-sm font-bold truncate">{res.name}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({ phaseId: phase.id, resourceIndex: i, resourceName: res.name })}
                          className="text-slate-400 hover:text-error transition-colors shrink-0"
                          aria-label="Delete resource"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-end">
                        <input
                          type="number"
                          min={0}
                          className="w-14 bg-surface-container-lowest border-none focus:ring-1 focus:ring-primary text-sm font-bold rounded p-1 text-center"
                          value={res.count}
                          onChange={(e) => {
                            const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                            const p = data.phases[phase.id];
                            const resources = p.resources.map((r, idx) => (idx === i ? { ...r, count: v } : r));
                            updateData({
                              phases: {
                                ...data.phases,
                                [phase.id]: { ...p, resources },
                              },
                            });
                          }}
                        />
                      </div>
                      {/* Timeline Range Slider for Resource Allocation */}
                      <div className="pt-2 border-t border-surface-container space-y-2">
                        {(() => {
                          const phaseStartOffset = getPhaseStartTime(phase.id, data.phases);
                          const phaseDurationMinutes = parseDurationToMinutes(cfg.duration);
                          const phaseEndOffset = phaseStartOffset + phaseDurationMinutes;
                          const resStartTime = res.startTime ?? 0;
                          const resEndTime = res.endTime ?? phaseDurationMinutes;
                          const absStartTime = phaseStartOffset + resStartTime;
                          const absEndTime = phaseStartOffset + Math.min(resEndTime, phaseDurationMinutes);
                          const isExpanded = expandedResources[`${phase.id}-${i}`];
                          const isThroughout = resStartTime === 0 && resEndTime >= phaseDurationMinutes;

                          return (
                            <>
                              <button
                                type="button"
                                onClick={() => toggleResourceExpand(`${phase.id}-${i}`)}
                                className="flex items-center justify-between gap-2 w-full text-left"
                              >
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-outline font-semibold">Required Time Window</span>
                                  <ChevronDown 
                                    size={14} 
                                    className={cn("text-outline transition-transform", isExpanded && "rotate-180")} 
                                  />
                                </div>
                                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider">
                                  {isThroughout ? 'Throughout' : `${formatMinutesToTime(absStartTime)} - ${formatMinutesToTime(absEndTime)}`}
                                </span>
                              </button>

                              {isExpanded && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  className="overflow-hidden pt-2"
                                >
                                  <div className="relative pt-2 pb-2">
                                    {/* Background track */}
                                    <div className="absolute h-1 bg-slate-200 rounded-lg w-full top-1/2 -translate-y-1/2" />

                                    {/* 15-minute markers */}
                                    <div className="absolute w-full flex items-center top-1/2 -translate-y-1/2 px-0">
                                      {Array.from({ length: Math.floor(parseDurationToMinutes(cfg.duration) / 15) + 1 }).map((_, idx) => {
                                        const percentage = (idx * 15 / parseDurationToMinutes(cfg.duration)) * 100;
                                        return (
                                          <div
                                            key={idx}
                                            className="absolute w-0.5 h-2 bg-slate-300"
                                            style={{
                                              left: `${percentage}%`,
                                              transform: 'translateX(-50%)',
                                            }}
                                          />
                                        );
                                      })}
                                    </div>

                                    {/* Active range highlight */}
                                    <div
                                      className="absolute h-1 bg-gradient-to-r from-primary to-tertiary rounded-lg top-1/2 -translate-y-1/2"
                                      style={{
                                        left: `${(resStartTime / parseDurationToMinutes(cfg.duration)) * 100}%`,
                                        right: `${100 - (resEndTime / parseDurationToMinutes(cfg.duration)) * 100}%`,
                                      }}
                                    />

                                    {/* Start time slider */}
                                    <input
                                      type="range"
                                      min={0}
                                      max={parseDurationToMinutes(cfg.duration)}
                                      step={15}
                                      value={resStartTime}
                                      onMouseDown={() => setActiveSlider(`${phase.id}-${i}-start`)}
                                      onTouchStart={() => setActiveSlider(`${phase.id}-${i}-start`)}
                                      onChange={(e) => {
                                        const startVal = parseInt(e.target.value, 10);
                                        const p = data.phases[phase.id];
                                        const endVal = res.endTime ?? parseDurationToMinutes(cfg.duration);
                                        const resources = p.resources.map((r, idx) =>
                                          idx === i ? { ...r, startTime: startVal, endTime: Math.max(startVal, endVal) } : r
                                        );
                                        updateData({
                                          phases: {
                                            ...data.phases,
                                            [phase.id]: { ...p, resources },
                                          },
                                        });
                                      }}
                                      className="absolute w-full h-1 top-1/2 -translate-y-1/2 appearance-none bg-transparent rounded-lg cursor-pointer"
                                      style={{
                                        zIndex: activeSlider === `${phase.id}-${i}-start` ? 10 : 3,
                                      }}
                                    />
                                    
                                    {/* End time slider */}
                                    <input
                                      type="range"
                                      min={0}
                                      max={parseDurationToMinutes(cfg.duration)}
                                      step={15}
                                      value={resEndTime}
                                      onMouseDown={() => setActiveSlider(`${phase.id}-${i}-end`)}
                                      onTouchStart={() => setActiveSlider(`${phase.id}-${i}-end`)}
                                      onChange={(e) => {
                                        const endVal = parseInt(e.target.value, 10);
                                        const p = data.phases[phase.id];
                                        const resources = p.resources.map((r, idx) =>
                                          idx === i ? { ...r, endTime: endVal } : r
                                        );
                                        updateData({
                                          phases: {
                                            ...data.phases,
                                            [phase.id]: { ...p, resources },
                                          },
                                        });
                                      }}
                                      className="absolute w-full h-1 top-1/2 -translate-y-1/2 appearance-none bg-transparent rounded-lg cursor-pointer"
                                      style={{
                                        zIndex: activeSlider === `${phase.id}-${i}-end` ? 10 : 3,
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span>{formatMinutesToTime(phaseStartOffset)}</span>
                                    <span>{formatMinutesToTime(phaseEndOffset)}</span>
                                  </div>
                                </motion.div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPhaseForAdd(phase.id)}
                  className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform shrink-0"
                  aria-label="Add resource to phase"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Resource Selection Modal - Outside phase container */}
        {selectedPhaseForAdd && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedPhaseForAdd(null)}
            />
            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
              <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-h-96 overflow-y-auto min-w-72">
                <div className="sticky top-0 flex justify-between items-center p-4 bg-surface-container-low border-b border-slate-200">
                  <h3 className="font-bold text-on-surface">Select Resource</h3>
                  <button
                    type="button"
                    onClick={() => setSelectedPhaseForAdd(null)}
                    className="text-slate-500 hover:text-on-surface transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-2 space-y-1">
                  {(() => {
                    const phaseId = selectedPhaseForAdd;
                    const phaseConfig = data.phases[phaseId];
                    const available = getAvailableDefaults(phaseConfig, phaseId, settings);
                    
                    if (available.length === 0) {
                      return (
                        <div className="px-4 py-6 text-center text-sm text-outline">
                          All resources for this phase have been added.
                        </div>
                      );
                    }

                    return available.map((resource, idx) => (
                      <button
                        key={`${phaseId}-option-${idx}`}
                        type="button"
                        onClick={() => {
                          const p = data.phases[phaseId];
                          const resources = [...p.resources, resource];
                          updateData({
                            phases: {
                              ...data.phases,
                              [phaseId]: { ...p, resources },
                            },
                          });
                          setSelectedPhaseForAdd(null);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="text-tertiary">
                            <Stethoscope size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-on-surface">{resource.name}</p>
                            <p className="text-xs text-outline">Default: {resource.count} count</p>
                          </div>
                        </div>
                        <Plus size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setDeleteConfirm(null)}
            />
            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
              <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-w-sm">
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="text-error" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-on-surface text-lg mb-1">Delete Resource?</h3>
                      <p className="text-sm text-on-surface-variant">
                        Are you sure you want to remove <span className="font-semibold">{deleteConfirm.resourceName}</span> from this phase?
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(null)}
                      className="px-6 py-2 rounded-lg bg-surface-container-high text-on-surface font-semibold hover:bg-surface-container-highest transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const p = data.phases[deleteConfirm.phaseId];
                        const resources = p.resources.filter((_, idx) => idx !== deleteConfirm.resourceIndex);
                        updateData({
                          phases: {
                            ...data.phases,
                            [deleteConfirm.phaseId]: { ...p, resources },
                          },
                        });
                        setDeleteConfirm(null);
                      }}
                      className="px-6 py-2 rounded-lg bg-error text-on-error font-semibold hover:bg-error/90 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container-lowest rounded-xl p-8 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold font-headline">Sterilization</h3>
                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-primary">
                  <Clock size={14} />
                  <div className="flex items-center gap-1 bg-surface-container-low px-1 py-1 rounded">
                    <button
                      type="button"
                      onClick={() => {
                        const minutes = Math.max(15, parseDurationToMinutes(ster.duration) - 15);
                        const newDuration = formatMinutesToDuration(minutes);
                        updateData({
                          phases: {
                            ...data.phases,
                            sterilization: { ...ster, duration: newDuration },
                          },
                        });
                      }}
                      className="p-0.5 hover:bg-surface-container rounded transition-colors"
                      aria-label="Decrease sterilization duration"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <span className="px-2 min-w-20 text-center">{ster.duration}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const minutes = parseDurationToMinutes(ster.duration) + 15;
                        const newDuration = formatMinutesToDuration(minutes);
                        updateData({
                          phases: {
                            ...data.phases,
                            sterilization: { ...ster, duration: newDuration },
                          },
                        });
                      }}
                      className="p-0.5 hover:bg-surface-container rounded transition-colors"
                      aria-label="Increase sterilization duration"
                    >
                      <ChevronUp size={16} />
                    </button>
                  </div>
                  <span className="text-[10px]">(EST)</span>
                </div>
              </div>
              <div className="text-right">
                <label className="text-[10px] font-bold text-slate-400 block mb-1">INFECTION STATUS</label>
                <select
                  className="bg-error-container/10 border-none text-error text-xs font-bold rounded focus:ring-0 cursor-pointer max-w-[10rem]"
                  value={data.infectionStatus || 'Standard Precautions'}
                  onChange={(e) => updateData({ infectionStatus: e.target.value })}
                >
                  <option>Standard Precautions</option>
                  <option>Contact Precautions (MRSA)</option>
                  <option>Airborne Precautions</option>
                  <option>Positive (+45m sterilization)</option>
                </select>
              </div>
            </div>
            <div className="bg-surface-container-low p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="text-secondary" size={18} />
                  <span className="text-sm font-bold">{cleaning.name}</span>
                </div>
                <input
                  type="number"
                  min={0}
                  className="w-14 bg-surface-container-lowest border-none text-center font-bold rounded py-1"
                  value={cleaning.count}
                  onChange={(e) => setCleaningCount(parseInt(e.target.value, 10) || 0)}
                />
              </div>
              <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-full" />
              </div>
              <p className="text-xs text-slate-500 italic">Duration extends automatically for positive infection status based on ICU protocols.</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-8 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold font-headline uppercase tracking-widest text-slate-400 text-[10px]">Recovery Phase</h3>
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Clock size={14} />
                <div className="flex items-center gap-1 bg-surface-container-low px-1 py-1 rounded">
                  <button
                    type="button"
                    onClick={() => {
                      const minutes = Math.max(360, parseDurationToMinutes(data.phases.recovery.duration) - 360);
                      const newDuration = formatMinutesToDuration(minutes);
                      updateData({
                        phases: {
                          ...data.phases,
                          recovery: { ...data.phases.recovery, duration: newDuration },
                        },
                      });
                    }}
                    className="p-0.5 hover:bg-surface-container rounded transition-colors"
                    aria-label="Decrease recovery duration"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <span className="px-2 min-w-20 text-center">{data.phases.recovery.duration}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const minutes = parseDurationToMinutes(data.phases.recovery.duration) + 360;
                      const newDuration = formatMinutesToDuration(minutes);
                      updateData({
                        phases: {
                          ...data.phases,
                          recovery: { ...data.phases.recovery, duration: newDuration },
                        },
                      });
                    }}
                    className="p-0.5 hover:bg-surface-container rounded transition-colors"
                    aria-label="Increase recovery duration"
                  >
                    <ChevronUp size={16} />
                  </button>
                </div>
                <span className="text-[10px]">(EST)</span>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-[#f8fafc] p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">ICU Probability</h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-[#1e293b] tracking-tighter">{icu}</span>
                      <span className="text-lg font-bold text-slate-300">%</span>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-slate-50 text-[9px] font-black text-primary uppercase tracking-widest transition-transform active:scale-95 group">
                    <Info size={14} className="text-primary group-hover:scale-110 transition-transform" />
                    ASA Score Based
                  </button>
                </div>

                <div className="relative h-16 flex items-center">
                  {/* Background Track */}
                  <div className="absolute left-2 right-2 h-[2px] bg-slate-200/60 rounded-full" />
                  
                  {/* Active Track */}
                  <div className="absolute left-2 right-2 h-[2px] pointer-events-none">
                    <div 
                      className="h-full bg-[#004a8d] rounded-full transition-all duration-300"
                      style={{ width: `${icu}%` }}
                    />
                  </div>

                  {/* Milestones Container */}
                  <div className="absolute left-2 right-2 inset-y-0 flex items-center pointer-events-none">
                    {[5, 10, 20, 30, 50, 75, 100].map((val) => (
                      <div 
                        key={val}
                        className="absolute flex flex-col items-center"
                        style={{ left: `${val}%`, transform: 'translateX(-50%)' }}
                      >
                        {/* Milestone Label */}
                        <span className={cn(
                          "absolute -top-7 text-[9px] font-black transition-all duration-300",
                          icu >= val ? "text-slate-500" : "text-slate-300"
                        )}>
                          {val}
                        </span>
                        {/* Milestone Dot */}
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all duration-300 z-10",
                          icu >= val ? "bg-[#004a8d] scale-110" : "bg-slate-300"
                        )} />
                      </div>
                    ))}
                  </div>

                  {/* Range Input (Interaction Layer) */}
                  <div className="absolute left-2 right-2 inset-0 flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      className="w-full h-full opacity-0 cursor-pointer z-40"
                      value={icu}
                      onChange={(e) => updateData({
                        phases: {
                          ...data.phases,
                          recovery: { ...data.phases.recovery, icuProbability: Number(e.target.value) }
                        }
                      })}
                    />
                  </div>

                  {/* Visible Thumb */}
                  <div className="absolute left-2 right-2 inset-y-0 flex items-center pointer-events-none">
                    <motion.div 
                      className="absolute w-7 h-7 rounded-full border-[3px] border-white shadow-lg shadow-blue-900/20 bg-gradient-to-br from-blue-500 to-indigo-600 z-30"
                      style={{ left: `${icu}%`, transform: 'translateX(-50%)' }}
                      animate={{ left: `${icu}%` }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 px-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Low Risk</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Critical Care Required</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-end pt-10 border-t border-outline-variant/10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onSaveDraft}
              className="px-8 py-3 rounded-xl bg-surface-container-high text-on-surface font-bold hover:bg-surface-container-highest transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={onNext}
              className="px-10 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold shadow-lg hover:shadow-primary-container/20 transition-all active:scale-95"
            >
              Next: Scheduling
            </button>
          </div>
        </footer>

        <style>{`
          input[type="range"] {
            pointer-events: auto;
          }

          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            pointer-events: auto;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            cursor: pointer;
          }

          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            cursor: pointer;
          }

          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          }

          input[type="range"]::-moz-range-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          }
        `}</style>
      </div>
    </div>
  );
}
