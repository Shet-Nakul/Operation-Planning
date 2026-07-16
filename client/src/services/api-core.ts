export function normalizeApiBaseUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  let s = value.trim();
  if (!s) return '';
  s = s.replace(/\/+$/, '');
  if (s.endsWith('/api')) s = s.slice(0, -4);
  if (s.endsWith('/auth')) s = s.slice(0, -5);
  return s;
}

export function normalizeToken(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  if (!s) return null;
  if (s === 'undefined' || s === 'null') return null;
  return s;
}

const RAW_API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL;
export const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL);

const RAW_DEV_EMAIL = (import.meta as any).env?.VITE_DEV_EMAIL;
const RAW_DEV_PASSWORD = (import.meta as any).env?.VITE_DEV_PASSWORD;
const DEV_EMAIL = normalizeToken(RAW_DEV_EMAIL) ?? 'admin@centralhospital.com';
const DEV_PASSWORD = normalizeToken(RAW_DEV_PASSWORD) ?? 'password123';
const RAW_AUTO_LOGIN = (import.meta as any).env?.VITE_AUTO_LOGIN;
const AUTO_LOGIN = String(RAW_AUTO_LOGIN ?? '').trim().toLowerCase() === 'true';

const STORAGE_ACCESS_TOKEN_KEY = 'op.accessToken';
const STORAGE_REFRESH_TOKEN_KEY = 'op.refreshToken';
const STORAGE_USER_KEY = 'op.user';

function getStorage(): Storage | null {
  try {
    const s = (globalThis as any)?.localStorage;
    return s ?? null;
  } catch {
    return null;
  }
}

function readStoredToken(key: string): string | null {
  const s = getStorage();
  if (!s) return null;
  return normalizeToken(s.getItem(key));
}

function writeStoredToken(key: string, value: string | null) {
  const s = getStorage();
  if (!s) return;
  try {
    if (value) s.setItem(key, value);
    else s.removeItem(key);
  } catch {
    return;
  }
}

export type ApiErrorShape = {
  error?: string;
  message?: string;
};

export type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiFailureEnvelope = {
  success: false;
  error?: string;
  message?: string;
} | {
  error?: string;
  message?: string;
};

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiFailureEnvelope | T;

export function unwrapApiResponse<T>(body: unknown): T {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const asObj = body as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(asObj, 'success')) {
      if (asObj.success === true && Object.prototype.hasOwnProperty.call(asObj, 'data')) {
        return asObj.data as T;
      }
      if (asObj.success === false) {
        const msg = String(asObj.error ?? asObj.message ?? 'API request failed');
        throw new Error(msg);
      }
    }
  }
  return body as T;
}

export type AuthUser = {
  id: number;
  first_name: string;
  last_name?: string | null;
  email: string;
  role: string;
  organization_id?: number | null;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type RegisterBody = {
  first_name: string;
  last_name?: string;
  email: string;
  password: string;
  role_id: number;
  organization_id?: number;
};

function normalizeUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as any;
  const id = typeof v.id === 'number' ? v.id : Number(v.id);
  if (!Number.isFinite(id)) return null;
  const email = String(v.email ?? '').trim();
  const first_name = String(v.first_name ?? '').trim();
  const role = String(v.role ?? '').trim();
  if (!email || !first_name || !role) return null;
  const last_name = typeof v.last_name === 'string' ? v.last_name : v.last_name ?? null;
  const organization_id =
    typeof v.organization_id === 'number'
      ? v.organization_id
      : v.organization_id == null
        ? null
        : Number(v.organization_id);
  return { id, email, first_name, role, last_name, organization_id };
}

