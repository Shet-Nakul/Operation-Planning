import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Activity, Clock, CheckCircle2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { SurgeryRequest, SurgeryRequestRecord } from '../../types';
import { SurgeryRequestListPanel } from './SurgeryRequestListPanel';
import { SurgeryRequestDetailView } from './SurgeryRequestDetailView';
import { SurgeryRequestWizard } from './SurgeryRequestWizard';

type RequestsViewMode = 'list' | 'editor' | 'viewer';

type SurgeryRequestsWorkspaceProps = {
  mode: RequestsViewMode;
  records: SurgeryRequestRecord[];
  totalRequestCount: number;
  onClearSearch?: () => void;
  activeId: string | null;
  activeRecord: SurgeryRequestRecord | null;
  isNew: boolean;
  step: number;
  onViewRequest: (id: string) => void;
  onEditRequest: (id: string) => void;
  onNewRequest: () => void;
  onBackToList: () => void;
  onStepChange: (step: number) => void;
  updateData: (updates: Partial<SurgeryRequest>) => void;
  onCancelRequest: () => void;
  onSaveDraft: () => void;
  onSaveForLater: () => void;
  onSubmitRequest: () => void;
};

export function SurgeryRequestsWorkspace({
  mode,
  records,
  totalRequestCount,
  onClearSearch,
  activeId,
  activeRecord,
  isNew,
  step,
  onViewRequest,
  onEditRequest,
  onNewRequest,
  onBackToList,
  onStepChange,
  updateData,
  onCancelRequest,
  onSaveDraft,
  onSaveForLater,
  onSubmitRequest,
}: SurgeryRequestsWorkspaceProps) {
  // Track if header is sticky (scrolled)
  const [isSticky, setIsSticky] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const modalRoot = typeof document !== 'undefined' ? document.body : null;

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get back button label based on current step
  const getBackLabel = (currentStep: number): string => {
    const labels: Record<number, string> = {
      1: 'Back to Requests',
      2: 'Back to Patient Details',
      3: 'Back to Phase Resources',
      4: 'Back to Resource Planning',
    };
    return labels[currentStep] || 'Back';
  };

  // Step configuration for progress indicator
  const stepConfig = [
    { label: 'Patient', icon: Check },
    { label: 'Phases', icon: Activity },
    { label: 'Schedule', icon: Clock },
    { label: 'Review', icon: CheckCircle2 },
  ];

  const handleBackClick = () => {
    if (step === 1) {
      onBackToList();
    } else {
      onStepChange(step - 1);
    }
  };

  if (mode === 'list') {
    return (
      <div className="min-h-[calc(100vh-7rem)] w-full">
        <SurgeryRequestListPanel
          records={records}
          totalRequestCount={totalRequestCount}
          onClearSearch={onClearSearch}
          activeId={activeId}
          onView={onViewRequest}
          onEdit={onEditRequest}
          onNewRequest={onNewRequest}
          layout="grid"
        />
      </div>
    );
  }

  if (!activeRecord) {
    return (
      <div className="max-w-md mx-auto text-center py-16 rounded-2xl border border-slate-200 bg-surface-container-lowest px-8">
        <p className="text-on-surface font-semibold">This request is no longer available.</p>
        <button
          type="button"
          onClick={onBackToList}
          className="mt-4 rounded-xl bg-primary text-on-primary px-5 py-2.5 text-sm font-bold hover:opacity-90"
        >
          Back to requests
        </button>
      </div>
    );
  }

  if (mode === 'viewer') {
    return (
      <SurgeryRequestDetailView
        record={activeRecord}
        onBack={onBackToList}
        onEdit={() => onEditRequest(activeRecord.id)}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-7rem)] flex flex-col">
      {/* Sticky Header - Fixed on top when scrolling */}
      <div
        className={`sticky top-0 z-50 relative shrink-0 flex flex-wrap items-center justify-between gap-3 min-h-16 py-2 px-6 lg:px-8 mb-6 rounded-b-lg transition-all duration-300 ${
          isSticky
            ? 'bg-primary text-white shadow-lg'
            : 'bg-white border-b border-slate-200/80'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Hide back button on step 1 */}
          {step > 1 && (
            <>
              <button
                type="button"
                onClick={handleBackClick}
                className={`inline-flex items-center gap-2 text-sm font-bold rounded-xl px-3 py-2 transition-colors ${
                  isSticky
                    ? 'text-white/90 hover:text-white hover:bg-white/10'
                    : 'text-slate-600 hover:text-on-surface hover:bg-slate-100'
                }`}
              >
                <ArrowLeft size={18} />
                {getBackLabel(step)}
              </button>
              <div className={`h-6 w-px mx-1 ${isSticky ? 'bg-white/30' : 'bg-slate-200'}`} />
            </>
          )}
        </div>
        {/* Centered step progress indicator */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1.5">
          {stepConfig.map((s, i) => {
            const stepNum = i + 1;
            const isDone = stepNum < step;
            const isActive = stepNum === step;
            const Icon = s.icon;

            return (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isDone
                      ? isSticky
                        ? 'bg-white/25 text-white'
                        : 'bg-tertiary text-white'
                      : isActive
                        ? isSticky
                          ? 'bg-white text-primary shadow-md'
                          : 'bg-primary text-white shadow-md ring-2 ring-primary/20'
                        : isSticky
                          ? 'bg-white/10 text-white/40'
                          : 'bg-slate-100 text-slate-400'
                  }`}
                  title={s.label}
                >
                  <Icon size={12} />
                </div>
                {stepNum < 4 && (
                  <div className={`w-3 h-0.5 rounded-full ${isSticky ? 'bg-white/20' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <p className={`text-xs font-mono font-semibold hidden sm:block ${isSticky ? 'text-white/80' : 'text-outline'}`}>
            {activeRecord.referenceCode}
            <span className={`font-sans font-normal ml-2 ${isSticky ? 'text-white/60' : 'text-outline/60'}`}>
              — {activeRecord.data.patientName?.trim() || 'Patient TBD'}
            </span>
          </p>
          <button
            type="button"
            onClick={onSaveDraft}
            className={`inline-flex items-center gap-2 text-sm font-bold rounded-xl px-4 py-2 transition-colors ${
              isSticky
                ? 'bg-white text-primary hover:bg-white/90'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => setCancelConfirmOpen(true)}
            className={`inline-flex items-center gap-2 text-sm font-bold rounded-xl px-4 py-2 transition-colors ${
              isSticky
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            Cancel Request
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-8">
        <SurgeryRequestWizard
          step={step}
          data={activeRecord.data}
          referenceCode={activeRecord.referenceCode}
          recordStatus={activeRecord.status}
          isNew={isNew}
          updateData={updateData}
          onStepChange={onStepChange}
          onCancelRequest={onCancelRequest}
          onSaveDraft={onSaveDraft}
          onSaveForLater={onSaveForLater}
          onSubmitRequest={onSubmitRequest}
        />
      </div>
      {cancelConfirmOpen && modalRoot && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[200]"
            onClick={() => setCancelConfirmOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-[min(92vw,30rem)]">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-bold text-on-surface mb-2">Confirm Cancel Request</h3>
                <p className="text-sm text-outline">
                  {isNew
                    ? 'Are you sure you want to cancel this new request? All entered data will be lost.'
                    : 'Are you sure you want to delete this existing request? This action cannot be undone.'}
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 p-4 bg-surface-container-low border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCancelConfirmOpen(false)}
                  className="px-5 py-2 rounded-xl bg-white border border-slate-200 text-on-surface font-semibold hover:bg-surface-container transition-colors"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCancelConfirmOpen(false);
                    onCancelRequest();
                  }}
                  className="px-5 py-2 rounded-xl bg-error text-on-error font-semibold hover:bg-error/90 transition-colors"
                >
                  {isNew ? 'Cancel Request' : 'Delete Request'}
                </button>
              </div>
            </div>
          </div>
        </>,
        modalRoot,
      )}
    </div>
  );
}
