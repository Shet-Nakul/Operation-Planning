import type { BackendSurgeryStatus, SurgeryRequest, SurgeryRequestRecord } from '../types/surgery';
import { createBlankSurgeryRequest as createBlankRequestFromMapper } from '../utils/surgeryMappers';

function newLocalId(): string {
  const maybe = (globalThis as any)?.crypto?.randomUUID?.();
  if (typeof maybe === 'string' && maybe.length > 0) return maybe;
  return `sr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createBlankSurgeryRequest(): SurgeryRequest {
  return createBlankRequestFromMapper();
}

export function createRequestRecord(
  data: SurgeryRequest,
  organizationId: number,
  overrides?: Partial<Pick<SurgeryRequestRecord, 'referenceCode' | 'status'>>,
): SurgeryRequestRecord {
  const now = new Date().toISOString();
  return {
    id: newLocalId(),
    organizationId,
    referenceCode: overrides?.referenceCode ?? 'New Request',
    status: overrides?.status ?? ('DRAFT' satisfies BackendSurgeryStatus),
    updatedAt: now,
    isPersisted: false,
    data,
    planResult: null,
  };
}

export function seedSurgeryRequestRecords(): SurgeryRequestRecord[] {
  return [];
}
