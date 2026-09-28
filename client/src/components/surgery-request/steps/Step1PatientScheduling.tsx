import { useEffect, useContext } from 'react';
import { Activity, AlertTriangle, ArrowLeft, Calendar, ChevronRight, Clock, Info, User } from 'lucide-react';
import { cn } from '../../../lib/utils';
import CatalogSelect from '../../ui/CatalogSelect';
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

const PRIMARY_SURGEON_OPTIONS = [
  'Dr. Sarah Jenkins (Neuro)',
  'Dr. Marcus Thorne (Cardio)',
  'Dr. Elena Rodriguez (Ortho)',
];

const INFECTION_STATUS_OPTIONS = [
  'Standard Precautions',
  'Contact Precautions (MRSA)',
  'Airborne Precautions',
];

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
  const departments = (context?.store.settings?.catalogs?.departments ?? []) as Array<{ id: number | string; name: string }>;
  const selectedDepartmentValue = (() => {
    if (typeof data.departmentId === 'number') {
      return String(data.departmentId);
    }

    const normalizedDepartmentName = String(data.department ?? '').trim();
    if (!normalizedDepartmentName) {
      return '';
    }

    const matchedDepartment = departments.find((dept) => String(dept.name ?? '').trim() === normalizedDepartmentName);
    return matchedDepartment ? String(matchedDepartment.id) : '';
  })();

  // Auto-populate dates when priority changes
  useEffect(() => {
    // Only auto-populate if dates are empty or if this is the first time setting priority
    if (!data.earliestDate || !data.endDate) {
      const earliestDate = data.earliestDate || todayString;
      const endDate = data.endDate || getDefaultEndDateByPriority(data.priority);
      updateData({ earliestDate, endDate });
    }
  }, [data.earliestDate, data.endDate, data.priority, updateData, todayString]);

  useEffect(() => {
    if (data.department || departments.length === 0) return;
    const fallbackDepartment = departments.find((dept) => Boolean(String(dept.name ?? '').trim()));
    if (!fallbackDepartment) return;
    updateData({
      department: String(fallbackDepartment.name ?? '').trim(),
      departmentId: Number(fallbackDepartment.id),
    });
  }, [data.department, departments, updateData]);
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

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-6 flex items-center gap-2">
            <User size={20} />
            Identity & Oversight
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">Patient Name</label>
              <input
                type="text"
                className="w-full bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary focus:ring-0 text-slate-900 font-medium px-4 py-3 rounded-t-xl transition-all outline-none"
                value={data.patientName}
                onChange={(e) => updateData({ patientName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">Operation Type</label>
              <CatalogSelect
                value={data.operationType}
                onChange={(value) => updateData({ operationType: value })}
                options={operationTypes.map((type) => ({ value: type, label: type }))}
                placeholder="Select Operation Type"
                emptyLabel="No operation types in Settings"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">Department</label>
              <CatalogSelect
                value={selectedDepartmentValue}
                onChange={(value) => {
                  const selectedDepartment = departments.find((dept) => String(dept.id) === value);
                  updateData({
                    department: selectedDepartment ? String(selectedDepartment.name ?? '').trim() : '',
                    departmentId: selectedDepartment ? Number(selectedDepartment.id) : undefined,
                  });
                }}
                options={departments.map((dept) => ({ value: String(dept.id), label: String(dept.name ?? '') }))}
                placeholder="Select Department"
                emptyLabel="No departments in catalog"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">Primary Surgeon</label>
              <CatalogSelect
                value={data.primarySurgeon}
                onChange={(value) => updateData({ primarySurgeon: value })}
                options={PRIMARY_SURGEON_OPTIONS.map((option) => ({ value: option, label: option }))}
                placeholder="Select Surgeon"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">Infection Status / Precautions</label>
              <CatalogSelect
                value={data.infectionStatus}
                onChange={(value) => updateData({ infectionStatus: value })}
                options={INFECTION_STATUS_OPTIONS.map((option) => ({ value: option, label: option }))}
                placeholder="Select Precaution Level"
              />
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-6 flex items-center gap-2">
            <AlertTriangle size={20} />
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

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-6 flex items-center gap-2">
            <Clock size={20} />
            Timeline Constraints
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">
                Earliest Surgery Date <span className="text-error">*</span>
              </label>
              <input
                type="date"
                min={todayString}
                className="w-full bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary focus:ring-0 text-slate-900 font-medium px-4 py-3 rounded-t-xl transition-all outline-none"
                value={data.earliestDate}
                onChange={(e) => updateData({ earliestDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">
                End Date (Required Deadline) <span className="text-error">*</span>
              </label>
              <input
                type="date"
                min={todayString}
                className="w-full bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary focus:ring-0 text-slate-900 font-medium px-4 py-3 rounded-t-xl transition-all outline-none"
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
