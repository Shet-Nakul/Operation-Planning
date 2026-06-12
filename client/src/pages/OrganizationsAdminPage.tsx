import { useContext, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, RefreshCw, Save, Trash2, X, Pencil } from 'lucide-react';
import { AppStoreContext } from '../context/AppStoreContext';
import { cn } from '../lib/utils';
import {
  createOrganization,
  deleteOrganizationById,
  getOrganizations,
  updateOrganizationById,
  type ServerOrganization,
} from '../lib/api';

type Draft = {
  name: string;
  contact_number: string;
  contact_email: string;
  status: string;
};

export default function OrganizationsAdminPage() {
  const app = useContext(AppStoreContext);
  const pushToast = app?.pushToast;

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ServerOrganization[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);

  const [createDraft, setCreateDraft] = useState<Draft>({
    name: '',
    contact_number: '',
    contact_email: '',
    status: 'ACTIVE',
  });
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>({
    name: '',
    contact_number: '',
    contact_email: '',
    status: 'ACTIVE',
  });
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getOrganizations({ page, limit });
        if (cancelled) return;
        setRows(Array.isArray(res.data) ? res.data : []);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotal(res.pagination?.total || 0);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? 'Failed to load organizations');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limit, page, refreshTick]);

  const canCreate = useMemo(() => createDraft.name.trim() !== '' && !creating, [createDraft.name, creating]);

  const startEdit = (org: ServerOrganization) => {
    setEditingId(org.id);
    setEditDraft({
      name: String(org.name ?? ''),
      contact_number: String(org.contact_number ?? ''),
      contact_email: String(org.contact_email ?? ''),
      status: String(org.status ?? 'ACTIVE'),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSavingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSavingId(editingId);
    try {
      await updateOrganizationById(editingId, {
        name: editDraft.name.trim(),
        contact_number: editDraft.contact_number.trim() || undefined,
        contact_email: editDraft.contact_email.trim() || undefined,
        status: editDraft.status.trim() || undefined,
      });
      if (app?.activeOrgId === editingId) app.setActiveOrgName(editDraft.name.trim());
      pushToast?.('Organization updated.');
      cancelEdit();
      setRefreshTick((x) => x + 1);
    } catch (e: any) {
      pushToast?.(e?.message ?? 'Update failed');
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (id: number) => {
    const ok = globalThis.confirm?.('Delete this organization?') ?? true;
    if (!ok) return;
    try {
      await deleteOrganizationById(id);
      if (app?.activeOrgId === id) app.setActiveOrgName('');
      pushToast?.('Organization deleted.');
      if (editingId === id) cancelEdit();
      setRefreshTick((x) => x + 1);
    } catch (e: any) {
      pushToast?.(e?.message ?? 'Delete failed');
    }
  };

  const create = async () => {
    if (!canCreate) return;
    setCreating(true);
    try {
      await createOrganization({
        name: createDraft.name.trim(),
        contact_number: createDraft.contact_number.trim() || undefined,
        contact_email: createDraft.contact_email.trim() || undefined,
        status: createDraft.status.trim() || undefined,
      });
      setCreateDraft({ name: '', contact_number: '', contact_email: '', status: 'ACTIVE' });
      pushToast?.('Organization created.');
      setRefreshTick((x) => x + 1);
    } catch (e: any) {
      pushToast?.(e?.message ?? 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-8 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <span className="text-blue-700 font-bold text-sm tracking-widest uppercase">Administration</span>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight font-manrope">Organizations</h2>
          <p className="text-slate-500 font-medium max-w-2xl">Create, update, and manage organizations.</p>
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
        <div className="p-5 border-b border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              value={createDraft.name}
              onChange={(e) => setCreateDraft((s) => ({ ...s, name: e.target.value }))}
              placeholder="Organization name"
              className="h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800 md:col-span-2"
            />
            <input
              value={createDraft.contact_number}
              onChange={(e) => setCreateDraft((s) => ({ ...s, contact_number: e.target.value }))}
              placeholder="Contact number"
              className="h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
            />
            <input
              value={createDraft.contact_email}
              onChange={(e) => setCreateDraft((s) => ({ ...s, contact_email: e.target.value }))}
              placeholder="Contact email"
              className="h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
            />
            <div className="flex gap-3">
              <input
                value={createDraft.status}
                onChange={(e) => setCreateDraft((s) => ({ ...s, status: e.target.value }))}
                placeholder="Status"
                className="h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800 w-full"
              />
              <button
                type="button"
                disabled={!canCreate}
                onClick={() => create()}
                className="h-11 px-4 rounded-xl bg-primary text-on-primary font-extrabold text-sm hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2 shrink-0"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
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
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500">ID</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500">Name</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500">Contact</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500">Status</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-sm font-semibold text-slate-500">
                    Loading organizations…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-sm font-semibold text-slate-500">
                    No organizations found.
                  </td>
                </tr>
              ) : (
                rows.map((org) => {
                  const isEditing = editingId === org.id;
                  const isSaving = savingId === org.id;
                  return (
                    <tr key={org.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">{org.id}</td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            value={editDraft.name}
                            onChange={(e) => setEditDraft((s) => ({ ...s, name: e.target.value }))}
                            className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
                          />
                        ) : (
                          <div className="text-sm font-bold text-slate-800">{org.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <input
                              value={editDraft.contact_email}
                              onChange={(e) => setEditDraft((s) => ({ ...s, contact_email: e.target.value }))}
                              placeholder="Contact email"
                              className="h-10 px-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
                            />
                            <input
                              value={editDraft.contact_number}
                              onChange={(e) => setEditDraft((s) => ({ ...s, contact_number: e.target.value }))}
                              placeholder="Contact number"
                              className="h-10 px-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-slate-700">{org.contact_email || '—'}</div>
                            <div className="text-sm font-semibold text-slate-700">{org.contact_number || '—'}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {isEditing ? (
                          <input
                            value={editDraft.status}
                            onChange={(e) => setEditDraft((s) => ({ ...s, status: e.target.value }))}
                            className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
                          />
                        ) : (
                          org.status
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => saveEdit()}
                                disabled={isSaving || editDraft.name.trim() === ''}
                                className="h-9 px-3 rounded-lg bg-primary text-on-primary font-extrabold text-xs hover:opacity-95 transition-opacity disabled:opacity-60 inline-flex items-center gap-2"
                              >
                                <Save size={14} />
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => cancelEdit()}
                                disabled={isSaving}
                                className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-50 transition-colors disabled:opacity-60 inline-flex items-center gap-2"
                              >
                                <X size={14} />
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(org)}
                                className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
                              >
                                <Pencil size={14} />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => remove(org.id)}
                                className="h-9 px-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-extrabold text-xs hover:bg-rose-100 transition-colors inline-flex items-center gap-2"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-slate-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-xs font-bold text-slate-500">
            Total: <span className="text-slate-900">{total}</span>
          </div>
          <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="h-11 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-extrabold text-sm hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                Prev
              </button>
              <div className="text-sm font-extrabold text-slate-700">
                {page} / {totalPages}
              </div>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="h-11 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-extrabold text-sm hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
