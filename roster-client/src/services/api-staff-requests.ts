import { apiFetch } from './api-core';
import type { ServerStaff } from './api-staff';

export type StaffRequest = {
  id: number;
  staff_id: string;
  staff_name: string;
  staff_department?: string;
  staff_designation?: string;
  request_category: 'LEAVE' | 'SHIFT';
  leave_type_name: string | null;
  shift: string | null;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  can_review: boolean;
  created_at: string;
  metadata?: Record<string, any> | null;
};

export type RequestCatalogOption = { name: string; alias?: string; status?: string };

export function getStaffRequests(staffId?: string) {
  return apiFetch<StaffRequest[]>(`/api/staff-requests${staffId ? `?staffId=${encodeURIComponent(staffId)}` : ''}`);
}

export function createStaffRequest(body: {
  staff_id: string;
  request_category: 'LEAVE' | 'SHIFT';
  leave_type_name?: string;
  shift?: string;
  start_date: string;
  end_date: string;
  reason: string;
  swap?: { target_staff_id: string; preferred_shift: string };
}) {
  return apiFetch<StaffRequest>('/api/staff-requests', { method: 'POST', body: JSON.stringify(body) }).then(notifyRequestsChanged);
}

export function reviewStaffRequest(id: number, status: 'APPROVED' | 'REJECTED') {
  return apiFetch<StaffRequest>(`/api/staff-requests/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }).then(notifyRequestsChanged);
}

function notifyRequestsChanged(request: StaffRequest) {
  window.dispatchEvent(new Event('staff-requests-changed'));
  return request;
}

export function staffRequestStage(request: StaffRequest) {
  if (request.status !== 'PENDING') return request.status === 'APPROVED' ? 'Approved' : 'Rejected';
  return request.metadata?.swap && request.metadata.stage === 'ADMIN' ? 'Awaiting hospital admin' : 'Awaiting supervisor';
}

export function getSupervisorTeam() {
  return apiFetch<{ staff: ServerStaff[]; own_staff: ServerStaff[] }>('/api/staff-requests/team');
}

export async function getRequestCatalogs() {
  const [leaveTypes, shifts] = await Promise.all([
    apiFetch<RequestCatalogOption[]>('/api/catalogs/leave_types'),
    apiFetch<RequestCatalogOption[]>('/api/catalogs/shift'),
  ]);
  return {
    leaveTypes: leaveTypes.filter(option => !option.status || option.status === 'ACTIVE'),
    shifts: shifts.filter(option => (!option.status || option.status === 'ACTIVE') && option.alias && option.alias !== 'V'),
  };
}