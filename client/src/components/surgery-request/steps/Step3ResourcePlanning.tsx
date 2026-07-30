import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Droplets,
  HelpCircle,
  Library,
  Plus,
  Package,
  Search,
  Syringe,
  Thermometer,
  Wrench,
  X,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../../context/AppStoreContext';
import { cn } from '../../../lib/utils';
import { getNonRenewableResources, type ServerNonRenewableResource } from '../../../lib/api';
import type { ResourceItem, SurgeryRequest } from '../../../types/surgery';

type Step3Props = {
  data: SurgeryRequest;
  referenceCode: string;
  onBack: () => void;
  onNext: () => void;
  updateData: (updates: Partial<SurgeryRequest>) => void;
  onSaveForLater: () => void;
};

function resourceStatus(required: number, stockpile: number): ResourceItem['status'] {
  return stockpile < required ? 'shortage' : 'available';
}

type LibraryItem = {
  resource_id: string;
  name: string;
  type: string;
  icon: string;
  stockpile_qty: number;
  min_required_qty: number;
  status: string;
};

function iconForNonRenewable(r: ServerNonRenewableResource): string {
  const category = String(r.category ?? '').toUpperCase();
  if (category.includes('BLOOD')) return 'blood';
  if (category.includes('MED')) return 'meds';
  if (category.includes('KIT')) return 'kit';
  if (category.includes('SUTURE')) return 'suture';
  return 'supply';
}

function typeLabelNonRenewable(r: ServerNonRenewableResource): string {
  const parts: string[] = [];
  const category = String(r.category ?? '').trim();
  const uom = String(r.uom ?? '').trim();
  const spec = String(r.spec ?? '').trim();
  if (category) parts.push(category);
  if (uom) parts.push(uom);
  if (spec) parts.push(spec);
  return parts.join(' • ');
}

