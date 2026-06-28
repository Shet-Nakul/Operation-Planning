import type { SurgeryRequest, SurgeryRequestRecord } from '../types';

export function createBlankSurgeryRequest(): SurgeryRequest {
  return {
    patientName: '',
    operationType: '',
    primarySurgeon: '',
    infectionStatus: '',
    priority: 'elective',
    earliestDate: '',
    endDate: '',
    phases: {
      preOp: { 
        duration: '15 min', 
        resources: [
          { name: "Anesthesiologist", count: 1, icon: "user" },
          { name: "Vitals Nurse", count: 2, icon: "nurse" },
          { name: "Pre-Op Technician", count: 1, icon: "user" },
          { name: "IV Pump", count: 1, icon: "equipment" }
        ] 
      },
      operative: { 
        duration: '3 hr 30 min', 
        resources: [
          { name: "Operating Room", count: 1, icon: "room" },
          { name: "Lead Surgeon", count: 1, icon: "user" },
          { name: "Assistant Surgeon", count: 1, icon: "user" },
          { name: "Scrub Nurse", count: 2, icon: "nurse" },
          { name: "Circulating Nurse", count: 1, icon: "nurse" },
          { name: "Anesthesiologist", count: 1, icon: "user" },
          { name: "Anesthesia Technician", count: 1, icon: "user" },
          { name: "Surgical Kit", count: 1, icon: "equipment" },
          { name: "Operating Table", count: 1, icon: "bed" }
        ] 
      },
      postOp: { 
        duration: '2 hr', 
        resources: [
          { name: "PACU Bed", count: 1, icon: "bed" },
          { name: "Anesthesiologist", count: 1, icon: "user" },
          { name: "Recovery Nurse", count: 2, icon: "nurse" },
          { name: "Monitor Station", count: 1, icon: "equipment" }
        ] 
      },
      sterilization: { 
        duration: '30 min', 
        resources: [
          { name: 'Cleaning Crew', count: 2, icon: 'user' },
          { name: "Sterilization Tech", count: 1, icon: "user" },
          { name: "Sterilizer Machine", count: 1, icon: "equipment" }
        ] 
      },
      recovery: { 
        duration: '6 hr', 
        resources: [
          { name: "ICU Bed", count: 1, icon: "bed" },
          { name: "ICU Nurse", count: 1, icon: "nurse" },
          { name: "Respiratory Therapist", count: 1, icon: "user" },
          { name: "Monitoring Equipment", count: 1, icon: "equipment" }
        ], 
        icuProbability: 35 
      },
    },
    resources: [],
  };
}

export const demoSurgeryRequest: SurgeryRequest = {
  patientName: 'Robert J. McAllister',
  operationType: 'Heart Valve Replacement',
  primarySurgeon: 'Dr. Elena Rodriguez (Ortho)',
  infectionStatus: 'Standard Precautions',
  priority: 'mandatory',
  earliestDate: '2023-10-14',
  endDate: '2023-10-16',
  phases: {
    preOp: {
      duration: '15 min',
      resources: [
        { name: 'Anesthesiologist', count: 1, icon: 'user' },
        { name: 'Vitals Nurse', count: 2, icon: 'nurse' },
      ],
    },
    operative: {
      duration: '3 hr 30 min',
      resources: [
        { name: 'Operating Room', count: 1, icon: 'room' },
        { name: 'Surgeons', count: 1, icon: 'user' },
        { name: 'Scrub Nurses', count: 3, icon: 'nurse' },
      ],
    },
    postOp: {
      duration: '2 hr',
      resources: [
        { name: 'PACU Bed', count: 1, icon: 'bed' },
        { name: 'Anesthesiologist', count: 1, icon: 'user' },
      ],
    },
    sterilization: { duration: '30 min', resources: [{ name: 'Cleaning Crew', count: 2, icon: 'user' }] },
    recovery: { duration: '48 hr', resources: [], icuProbability: 35 },
  },
  resources: [
    { id: '1', name: 'Propofol 1% Emulsion', type: '20ml Vial • Anesthetic', required: 12, stockpile: 142, status: 'available', icon: 'meds' },
    { id: '2', name: 'Blood Unit: O-Negative', type: '450ml Standard Bag', required: 4, stockpile: 2, status: 'shortage', icon: 'blood' },
    { id: '3', name: 'Laparoscopic Kit Alpha', type: 'Single-use Sterile Pack', required: 2, stockpile: 8, status: 'available', icon: 'kit' },
    { id: '4', name: 'Surgical Sutures 4-0', type: 'Vicryl Absorbable (12/box)', required: 1, stockpile: 0, status: 'shortage', icon: 'suture' },
  ],
};

function newReferenceCode(): string {
  const n = Math.floor(100 + Math.random() * 900);
  return `SR-2024-${n}`;
}

function newId(): string {
  const maybe = (globalThis as any)?.crypto?.randomUUID?.();
  if (typeof maybe === 'string' && maybe.length > 0) return maybe;
  return `sr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createRequestRecord(data: SurgeryRequest, overrides?: Partial<Pick<SurgeryRequestRecord, 'referenceCode' | 'status'>>): SurgeryRequestRecord {
  return {
    id: newId(),
    referenceCode: overrides?.referenceCode ?? newReferenceCode(),
    status: overrides?.status ?? 'draft',
    updatedAt: new Date().toISOString(),
    data,
  };
}

export function seedSurgeryRequestRecords(): SurgeryRequestRecord[] {
  return [
    createRequestRecord(demoSurgeryRequest, { referenceCode: 'SR-2024-089', status: 'in_review' }),
    createRequestRecord(
      {
        ...demoSurgeryRequest,
        patientName: 'Maria Chen',
        operationType: 'Total Knee Arthroplasty',
        priority: 'elective',
        earliestDate: '2023-10-20',
        endDate: '2023-10-28',
      },
      { referenceCode: 'SR-2024-102', status: 'draft' },
    ),
  ];
}
