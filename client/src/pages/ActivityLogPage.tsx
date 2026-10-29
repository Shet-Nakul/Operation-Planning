import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Search, X, ScrollText, Users, Layers, Eye } from 'lucide-react';
import { DirectoryPagination } from '../components/ui/DirectoryPagination';
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-w-0 space-y-8 pb-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900">Activity Log</h2>
          <p className="text-sm text-slate-500">
            Review platform activity, user actions, and audit details
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRefreshTick((x) => x + 1)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-50"
          >
            <RefreshCw size={16} className={cn(isLoading ? 'animate-spin' : '')} />
            Refresh
          </button>
        </div>
      </header>

      <section aria-label="Activity overview" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Events', value: total, icon: ScrollText, color: 'bg-blue-50 text-blue-700' },
          { label: 'Users on This Page', value: new Set(logs.flatMap(log => log.user ? [log.user.id] : [])).size, icon: Users, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Entities on This Page', value: new Set(logs.map(log => log.entity).filter(Boolean)).size, icon: Layers, color: 'bg-amber-50 text-amber-700' },
        ].map(metric => <div key={metric.label} className="flex items-center gap-4 rounded-2xl border border-slate-200/50 bg-white p-5 shadow-sm"><div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', metric.color)}><metric.icon size={21} /></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{metric.label}</p><p className="mt-1 text-2xl font-extrabold text-slate-900">{metric.value}</p></div></div>)}
      </section>

      <section aria-labelledby="activity-history-heading" className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5"><h3 id="activity-history-heading" className="flex items-center gap-2 text-base font-bold text-slate-900"><ScrollText size={18} className="text-primary" />Activity History</h3><p className="mt-1 text-xs text-slate-500">Select an event to inspect its details. Search applies to the current page.</p></div>
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/40 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              aria-label="Search activity on this page"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, action, entity, ID, description..."
              className="w-full h-9 pl-10 pr-4 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-xs text-slate-700"
              autoComplete="off"
            />
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3">
            <div className="text-xs font-bold text-slate-500">
              Total: <span className="text-slate-900">{total}</span>
            </div>
            <select
              aria-label="Activity events per page"
              value={String(limit)}
              onChange={(e) => {
                const next = Number(e.target.value) || 20;
                setLimit(next);
                setPage(1);
              }}
              className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
          </div>
        </div>

        {error && (
          <div role="alert" className="p-5 border-b border-slate-100 bg-rose-50 text-rose-700 font-semibold text-sm">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table aria-label="Activity log" className="w-full min-w-[1100px] text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                {['Time', 'User', 'Action', 'Entity', 'Entity ID', 'Description', 'Details'].map(heading => <th key={heading} scope="col" className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                    Loading activity logs…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <ScrollText size={28} className="mx-auto mb-3 text-slate-300" /><p className="text-sm font-bold text-slate-700">No activity found.</p><p className="mt-1 text-xs text-slate-500">{search ? 'Try another user, action, or entity on this page.' : 'Platform events will appear here as operations are performed.'}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelected(log)}
                  >
                    <td className="px-6 py-5 text-xs font-semibold text-slate-600 whitespace-nowrap">{fmtDateTime(log.created_at)}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{userLabel(log).split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}</div><div className="min-w-32"><p className="text-sm font-bold text-slate-900">{userLabel(log)}</p><p className="mt-1 text-xs text-slate-500">{log.user?.email || 'Automated activity'}</p></div></div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold',
                          actionBadgeClass(log.action),
                        )}
                      >
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{log.action}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600">{log.entity || '—'}</td>
                    <td className="px-6 py-5 text-xs font-mono text-slate-600">{log.entity_id || '—'}</td>
                    <td className="px-6 py-5 text-xs text-slate-500 min-w-48 max-w-xs"><p className="line-clamp-2">{log.description || '—'}</p></td>
                    <td className="px-6 py-5"><button type="button" aria-label={`View activity ${log.id}`} onClick={event => { event.stopPropagation(); setSelected(log); }} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded px-3 py-2 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50"><Eye size={14} />View Details</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {search.trim() && <p className="border-t border-slate-100 px-6 py-3 text-xs text-slate-500">{filtered.length} matching events on this page</p>}
        <DirectoryPagination page={page} totalPages={totalPages} total={total} limit={limit} label="events" disabled={isLoading} onChange={setPage} />
      </section>

      {selected && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[200]" onClick={() => setSelected(null)} />
          <div role="dialog" aria-modal="true" aria-labelledby="activity-detail-heading" className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-[94vw] max-w-2xl max-h-[90vh] overflow-y-auto" onKeyDown={event => { if (event.key === 'Escape') setSelected(null); }}>
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div id="activity-detail-heading" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activity Details</div>
                  <div className="mt-1 text-lg font-black text-slate-900 truncate">
                    {selected.action} • {selected.entity || 'Unknown'}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-600">
                    {fmtDateTime(selected.created_at)} • {userLabel(selected)}
                  </div>
                </div>
                <button
                  aria-label="Close activity details"
                  autoFocus
                  type="button"
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">{selected.description || 'No description provided.'}</p>
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
