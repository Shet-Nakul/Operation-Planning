import { useState, useEffect, useContext, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Droplets,
  Info,
  Plus,
  Stethoscope,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { cn } from '../../../lib/utils';
import { getPhaseDefaults, getAvailableDefaults } from '../../../lib/resourceDefaults';
import type { SurgeryRequest } from '../../../types';
import { AppStoreContext } from '../../../context/AppStoreContext';

type MainPhase = 'preOp' | 'operative' | 'postOp';
type AssignmentPhase = MainPhase | 'sterilization';

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
  const modalRoot = typeof document !== 'undefined' ? document.body : null;

  const [selectedPhaseForAdd, setSelectedPhaseForAdd] = useState<MainPhase | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ phaseId: MainPhase; resourceIndex: number; resourceName: string } | null>(null);
  const [activeSlider, setActiveSlider] = useState<string | null>(null);
  const [expandedResources, setExpandedResources] = useState<Record<string, boolean>>({});
  const [assignmentMode, setAssignmentMode] = useState<Record<string, 'staff' | 'pool' | 'nonhuman'>>({});
  const [assignmentDept, setAssignmentDept] = useState<Record<string, string>>({});
  const [assignmentEditor, setAssignmentEditor] = useState<{ phaseId: AssignmentPhase; resourceIndex: number } | null>(null);

  const staff = context?.store.staff ?? [];
  const pools = context?.store.resourcePools ?? [];
  const departments = context?.store.settings?.catalogs?.departments ?? [];

  const normalize = (value?: string) => (value ?? '').trim().toLowerCase();
  const normalizeDepartmentKey = (value?: string) =>
    normalize(value)
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\bdepartments?\b/g, '')
      .replace(/\bservices?\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/s\b/g, '');

  const findDepartmentId = (deptName: string) => {
    const key = normalize(deptName);
    const row = departments.find((d) => normalize(d.name) === key);
    return row ? Number(row.id) : undefined;
  };

  // Get unique department names from settings.
  const deptNames = useMemo(() => {
    const names = departments
      .map(d => (d.name ?? '').trim())
      .filter(Boolean);

    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [departments]);

  // Get staff members in a department
  const getStaffByDept = (dept: string) => {
    const deptKey = normalize(dept);
    const deptCanonical = normalizeDepartmentKey(dept);
    const selectedDeptId = findDepartmentId(dept);

    return staff.filter((s: any) => {
      const byName = normalize(s.department) === deptKey;
      const byCanonical = normalizeDepartmentKey(s.department) === deptCanonical;
      const byId =
        typeof selectedDeptId === 'number' &&
        (Number(s.departmentId) === selectedDeptId || Number(s.department_id) === selectedDeptId);
      return byName || byCanonical || byId;
    });
  };

  // Get pools in a department, segregated by human/non-human
  const getPoolsByDept = (dept: string) => {
    const deptKey = normalize(dept);
    const deptCanonical = normalizeDepartmentKey(dept);
    const selectedDeptId = findDepartmentId(dept);

    const all = pools.filter((p: any) => {
      const byName = normalize(p.department) === deptKey;
      const byCanonical = normalizeDepartmentKey(p.department) === deptCanonical;
      const byId =
        typeof selectedDeptId === 'number' &&
        (Number(p.departmentId) === selectedDeptId || Number(p.department_id) === selectedDeptId);
      return byName || byCanonical || byId;
    });
    const human = all.filter(p => ['user', 'nurse'].includes(normalize(p.icon)));
    const nonHuman = all.filter(p => !['user', 'nurse'].includes(normalize(p.icon)));
    return { all, human, nonHuman };
  };

  const getResourceKey = (phaseId: AssignmentPhase, resourceIndex: number) => `${phaseId}-${resourceIndex}`;

  const getPhaseResources = (phaseId: AssignmentPhase) => {
    if (phaseId === 'sterilization') return data.phases.sterilization.resources;
    return data.phases[phaseId].resources;
  };

  const getResourceAssignments = (phaseId: AssignmentPhase, resourceIndex: number) => {
    const resource = getPhaseResources(phaseId)[resourceIndex];
    return resource?.assignments ?? [];
  };

  const setResourceAssignments = (phaseId: AssignmentPhase, resourceIndex: number, assignments: { type: 'individual' | 'pool'; id: string; name: string }[]) => {
    if (phaseId === 'sterilization') {
      const resources = data.phases.sterilization.resources.map((r, idx) =>
        idx === resourceIndex ? { ...r, assignments } : r
      );
      updateData({
        phases: {
          ...data.phases,
          sterilization: { ...data.phases.sterilization, resources },
        },
      });
      return;
    }

    const phase = data.phases[phaseId];
    const resources = phase.resources.map((r, idx) =>
      idx === resourceIndex ? { ...r, assignments } : r
    );
    updateData({
      phases: {
        ...data.phases,
        [phaseId]: { ...phase, resources },
      },
    });
  };

  useEffect(() => {
    if (deptNames.length === 0) {
      setAssignmentDept({});
      return;
    }

    const validSet = new Set(deptNames.map(normalize));
    setAssignmentDept(prev => {
      const next: Record<string, string> = {};
      for (const [key, value] of Object.entries(prev)) {
        if (validSet.has(normalize(value))) {
          next[key] = value;
        }
      }
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }, [deptNames]);

  const getSelectionLimit = (mode: 'staff' | 'pool' | 'nonhuman', resourceCount: number) => {
    return mode === 'staff' ? resourceCount : 1;
  };

  const isPersonnelResource = (icon: string) => icon === 'user' || icon === 'nurse';

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
                      <div className="space-y-2 border-t border-surface-container pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Assigned ({(res.assignments ?? []).length}/{res.count})
                          </label>
                          <button
                            type="button"
                            onClick={() => setAssignmentEditor({ phaseId: phase.id, resourceIndex: i })}
                            className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
                          >
                            Manage
                          </button>
                        </div>
                        {(res.assignments ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {(res.assignments ?? []).map((assignment) => (
                              <span key={assignment.id} className="text-[10px] bg-primary/10 text-primary rounded px-2 py-1 font-semibold">
                                {assignment.name}
                              </span>
                            ))}
                          </div>
                        )}
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
        {selectedPhaseForAdd && modalRoot && createPortal((
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-[200]"
              onClick={() => setSelectedPhaseForAdd(null)}
            />
            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210]">
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
        ), modalRoot)}

        {/* Assignment Management Modal */}
        {assignmentEditor && modalRoot && (
          (() => {
            const { phaseId, resourceIndex } = assignmentEditor;
            const resource = getPhaseResources(phaseId)[resourceIndex];
            if (!resource) return null;

            const resourceKey = getResourceKey(phaseId, resourceIndex);
            const selectedDept = assignmentDept[resourceKey] ?? '';
            const mode = assignmentMode[resourceKey] ?? 'staff';
            const currentAssignments = getResourceAssignments(phaseId, resourceIndex);
            const selectionLimit = getSelectionLimit(mode, resource.count);

            const staffByDept = selectedDept ? getStaffByDept(selectedDept) : [];
            const poolsByDept = selectedDept ? getPoolsByDept(selectedDept) : { all: [], human: [], nonHuman: [] };
            const modeOptions = mode === 'staff'
              ? staffByDept.map(item => ({
                  id: item.id,
                  label: `${item.name} · ${item.title}`,
                  assignmentName: item.name,
                  type: 'individual' as const,
                }))
              : mode === 'pool'
                ? poolsByDept.human.map(item => ({
                    id: item.id,
                    label: item.name,
                    assignmentName: item.name,
                    type: 'pool' as const,
                  }))
                : poolsByDept.nonHuman.map(item => ({
                    id: item.id,
                    label: item.name,
                    assignmentName: item.name,
                    type: 'pool' as const,
                  }));

            const addAssignment = (id: string) => {
              const selected = modeOptions.find(option => option.id === id);
              if (!selected) return;
              if (currentAssignments.some(item => item.id === id)) return;
              if (currentAssignments.length >= selectionLimit) return;

              setResourceAssignments(phaseId, resourceIndex, [
                ...currentAssignments,
                { id: selected.id, name: selected.assignmentName, type: selected.type },
              ]);
            };

            const removeAssignment = (id: string) => {
              setResourceAssignments(
                phaseId,
                resourceIndex,
                currentAssignments.filter(item => item.id !== id),
              );
            };

            return createPortal((
              <>
                <div
                  className="fixed inset-0 bg-black/50 z-[200]"
                  onClick={() => setAssignmentEditor(null)}
                />
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-[min(92vw,680px)]">
                  <div className="bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden">
                    <div className="flex justify-between items-center p-4 bg-surface-container-low border-b border-slate-200">
                      <div>
                        <h3 className="font-bold text-on-surface">Assign Resource</h3>
                        <p className="text-xs text-outline mt-0.5">{resource.name} ({currentAssignments.length}/{selectionLimit})</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAssignmentEditor(null)}
                        className="text-slate-500 hover:text-on-surface transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</label>
                          <select
                            value={selectedDept}
                            onChange={(e) => {
                              setAssignmentDept(prev => ({ ...prev, [resourceKey]: e.target.value }));
                              setResourceAssignments(phaseId, resourceIndex, []);
                            }}
                            className="w-full bg-surface-container-lowest border border-slate-200 focus:ring-1 focus:ring-primary text-xs font-bold rounded px-3 py-2"
                          >
                            <option value="">— Select department —</option>
                            {deptNames.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resource Type</label>
                          <div className="flex rounded-md overflow-hidden border border-outline-variant/30 text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => {
                                setAssignmentMode(prev => ({ ...prev, [resourceKey]: 'staff' }));
                                setResourceAssignments(phaseId, resourceIndex, []);
                              }}
                              className={cn(
                                'flex-1 py-2 transition-colors',
                                mode === 'staff'
                                  ? 'bg-primary text-on-primary'
                                  : 'bg-surface-container-lowest text-outline hover:bg-surface-container',
                              )}
                            >
                              Staff
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAssignmentMode(prev => ({ ...prev, [resourceKey]: 'pool' }));
                                setResourceAssignments(phaseId, resourceIndex, []);
                              }}
                              className={cn(
                                'flex-1 py-2 transition-colors',
                                mode === 'pool'
                                  ? 'bg-primary text-on-primary'
                                  : 'bg-surface-container-lowest text-outline hover:bg-surface-container',
                              )}
                            >
                              Pool
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAssignmentMode(prev => ({ ...prev, [resourceKey]: 'nonhuman' }));
                                setResourceAssignments(phaseId, resourceIndex, []);
                              }}
                              className={cn(
                                'flex-1 py-2 transition-colors',
                                mode === 'nonhuman'
                                  ? 'bg-primary text-on-primary'
                                  : 'bg-surface-container-lowest text-outline hover:bg-surface-container',
                              )}
                            >
                              Equipment
                            </button>
                          </div>
                        </div>
                      </div>

                      {selectedDept ? (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Add Option ({currentAssignments.length}/{selectionLimit})
                          </label>
                          <select
                            value=""
                            disabled={modeOptions.length === 0 || currentAssignments.length >= selectionLimit}
                            onChange={(e) => addAssignment(e.target.value)}
                            className="w-full bg-surface-container-lowest border border-slate-200 focus:ring-1 focus:ring-primary text-xs font-bold rounded px-3 py-2 disabled:opacity-60"
                          >
                            <option value="">
                              {modeOptions.length === 0
                                ? '— No options for selected department/type —'
                                : currentAssignments.length >= selectionLimit
                                  ? '— Selection limit reached —'
                                  : `— Select ${mode === 'staff' ? 'staff' : mode === 'pool' ? 'pool' : 'equipment'} —`}
                            </option>
                            {modeOptions.map(option => (
                              <option
                                key={option.id}
                                value={option.id}
                                disabled={currentAssignments.some(item => item.id === option.id)}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">Select a department first. Departments are loaded from Settings.</p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Assignment</label>
                          {currentAssignments.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setResourceAssignments(phaseId, resourceIndex, [])}
                              className="text-[10px] text-slate-400 hover:text-error transition-colors"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                        {currentAssignments.length > 0 ? (
                          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                            {currentAssignments.map(item => (
                              <div key={item.id} className="flex items-center justify-between gap-2 bg-primary/10 text-primary rounded px-2 py-1">
                                <span className="text-xs font-semibold truncate">{item.name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeAssignment(item.id)}
                                  className="text-[10px] text-slate-400 hover:text-error transition-colors"
                                  aria-label="Remove assignment"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No assignments selected yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 p-4 bg-surface-container-low border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setAssignmentEditor(null)}
                        className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-on-surface font-semibold hover:bg-surface-container transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ), modalRoot);
          })()
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && modalRoot && createPortal((
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-[200]"
              onClick={() => setDeleteConfirm(null)}
            />
            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210]">
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
        ), modalRoot)}

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
              <div className="space-y-2 border-t border-surface-container pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Assigned ({(ster.resources[0]?.assignments ?? []).length}/{cleaning.count})
                  </label>
                  <button
                    type="button"
                    onClick={() => setAssignmentEditor({ phaseId: 'sterilization', resourceIndex: 0 })}
                    className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    Manage
                  </button>
                </div>
                {(ster.resources[0]?.assignments ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(ster.resources[0]?.assignments ?? []).map((assignment) => (
                      <span key={assignment.id} className="text-[10px] bg-primary/10 text-primary rounded px-2 py-1 font-semibold">
                        {assignment.name}
                      </span>
                    ))}
                  </div>
                )}
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
