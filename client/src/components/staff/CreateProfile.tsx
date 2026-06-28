import React, { useState, useContext, useMemo, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ChevronRight, Plus, Search, X, PlusCircle, Camera, FileText, Info, Plane, StickyNote, Clock, CalendarIcon, Check, Trash2, AlertTriangle, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaffMember, ScheduleBlock, EffortRole } from "./types";
import { AppStoreContext } from "../../context/AppStoreContext";
import { PROFESSIONAL_TITLES, STAFF_TYPES } from "./constants";
import { createStaff, getCatalogDepartments, getPools, type ServerDepartment, type ServerPoolListItem } from "../../lib/api";

interface CreateProfileProps {
  onAdd: (member: StaffMember) => void;
  onCancel?: () => void;
}

export default function CreateProfile({ onAdd, onCancel }: CreateProfileProps) {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error('AppStoreContext not found');
  const { store, pushToast, updateSettings } = context;
  const contracts = store.contracts || [];
  const existingStaff = store.staff || [];
  const [catalogDepartments, setCatalogDepartments] = useState<ServerDepartment[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const didAttemptDepartmentsFetchRef = useRef(false);
  const departments = useMemo(() => {
    const catalogs = store.settings?.catalogs as any;
    const fromStore = catalogs?.departments;
    if (Array.isArray(fromStore) && fromStore.length > 0) {
      return fromStore as ServerDepartment[];
    }
    return catalogDepartments;
  }, [catalogDepartments, store.settings?.catalogs]);

  const departmentNameById = useMemo(() => {
    return new Map(departments.map((d) => [Number((d as any).id), String((d as any).name ?? '')]));
  }, [departments]);
  const staffTypeOptions = useMemo(() => {
    const rows = store.settings?.catalogs?.staffTags ?? [];
    const names = rows.map((t) => t.name).filter(Boolean);
    return names.length > 0 ? names : STAFF_TYPES;
  }, [store.settings?.catalogs?.staffTags]);

  useEffect(() => {
    const catalogs = store.settings?.catalogs as any;
    const fromStore = catalogs?.departments;
    if (Array.isArray(fromStore) && fromStore.length > 0) {
      setCatalogDepartments(fromStore);
      return;
    }
    if (didAttemptDepartmentsFetchRef.current) return;
    didAttemptDepartmentsFetchRef.current = true;
    let cancelled = false;
    (async () => {
      setDepartmentsLoading(true);
      try {
        const rows = await getCatalogDepartments({ orgId: 1 });
        if (cancelled) return;
        const list = Array.isArray(rows) ? rows : [];
        setCatalogDepartments(list);
        const current = store.settings?.catalogs as any;
        const nextCatalogs = {
          staffTags: current?.staffTags ?? [],
          specializations: current?.specializations ?? [],
          skills: current?.skills ?? [],
          departments: list,
          shifts: current?.shifts ?? [],
        };
        updateSettings({ catalogs: nextCatalogs } as any);
      } catch {
        if (!cancelled) setCatalogDepartments([]);
      } finally {
        if (!cancelled) setDepartmentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store.settings?.catalogs, updateSettings]);

  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    email: "",
    title: "",
    supervisor: "",
    departmentId: "",
    specialization: [] as string[],
    contractId: "",
    effortRoles: [
      { id: "er1", type: "CLINICAL", description: "Direct Patient Care", percentage: 60 },
      { id: "er2", type: "RESEARCH", description: "Advanced Oncology Lab", percentage: 25 },
      { id: "er3", type: "TEACHING", description: "Resident Supervision", percentage: 15 },
    ] as EffortRole[],
    pools: [] as string[],
    weeklySchedule: [] as ScheduleBlock[]
  });

  const [showContractDropdown, setShowContractDropdown] = useState(false);
  const [contractSearch, setContractSearch] = useState("");

  const [showSupervisorDropdown, setShowSupervisorDropdown] = useState(false);
  const [supervisorSearch, setSupervisorSearch] = useState("");

  const [poolRows, setPoolRows] = useState<ServerPoolListItem[]>([]);
  const [poolsLoading, setPoolsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPoolsLoading(true);
      try {
        const rows = await getPools({ orgId: 1 });
        if (cancelled) return;
        setPoolRows(Array.isArray(rows) ? rows : []);
      } catch (e: any) {
        if (cancelled) return;
        setPoolRows([]);
        pushToast({ message: `Pool load failed: ${e?.message ?? 'Unknown error'}`, variant: 'error' });
      } finally {
        if (!cancelled) setPoolsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pushToast]);

  const filteredSupervisors = useMemo(() => {
    return existingStaff.filter(s => 
      s.name.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
      s.title.toLowerCase().includes(supervisorSearch.toLowerCase())
    );
  }, [existingStaff, supervisorSearch]);

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => 
      c.contractId.toLowerCase().includes(contractSearch.toLowerCase()) ||
      c.name.toLowerCase().includes(contractSearch.toLowerCase())
    );
  }, [contracts, contractSearch]);

  const selectedContract = contracts.find(c => c.contractId === formData.contractId);

  const [selectedPoolId, setSelectedPoolId] = useState("");

  const selectedDepartmentIdNum = useMemo(() => {
    const n = Number(formData.departmentId);
    return formData.departmentId && Number.isFinite(n) ? n : null;
  }, [formData.departmentId]);

  const selectedDepartmentName = useMemo(() => {
    if (typeof selectedDepartmentIdNum !== 'number') return '';
    return departmentNameById.get(selectedDepartmentIdNum) ?? '';
  }, [departmentNameById, selectedDepartmentIdNum]);

  const poolOptions = useMemo(() => {
    if (typeof selectedDepartmentIdNum !== 'number' && !selectedDepartmentName) return [];
    const deptId = selectedDepartmentIdNum;
    const deptName = selectedDepartmentName.trim().toLowerCase();
    return poolRows
      .filter((p) => {
        const pid = typeof p.department_id === 'number' ? Number(p.department_id) : null;
        if (typeof deptId === 'number' && typeof pid === 'number') return pid === deptId;
        const name = String(p.department ?? '').trim().toLowerCase();
        if (deptName && name) return name === deptName;
        return false;
      })
      .map((p) => ({ id: String(p.pool_id), name: String(p.pool_name ?? p.pool_id) }))
      .filter((p) => p.id && p.name);
  }, [poolRows, selectedDepartmentIdNum, selectedDepartmentName]);

  const poolNameById = useMemo(() => {
    return new Map(poolOptions.map((p) => [p.id, p.name]));
  }, [poolOptions]);

  useEffect(() => {
    if (!selectedPoolId) return;
    if (poolOptions.some((p) => p.id === selectedPoolId)) return;
    setSelectedPoolId("");
  }, [poolOptions, selectedPoolId]);

  const [newRole, setNewRole] = useState<Partial<EffortRole>>({
    type: 'CLINICAL',
    description: '',
    percentage: 0
  });

  const [newTag, setNewTag] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBlock, setNewBlock] = useState<Partial<ScheduleBlock>>({
    day: "Monday",
    startTime: "08:00",
    endTime: "12:00",
    role: "Clinical (Direct Patient Care)"
  });

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        specialization: [...prev.specialization, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.filter(t => t !== tag)
    }));
  };

  const handleAddBlock = () => {
    const block: ScheduleBlock = {
      id: Math.random().toString(36).substr(2, 9),
      day: newBlock.day || "Monday",
      startTime: newBlock.startTime || "08:00",
      endTime: newBlock.endTime || "12:00",
      role: newBlock.role || "Clinical"
    };

    setFormData(prev => ({
      ...prev,
      weeklySchedule: [...prev.weeklySchedule, block]
    }));
    setIsModalOpen(false);
  };

  const removeBlock = (id: string) => {
    setFormData(prev => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule.filter(b => b.id !== id)
    }));
  };

  const handleAddEffortRole = () => {
    if (!newRole.description || !newRole.type) return;
    const role: EffortRole = {
      id: Math.random().toString(36).substr(2, 9),
      type: newRole.type as EffortRole['type'],
      description: newRole.description,
      percentage: newRole.percentage || 0
    };
    setFormData(prev => ({
      ...prev,
      effortRoles: [...prev.effortRoles, role]
    }));
    setNewRole({ type: 'CLINICAL', description: '', percentage: 0 });
  };

  const removeEffortRole = (id: string) => {
    setFormData(prev => ({
      ...prev,
      effortRoles: prev.effortRoles.filter(r => r.id !== id)
    }));
  };

  const updateEffortRole = (id: string, updates: Partial<EffortRole>) => {
    setFormData(prev => ({
      ...prev,
      effortRoles: prev.effortRoles.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  };
 
   const handleAddPool = () => {
     const pool = poolOptions.find(p => p.id === selectedPoolId);
     if (pool && !formData.pools.includes(pool.id)) {
       setFormData(prev => ({
         ...prev,
         pools: [...prev.pools, pool.id]
       }));
       setSelectedPoolId("");
     }
   };
 
   const removePool = (poolId: string) => {
     setFormData(prev => ({
       ...prev,
       pools: prev.pools.filter(p => p !== poolId)
     }));
   };
 
   const totalEffort = formData.effortRoles.reduce((acc, curr) => acc + curr.percentage, 0);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      alert("Please enter Name and Email.");
      return;
    }

    if (!formData.contractId) {
      alert("Please select a contract for this staff member.");
      return;
    }

    if (totalEffort !== 100) {
      alert("Total Resource Distribution must equal 100% (currently " + totalEffort + "%).");
      return;
    }

    setIsSubmitting(true);
    try {
      const weekly_template = formData.weeklySchedule.reduce<Record<string, any[]>>((acc, b) => {
        const key = (b.day || '').toLowerCase();
        if (!key) return acc;
        acc[key] = acc[key] ?? [];
        acc[key].push({ start: b.startTime, end: b.endTime, role: b.role });
        return acc;
      }, {});

      const role_distribution = formData.effortRoles.reduce<Record<string, number>>((acc, r) => {
        const key = r.description || r.type;
        acc[key] = (r.percentage || 0) / 100;
        return acc;
      }, {});

      const created = await createStaff({
        organization_id: 1,
        personal_details: {
          name: formData.name,
          email: formData.email,
        },
        professional_primary_details: {
          department_id: formData.departmentId ? Number(formData.departmentId) : undefined,
          designation: formData.title || "Clinical Staff",
          contract_id: formData.contractId,
          supervisor: formData.supervisor || "Hospital Admin",
        },
        professional_secondary_details: {
          skills: formData.specialization,
          certifications: [],
          roles: formData.effortRoles.map((r) => r.description),
          role_distribution,
          weekly_template,
          pool_assignments: formData.pools.map((p) => ({ pool_id: p })),
        },
      });

      const deptId =
        typeof (created as any)?.department_id === 'number'
          ? Number((created as any).department_id)
          : (formData.departmentId ? Number(formData.departmentId) : undefined);
      const deptName =
        typeof (created as any)?.department === 'string' && String((created as any).department).trim()
          ? String((created as any).department).trim()
          : (typeof deptId === 'number'
              ? (departments.find((d) => Number(d.id) === deptId)?.name ?? '')
              : '');

      const newMember: StaffMember = {
        id: String(created.id),
        name: created.name,
        title: created.designation || formData.title || "Clinical Staff",
        specialization:
          Array.isArray(created.skills) && created.skills.length > 0
            ? (created.skills as string[])
            : (formData.specialization.length > 0 ? formData.specialization : ["General"]),
        contractId: created.contract_id || formData.contractId,
        departmentId: typeof deptId === 'number' ? deptId : undefined,
        department: deptName || undefined,
        supervisor: created.supervisor || formData.supervisor || "Hospital Admin",
        status: "Active",
        email: created.email || formData.email,
        employeeId: created.staff_id.startsWith('#') ? created.staff_id : `#${created.staff_id}`,
        skills:
          Array.isArray(created.skills) && created.skills.length > 0
            ? (created.skills as string[])
            : (formData.specialization.length > 0 ? formData.specialization : ["General Medicine"]),
        effortRoles: formData.effortRoles,
        pools: formData.pools,
        weeklySchedule: formData.weeklySchedule
      };

      pushToast('Staff member created successfully.');
      onAdd(newMember);
    } catch (e: any) {
      pushToast({ message: `Staff create failed: ${e?.message ?? 'Unknown error'}`, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto pt-6 pb-4"
    >
      <header className="mb-12">
        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
          <span className="hover:text-blue-600 cursor-pointer" onClick={onCancel}>Personnel Library</span>
          <ChevronRight size={12} />
          <span className="text-blue-700 font-medium">Add New Human Resource</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Resource Onboarding</h1>
        <p className="text-slate-500 mt-2 text-lg">Define identity, contract roles, and effort distribution for the new clinical member.</p>
      </header>

      <div className="grid grid-cols-12 gap-10 items-start">
        <section className="col-span-12 lg:col-span-7 space-y-10">
          <div className="space-y-6">
            <h3 className="text-xl font-bold border-b border-slate-100 pb-3">Identity & Logistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                <input 
                  className="w-full bg-white border-none border-b-2 border-slate-100 focus:border-blue-600 rounded-none px-4 py-6 h-auto shadow-none transition-colors focus:ring-0 focus:outline-none"
                  placeholder="Dr. Julianne Mercer"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Employee ID</label>
                <input 
                  type="text"
                  readOnly
                  value={formData.employeeId || 'Generated after save'}
                  className="w-full bg-slate-50 border-none border-b-2 border-slate-100 focus:border-blue-600 focus:ring-0 text-slate-900 font-bold px-4 py-3 rounded-t-xl transition-all outline-none"
                />
                <p className="text-[9px] text-slate-400 mt-1 italic px-1">Assigned by the backend and available after creation</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Professional Title</label>
                <div className="relative">
                  <select 
                    className="w-full bg-white border-none border-b-2 border-slate-100 focus:border-blue-600 rounded-none pl-4 pr-10 py-6 h-auto shadow-none transition-colors focus:ring-0 focus:outline-none appearance-none font-bold text-slate-900"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  >
                    <option value="" disabled>Select Professional Title...</option>
                    {PROFESSIONAL_TITLES.map(title => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Official Email</label>
                <input 
                  className="w-full bg-white border-none border-b-2 border-slate-100 focus:border-blue-600 rounded-none px-4 py-6 h-auto shadow-none transition-colors focus:ring-0 focus:outline-none"
                  placeholder="j.mercer@stprecision.org"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Staff Type</label>
                <div className="relative">
                  <select 
                    className="w-full bg-white border-none border-b-2 border-slate-100 focus:border-blue-600 rounded-none pl-4 pr-10 py-6 h-auto shadow-none transition-colors focus:ring-0 focus:outline-none appearance-none font-bold text-slate-900"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !formData.specialization.includes(val)) {
                        setFormData(prev => ({
                          ...prev,
                          specialization: [...prev.specialization, val]
                        }));
                      }
                      e.target.value = ""; // Reset select
                    }}
                  >
                    <option value="">Add Staff Type...</option>
                    {staffTypeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.specialization.map(tag => (
                    <span key={tag} className="bg-blue-50 text-blue-700 text-[10px] font-black rounded px-2.5 py-1.5 flex items-center gap-1.5 uppercase tracking-tight hover:bg-blue-100 transition-colors">
                      {tag}
                      <X size={10} className="cursor-pointer" onClick={() => removeTag(tag)} />
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Department</label>
                <div className="relative">
                  <select
                    className="w-full bg-white border-none border-b-2 border-slate-100 focus:border-blue-600 rounded-none pl-4 pr-10 py-6 h-auto shadow-none transition-colors focus:ring-0 focus:outline-none appearance-none font-bold text-slate-900"
                    value={formData.departmentId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, departmentId: e.target.value }))}
                    disabled={departments.length === 0}
                  >
                    <option value="">{departments.length === 0 ? 'No departments in catalog' : 'Select Department...'}</option>
                    {departments.map((d) => (
                      <option key={d.id} value={String(d.id)}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
                {departmentsLoading && (
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading departments…</div>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Primary Supervisor</label>
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setShowSupervisorDropdown(!showSupervisorDropdown)}
                    className="w-full bg-white border-none border-b-2 border-slate-100 focus:border-blue-600 rounded-none px-4 py-6 h-auto shadow-none transition-colors flex justify-between items-center group"
                  >
                    <div className="flex items-center gap-3">
                      <Search className="text-slate-400 group-hover:text-blue-600 transition-colors" size={18} />
                      <span className={cn(
                        "text-sm font-bold transition-colors",
                        formData.supervisor ? "text-slate-900" : "text-slate-400"
                      )}>
                        {formData.supervisor || "Select a supervisor from staff..."}
                      </span>
                    </div>
                    <ChevronDown size={18} className={cn("text-slate-400 transition-transform duration-200", showSupervisorDropdown && "rotate-180")} />
                  </button>

                  {showSupervisorDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowSupervisorDropdown(false)}></div>
                      <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-4 border-b border-slate-50">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                              autoFocus
                              type="text"
                              placeholder="Search by name or title..."
                              className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                              value={supervisorSearch}
                              onChange={(e) => setSupervisorSearch(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {filteredSupervisors.length > 0 ? (
                            filteredSupervisors.map(staff => (
                              <button
                                key={staff.id}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, supervisor: staff.name }));
                                  setShowSupervisorDropdown(false);
                                  setSupervisorSearch("");
                                }}
                                className="w-full px-4 py-4 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 text-xs font-bold">
                                  {staff.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{staff.name}</span>
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{staff.title}</span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-8 text-center">
                              <p className="text-sm text-slate-400 font-medium italic">No staff members found</p>
                              <p className="text-[10px] text-slate-300 uppercase font-black mt-2 tracking-widest">Add more staff to see them here</p>
                            </div>
                          )}
                          <div className="p-2 border-t border-slate-50">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, supervisor: "Hospital Admin" }));
                                setShowSupervisorDropdown(false);
                                setSupervisorSearch("");
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-slate-50 rounded-lg transition-colors text-xs font-bold text-slate-500 uppercase tracking-widest"
                            >
                              Default: Hospital Admin
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contract Assignment</label>
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setShowContractDropdown(!showContractDropdown)}
                    className="w-full bg-white border-none border-b-2 border-slate-100 focus:border-blue-600 rounded-none px-4 py-6 h-auto shadow-none transition-colors flex justify-between items-center group"
                  >
                    <div className="flex items-center gap-3">
                      <StickyNote className="text-slate-400 group-hover:text-blue-600 transition-colors" size={18} />
                      <span className={cn(
                        "text-sm font-bold transition-colors",
                        selectedContract ? "text-slate-900" : "text-slate-400"
                      )}>
                        {selectedContract ? `${selectedContract.contractId} - ${selectedContract.name}` : "Select an existing contract..."}
                      </span>
                    </div>
                    <ChevronDown size={18} className={cn("text-slate-400 transition-transform duration-200", showContractDropdown && "rotate-180")} />
                  </button>

                  {showContractDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowContractDropdown(false)}></div>
                      <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-4 border-b border-slate-50">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                              autoFocus
                              type="text"
                              placeholder="Search contracts by ID or Name..."
                              className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                              value={contractSearch}
                              onChange={(e) => setContractSearch(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {filteredContracts.length > 0 ? (
                            filteredContracts.map(contract => (
                              <button
                                key={contract.id}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, contractId: contract.contractId }));
                                  setShowContractDropdown(false);
                                  setContractSearch("");
                                }}
                                className="w-full px-4 py-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group"
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{contract.contractId}</span>
                                  <span className="text-xs text-slate-500 font-medium">{contract.name}</span>
                                </div>
                                <div className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight",
                                  contract.type === 'DYNAMIC' ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"
                                )}>
                                  {contract.type}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-8 text-center">
                              <p className="text-sm text-slate-400 font-medium italic">No contracts found</p>
                              <p className="text-[10px] text-slate-300 uppercase font-black mt-2 tracking-widest">Create one in the Contracts tab</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-2 italic uppercase tracking-tighter">
                  {selectedContract 
                    ? `* Assigned to ${selectedContract.type} contract. ${selectedContract.type === 'STATIC' ? 'Schedule can be customized below.' : 'Schedule is generated by the contract rules.'}`
                    : "* Assign an existing Static or Dynamic contract to this staff member."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-slate-900">Resource Distribution</h3>
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all",
                totalEffort === 100 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                  : "bg-rose-50 text-rose-700 border border-rose-100 animate-pulse"
              )}>
                {totalEffort === 100 ? <Check size={12} /> : <AlertTriangle size={12} />}
                Total: {totalEffort}% {totalEffort === 100 ? '(Balanced)' : '(Required: 100%)'}
              </div>
            </div>

            <div className="space-y-8">
              {/* Progress Bar */}
              <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-hidden">
                {formData.effortRoles.map((role) => (
                  <div
                    key={role.id}
                    className={cn(
                      "h-full transition-all duration-500",
                      role.type === 'CLINICAL' ? "bg-[#004a8d]" : 
                      role.type === 'RESEARCH' ? "bg-[#005a4d]" : 
                      "bg-[#8da2b5]"
                    )}
                    style={{ width: `${role.percentage}%` }}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-6">
                {[
                  { label: 'CLINICAL', color: 'bg-[#004a8d]', type: 'CLINICAL' },
                  { label: 'RESEARCH', color: 'bg-[#005a4d]', type: 'RESEARCH' },
                  { label: 'TEACHING', color: 'bg-[#8da2b5]', type: 'TEACHING' }
                ].map(item => {
                  const total = formData.effortRoles
                    .filter(r => r.type === item.type)
                    .reduce((acc, curr) => acc + curr.percentage, 0);
                  return (
                    <div key={item.type} className="flex items-center gap-2">
                      <div className={cn("w-2.5 h-2.5 rounded-full", item.color)}></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {item.label} <span className="text-slate-300 ml-1">({total}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Roles Table */}
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <div className="col-span-2">Type</div>
                  <div className="col-span-6">Role Description</div>
                  <div className="col-span-3 text-center">Adjustment</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>

                <div className="space-y-2">
                  {formData.effortRoles.map((role) => (
                    <div key={role.id} className="grid grid-cols-12 gap-4 items-center bg-white p-4 rounded-xl border border-slate-50 hover:border-slate-100 transition-all group">
                      <div className="col-span-2">
                        <span className={cn(
                          "px-2.5 py-1 rounded text-[9px] font-black tracking-tight uppercase",
                          role.type === 'CLINICAL' ? "bg-blue-50 text-blue-700" :
                          role.type === 'RESEARCH' ? "bg-emerald-50 text-emerald-700" :
                          "bg-slate-100 text-slate-600"
                        )}>
                          {role.type}
                        </span>
                      </div>
                      <div className="col-span-6">
                        <input
                          type="text"
                          className="w-full text-sm font-bold text-slate-700 bg-transparent border-none focus:ring-0 p-0"
                          value={role.description}
                          onChange={(e) => updateEffortRole(role.id, { description: e.target.value })}
                        />
                      </div>
                      <div className="col-span-3 flex items-center justify-center gap-2">
                        <div className="relative">
                          <input
                            type="number"
                            className="w-20 bg-slate-50 border-none rounded-lg py-2 px-3 text-sm font-black text-center focus:ring-2 focus:ring-blue-500/20"
                            value={role.percentage}
                            onChange={(e) => updateEffortRole(role.id, { percentage: Number(e.target.value) })}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-bold">%</span>
                        </div>
                      </div>
                      <div className="col-span-1 text-right">
                        <button 
                          onClick={() => removeEffortRole(role.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Row */}
                  <div className="grid grid-cols-12 gap-4 items-center bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 mt-6">
                    <div className="col-span-2">
                      <select
                        className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2 text-[9px] font-bold uppercase focus:ring-2 focus:ring-blue-500/20"
                        value={newRole.type}
                        onChange={(e) => setNewRole({ ...newRole, type: e.target.value as any })}
                      >
                        <option value="CLINICAL">CLINICAL</option>
                        <option value="RESEARCH">RESEARCH</option>
                        <option value="TEACHING">TEACHING</option>
                      </select>
                    </div>
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="Enter role description..."
                        className="w-full text-sm font-medium text-slate-500 bg-white border border-slate-200 rounded-lg py-2 px-4 focus:ring-2 focus:ring-blue-500/20"
                        value={newRole.description}
                        onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                      />
                    </div>
                    <div className="col-span-3 flex items-center justify-center gap-2">
                      <div className="relative">
                        <input
                          type="number"
                          className="w-20 bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-black text-center focus:ring-2 focus:ring-blue-500/20"
                          value={newRole.percentage}
                          onChange={(e) => setNewRole({ ...newRole, percentage: Number(e.target.value) })}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-bold">%</span>
                      </div>
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        onClick={handleAddEffortRole}
                        disabled={!newRole.description}
                        className="w-full h-10 bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <Plus size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-tighter hidden xl:inline">Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selectedContract?.type === 'STATIC' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b border-slate-100 pb-3 flex items-center justify-between">
                Weekly Schedule Template
                <button 
                  className="text-blue-700 font-bold flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                  onClick={() => setIsModalOpen(true)}
                >
                  <PlusCircle size={16} />
                  Add Block
                </button>
              </h3>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="grid grid-cols-7 gap-3">
                  {days.map(day => {
                    const dayBlocks = formData.weeklySchedule.filter(b => b.day === day);
                    return (
                      <div key={day} className="text-center space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">{day.slice(0, 3)}</span>
                        <div className="h-32 bg-white rounded-xl border-2 border-dashed border-slate-200 flex flex-col p-1 gap-1 overflow-y-auto scrollbar-hide">
                          {dayBlocks.map(block => (
                            <div 
                              key={block.id} 
                              className={cn(
                                "w-full rounded-lg p-1.5 text-left group relative transition-all",
                                block.role.includes("Clinical") ? "bg-emerald-50 border-l-2 border-emerald-600" :
                                block.role.includes("Research") ? "bg-blue-50 border-l-2 border-blue-600" :
                                "bg-slate-100 border-l-2 border-slate-400"
                              )}
                            >
                              <div className="text-[8px] font-bold text-slate-900 truncate">{block.startTime}</div>
                              <div className="text-[7px] text-slate-500 truncate">{block.role}</div>
                              <button 
                                onClick={() => removeBlock(block.id)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                              >
                                <X size={8} />
                              </button>
                            </div>
                          ))}
                          <button 
                            onClick={() => {
                              setNewBlock(prev => ({ ...prev, day }));
                              setIsModalOpen(true);
                            }}
                            className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all group"
                          >
                            <PlusCircle size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="col-span-12 lg:col-span-5 sticky top-32 space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-40 h-40 rounded-3xl overflow-hidden mb-6 border-4 border-white shadow-lg bg-slate-50 flex items-center justify-center text-slate-300">
                <Camera size={48} />
              </div>
              <button className="text-blue-700 text-sm font-bold flex items-center gap-2 mb-4 hover:bg-blue-50 px-3 py-2 rounded transition-colors">
                <Camera size={18} />
                Update Profile Photo
              </button>
              <h4 className="text-2xl font-extrabold text-slate-900">{formData.name || "New Staff Member"}</h4>
              <p className="text-slate-500 font-medium">{formData.title || "Position Title"}</p>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                  <span className="text-sm font-bold text-slate-900">Draft Profile</span>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Total Effort</span>
                <span className="text-sm font-bold text-slate-900">{(totalEffort / 100).toFixed(1)} FTE</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Effort Split Metrics</h3>
            <div className="flex items-end gap-3 h-40 mb-6">
              {[
                { type: 'CLINICAL', color: 'bg-[#004a8d]' },
                { type: 'RESEARCH', color: 'bg-[#005a4d]' },
                { type: 'TEACHING', color: 'bg-[#8da2b5]' }
              ].map(item => {
                const total = formData.effortRoles
                  .filter(r => r.type === item.type)
                  .reduce((acc, curr) => acc + curr.percentage, 0);
                return (
                  <div 
                    key={item.type}
                    className={cn("flex-grow rounded-t-xl transition-all duration-500", item.color)}
                    style={{ height: `${total}%` }}
                  ></div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              <span>Clinical</span>
              <span>Research</span>
              <span>Teaching</span>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className={cn(
                "flex items-center gap-3 text-sm font-bold transition-colors",
                totalEffort === 100 ? "text-slate-600 italic" : "text-rose-600"
              )}>
                {totalEffort === 100 ? <Info size={18} className="text-blue-600" /> : <AlertTriangle size={18} className="text-rose-600" />}
                <span>
                  {totalEffort === 100 
                    ? "Effort distribution is compliant with Standard Contract v4.2" 
                    : `Incomplete distribution: ${totalEffort}% / 100%`}
                </span>
              </div>
            </div>
          </div>

          {/* Pool Assignment Card */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-2xl font-black text-slate-900">Pool Assignment</h3>
            
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Add to Pool</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <select 
                    className="w-full bg-slate-50 border-none rounded-2xl h-14 px-5 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all"
                    value={selectedPoolId}
                    onChange={(e) => setSelectedPoolId(e.target.value)}
                    disabled={poolsLoading || poolOptions.length === 0}
                  >
                    <option value="">
                      {poolsLoading ? 'Loading pools…' : poolOptions.length === 0 ? 'Select staff department first' : 'Select a pool...'}
                    </option>
                    {poolOptions.map(pool => (
                      <option key={pool.id} value={pool.id}>{pool.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Plus size={16} className="text-slate-400 rotate-45" />
                  </div>
                </div>
                <button 
                  onClick={handleAddPool}
                  disabled={!selectedPoolId || poolsLoading || poolOptions.length === 0}
                  className={cn(
                    "px-8 font-bold rounded-2xl transition-all active:scale-95 text-white",
                    selectedPoolId && !poolsLoading && poolOptions.length > 0
                      ? "bg-[#004a8d] hover:bg-[#003a6d] shadow-lg shadow-blue-900/20" 
                      : "bg-[#8da2b5] opacity-50 cursor-not-allowed"
                  )}
                >
                  Add
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Pools</label>
              <div className="flex flex-wrap gap-3">
                {formData.pools.length > 0 ? (
                  formData.pools.map(poolId => (
                    <span 
                      key={poolId} 
                      className="bg-blue-50 text-[#004a8d] text-[11px] font-bold rounded-full px-4 py-2 flex items-center gap-2 border border-blue-100/50"
                    >
                      {poolNameById.get(poolId) ?? poolId}
                      <button 
                        onClick={() => removePool(poolId)}
                        className="hover:bg-blue-200/50 rounded-full p-0.5 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                ) : (
                  <div className="w-full py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No pools assigned</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50">
              <div className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-2xl">
                <Info size={18} className="text-slate-400 mt-0.5" />
                <p className="text-xs leading-relaxed text-slate-500 font-medium">
                  Personnel assigned to pools are automatically prioritized during emergency scheduling shifts.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-3xl">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-xl font-extrabold text-blue-900 mb-6">Add Schedule Block</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Day of the Week</label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-xl h-12 focus:ring-2 focus:ring-blue-500"
                  value={newBlock.day}
                  onChange={(e) => setNewBlock(prev => ({ ...prev, day: e.target.value }))}
                >
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Role</label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-xl h-12 focus:ring-2 focus:ring-blue-500"
                  value={newBlock.role}
                  onChange={(e) => setNewBlock(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="Clinical (Direct Patient Care)">Clinical (Direct Patient Care)</option>
                  <option value="Research (Trial Coordination)">Research (Trial Coordination)</option>
                  <option value="Teaching (Residency Mentorship)">Teaching (Residency Mentorship)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Start Time</label>
                  <input 
                    type="time"
                    className="w-full bg-slate-50 border-none rounded-xl h-12 focus:ring-2 focus:ring-blue-500"
                    value={newBlock.startTime}
                    onChange={(e) => setNewBlock(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">End Time</label>
                  <input 
                    type="time"
                    className="w-full bg-slate-50 border-none rounded-xl h-12 focus:ring-2 focus:ring-blue-500"
                    value={newBlock.endTime}
                    onChange={(e) => setNewBlock(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Discard
              </button>
              <button 
                onClick={handleAddBlock}
                className="flex-1 bg-blue-700 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20"
              >
                Add Block
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="sticky bottom-4 w-full bg-slate-900 text-white p-6 z-[60] flex flex-col md:flex-row justify-between items-center gap-4 rounded-2xl mt-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
            <FileText size={20} className="text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Drafting: New Human Resource</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Last saved 2 mins ago</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-white font-semibold" onClick={onCancel}>Discard Draft</button>
          <button className="bg-slate-800 text-slate-200 hover:bg-slate-700 font-semibold rounded-xl px-4 py-2" onClick={onCancel}>Cancel</button>
          <button 
            className={cn(
              "text-white font-bold rounded-xl shadow-lg transition-all px-8 py-3 flex items-center gap-2",
              totalEffort === 100 && !isSubmitting
                ? "bg-blue-600 shadow-blue-900/20 hover:scale-[1.02] active:scale-95" 
                : "bg-rose-600 shadow-rose-900/20 opacity-90 cursor-not-allowed hover:bg-rose-700"
            )}
            disabled={isSubmitting || totalEffort !== 100}
            onClick={() => {
              if (isSubmitting) return;
              if (totalEffort !== 100) {
                alert(`Cannot save profile: Total distribution is ${totalEffort}%. It must be exactly 100%.`);
                return;
              }
              handleSubmit();
            }}
          >
            {totalEffort !== 100 && <AlertTriangle size={18} />}
            {isSubmitting ? 'Saving...' : 'Add to HR Library'}
          </button>
        </div>
      </footer>
    </motion.div>
  );
}
