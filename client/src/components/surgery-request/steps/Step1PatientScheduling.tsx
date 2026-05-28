import { useEffect, useContext } from 'react';
import { Activity, AlertTriangle, ArrowLeft, Calendar, ChevronRight, Clock, Info, User } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Priority, SurgeryRequest } from '../../../types';
import { AppStoreContext } from '../../../context/AppStoreContext';

type Step1Props = {
  data: SurgeryRequest;
  isNew: boolean;
  updateData: (d: Partial<SurgeryRequest>) => void;
  onNext: () => void;
  onCancel: () => void;
  onSaveDraft: () => void;
};

function getTodayDateString(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().split('T')[0];
}

function getDateAfterDays(days: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function getDefaultEndDateByPriority(priority: Priority): string {
  const daysMap: Record<Priority, number> = {
    emergency: 1,
    mandatory: 3,
    elective: 7,
  };
  return getDateAfterDays(daysMap[priority]);
}

export function Step1PatientScheduling({ data, isNew, updateData, onNext, onCancel, onSaveDraft }: Step1Props) {
  const context = useContext(AppStoreContext);
  const todayString = getTodayDateString();

  const operationTypes = context?.store.settings?.operationTypes || [];

  // Auto-populate dates when priority changes
  useEffect(() => {
    // Only auto-populate if dates are empty or if this is the first time setting priority
    if (!data.earliestDate || !data.endDate) {
      const earliestDate = data.earliestDate || todayString;
      const endDate = data.endDate || getDefaultEndDateByPriority(data.priority);
      updateData({ earliestDate, endDate });
    }
  }, [data.priority]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <aside className="hidden lg:block lg:col-span-3">
        <div className="sticky top-28 bg-surface-container-low rounded-xl p-6 space-y-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-outline mb-4">Request Progress</h3>
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="bg-primary text-on-primary w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Patient Details</p>
                  <p className="text-xs text-outline">Primary case information</p>
                </div>
              </div>
              <div className="flex gap-4 items-start opacity-50">
                <div className="bg-surface-container-highest text-outline w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <p className="text-sm font-medium text-on-surface">Procedure Info</p>
                  <p className="text-xs text-outline">Surgical workflow</p>
                </div>
              </div>
              <div className="flex gap-4 items-start opacity-50">
                <div className="bg-surface-container-highest text-outline w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <p className="text-sm font-medium text-on-surface">Resource Allocation</p>
                  <p className="text-xs text-outline">Equipment & Staff</p>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-outline-variant/15">
            <div className="bg-primary-container/10 p-4 rounded-lg">
              <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                <Info size={14} />
                Clinical Tip
              </p>
              <p className="text-xs text-secondary leading-relaxed">
                Emergency requests are auto-prioritized in the central Gantt view. Ensure Infection Status is accurate for OR sterilization scheduling.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:col-span-9 space-y-8">
        <header>
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <span>Request Workflow</span>
            <ChevronRight size={12} />
            <span className="text-on-surface font-semibold">Patient & Scheduling</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Patient & Scheduling</h1>
          <p className="text-secondary text-lg font-light">Enter core patient identity and define the surgical window requirements.</p>
        </header>

        <section className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
            <User className="text-primary" size={20} />
            Identity & Oversight
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group">
              <label className="block text-sm font-semibold text-outline-variant group-focus-within:text-primary transition-colors mb-2">Patient Name</label>
              <input
                type="text"
                className="w-full bg-transparent border-0 border-b-2 border-outline-variant/20 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-medium transition-all"
                value={data.patientName}
                onChange={(e) => updateData({ patientName: e.target.value })}
              />
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-outline-variant group-focus-within:text-primary transition-colors mb-2">Operation Type</label>
              <select
                className="w-full bg-transparent border-0 border-b-2 border-outline-variant/20 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-medium transition-all appearance-none"
                value={data.operationType}
                onChange={(e) => updateData({ operationType: e.target.value })}
              >
                <option value="">Select Operation Type</option>
                {operationTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-outline-variant group-focus-within:text-primary transition-colors mb-2">Primary Surgeon</label>
              <select
                className="w-full bg-transparent border-0 border-b-2 border-outline-variant/20 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-medium transition-all appearance-none"
                value={data.primarySurgeon}
                onChange={(e) => updateData({ primarySurgeon: e.target.value })}
              >
                <option value="">Select Surgeon</option>
                <option>Dr. Sarah Jenkins (Neuro)</option>
                <option>Dr. Marcus Thorne (Cardio)</option>
                <option>Dr. Elena Rodriguez (Ortho)</option>
              </select>
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-outline-variant group-focus-within:text-primary transition-colors mb-2">Infection Status / Precautions</label>
              <select
                className="w-full bg-transparent border-0 border-b-2 border-outline-variant/20 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-medium transition-all appearance-none"
                value={data.infectionStatus}
                onChange={(e) => updateData({ infectionStatus: e.target.value })}
              >
                <option value="">Select Precaution Level</option>
                <option>Standard Precautions</option>
                <option>Contact Precautions (MRSA)</option>
                <option>Airborne Precautions</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
            <AlertTriangle className="text-primary" size={20} />
            Clinical Urgency
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['emergency', 'mandatory', 'elective'] as Priority[]).map((p) => (
              <label
                key={p}
                className={cn(
                  'relative flex flex-col p-6 rounded-xl border-2 cursor-pointer transition-all',
                  data.priority === p
                    ? 'border-primary bg-surface-container-lowest shadow-md'
                    : 'border-transparent bg-surface-container-low hover:bg-surface-container',
                )}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={data.priority === p}
                  onChange={() => {
                    updateData({ priority: p });
                    // Auto-update dates based on new priority
                    const endDate = getDefaultEndDateByPriority(p);
                    updateData({ priority: p, endDate });
                  }}
                />
                <div className="flex justify-between items-start mb-4">
                  {p === 'emergency' && <Activity className="text-error" size={24} />}
                  {p === 'mandatory' && <AlertTriangle className="text-secondary" size={24} />}
                  {p === 'elective' && <Calendar className="text-tertiary" size={24} />}
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                      data.priority === p ? 'border-primary' : 'border-outline-variant',
                    )}
                  >
                    {data.priority === p && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                </div>
                <span className="font-bold text-on-surface capitalize">{p}</span>
                <span className="text-xs text-outline mt-1 italic">
                  Default: {p === 'emergency' ? '1 Day' : p === 'mandatory' ? '3 Day' : '7 Day'} Window
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
            <Clock className="text-primary" size={20} />
            Timeline Constraints
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group">
              <label className="block text-sm font-semibold text-outline-variant mb-2">
                Earliest Surgery Date <span className="text-error">*</span>
              </label>
              <input
                type="date"
                min={todayString}
                className="w-full bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary/20 px-4 py-3 font-medium transition-all"
                value={data.earliestDate}
                onChange={(e) => updateData({ earliestDate: e.target.value })}
              />
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-outline-variant mb-2">
                End Date (Required Deadline) <span className="text-error">*</span>
              </label>
              <input
                type="date"
                min={todayString}
                className="w-full bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary/20 px-4 py-3 font-medium transition-all"
                value={data.endDate}
                onChange={(e) => updateData({ endDate: e.target.value })}
              />
            </div>
          </div>
        </section>

        <footer className="flex justify-end items-center pt-8">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onSaveDraft}
              className="px-8 py-3 bg-surface-container-high text-on-surface font-semibold rounded-lg hover:bg-surface-dim transition-colors"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={onNext}
              className="px-10 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
            >
              Continue to Step 2
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
