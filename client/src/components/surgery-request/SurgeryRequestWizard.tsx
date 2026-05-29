import { AnimatePresence, motion } from 'motion/react';
import type { SurgeryRequest, SurgeryRequestStatus } from '../../types';
import { Step1PatientScheduling } from './steps/Step1PatientScheduling';
import { Step2PhaseResources } from './steps/Step2PhaseResources';
import { Step3ResourcePlanning } from './steps/Step3ResourcePlanning';
import { Step4FinalReview } from './steps/Step4FinalReview';

type SurgeryRequestWizardProps = {
  step: number;
  data: SurgeryRequest;
  referenceCode: string;
  recordStatus: SurgeryRequestStatus;
  isNew: boolean;
  updateData: (updates: Partial<SurgeryRequest>) => void;
  onStepChange: (step: number) => void;
  onCancelRequest: () => void;
  onSaveDraft: () => void;
  onSaveForLater: () => void;
  onSubmitRequest: () => void;
};

export function SurgeryRequestWizard({
  step,
  data,
  referenceCode,
  recordStatus,
  isNew,
  updateData,
  onStepChange,
  onCancelRequest,
  onSaveDraft,
  onSaveForLater,
  onSubmitRequest,
}: SurgeryRequestWizardProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {step === 1 && (
          <Step1PatientScheduling
            data={data}
            isNew={isNew}
            updateData={updateData}
            onNext={() => onStepChange(2)}
            onCancel={onCancelRequest}
            onSaveDraft={onSaveDraft}
          />
        )}
        {step === 2 && (
          <Step2PhaseResources
            data={data}
            updateData={updateData}
            onBack={() => onStepChange(1)}
            onNext={() => onStepChange(3)}
            onSaveDraft={onSaveDraft}
          />
        )}
        {step === 3 && (
          <Step3ResourcePlanning
            data={data}
            referenceCode={referenceCode}
            onBack={() => onStepChange(2)}
            onNext={() => onStepChange(4)}
            updateData={updateData}
            onSaveForLater={onSaveForLater}
          />
        )}
        {step === 4 && (
          <Step4FinalReview
            data={data}
            recordStatus={recordStatus}
            onBack={() => onStepChange(3)}
            onSaveDraft={onSaveDraft}
            onSubmitRequest={onSubmitRequest}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
