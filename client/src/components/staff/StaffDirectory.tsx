import React, { useState, useMemo, useContext } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaffMember } from "./types";
import { AppStoreContext } from "../../context/AppStoreContext";

interface StaffDirectoryProps {
  staff: StaffMember[];
  onViewProfile?: (memberId: string) => void;
  onCreateNew?: () => void;
}

export default function StaffDirectory({ 
  staff, 
  onViewProfile, 
  onCreateNew
}: StaffDirectoryProps) {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error('AppStoreContext not found');
  const { store } = context;
  const [filtersEnabled, setFiltersEnabled] = useState(false);
  const [staffIdFilter, setStaffIdFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [contractIdFilter, setContractIdFilter] = useState("");
  const [supervisorFilter, setSupervisorFilter] = useState("");

  const getContractType = (contractId: string) => {
    return contractId.toUpperCase().startsWith('STA') ? 'Static' : 'Dynamic';
  };

  const filteredStaff = useMemo(() => {
    return staff.filter(member => {
      const isNotArchived = member.status !== 'Archived';
      if (!filtersEnabled) return isNotArchived;

      const matchesSearch = searchTerm === "" || 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStaffId = staffIdFilter === "" ||
        String(member.employeeId || member.id).toLowerCase().includes(staffIdFilter.toLowerCase());

      const matchesSpec = specializationFilter === "" || 
        member.specialization.includes(specializationFilter);

      const contractType = getContractType(member.contractId);
      const contractQuery = contractIdFilter.toLowerCase();
      const matchesContract = contractIdFilter === "" || 
        member.contractId.toLowerCase().includes(contractQuery) ||
        contractType.toLowerCase().includes(contractQuery);

      const dept = String(member.department ?? '').trim();
      const matchesDept = departmentFilter === "" || dept === departmentFilter;

      const matchesSupervisor = supervisorFilter === "" ||
        member.supervisor.toLowerCase().includes(supervisorFilter.toLowerCase());

      return matchesStaffId && matchesSearch && matchesSpec && matchesDept && matchesContract && matchesSupervisor && isNotArchived;
    });
  }, [staff, filtersEnabled, staffIdFilter, searchTerm, specializationFilter, departmentFilter, contractIdFilter, supervisorFilter]);

  const specializationOptions = Array.from(new Set(staff.flatMap(s => s.specialization)));
  const departmentOptions = useMemo(() => {
    const fromCatalog = ((store.settings?.catalogs as any)?.departments ?? [])
      .map((d: any) => String(d?.name ?? '').trim())
      .filter(Boolean);
    if (fromCatalog.length > 0) return Array.from(new Set(fromCatalog));
    return Array.from(
      new Set(
        staff
          .map((m) => String(m.department ?? '').trim())
          .filter(Boolean),
      ),
    );
  }, [staff, store.settings?.catalogs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 pb-12"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Personnel Library</h2>
          <p className="text-slate-500 mt-2">Manage clinical staff, assignments, and schedules</p>
        </div>
        <button 
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 shrink-0"
          onClick={onCreateNew}
        >
          <Plus size={20} />
          Add Staff Member
        </button>
      </div>

      {/* Staff List Table */}
      <div className="bg-white rounded-2xl overflow-x-auto shadow-sm border border-slate-200/50">
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/40 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Table Controls</p>
          <button
            type="button"
            onClick={() => setFiltersEnabled((prev) => !prev)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
              filtersEnabled
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            )}
          >
            <Filter size={14} />
            {filtersEnabled ? 'Hide Filters' : 'Enable Filters'}
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">Staff ID</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">Name & Professional Title</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">Specialization</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">Department</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">Contract</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">Supervisor</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">Actions</th>
            </tr>
            {filtersEnabled && (
              <tr className="bg-slate-50/30 border-b border-slate-200">
                <th className="px-4 py-3 text-left">
                  <input
                    className="w-full min-w-28 bg-white border border-slate-200 h-9 rounded-lg px-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Filter ID"
                    value={staffIdFilter}
                    onChange={(e) => setStaffIdFilter(e.target.value)}
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <input
                    className="w-full min-w-44 bg-white border border-slate-200 h-9 rounded-lg px-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Filter name/title"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <select
                    className="w-full min-w-40 bg-white border border-slate-200 h-9 rounded-lg px-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={specializationFilter}
                    onChange={(e) => setSpecializationFilter(e.target.value)}
                  >
                    <option value="">All</option>
                    {specializationOptions.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </th>
                <th className="px-4 py-3 text-left">
                  <select
                    className="w-full min-w-36 bg-white border border-slate-200 h-9 rounded-lg px-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    disabled={departmentOptions.length === 0}
                  >
                    <option value="">All</option>
                    {departmentOptions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </th>
                <th className="px-4 py-3 text-center">
                  <input
                    className="w-full min-w-28 bg-white border border-slate-200 h-9 rounded-lg px-3 text-xs text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Filter contract"
                    value={contractIdFilter}
                    onChange={(e) => setContractIdFilter(e.target.value)}
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <input
                    className="w-full min-w-36 bg-white border border-slate-200 h-9 rounded-lg px-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Filter supervisor"
                    value={supervisorFilter}
                    onChange={(e) => setSupervisorFilter(e.target.value)}
                  />
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setStaffIdFilter('');
                      setSpecializationFilter('');
                      setDepartmentFilter('');
                      setContractIdFilter('');
                      setSupervisorFilter('');
                    }}
                    className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                  >
                    Clear
                  </button>
                </th>
              </tr>
            )}
          </thead>
          <tbody>
            {filteredStaff.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-200 group">
                <td className="px-6 py-5">
                  <span className="font-mono text-xs text-slate-600">
                    {member.employeeId || member.id}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{member.name}</div>
                      <div className="text-xs text-slate-500">{member.title}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1 items-start">
                    {member.specialization.map(tag => (
                      <span key={tag} className="bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-tighter rounded-full px-2 py-1 w-fit block">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">
                  {String(member.department ?? '').trim() || '—'}
                </td>
                <td className="px-6 py-5 text-center">
                  <span
                    className="inline-flex items-center justify-center rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1"
                    title={`Contract ID: ${member.contractId || '—'}`}
                  >
                    {getContractType(member.contractId)}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">
                  {member.supervisor}
                </td>
                <td className="px-6 py-5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      className="text-blue-600 font-bold text-xs hover:bg-blue-50 px-3 py-2 rounded transition-colors"
                      onClick={() => onViewProfile?.(member.id)}
                    >
                      View Profile
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination Footer */}
        <div className="px-6 py-4 flex items-center justify-between bg-slate-50/30 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-900">{filteredStaff.length}</span> of <span className="font-bold text-slate-900">{staff.filter(m => m.status !== 'Archived').length}</span> staff members
          </p>
          <div className="flex items-center gap-1">
            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button className="h-8 w-8 bg-blue-700 text-white font-bold p-0 rounded">1</button>
            <button className="h-8 w-8 font-medium p-0 hover:bg-slate-100 rounded transition-colors">2</button>
            <button className="h-8 w-8 font-medium p-0 hover:bg-slate-100 rounded transition-colors">3</button>
            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