export function Step3ResourcePlanning({ data, referenceCode, onBack, onNext, updateData, onSaveForLater }: Step3Props) {
  const { pushToast } = useAppStore();
  const modalRoot = typeof document !== 'undefined' ? document.body : null;
  const [q, setQ] = useState('');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [library, setLibrary] = useState<LibraryItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getNonRenewableResources({ orgId: 1, limit: 500 });
        if (cancelled) return;
        const items: LibraryItem[] = (Array.isArray(rows) ? rows : []).map((r) => ({
          resource_id: String(r.resource_id ?? ''),
          name: String(r.name ?? ''),
          type: typeLabelNonRenewable(r),
          icon: iconForNonRenewable(r),
          stockpile_qty: Number(r.stockpile_qty ?? 0),
          min_required_qty: Number(r.min_required_qty ?? 0),
          status: String(r.status ?? ''),
        })).filter((x) => x.resource_id && x.name);
        setLibrary(items);
      } catch {
        if (!cancelled) setLibrary([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data.resources;
    return data.resources.filter((r) => r.name.toLowerCase().includes(s) || r.type.toLowerCase().includes(s));
  }, [data.resources, q]);

  const searchDropdownResults = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return { added: [], available: [] };

    const addedMatches = data.resources.filter((r) => r.name.toLowerCase().includes(s) || r.type.toLowerCase().includes(s));
    
    const availableMatches = library.filter(
      (item) => !data.resources.some((r) => r.name === item.name) &&
        (item.name.toLowerCase().includes(s) || item.type.toLowerCase().includes(s))
    );

    return { added: addedMatches, available: availableMatches };
  }, [data.resources, q, library]);

  const summary = useMemo(() => {
    const meds = data.resources.filter((r) => r.icon === 'meds').reduce((a, r) => a + r.required, 0);
    const blood = data.resources.filter((r) => r.icon === 'blood').reduce((a, r) => a + r.required, 0);
    const kits = data.resources.filter((r) => r.icon === 'kit').reduce((a, r) => a + r.required, 0);
    return { meds, blood, kits };
  }, [data.resources]);

  const patchResource = (id: string, patch: Partial<ResourceItem>) => {
    const next = data.resources.map((r) => {
      if (r.id !== id) return r;
      const merged = { ...r, ...patch };
      if ('required' in patch || 'stockpile' in patch) {
        merged.status = resourceStatus(merged.required, merged.stockpile);
      }
      return merged;
    });
    updateData({ resources: next });
  };

  const deleteResource = (id: string) => {
    updateData({ resources: data.resources.filter((r) => r.id !== id) });
    pushToast('Resource removed from list.');
  };

  const filteredSupplies = useMemo(() => {
    const s = searchQuery.trim().toLowerCase();
    if (!s) return library;
    return library.filter(
      (item) => item.name.toLowerCase().includes(s) || item.type.toLowerCase().includes(s)
    );
  }, [searchQuery, library]);

  const addItemFromLibrary = (supply: LibraryItem) => {
    // Check if already added
    const exists = data.resources.some((r) => r.name === supply.name);
    if (exists) {
      pushToast('This item is already in your list.');
      return;
    }

    const id = crypto.randomUUID();
    const required = 1;
    const stockpile = Math.max(0, Number(supply.stockpile_qty) || 0);
    const rawStatus = String(supply.status ?? '').toUpperCase();
    const status =
      rawStatus === 'SHORTAGE' || rawStatus === 'OUT_OF_STOCK'
        ? 'shortage'
        : resourceStatus(required, stockpile);

    updateData({
      resources: [
        ...data.resources,
        {
          id,
          name: supply.name,
          type: supply.type,
          required,
          stockpile,
          status,
          icon: supply.icon,
        },
      ],
    });
    pushToast(`${supply.name} added to list.`);
    setSearchModalOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-12">
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <span>Request Workflow</span>
          <ChevronRight size={12} />
          <span className="text-on-surface font-semibold">Surgery Resource Planning</span>
        </nav>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-8">Surgery Resource Planning</h1>
        <div className="flex items-center w-full gap-4 px-2">
          {['Patient Details', 'Procedure', 'Non-Renewables', 'Review & Confirm'].map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div
                className={cn(
                  'h-1 w-full rounded-full transition-all',
                  i <= 2 ? 'bg-primary' : 'bg-surface-container-highest',
                  i === 2 && 'h-2 shadow-[0_0_8px_rgba(0,71,141,0.3)]',
                )}
              />
              <span className={cn('text-[10px] font-bold uppercase tracking-tighter', i <= 2 ? 'text-primary' : 'text-slate-400')}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-secondary rounded-full" />
                <h3 className="text-xl font-bold tracking-tight">Non-Renewable Stockpile</h3>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                  placeholder="Search resources by name or type..."
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-primary focus:border-primary"
                />
                
                {/* Search Dropdown */}
                {showSearchDropdown && q.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-96 overflow-y-auto">
                    {searchDropdownResults.added.length === 0 && searchDropdownResults.available.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-500 text-center">No results found.</div>
                    ) : (
                      <>
                        {/* Added Resources Section */}
                        {searchDropdownResults.added.length > 0 && (
                          <div>
                            <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                              Added Resources
                            </div>
                            {searchDropdownResults.added.map((res) => (
                              <div key={res.id} className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-b-0 flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                    {res.icon === 'meds' && <Syringe size={16} />}
                                    {res.icon === 'blood' && <Droplets size={16} />}
                                    {res.icon === 'kit' && <Wrench size={16} />}
                                    {res.icon === 'suture' && <Thermometer size={16} />}
                                    {res.icon === 'supply' && <Package size={16} />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-on-surface truncate">{res.name}</p>
                                    <p className="text-[11px] text-slate-500 truncate">{res.type}</p>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-slate-400 ml-2 shrink-0">Added</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Available from Library Section */}
                        {searchDropdownResults.available.length > 0 && (
                          <div>
                            <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase bg-slate-50 border-t border-slate-100">
                              Available in Library
                            </div>
                            {searchDropdownResults.available.map((supply) => (
                              <div key={supply.resource_id} className="px-4 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-b-0 flex items-center justify-between group">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                    {supply.icon === 'meds' && <Syringe size={16} />}
                                    {supply.icon === 'blood' && <Droplets size={16} />}
                                    {supply.icon === 'kit' && <Wrench size={16} />}
                                    {supply.icon === 'suture' && <Thermometer size={16} />}
                                    {supply.icon === 'supply' && <Package size={16} />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-on-surface truncate">{supply.name}</p>
                                    <p className="text-[11px] text-slate-500 truncate">{supply.type}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    addItemFromLibrary(supply);
                                    setQ('');
                                    setShowSearchDropdown(false);
                                  }}
                                  className="ml-2 px-2 py-1 text-xs font-bold text-primary bg-primary/10 rounded hover:bg-primary hover:text-white transition-colors shrink-0"
                                >
                                  Add
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary text-sm font-bold rounded-xl shadow-sm hover:opacity-90 transition-all"
              >
                <Plus size={18} />
                Add Item
              </button>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
              <div className="grid grid-cols-12 px-6 py-4 bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-widest border-b border-slate-100">
                <div className="col-span-5">Resource Item</div>
                <div className="col-span-2 text-center">Required</div>
                <div className="col-span-2 text-center">Stockpile</div>
                <div className="col-span-3 text-right">Status</div>
              </div>
              <div className="divide-y divide-slate-50">
                {filtered.length === 0 && (
                  <div className="px-6 py-8 text-center text-sm text-slate-500">No resources match this search.</div>
                )}
                {filtered.map((res) => (
                  <div key={res.id} className="grid grid-cols-12 px-6 py-5 items-center hover:bg-slate-50/50 transition-colors gap-2">
                    <div className="col-span-5 flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        {res.icon === 'meds' && <Syringe size={20} />}
                        {res.icon === 'blood' && <Droplets size={20} />}
                        {res.icon === 'kit' && <Wrench size={20} />}
                        {res.icon === 'suture' && <Thermometer size={20} />}
                        {res.icon === 'supply' && <Package size={20} />}
                      </div>
                      <div className="min-w-0">
                        <input
                          className="font-semibold text-on-surface bg-transparent border-b border-transparent hover:border-slate-200 focus:border-primary w-full text-sm"
                          value={res.name}
                          onChange={(e) => patchResource(res.id, { name: e.target.value })}
                        />
                        <input
                          className="text-xs text-slate-500 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-primary w-full mt-0.5"
                          value={res.type}
                          onChange={(e) => patchResource(res.id, { type: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <input
                        type="number"
                        min={0}
                        className="w-16 mx-auto bg-slate-50 border border-slate-200 rounded-lg text-center text-sm font-medium py-1"
                        value={res.required}
                        onChange={(e) => patchResource(res.id, { required: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      />
                    </div>
                    <div className="col-span-2 text-center">
                      <input
                        type="number"
                        min={0}
                        readOnly
                        className={cn(
                          'w-16 mx-auto bg-slate-100 border border-slate-200 rounded-lg text-center text-sm font-medium py-1 cursor-not-allowed',
                          res.status === 'shortage' && 'text-error font-bold',
                        )}
                        value={res.stockpile}
                      />
                    </div>
                    <div className="col-span-3 flex justify-end items-center gap-3">
                      {res.status === 'shortage' && <AlertTriangle size={14} className="text-error" fill="currentColor" />}
                      <span
                        className={cn(
                          'px-3 py-1 text-[10px] font-bold rounded-full uppercase',
                          res.status === 'available' ? 'bg-tertiary-container/10 text-tertiary' : 'bg-error-container text-on-error-container',
                        )}
                      >
                        {res.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteResource(res.id)}
                        className="text-slate-400 hover:text-error transition-colors ml-2"
                        aria-label="Delete resource"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="bg-slate-50 rounded-2xl p-6 flex items-start gap-6 border-l-4 border-secondary shadow-sm">
            <HelpCircle size={32} className="text-secondary shrink-0" />
            <div>
              <h4 className="font-bold text-secondary mb-1">Procurement Automation Active</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Shortages are derived from required vs stockpile in your data store. Adjust quantities above — status updates automatically.
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-primary p-8 rounded-3xl text-on-primary relative overflow-hidden shadow-xl">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <h3 className="text-lg font-bold mb-6 font-headline">Summary</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-end border-b border-white/20 pb-2">
                <span className="text-xs opacity-70">Meds (req. units)</span>
                <span className="text-xl font-bold font-headline">{summary.meds || '—'}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/20 pb-2">
                <span className="text-xs opacity-70">Blood units</span>
                <span className="text-xl font-bold font-headline">{summary.blood || '—'}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/20 pb-2">
                <span className="text-xs opacity-70">Kits (req.)</span>
                <span className="text-xl font-bold font-headline">{summary.kits || '—'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onNext}
              className="w-full bg-white text-primary py-4 rounded-xl font-bold shadow-xl hover:bg-slate-50 transition-all active:scale-95"
            >
              Review & Confirm
            </button>
            <button
              type="button"
              onClick={() => {
                onSaveForLater();
              }}
              className="w-full mt-3 text-white/70 text-sm font-medium py-2 hover:text-white transition-colors"
            >
              Save for later
            </button>
          </div>
        </div>
      </div>

      {/* Search & Add Modal */}
      {searchModalOpen && modalRoot && createPortal((
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold">Add Resource from Library</h2>
              <button
                type="button"
                onClick={() => {
                  setSearchModalOpen(false);
                  setSearchQuery('');
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 border-b border-slate-100">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or type..."
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-slate-100">
                {filteredSupplies.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">No supplies match your search.</div>
                ) : (
                  filteredSupplies.map((supply) => {
                    const isAdded = data.resources.some((r) => r.name === supply.name);
                    return (
                      <div
                        key={supply.resource_id}
                        className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            {supply.icon === 'meds' && <Syringe size={20} />}
                            {supply.icon === 'blood' && <Droplets size={20} />}
                            {supply.icon === 'kit' && <Wrench size={20} />}
                            {supply.icon === 'suture' && <Thermometer size={20} />}
                            {supply.icon === 'supply' && <Package size={20} />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-on-surface">{supply.name}</p>
                            <p className="text-xs text-slate-500">{supply.type}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => addItemFromLibrary(supply)}
                          disabled={isAdded}
                          className={cn(
                            'px-4 py-2 rounded-lg text-sm font-bold transition-all shrink-0',
                            isAdded
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-primary text-on-primary hover:opacity-90',
                          )}
                        >
                          {isAdded ? 'Added' : 'Add'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ), modalRoot)}
    </div>
  );
}
