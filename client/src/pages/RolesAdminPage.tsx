import { useContext, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, RefreshCw, Save, Trash2, X, Pencil } from 'lucide-react';
import { AppStoreContext } from '../context/AppStoreContext';
import { cn } from '../lib/utils';
import { createRole, deleteRoleById, getRoles, updateRoleById, type ServerRole } from '../lib/api';

type Draft = {
  name: string;
  description: string;
};

export default function RolesAdminPage() {
  const app = useContext(AppStoreContext);
  const pushToast = app?.pushToast;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ServerRole[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);

  const [createDraft, setCreateDraft] = useState<Draft>({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>({ name: '', description: '' });
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getRoles();
        if (cancelled) return;
        setRows(Array.isArray(res) ? res : []);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? 'Failed to load roles');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const canCreate = useMemo(() => createDraft.name.trim() !== '' && !creating, [createDraft.name, creating]);

  const startEdit = (r: ServerRole) => {
    setEditingId(r.id);
    setEditDraft({ name: String(r.name ?? ''), description: String(r.description ?? '') });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSavingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSavingId(editingId);
    try {
      await updateRoleById(editingId, { name: editDraft.name.trim(), description: editDraft.description.trim() || undefined });
      pushToast?.('Role updated.');
      cancelEdit();
      setRefreshTick((x) => x + 1);
    } catch (e: any) {
      pushToast?.(e?.message ?? 'Update failed');
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (id: number) => {
    const ok = globalThis.confirm?.('Delete this role?') ?? true;
    if (!ok) return;
    try {
      await deleteRoleById(id);
      pushToast?.('Role deleted.');
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
      await createRole({ name: createDraft.name.trim(), description: createDraft.description.trim() || undefined });
      setCreateDraft({ name: '', description: '' });
      pushToast?.('Role created.');
      setRefreshTick((x) => x + 1);
    } catch (e: any) {
      pushToast?.(e?.message ?? 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-8 space-y-6 max-w-6xl mx-auto">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <span className="text-blue-700 font-bold text-sm tracking-widest uppercase">Administration</span>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight font-manrope">Roles</h2>
          <p className="text-slate-500 font-medium max-w-2xl">Manage access roles used across the platform.</p>
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
              placeholder="Role name (e.g., ADMIN)"
              className="h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800 md:col-span-2"
            />
            <input
              value={createDraft.description}
              onChange={(e) => setCreateDraft((s) => ({ ...s, description: e.target.value }))}
              placeholder="Description"
              className="h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800 md:col-span-2"
            />
            <button
              type="button"
              disabled={!canCreate}
              onClick={() => create()}
              className="h-11 px-4 rounded-xl bg-primary text-on-primary font-extrabold text-sm hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Add
            </button>
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
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500">Description</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-sm font-semibold text-slate-500">
                    Loading roles…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-sm font-semibold text-slate-500">
                    No roles found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const isEditing = editingId === r.id;
                  const isSaving = savingId === r.id;
                  return (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">{r.id}</td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            value={editDraft.name}
                            onChange={(e) => setEditDraft((s) => ({ ...s, name: e.target.value }))}
                            className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
                          />
                        ) : (
                          <div className="text-sm font-bold text-slate-800">{r.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            value={editDraft.description}
                            onChange={(e) => setEditDraft((s) => ({ ...s, description: e.target.value }))}
                            className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
                          />
                        ) : (
                          <div className="text-sm text-slate-600 font-semibold">{r.description || '—'}</div>
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
                                onClick={() => startEdit(r)}
                                className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
                              >
                                <Pencil size={14} />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => remove(r.id)}
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
      </div>
    </motion.div>
  );
}

