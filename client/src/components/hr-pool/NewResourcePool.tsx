import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  Stethoscope,
  PlusCircle,
  Search,
  X,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  FileText
} from 'lucide-react';
import { ViewState, Shift, Member } from '../hr-pool/types';
import { motion } from 'motion/react';
import { createPool, getCatalogStaffTags, getStaff, type ServerPoolDemandMatrixItem, type ServerStaffTag } from '../../lib/api';
import { useAppStore } from '../../context/AppStoreContext';

interface NewResourcePoolProps {
  onNavigate: (view: ViewState) => void;
  onPoolCreated?: (poolId: string) => void;
  draftDemandMatrix?: ServerPoolDemandMatrixItem[];
  onResetDraftDemand?: () => void;
  shifts?: Shift[];
  setShifts?: React.Dispatch<React.SetStateAction<Shift[]>>;
  members?: Member[];
  setMembers?: React.Dispatch<React.SetStateAction<Member[]>>;
}

export const NewResourcePool: React.FC<NewResourcePoolProps> = ({
  onNavigate,
  onPoolCreated = () => {},
  draftDemandMatrix,
  onResetDraftDemand = () => {},
  shifts = [],
  setShifts = (p0: any[]) => {},
  members = [],
  setMembers = (p0: (prev: any) => any) => {}
}) => {
  const { pushToast, store } = useAppStore();

  const [poolName, setPoolName] = useState('');
  const [primarySkill, setPrimarySkill] = useState('Select Role');
  const [department, setDepartment] = useState('Surgery');
  const [location, setLocation] = useState('');
  const [costCenter, setCostCenter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);
  const [availableStaff, setAvailableStaff] = useState<Member[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [catalogRoles, setCatalogRoles] = useState<ServerStaffTag[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const DEFAULT_ORG_ID = 1;

  useEffect(() => {
    const fromStore = store.settings?.catalogs?.staffTags ?? [];
    if (fromStore.length > 0) {
      setCatalogRoles(fromStore);
      return;
    }
    let cancelled = false;
    (async () => {
      setRolesLoading(true);
      try {
        const rows = await getCatalogStaffTags({ orgId: DEFAULT_ORG_ID });
        if (cancelled) return;
        setCatalogRoles(Array.isArray(rows) ? rows : []);
      } catch (e: any) {
        if (!cancelled) setCatalogRoles([]);
      } finally {
        if (!cancelled) setRolesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store.settings?.catalogs?.staffTags]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStaffLoading(true);
      try {
        const rows = await getStaff({ orgId: DEFAULT_ORG_ID });
        if (cancelled) return;
        const mapped: Member[] = rows.map((r: any) => {
          const id = String(r.staff_id ?? r.id ?? '');
          const name = String(r.name ?? '');
          const role = String(r.designation ?? 'Staff');
          const avatar = typeof r.profile_picture === 'string' ? r.profile_picture : '';
          const contractId = String(r.contract_id ?? '');
          const type: Member['type'] = contractId.startsWith('STA') ? 'STATIC' : 'DYNAMIC';
          return { id, name, role, avatar, type };
        }).filter((m) => m.id && m.name);
        setAvailableStaff(mapped);
      } catch (e: any) {
        if (!cancelled) {
          setAvailableStaff([]);
          pushToast(`Staff load failed: ${e?.message ?? 'Unknown error'}`);
        }
      } finally {
        if (!cancelled) setStaffLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pushToast]);

  const createAndNavigate = async (next: ViewState) => {
    if (!poolName.trim()) {
      alert('Please enter a Pool Name.');
      return;
    }
    setCreating(true);
    try {
      const record = await createPool({
        organization_id: DEFAULT_ORG_ID,
        pool_name: poolName.trim(),
        department,
        location: location || 'Main Hospital',
        primary_role: primarySkill === 'Select Role' ? undefined : primarySkill,
        static_pct: 50,
        dynamic_pct: 50,
        metadata: {
          icon: 'Users',
          color: 'blue',
          status: 'active',
          costCenter: costCenter || undefined,
        },
        demand_matrix: Array.isArray(draftDemandMatrix) && draftDemandMatrix.length > 0 ? draftDemandMatrix : undefined,
      });
      onPoolCreated();
      onResetDraftDemand();
      pushToast(`Pool created: ${record.pool_name}`);
      onNavigate(next);
    } catch (e: any) {
      pushToast(`Create pool failed: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDeploy = () => createAndNavigate('pool-detail');
  const handleGoToDemand = () => onNavigate('pool-demand');

  const addCustomShift = () => {
    const newShift: Shift = {
      id: `custom-${Date.now()}`,
      name: 'Custom Shift',
      start: '09:00',
      end: '17:00',
      typical: '09:00 AM - 05:00 PM',
      icon: 'Clock',
      color: 'text-emerald-500'
    };
    setShifts([...shifts, newShift]);
  };

  const deleteShift = (id: string) => {
    setShifts(shifts.filter(s => s.id !== id));
  };

  const updateShiftTime = (id: string, field: 'start' | 'end', value: string) => {
    setShifts(shifts.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const addFromLibrary = () => {
    const selectedIds = new Set(members.map((m) => m.id));
    const pool = availableStaff.filter((m) => !selectedIds.has(m.id));
    const q = searchTerm.trim().toLowerCase();
    const filtered = q
      ? pool.filter((m) => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))
      : pool;
    const pick = filtered[0] ?? pool[0];
    if (!pick) return;
    setMembers((prev) => [...prev, pick]);
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableCandidates = useMemo(() => {
    const selectedIds = new Set(members.map((m) => m.id));
    const q = searchTerm.trim().toLowerCase();
    return availableStaff
      .filter((m) => !selectedIds.has(m.id))
      .filter((m) => {
        if (!q) return true;
        return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
      });
  }, [availableStaff, members, searchTerm]);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <button onClick={() => onNavigate('directory')} className="hover:text-blue-700 transition-colors">Resource Pools</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-700 font-semibold">New Resource Pool</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">New Resource Pool</h1>
          <p className="text-slate-500 max-w-lg text-lg">Define unit-specific clinical groups with precise role hierarchies and shift logic.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => onNavigate('directory')}
            className="px-6 py-3 rounded-xl text-slate-600 bg-slate-100 font-bold transition-all hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleGoToDemand}
            disabled={creating}
            className="px-6 py-3 rounded-xl border-2 border-blue-700 text-blue-700 font-bold transition-all hover:bg-blue-50 active:scale-95"
          >
            Configure Weekly Demand Matrix
          </button>
          <button
            onClick={handleDeploy}
            disabled={creating}
            className="px-8 py-3 rounded-xl text-white bg-gradient-to-br from-blue-700 to-blue-800 font-bold shadow-xl shadow-blue-700/20 transition-all hover:scale-[1.02]"
          >
            Deploy Pool
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-2xl space-y-8 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <div className="p-2 bg-blue-100/50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-700" />
              </div>
              Core Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pool Name</label>
                <input
                  className="w-full bg-slate-50 border-0 border-b-2 border-slate-200 py-3 px-4 focus:ring-0 focus:border-blue-700 transition-all rounded-t-lg font-bold text-lg"
                  placeholder="e.g. Surgical Night Response Team"
                  type="text"
                  value={poolName}
                  onChange={(e) => setPoolName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Primary Role/Skill</label>
                <div className="relative">
                  <select 
                    value={primarySkill}
                    onChange={(e) => setPrimarySkill(e.target.value)}
                    className="w-full bg-slate-50 border-0 border-b-2 border-slate-200 py-3 px-4 focus:ring-0 focus:border-blue-700 transition-all appearance-none cursor-pointer rounded-t-lg"
                  >
                    <option value="Select Role">Select Role</option>
                    {catalogRoles.map((r) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                  {rolesLoading && (
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading roles…</div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Department</label>
                <div className="relative">
                  <select 
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 border-0 border-b-2 border-slate-200 py-3 px-4 focus:ring-0 focus:border-blue-700 transition-all appearance-none cursor-pointer rounded-t-lg"
                  >
                    <option>Surgery</option>
                    <option>Pediatrics</option>
                    <option>Emergency</option>
                    <option>Intensive Care</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location</label>
                <input
                  className="w-full bg-slate-50 border-0 border-b-2 border-slate-200 py-3 px-4 focus:ring-0 focus:border-blue-700 transition-all rounded-t-lg"
                  placeholder="e.g. North Wing, ICU-B"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cost Center</label>
                <input
                  className="w-full bg-slate-50 border-0 border-b-2 border-slate-200 py-3 px-4 focus:ring-0 focus:border-blue-700 transition-all rounded-t-lg"
                  placeholder="CC-90124-SURG"
                  type="text"
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-2xl space-y-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 bg-blue-100/50 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-700" />
                </div>
                Shift Configuration
              </h2>
              <button
                onClick={addCustomShift}
                className="text-blue-700 text-sm font-bold flex items-center gap-1.5 hover:underline"
              >
                <PlusCircle className="w-4 h-4" />
                Add Custom Shift
              </button>
            </div>
            <div className="space-y-4">
              {shifts.map((shift) => (
                <div key={shift.id} className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl group border border-slate-200">
                  <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm ${shift.color}`}>
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{shift.name}</p>
                    <p className="text-xs text-slate-500 font-medium">Typical: {shift.typical}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      id={`start-${shift.id}`}
                      className="border-0 bg-white px-3 py-1.5 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-700/20 shadow-sm"
                      type="time"
                      value={shift.start}
                      onChange={(e) => updateShiftTime(shift.id, 'start', e.target.value)}
                    />
                    <span className="text-slate-400 font-bold">→</span>
                    <input
                      id={`end-${shift.id}`}
                      className="border-0 bg-white px-3 py-1.5 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-700/20 shadow-sm"
                      type="time"
                      value={shift.end}
                      onChange={(e) => updateShiftTime(shift.id, 'end', e.target.value)}
                    />
                  </div>
                  <div className="flex gap-1 transition-opacity ml-4">
                    <button
                      onClick={() => {
                        const input = document.getElementById(`start-${shift.id}`);
                        if (input) input.focus();
                      }}
                      className="p-2 hover:bg-white hover:text-blue-700 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteShift(shift.id)}
                      className="p-2 hover:bg-white hover:text-red-500 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-8 rounded-2xl space-y-6 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <div className="p-2 bg-blue-100/50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-700" />
              </div>
              Contract Availability & Composition
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Static Hours Available', value: '420', unit: 'hrs' },
                { label: 'Dynamic Hours Available', value: '185', unit: 'hrs' },
                { label: 'Unique Contract IDs', value: '8', unit: 'IDs' },
                { label: 'Distribution', value: '5/3', unit: 'S/D' },
              ].map((stat, i) => (
                <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900">{stat.value}</span>
                    <span className="text-xs font-bold text-slate-400">{stat.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white p-8 rounded-2xl space-y-6 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <div className="p-2 bg-blue-100/50 rounded-lg">
                <PlusCircle className="w-5 h-5 text-blue-700" />
              </div>
              Initial Members
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 text-sm font-medium shadow-inner"
                placeholder="Search HR library..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Staff ({filteredMembers.length})</p>
              {filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200">
                  {member.avatar ? (
                    <img className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" src={member.avatar} alt={member.name} />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 ring-2 ring-white shadow-sm flex items-center justify-center font-extrabold text-slate-500">
                      {member.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-slate-900">{member.name}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{member.role}</p>
                  </div>
                  <button
                    onClick={() => removeMember(member.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Available Staff ({staffLoading ? '…' : availableCandidates.length})
              </p>
              {staffLoading ? (
                <div className="text-sm text-slate-500 font-medium py-2">Loading staff…</div>
              ) : availableCandidates.length === 0 ? (
                <div className="text-sm text-slate-400 font-medium py-2">No staff available.</div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-auto pr-1">
                  {availableCandidates.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setMembers((prev) => [...prev, m])}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-left"
                    >
                      {m.avatar ? (
                        <img className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm" src={m.avatar} alt={m.name} />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-white ring-2 ring-white shadow-sm flex items-center justify-center font-extrabold text-slate-500">
                          {m.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate text-slate-900">{m.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{m.role}</p>
                      </div>
                      <div className="text-blue-700 font-extrabold text-lg px-2">+</div>
                    </button>
                  ))}
                </div>
              )}
              {availableCandidates.length > 0 && (
                <button
                  type="button"
                  onClick={addFromLibrary}
                  className="w-full py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add First Match
                </button>
              )}
            </div>
          </section>

          <section className="bg-gradient-to-br from-slate-900 to-blue-800 p-8 rounded-2xl text-white space-y-6 relative overflow-hidden shadow-2xl">
            <div className="relative z-10 space-y-4">
              <h3 className="font-bold text-lg">Capacity Insight</h3>
              <p className="text-blue-100/80 text-sm leading-relaxed font-medium">
                Based on the selected role and department, this pool will require a minimum of <span className="text-white font-bold">12 full-time staff</span> to maintain 24/7 coverage.
              </p>
              <div className="space-y-2">
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full shadow-[0_0_10px_rgba(13,148,136,0.5)]" style={{ width: '33%' }}></div>
                </div>
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Currently staffed: {members.length} / 12 ({Math.round((members.length / 12) * 100)}%)</p>
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12">
              <Stethoscope className="w-32 h-32" />
            </div>
          </section>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-teal-100/50 flex items-center justify-center text-teal-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">System Validation</p>
                <p className="text-[10px] text-slate-500 font-medium">Mandatory clinical requirements met.</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-teal-700">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-wider">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
