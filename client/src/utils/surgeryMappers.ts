import type {
  BackendStageKey,
  BackendStageRequirement,
  BackendSurgery,
  BackendSurgeryPayload,
  BackendSurgeryPlanResult,
  BackendSurgeryStatus,
  Priority,
  SurgeryRequest,
  SurgeryRequestRecord,
  UiPhaseKey,
} from '../types/surgery';

const PHASE_TO_STAGE: Record<UiPhaseKey, BackendStageKey> = {
  preOp: 'pre_op',
  operative: 'operative',
  postOp: 'post_op',
  sterilization: 'sterilization',
  recovery: 'recovery',
};

const STAGE_TO_PHASE: Record<BackendStageKey, UiPhaseKey> = {
  pre_op: 'preOp',
  operative: 'operative',
  post_op: 'postOp',
  sterilization: 'sterilization',
  recovery: 'recovery',
};

const ROLE_NAME_OVERRIDES: Record<string, string> = {
  surgeons: 'Surgeon',
  'operating room': 'Operation Room',
  'scrub nurses': 'Scrub Nurse',
  'cleaning crew': 'Cleaning Crew',
  'anesthesia tech': 'Anesthesia Tech',
  'circulating nurse': 'Circulating Nurse',
  'operating table': 'Operating Table',
  'surgical light': 'Surgical Light',
  'monitor station': 'Monitor Station',
  'monitoring equipment': 'Monitoring Equipment',
  'pre-op technician': 'Pre-Op Technician',
  'iv pump': 'IV Pump',
  'pacu bed': 'PACU Bed',
  'icu bed': 'ICU Bed',
};

function toIsoMinute(value: string, fallbackTime: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.includes('T')) return trimmed.slice(0, 16);
  return `${trimmed}T${fallbackTime}`;
}

function toDateOnly(value: string, fallbackTime: string): string {
  const iso = toIsoMinute(value, fallbackTime);
  return iso ? iso.slice(0, 10) : '';
}

function parseDurationToMinutes(duration: string): number {
  let totalMinutes = 0;
  const dayMatch = duration.match(/(\d+)\s*day/);
  const hourMatch = duration.match(/(\d+)\s*hr/);
  const minMatch = duration.match(/(\d+)\s*min/);

  if (dayMatch) totalMinutes += parseInt(dayMatch[1], 10) * 24 * 60;
  if (hourMatch) totalMinutes += parseInt(hourMatch[1], 10) * 60;
  if (minMatch) totalMinutes += parseInt(minMatch[1], 10);

  return totalMinutes;
}

function inferPriority(earliest: string, latest: string): Priority {
  if (!earliest || !latest) return 'elective';

  const start = new Date(toIsoMinute(earliest, '00:00'));
  const end = new Date(toIsoMinute(latest, '23:59'));
  const diffMs = end.getTime() - start.getTime();
  const diffDays = diffMs / (24 * 60 * 60 * 1000);

  if (diffDays <= 1) return 'emergency';
  if (diffDays <= 3) return 'mandatory';
  return 'elective';
}

function mapInfectionTypeToStatus(infectionType: number): string {
  if (infectionType === 1) return 'Contact Precautions (MRSA)';
  if (infectionType === 2) return 'Airborne Precautions';
  if (infectionType === 3) return 'Positive (+45m sterilization)';
  return 'Standard Precautions';
}

function mapInfectionStatusToType(infectionStatus: string): number {
  const value = infectionStatus.trim().toLowerCase();
  if (value.includes('contact')) return 1;
  if (value.includes('airborne')) return 2;
  if (value.includes('positive')) return 3;
  return 0;
}

