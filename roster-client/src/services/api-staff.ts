import { apiFetch } from './api-core';

export type ServerStaff = {
  id: number;
  organization_id: number;
  staff_id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  profile_picture?: string | null;
  department_id?: number | null;
  department?: string | null;
  designation?: string | null;
  contract_id?: string | null;
  supervisor?: string | null;
  skills?: any;
  certifications?: any;
  roles?: any;
  role_distribution?: any;
  weekly_template?: any;
  pool_assignments?: any;
  created_at: string;
  updated_at: string;
};

export type CreateStaffBody = {
  organization_id: number;
  personal_details: {
    staff_id?: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    profile_picture?: string;
  };
  professional_primary_details: {
    department_id?: number;
    designation?: string;
    contract_id?: string;
    supervisor?: string;
  };
  professional_secondary_details: {
    skills?: string[];
    certifications?: string[];
    roles?: string[];
    role_distribution?: Record<string, number>;
    weekly_template?: any;
    pool_assignments?: any[];
  };
};

export type UpdateStaffBody = Partial<{
  organization_id: number;
  personal_details: Partial<{
    staff_id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    profile_picture: string;
  }>;
  professional_primary_details: Partial<{
    department_id: number;
    designation: string;
    contract_id: string;
    supervisor: string;
  }>;
  professional_secondary_details: Partial<{
    skills: string[];
    certifications: string[];
    roles: string[];
    role_distribution: Record<string, number>;
    weekly_template: any;
    pool_assignments: any[];
  }>;
}>;

export async function createStaff(body: CreateStaffBody): Promise<ServerStaff> {
  return apiFetch<ServerStaff>('/api/staff', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getStaff(params?: { orgId?: number }): Promise<ServerStaff[]> {
  const qs = params?.orgId ? `?orgId=${encodeURIComponent(String(params.orgId))}` : '';
  return apiFetch<ServerStaff[]>(`/api/staff${qs}`, { method: 'GET' });
}

export async function deleteStaffById(id: string | number): Promise<void> {
  await apiFetch<void>(`/api/staff/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
}

export async function updateStaffById(id: string | number, body: UpdateStaffBody): Promise<ServerStaff> {
  return apiFetch<ServerStaff>(`/api/staff/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}
