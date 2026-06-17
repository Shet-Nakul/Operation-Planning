import React, { useEffect, useState, useContext } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit2, 
  Eye, 
  Archive, 
  AlertTriangle,
  ChevronLeft, 
  ChevronRight,
  Info,
  History,
  ChevronDown,
  FileText,
  TrendingUp
} from 'lucide-react';
import { motion } from 'motion/react';
import { Contract, ViewState } from './types';
import { AppStoreContext } from '../../context/AppStoreContext';
import { deleteContractById, getContracts } from '../../lib/api';

interface ContractLibraryProps {
  onNavigate: (view: ViewState) => void;
  onEditContract: (contract: Contract) => void;
  onViewContract: (contract: Contract) => void;
}

export function ContractLibrary({ onNavigate, onEditContract, onViewContract }: ContractLibraryProps) {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error('AppStoreContext not found');
  const { store, deleteContract: removeContractFromStore, replaceContracts, pushToast } = context;
  const contracts = store.contracts || [];

  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Contract | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getContracts({ orgId: 1 });
        if (cancelled) return;
        replaceContracts(
          rows.map((c) => ({
            id: String(c.id),
            contractId: c.contract_id,
            name: c.name,
            type: c.type,
            status: (c.status as any) || 'Active',
            staffTags: c.staff_tags ?? [],
            createdAt: fmt(c.created_at),
            updatedAt: fmt(c.updated_at),
          })),
        );
      } catch (e: any) {
        pushToast(`Contract sync failed: ${e?.message ?? 'Unknown error'}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pushToast, replaceContracts]);

  const filteredContracts = contracts.filter(c => 
    c.contractId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.staffTags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const dynamicCount = contracts.filter(c => c.type === 'DYNAMIC').length;
  const staticCount = contracts.filter(c => c.type === 'STATIC').length;

  const confirmDelete = async () => {
    if (!deleteConfirm || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteContractById(deleteConfirm.id);
      removeContractFromStore(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (e: any) {
      pushToast(`Delete failed: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-7xl mx-auto space-y-12"
    >
      {/* Hero Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-primary text-white p-8 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-xl shadow-primary/10">
          <div className="relative z-10">
            <p className="font-headline text-primary-fixed text-sm font-bold uppercase tracking-widest mb-2">Total Active Portfolio</p>
            <h3 className="font-headline text-6xl font-extrabold tracking-tight">
              {contracts.length.toString().padStart(2, '0')} <span className="text-lg font-medium opacity-70">Contracts</span>
            </h3>
          </div>
          <div className="flex gap-12 relative z-10">
            <div className="flex flex-col">
              <span className="text-xs text-primary-fixed/80 font-medium uppercase tracking-wider">Dynamic Frameworks</span>
              <span className="text-3xl font-bold">{dynamicCount.toString().padStart(2, '0')}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-primary-fixed/80 font-medium uppercase tracking-wider">Static Templates</span>
              <span className="text-3xl font-bold">{staticCount.toString().padStart(2, '0')}</span>
            </div>
          </div>
          {/* Decorative element */}
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-primary-container rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute right-12 bottom-8 opacity-10">
            <FileText size={140} strokeWidth={1} />
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl flex flex-col justify-center items-center text-center space-y-6 border border-outline-variant/10 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-tertiary-fixed flex items-center justify-center shadow-inner">
            <Plus className="text-tertiary" size={32} />
          </div>
          <div>
            <h4 className="font-headline text-xl font-bold text-on-surface">New Agreement</h4>
            <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">Initiate a standardized or dynamic clinical contract.</p>
          </div>
          <div className="relative w-full">
            <button 
              onClick={() => setShowCreateDropdown(!showCreateDropdown)}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Create New Contract
              <ChevronDown size={18} className={`transition-transform duration-200 ${showCreateDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showCreateDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowCreateDropdown(false)}
                ></div>
                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-2xl border border-outline-variant/10 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <button 
                    onClick={() => {
                      onNavigate('CREATE_STATIC');
                      setShowCreateDropdown(false);
                    }}
                    className="w-full px-4 py-4 text-sm text-left hover:bg-slate-50 font-bold text-slate-700 transition-colors flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p>Static Template</p>
                      <p className="text-[10px] text-slate-400 font-medium">Fixed weekly schedule</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => {
                      onNavigate('CREATE_DYNAMIC');
                      setShowCreateDropdown(false);
                    }}
                    className="w-full px-4 py-4 text-sm text-left hover:bg-slate-50 font-bold text-slate-700 transition-colors border-t border-slate-50 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <p>Dynamic Framework</p>
                      <p className="text-[10px] text-slate-400 font-medium">Rule-based allocation</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter by ID, Name, or Staff Tag..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-outline-variant/20 py-3.5 pl-12 pr-4 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-surface-container-high rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2">
              <Filter size={16} />
              Filter
            </button>
            <button className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-surface-container-high rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contract ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contract Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Staff Tags</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="text-sm font-bold text-primary">{contract.contractId}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface">{contract.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">Revised {contract.updatedAt}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight ${
                      contract.type === 'DYNAMIC' 
                        ? 'bg-secondary-container text-secondary' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {contract.type}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1.5">
                      {contract.staffTags.map(tag => (
                        <span key={tag} className="bg-surface-container px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        contract.status === 'Active' ? 'bg-tertiary' : 'bg-slate-300'
                      }`}></div>
                      <span className={`text-xs font-bold ${
                        contract.status === 'Active' ? 'text-tertiary' : 'text-slate-500'
                      }`}>{contract.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirm(null);
                          onEditContract(contract);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirm(null);
                          onViewContract(contract);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setDeleteConfirm(contract);
                        }}
                        className="p-2 hover:bg-error-container rounded-lg text-error transition-colors"
                      >
                        <Archive size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredContracts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No contracts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 bg-slate-50/30">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Showing {filteredContracts.length} of {contracts.length} contracts</span>
            <div className="flex gap-2">
              <button className="p-1.5 rounded-lg bg-white border border-outline-variant/20 text-slate-400 hover:text-primary transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button className="p-1.5 rounded-lg bg-white border border-outline-variant/20 text-slate-400 hover:text-primary transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Insights */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 bg-white rounded-2xl border border-outline-variant/10 flex items-start gap-4 shadow-sm">
          <div className="p-3 bg-primary/5 rounded-xl text-primary">
            <Info size={24} />
          </div>
          <div>
            <h5 className="text-sm font-bold text-on-surface">Did you know?</h5>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Dynamic contracts automatically adjust staffing ratios based on real-time department occupancy. Using these can reduce planning time by 24%.
            </p>
          </div>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-outline-variant/10 flex items-start gap-4 shadow-sm">
          <div className="p-3 bg-secondary/5 rounded-xl text-secondary">
            <History size={24} />
          </div>
          <div>
            <h5 className="text-sm font-bold text-on-surface">Recent Activity</h5>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Draft 'Anesthesiology Locum Pool' was updated by Dr. Aris today at 09:12 AM.
            </p>
          </div>
        </div>
      </section>

      {deleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[200]"
            onClick={() => {
              if (!isDeleting) setDeleteConfirm(null);
            }}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-[92vw] max-w-sm">
            <div className="bg-white rounded-lg shadow-2xl border border-slate-200">
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="text-error" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-on-surface text-lg mb-1">Delete Contract?</h3>
                    <p className="text-sm text-on-surface-variant">
                      Are you sure you want to delete <span className="font-semibold">{deleteConfirm.name}</span>?
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setDeleteConfirm(null)}
                    className="px-6 py-2 rounded-lg bg-surface-container-high text-on-surface font-semibold hover:bg-surface-container-highest transition-colors disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={confirmDelete}
                    className="px-6 py-2 rounded-lg bg-error text-on-error font-semibold hover:bg-error/90 transition-colors disabled:opacity-60"
                  >
                    {isDeleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
