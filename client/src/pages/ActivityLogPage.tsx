import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { getActivityLogs, type ServerActivityLog } from '../lib/api';

function userLabel(log: ServerActivityLog): string {
  const u = log.user;
  if (!u) return 'System';
  const full = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
  return full || u.email || `User #${u.id}`;
}

function actionBadgeClass(action: string): string {
  const a = (action || '').toUpperCase();
  if (a === 'POST' || a.includes('CREATE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (a === 'PUT' || a === 'PATCH' || a.includes('UPDATE')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (a === 'DELETE' || a.includes('DELETE') || a.includes('REMOVE')) return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

function fmtDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function ActivityLogPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<ServerActivityLog[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<ServerActivityLog | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getActivityLogs({ page, limit, orgId: 1 });
        if (cancelled) return;
        setLogs(Array.isArray(res.data) ? res.data : []);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotal(res.pagination?.total || 0);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? 'Failed to load activity logs');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, limit, refreshTick]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) => {
      const org = l.organization?.name ?? '';
      const u = userLabel(l);
      const email = l.user?.email ?? '';
      const parts = [
        l.action ?? '',
        l.entity ?? '',
        l.entity_id ?? '',
        l.description ?? '',
        org,
        u,
        email,
        fmtDateTime(l.created_at),
      ];
      return parts.some((p) => String(p).toLowerCase().includes(q));
    });
  }, [logs, search]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-8 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <span className="text-blue-700 font-bold text-sm tracking-widest uppercase">Settings & Support</span>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight font-manrope">Activity Log</h2>
          <p className="text-slate-500 font-medium max-w-2xl">
            All key operations performed on the platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRefreshTick((x) => x + 1)}
            disabled={isLoading}
            className="h-11 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-60 inline-flex items-center gap-2"
          >
            <RefreshCw size={16} className={cn(isLoading ? 'animate-spin' : '')} />
            Refresh
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, action, entity, ID, description..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-700"
              autoComplete="off"
            />
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3">
            <div className="text-xs font-bold text-slate-500">
              Total: <span className="text-slate-900">{total}</span>
            </div>
            <select
              value={String(limit)}
              onChange={(e) => {
                const next = Number(e.target.value) || 20;
                setLimit(next);
                setPage(1);
              }}
              className="h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 outline-none"
            >
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-5 border-b border-slate-100 bg-rose-50 text-rose-700 font-semibold text-sm">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500">Time</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500">User</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500">Action</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500">Entity</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500">Entity ID</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500">Description</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-sm font-semibold text-slate-500">
                    Loading activity logs…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-sm font-semibold text-slate-500">
                    No activity found.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelected(log)}
                  >
                    <td className="px-6 py-4 text-sm font-bold text-slate-700 whitespace-nowrap">{fmtDateTime(log.created_at)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700 whitespace-nowrap">
                      {userLabel(log)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black border',
                          actionBadgeClass(log.action),
                        )}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">{log.entity || '—'}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{log.entity_id || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-[420px] truncate">{log.description || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 flex items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-500">
            Page <span className="text-slate-900">{page}</span> of <span className="text-slate-900">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={isLoading || page <= 1}
              className="h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-60"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={isLoading || page >= totalPages}
              className="h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[200]" onClick={() => setSelected(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-[94vw] max-w-2xl">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Activity Log</div>
                  <div className="mt-1 text-lg font-black text-slate-900 truncate">
                    {selected.action} • {selected.entity || 'Unknown'}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-600">
                    {fmtDateTime(selected.created_at)} • {userLabel(selected)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="text-[10px] uppercase tracking-widest font-black text-slate-400">Entity</div>
                    <div className="mt-1 text-sm font-bold text-slate-800">{selected.entity || '—'}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="text-[10px] uppercase tracking-widest font-black text-slate-400">Entity ID</div>
                    <div className="mt-1 text-sm font-mono font-bold text-slate-800">{selected.entity_id || '—'}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="text-[10px] uppercase tracking-widest font-black text-slate-400">Organization</div>
                    <div className="mt-1 text-sm font-bold text-slate-800">{selected.organization?.name || '—'}</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest font-black text-slate-500">
                    Metadata
                  </div>
                  <pre className="p-4 text-xs bg-white overflow-auto max-h-[50vh] text-slate-800">
                    {JSON.stringify(selected.metadata ?? {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

