import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { apiFetch, clearAuthSession, readAuthSession, setAuthSession } from '../src/services/api-core';

const originalFetch = globalThis.fetch;
const user = { id: 5, first_name: 'Admin', email: 'admin@example.test', role: 'ADMIN', organization_id: 42 };
afterEach(() => {
  globalThis.fetch = originalFetch;
  clearAuthSession();
});

test('permission denial reports the error without signing the user out', async () => {
  setAuthSession({ accessToken: 'access', refreshToken: 'refresh', user });
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  };
  await assert.rejects(apiFetch('/api/catalogs/shift'), /Forbidden/);
  assert.equal(calls, 1);
  assert.equal(readAuthSession().user?.organization_id, 42);
  assert.equal(readAuthSession().accessToken, 'access');
});

test('expired access token is refreshed and the request retried', async () => {
  setAuthSession({ accessToken: 'expired', refreshToken: 'refresh', user });
  const requests: string[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    requests.push(url);
    if (url === '/auth/refresh') return Response.json({ accessToken: 'fresh', refreshToken: 'rotated' });
    const token = new Headers(init?.headers).get('Authorization');
    return token === 'Bearer fresh' ? Response.json({ value: 42 }) : Response.json({ error: 'Expired' }, { status: 401 });
  };
  assert.deepEqual(await apiFetch('/api/staff'), { value: 42 });
  assert.deepEqual(requests, ['/api/staff', '/auth/refresh', '/api/staff']);
  assert.equal(readAuthSession().refreshToken, 'rotated');
});

test('a late refresh cannot restore a signed-out session', async () => {
  setAuthSession({ accessToken: 'expired', refreshToken: 'refresh', user });
  let releaseRefresh: (response: Response) => void = () => { throw new Error('Refresh not started'); };
  let refreshStarted: () => void = () => { throw new Error('Refresh signal not initialized'); };
  const started = new Promise<void>(resolve => { refreshStarted = resolve; });
  globalThis.fetch = async input => {
    if (String(input) !== '/auth/refresh') return Response.json({ error: 'Expired' }, { status: 401 });
    refreshStarted();
    return new Promise<Response>(resolve => { releaseRefresh = resolve; });
  };
  const request = apiFetch('/api/staff');
  await started;
  clearAuthSession();
  releaseRefresh(Response.json({ accessToken: 'fresh', refreshToken: 'rotated' }));
  await assert.rejects(request, /Expired/);
  assert.equal(readAuthSession().accessToken, null);
  assert.equal(readAuthSession().user, null);
});
