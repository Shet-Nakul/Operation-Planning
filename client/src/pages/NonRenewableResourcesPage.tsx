import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  createNonRenewableResource,
  deleteNonRenewableResource,
  getNonRenewableResources,
  updateNonRenewableResource,
  type ServerNonRenewableResource,
} from '../lib/api';
import { useAppStore } from '../context/AppStoreContext';

type Draft = {
  name: string;
  spec: string;
  category: string;
  uom: string;
  stockpile_qty: number;
  min_required_qty: number;
  status: string;
};

const DEFAULT_DRAFT: Draft = {
  name: '',
  spec: '',
  category: 'MEDICATION',
  uom: 'UNIT',
  stockpile_qty: 0,
  min_required_qty: 0,
  status: 'AVAILABLE',
};

function normalizeDraft(d: Draft): Draft {
  return {
    ...d,
    name: d.name.trim(),
    spec: d.spec.trim(),
    category: d.category.trim(),
    uom: d.uom.trim(),
    stockpile_qty: Math.max(0, Number(d.stockpile_qty) || 0),
    min_required_qty: Math.max(0, Number(d.min_required_qty) || 0),
    status: d.status.trim() || 'AVAILABLE',
  };
}

export default function NonRenewableResourcesPage() {
  const { pushToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ServerNonRenewableResource[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  const [createDraft, setCreateDraft] = useState<Draft>(DEFAULT_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(DEFAULT_DRAFT);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getNonRenewableResources({
          orgId: 1,
          query: query.trim() || undefined,
          category: category.trim() || undefined,
          status: status.trim() || undefined,
          limit: 250,
        });
        if (cancelled) return;
        setRows(Array.isArray(res) ? res : []);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? 'Failed to load non-renewable resources');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query, category, status, refreshTick]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const c = String(r.category ?? '').trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const s = String(r.status ?? '').trim();
      if (s) set.add(s);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const startEdit = (r: ServerNonRenewableResource) => {
    setEditingId(r.resource_id);
    setEditDraft({
      name: String(r.name ?? ''),
      spec: String(r.spec ?? ''),
      category: String(r.category ?? ''),
      uom: String(r.uom ?? ''),
      stockpile_qty: Number(r.stockpile_qty ?? 0),
      min_required_qty: Number(r.min_required_qty ?? 0),
      status: String(r.status ?? 'AVAILABLE'),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(DEFAULT_DRAFT);
  };

  const doCreate = async () => {
    const d = normalizeDraft(createDraft);
    if (!d.name) return;
    setIsLoading(true);
    try {
      await createNonRenewableResource({
        organization_id: 1,
        name: d.name,
        spec: d.spec || undefined,
        category: d.category || 'MEDICATION',
        uom: d.uom || 'UNIT',
        stockpile_qty: d.stockpile_qty,
        min_required_qty: d.min_required_qty,
        status: d.status || 'AVAILABLE',
      });
      setCreateDraft(DEFAULT_DRAFT);
      setRefreshTick((x) => x + 1);
      pushToast('Resource created.');
    } catch (e: any) {
      pushToast(e?.message ?? 'Create failed');
    } finally {
      setIsLoading(false);
    }
  };

  const doSave = async () => {
    if (!editingId) return;
    const d = normalizeDraft(editDraft);
    if (!d.name || !d.category || !d.uom) return;
    setIsLoading(true);
    try {
      await updateNonRenewableResource(editingId, {
        name: d.name,
        spec: d.spec || undefined,
        category: d.category,
        uom: d.uom,
        stockpile_qty: d.stockpile_qty,
        min_required_qty: d.min_required_qty,
        status: d.status,
      });
      setEditingId(null);
      setRefreshTick((x) => x + 1);
      pushToast('Resource updated.');
    } catch (e: any) {
      pushToast(e?.message ?? 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const doDelete = async (r: ServerNonRenewableResource) => {
    if (!confirm(`Delete "${r.name}"?`)) return;
    setIsLoading(true);
    try {
      await deleteNonRenewableResource(r.resource_id);
      setRefreshTick((x) => x + 1);
      pushToast('Resource deleted.');
    } catch (e: any) {
      pushToast(e?.message ?? 'Delete failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-black text-slate-900 mb-1">Medicine Inventory</h3>
            <p className="text-sm text-slate-500 font-medium">
              Backed by /api/non-renewable-resources. Used in Surgery Requests → Resource Planning.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshTick((x) => x + 1)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60 shrink-0"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="p-6 bg-slate-50/50 border-b border-slate-100 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-6 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name…"
                className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100">
            <h4 className="text-sm font-black text-slate-900">Add Item</h4>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Item Name</label>
                <input
                  value={createDraft.name}
                  onChange={(e) => setCreateDraft((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Cefazolin"
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="lg:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Stockpile</label>
                <input
                  type="number"
                  min={0}
                  value={createDraft.stockpile_qty}
                  onChange={(e) => setCreateDraft((p) => ({ ...p, stockpile_qty: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 text-center"
                />
              </div>
              <div className="lg:col-span-6">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Spec</label>
                <input
                  value={createDraft.spec}
                  onChange={(e) => setCreateDraft((p) => ({ ...p, spec: e.target.value }))}
                  placeholder="Optional notes/specification"
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="lg:col-span-12 flex items-end">
                <button
                  type="button"
                  onClick={() => void doCreate()}
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-2xl text-sm font-black hover:opacity-90 disabled:opacity-60"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>
          </div>

          {error && <div className="text-sm text-error font-bold">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rows.map((r) => {
              const isEditing = editingId === r.resource_id;
              const displaySpec = String(r.spec ?? '').trim();
              return (
                <div key={r.resource_id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3">
                        <input
                          value={editDraft.name}
                          onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                          className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            value={editDraft.category}
                            onChange={(e) => setEditDraft((p) => ({ ...p, category: e.target.value }))}
                            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <input
                            value={editDraft.uom}
                            onChange={(e) => setEditDraft((p) => ({ ...p, uom: e.target.value }))}
                            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <select
                            value={editDraft.status}
                            onChange={(e) => setEditDraft((p) => ({ ...p, status: e.target.value }))}
                            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="AVAILABLE">AVAILABLE</option>
                            <option value="SHORTAGE">SHORTAGE</option>
                            <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                            <option value="MAINTENANCE">MAINTENANCE</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            min={0}
                            value={editDraft.stockpile_qty}
                            onChange={(e) => setEditDraft((p) => ({ ...p, stockpile_qty: parseInt(e.target.value) || 0 }))}
                            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 text-center"
                          />
                          <input
                            type="number"
                            min={0}
                            value={editDraft.min_required_qty}
                            onChange={(e) => setEditDraft((p) => ({ ...p, min_required_qty: parseInt(e.target.value) || 0 }))}
                            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 text-center"
                          />
                        </div>
                        <input
                          value={editDraft.spec}
                          onChange={(e) => setEditDraft((p) => ({ ...p, spec: e.target.value }))}
                          placeholder="Spec (optional)"
                          className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => void doSave()}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-2xl text-sm font-black hover:opacity-90 disabled:opacity-60"
                          >
                            <Check size={16} />
                            Save
                          </button>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={cancelEdit}
                            className="inline-flex items-center justify-center gap-2 bg-slate-200 text-slate-700 px-4 py-3 rounded-2xl text-sm font-black hover:bg-slate-300 disabled:opacity-60"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 truncate">{r.name}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                          {r.category} • {r.uom} • stk {r.stockpile_qty} • min {r.min_required_qty}
                        </p>
                        {displaySpec && <p className="text-xs text-slate-500 mt-1 font-medium line-clamp-2">{displaySpec}</p>}
                        <div
                          className={cn(
                            'inline-flex mt-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border',
                            String(r.status).toUpperCase() === 'AVAILABLE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : String(r.status).toUpperCase() === 'SHORTAGE' || String(r.status).toUpperCase() === 'OUT_OF_STOCK'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200',
                          )}
                        >
                          {String(r.status)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => startEdit(r)}
                          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => void doDelete(r)}
                          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {rows.length === 0 && !isLoading && !error && (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500 font-bold">
              No resources yet.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
