import { ArrowLeft } from 'lucide-react';
import type { SurgeryRequest, SurgeryRequestRecord } from '../../types';
import { SurgeryRequestListPanel } from './SurgeryRequestListPanel';
import { SurgeryRequestWizard } from './SurgeryRequestWizard';

type RequestsViewMode = 'list' | 'editor';

type SurgeryRequestsWorkspaceProps = {
  mode: RequestsViewMode;
  records: SurgeryRequestRecord[];
  totalRequestCount: number;
  onClearSearch?: () => void;
  activeId: string | null;
  activeRecord: SurgeryRequestRecord | null;
  isNew: boolean;
  step: number;
  onSelectRequest: (id: string) => void;
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
  onSelectRequest,
  onNewRequest,
  onBackToList,
  onStepChange,
  updateData,
  onCancelRequest,
  onSaveDraft,
  onSaveForLater,
  onSubmitRequest,
}: SurgeryRequestsWorkspaceProps) {
  if (mode === 'list') {
    return (
      <div className="min-h-[calc(100vh-7rem)] w-full">
        <SurgeryRequestListPanel
          records={records}
          totalRequestCount={totalRequestCount}
          onClearSearch={onClearSearch}
          activeId={activeId}
          onSelect={onSelectRequest}
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

  return (
    <div className="min-h-[calc(100vh-7rem)] flex flex-col">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-200/80 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToList}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-on-surface rounded-xl px-3 py-2 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to requests
          </button>
          <div className="h-6 w-px bg-slate-200 mx-1" />
          <button
            type="button"
            onClick={() => {
              const msg = isNew 
                ? 'Are you sure you want to cancel this new request? All entered data will be lost.' 
                : 'Are you sure you want to delete this existing request? This action cannot be undone.';
              if (window.confirm(msg)) {
                onCancelRequest();
              }
            }}
            className="inline-flex items-center gap-2 text-sm font-bold text-error hover:text-error/80 rounded-xl px-3 py-2 hover:bg-rose-50 transition-colors"
          >
            {isNew ? 'Cancel Request' : 'Delete Request'}
          </button>
        </div>
        <p className="text-xs font-mono font-semibold text-outline">
          {activeRecord.referenceCode}
          <span className="text-outline/60 font-sans font-normal ml-2">
            — {activeRecord.data.patientName?.trim() || 'Patient TBD'}
          </span>
        </p>
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
    </div>
  );
}
