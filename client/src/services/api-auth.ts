import { apiFetch, setAuthSession, type AuthUser, type LoginResponse, type RegisterBody } from './api-core';

export async function authLogin(body: { email: string; password: string }): Promise<LoginResponse> {
  const res = await apiFetch<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) });
  setAuthSession(res);
  return res;
}

export async function authRegister(body: RegisterBody): Promise<{ user: AuthUser }> {
  return apiFetch<{ user: AuthUser }>('/auth/register', { method: 'POST', body: JSON.stringify(body) });
}