function readStoredUser(): AuthUser | null {
  const s = getStorage();
  if (!s) return null;
  const raw = s.getItem(STORAGE_USER_KEY);
  if (!raw) return null;
  try {
    return normalizeUser(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeStoredUser(value: AuthUser | null) {
  const s = getStorage();
  if (!s) return;
  try {
    if (value) s.setItem(STORAGE_USER_KEY, JSON.stringify(value));
    else s.removeItem(STORAGE_USER_KEY);
  } catch {
    return;
  }
}

let runtimeAccessToken: string | null = readStoredToken(STORAGE_ACCESS_TOKEN_KEY);
let runtimeRefreshToken: string | null = readStoredToken(STORAGE_REFRESH_TOKEN_KEY);
let runtimeLoginPromise: Promise<string> | null = null;
let runtimeUser: AuthUser | null = null;

runtimeUser = readStoredUser();

export function readAuthSession(): { accessToken: string | null; refreshToken: string | null; user: AuthUser | null } {
  return { accessToken: runtimeAccessToken, refreshToken: runtimeRefreshToken, user: runtimeUser };
}

const authSessionListeners = new Set<
  (session: { accessToken: string | null; refreshToken: string | null; user: AuthUser | null }) => void
>();

function emitAuthSession() {
  const s = readAuthSession();
  for (const l of authSessionListeners) l(s);
}

export function subscribeAuthSession(
  listener: (session: { accessToken: string | null; refreshToken: string | null; user: AuthUser | null }) => void,
) {
  authSessionListeners.add(listener);
  return () => {
    authSessionListeners.delete(listener);
  };
}

export function setAuthSession(next: { accessToken: string; refreshToken?: string | null; user?: AuthUser | null }) {
  runtimeAccessToken = normalizeToken(next.accessToken);
  runtimeRefreshToken = normalizeToken(next.refreshToken ?? null);
  runtimeUser = normalizeUser(next.user ?? null);
  writeStoredToken(STORAGE_ACCESS_TOKEN_KEY, runtimeAccessToken);
  writeStoredToken(STORAGE_REFRESH_TOKEN_KEY, runtimeRefreshToken);
  writeStoredUser(runtimeUser);
  emitAuthSession();
}

export function clearAuthSession() {
  runtimeAccessToken = null;
  runtimeRefreshToken = null;
  runtimeUser = null;
  writeStoredToken(STORAGE_ACCESS_TOKEN_KEY, null);
  writeStoredToken(STORAGE_REFRESH_TOKEN_KEY, null);
  writeStoredUser(null);
  emitAuthSession();
}

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const hasAuth = path.startsWith('/api/');
  const url = `${API_BASE_URL}${path}`;

  const doRequest = async (h: Headers) => {
    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        headers: h,
      });
    } catch {
      throw new Error(`Network request failed: ${url}`);
    }

    const contentType = res.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');

    let body: unknown = null;
    let bodyText: string | null = null;
    try {
      if (isJson) {
        body = await res.json();
      } else {
        bodyText = await res.text();
      }
    } catch {
      body = null;
      bodyText = null;
    }

    return { res, contentType, isJson, body, bodyText };
  };

  const ensureRuntimeToken = async () => {
    if (!AUTO_LOGIN) throw new Error('Not authenticated');
    if (runtimeAccessToken) return runtimeAccessToken;
    if (runtimeLoginPromise) return await runtimeLoginPromise;

    runtimeLoginPromise = (async () => {
      const loginUrl = `${API_BASE_URL}/auth/login`;
      const loginRes = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: DEV_EMAIL, password: DEV_PASSWORD }),
      });

      const loginContentType = loginRes.headers.get('content-type') ?? '';
      if (!loginContentType.includes('application/json')) {
        const t = (await loginRes.text()).slice(0, 200);
        throw new Error(`Login failed: ${loginRes.status} ${loginContentType || 'unknown'} ${loginUrl} ${t}`);
      }

      const json = (await loginRes.json()) as any;
      const token = normalizeToken(json?.accessToken ?? json?.token ?? json?.access_token);
      const refresh = normalizeToken(json?.refreshToken ?? json?.refresh_token);
      const err = normalizeToken(json?.error ?? json?.message);
      if (!token) throw new Error(`Login failed: ${err || 'missing accessToken'}`);
      runtimeAccessToken = token;
      runtimeRefreshToken = refresh;
      writeStoredToken(STORAGE_ACCESS_TOKEN_KEY, runtimeAccessToken);
      writeStoredToken(STORAGE_REFRESH_TOKEN_KEY, runtimeRefreshToken);
      emitAuthSession();
      return token;
    })();

    try {
      return await runtimeLoginPromise;
    } finally {
      runtimeLoginPromise = null;
    }
  };

  const tryRefreshToken = async () => {
    if (!runtimeRefreshToken) return null;
    const refreshUrl = `${API_BASE_URL}/auth/refresh`;
    const refreshRes = await fetch(refreshUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: runtimeRefreshToken }),
    });

    const refreshContentType = refreshRes.headers.get('content-type') ?? '';
    const isJson = refreshContentType.includes('application/json');
    const json = isJson ? ((await refreshRes.json()) as any) : null;
    const token = normalizeToken(json?.accessToken ?? json?.token ?? json?.access_token);
    const refresh = normalizeToken(json?.refreshToken ?? json?.refresh_token);
    if (!token) return null;
    runtimeAccessToken = token;
    runtimeRefreshToken = refresh ?? runtimeRefreshToken;
    writeStoredToken(STORAGE_ACCESS_TOKEN_KEY, runtimeAccessToken);
    writeStoredToken(STORAGE_REFRESH_TOKEN_KEY, runtimeRefreshToken);
    emitAuthSession();
    return token;
  };

  if (hasAuth && !headers.has('Authorization')) {
    const token = runtimeAccessToken ?? (AUTO_LOGIN ? await ensureRuntimeToken() : null);
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  let { res, contentType, isJson, body, bodyText } = await doRequest(headers);

  if (!res.ok && hasAuth && (res.status === 401 || res.status === 403)) {
    runtimeAccessToken = null;
    writeStoredToken(STORAGE_ACCESS_TOKEN_KEY, null);

    const refreshed = await tryRefreshToken();
    let fresh: string | null = refreshed;
    if (!fresh && AUTO_LOGIN) {
      try {
        fresh = await ensureRuntimeToken();
      } catch {
        fresh = null;
      }
    }

    if (fresh) {
      const retryHeaders = new Headers(headers);
      retryHeaders.set('Authorization', `Bearer ${fresh}`);
      ({ res, contentType, isJson, body, bodyText } = await doRequest(retryHeaders));
    } else {
      clearAuthSession();
    }
  }

  if (!res.ok) {
    const err = (body ?? {}) as ApiErrorShape;
    const msg = err.error || err.message || bodyText || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  const expectsJson = path.startsWith('/api/') || path.startsWith('/auth/');
  if (expectsJson && (res.status === 204 || res.status === 205)) {
    return null as T;
  }
  if (expectsJson && !isJson) {
    const snippet = (bodyText ?? '').slice(0, 200);
    throw new Error(`Invalid API response (expected JSON): ${res.status} ${contentType || 'unknown'} ${url} ${snippet}`);
  }

  return unwrapApiResponse<T>(body);
}