export function toBackendRoleName(name: string, roles?: string[]): string {
  const explicit = roles?.find(Boolean)?.trim();
  if (explicit) return explicit;

  const normalized = name.trim().toLowerCase();
  if (ROLE_NAME_OVERRIDES[normalized]) return ROLE_NAME_OVERRIDES[normalized];

  if (normalized.endsWith('s')) {
    const singular = normalized.slice(0, -1);
    if (ROLE_NAME_OVERRIDES[singular]) return ROLE_NAME_OVERRIDES[singular];
    return singular
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  return name;
}

function toStageRequirements(data: SurgeryRequest): Partial<Record<BackendStageKey, BackendStageRequirement[]>> {
  const stages: Partial<Record<BackendStageKey, BackendStageRequirement[]>> = {};

  (Object.keys(PHASE_TO_STAGE) as UiPhaseKey[]).forEach((phaseKey) => {
    const phase = data.phases[phaseKey];
    const phaseDuration = parseDurationToMinutes(phase.duration);

    stages[PHASE_TO_STAGE[phaseKey]] = phase.resources.map((resource) => ({
      role: toBackendRoleName(resource.name, resource.roles),
      count: Math.max(1, Number(resource.count) || 1),
      duration: [
        Math.max(0, Number(resource.startTime) || 0),
        Math.max(
          Math.max(0, Number(resource.startTime) || 0),
          Number(resource.endTime) || phaseDuration,
        ),
      ],
      ...(phaseKey === 'recovery' && typeof phase.icuProbability === 'number'
        ? { probability: phase.icuProbability / 100 }
        : {}),
    }));
  });

  return stages;
}

function cloneDefaultPhases(): SurgeryRequest['phases'] {
  return {
    preOp: { duration: '15 min', resources: [] },
    operative: { duration: '3 hr 30 min', resources: [] },
    postOp: { duration: '2 hr', resources: [] },
    sterilization: { duration: '30 min', resources: [] },
    recovery: { duration: '6 hr', resources: [], icuProbability: 35 },
  };
}

export function createBlankSurgeryRequest(): SurgeryRequest {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const date = `${yyyy}-${mm}-${dd}`;

  return {
    patientName: '',
    operationType: '',
    primarySurgeon: '',
    infectionStatus: 'Standard Precautions',
    infectionType: 0,
    priority: 'elective',
    earliestDate: date,
    endDate: date,
    earliestDateTime: `${date}T00:00`,
    endDateTime: `${date}T23:59`,
    departmentId: undefined,
    department: '',
    phases: cloneDefaultPhases(),
    resources: [],
  };
}

const KNOWN_PRIORITIES: readonly Priority[] = ['emergency', 'mandatory', 'elective'] as const;

function isKnownPriority(value: unknown): value is Priority {
  return typeof value === 'string' && (KNOWN_PRIORITIES as readonly string[]).includes(value);
}

export function unwrapPlanResultPayload(
  raw: unknown,
  surgeryId?: string,
): BackendSurgeryPlanResult['result'] | null {
  let result: unknown = raw;
  if (typeof result === 'string') {
    try {
      result = JSON.parse(result);
    } catch {
      return null;
    }
  }

  if (Array.isArray(result)) {
    const match = surgeryId
      ? result.find((item) => item && typeof item === 'object' && String((item as { id?: unknown }).id) === surgeryId)
      : undefined;
    if (surgeryId && !match) return null;
    result = match ?? result[0];
  }

  if (result && typeof result === 'object' && !Array.isArray(result)) {
    const obj = result as Record<string, unknown>;
    if (Array.isArray(obj.scheduled)) {
      const list = obj.scheduled as unknown[];
      const match = surgeryId
        ? list.find((item) => item && typeof item === 'object' && String((item as { id?: unknown }).id) === surgeryId)
        : undefined;
      if (surgeryId && !match && !(obj.id && String(obj.id) === surgeryId)) return null;
      result = match ?? (obj.id || obj.resources_assigned || obj.planned_start ? obj : list[0]);
    }
  }

  if (!result || typeof result !== 'object' || Array.isArray(result)) return null;
  const finalObj = result as BackendSurgeryPlanResult['result'];
  if (surgeryId && finalObj.id != null && String(finalObj.id) !== surgeryId) return null;
  return finalObj;
}

function planResultHasSchedule(result: BackendSurgeryPlanResult['result'] | null | undefined): boolean {
  if (!result) return false;
  if (result.planned_start) return true;
  const assigned = result.resources_assigned;
  return Boolean(assigned && typeof assigned === 'object' && Object.keys(assigned).length > 0);
}

function effectiveSurgeryStatus(
  status: BackendSurgeryStatus,
  planResult: BackendSurgeryPlanResult['result'] | null,
  timeWindowsPlannedStart?: string | null,
): BackendSurgeryStatus {
  if (status === 'IN_PROGRESS' || status === 'DONE' || status === 'CANCELLED') return status;
  if (planResultHasSchedule(planResult) || Boolean(timeWindowsPlannedStart)) {
    if (status === 'DRAFT' || status === 'ESTIMATED' || status === 'PLANNING') return 'PLANNED';
  }
  return status;
}

export function mapBackendSurgeryToRequestRecord(
  surgery: BackendSurgery,
  planResult?: BackendSurgeryPlanResult | null,
): SurgeryRequestRecord {
  const stages = surgery.stages ?? {};
  const phases = cloneDefaultPhases();

  (Object.keys(STAGE_TO_PHASE) as BackendStageKey[]).forEach((stageKey) => {
    const phaseKey = STAGE_TO_PHASE[stageKey];
    const requirements = stages[stageKey] ?? [];
    phases[phaseKey] = {
      ...phases[phaseKey],
      resources: requirements.map((requirement) => ({
        name: requirement.role,
        count: requirement.count,
        icon: 'user',
        roles: [requirement.role],
        startTime: requirement.duration?.[0] ?? 0,
        endTime: requirement.duration?.[1] ?? parseDurationToMinutes(phases[phaseKey].duration),
        assignments: [],
      })),
      ...(phaseKey === 'recovery'
        ? {
            icuProbability:
              typeof requirements[0]?.probability === 'number'
                ? Math.round(requirements[0].probability * 100)
                : phases[phaseKey].icuProbability,
          }
        : {}),
    };
  });

  const earliestDateTime = toIsoMinute(surgery.time_windows?.earliest_date ?? '', '00:00');
  const endDateTime = toIsoMinute(surgery.time_windows?.latest_date ?? '', '23:59');

  const rawType = surgery.type ?? '';
  const normalizedType = rawType.trim().toLowerCase();

  let priority: Priority;
  let operationType: string;

  if (isKnownPriority(normalizedType)) {
    priority = normalizedType;
    operationType = '';
  } else {
    priority = inferPriority(earliestDateTime, endDateTime);
    operationType = rawType;
  }

  const unwrappedResult = unwrapPlanResultPayload(planResult?.result, surgery.surgery_id);
  const timeWindowStart = surgery.time_windows?.planned_start ?? null;
  const mergedResult = unwrappedResult
    ? {
        ...unwrappedResult,
        planned_start: unwrappedResult.planned_start || timeWindowStart || undefined,
      }
    : timeWindowStart
      ? { planned_start: timeWindowStart }
      : null;
  const status = effectiveSurgeryStatus(surgery.status, mergedResult, timeWindowStart);
  const attachedPlan =
    mergedResult && planResultHasSchedule(mergedResult)
      ? {
          ...(planResult ?? {
            id: 0,
            surgery_id: surgery.surgery_id,
            organization_id: surgery.organization_id,
            department: surgery.department ?? '',
            result: mergedResult,
          }),
          result: mergedResult,
        }
      : null;

  return {
    id: String(surgery.id),
    backendId: surgery.id,
    organizationId: surgery.organization_id,
    referenceCode: surgery.surgery_id,
    status,
    updatedAt: surgery.updated_at ?? new Date().toISOString(),
    isPersisted: true,
    planResult: attachedPlan,
    data: {
      patientName: surgery.name ?? '',
      operationType,
      primarySurgeon: '',
      infectionStatus: mapInfectionTypeToStatus(Number(surgery.infection_type ?? 0)),
      infectionType: Number(surgery.infection_type ?? 0),
      priority,
      earliestDate: toDateOnly(earliestDateTime, '00:00'),
      endDate: toDateOnly(endDateTime, '23:59'),
      earliestDateTime,
      endDateTime,
      departmentId: surgery.department_id ?? undefined,
      department: surgery.department ?? '',
      plannedStart: String(mergedResult?.planned_start ?? timeWindowStart ?? ''),
      phases,
      resources: [],
    },
  };
}

export function mapRequestToBackendPayload(
  request: SurgeryRequest,
  organizationId: number,
  status?: BackendSurgeryStatus,
): BackendSurgeryPayload {
  const earliestDateTime = toIsoMinute(request.earliestDateTime || request.earliestDate, '00:00');
  const endDateTime = toIsoMinute(request.endDateTime || request.endDate, '23:59');

  return {
    organization_id: organizationId,
    name: request.patientName.trim(),
    type: request.priority,
    infection_type: mapInfectionStatusToType(request.infectionStatus),
    department_id: request.departmentId ?? null,
    ...(status ? { status } : {}),
    time_windows: {
      earliest_date: earliestDateTime,
      latest_date: endDateTime,
    },
    stages: toStageRequirements(request),
  };
}

export function withSynchronizedWindow(
  request: SurgeryRequest,
  patch: Partial<SurgeryRequest>,
): SurgeryRequest {
  const next = { ...request, ...patch };
  const earliestDate = patch.earliestDate ?? next.earliestDate;
  const endDate = patch.endDate ?? next.endDate;

  next.earliestDate = earliestDate;
  next.endDate = endDate;
  next.earliestDateTime = patch.earliestDateTime ?? toIsoMinute(earliestDate, '00:00');
  next.endDateTime = patch.endDateTime ?? toIsoMinute(endDate, '23:59');
  next.infectionType =
    typeof patch.infectionType === 'number'
      ? patch.infectionType
      : mapInfectionStatusToType(patch.infectionStatus ?? next.infectionStatus);

  return next;
}
