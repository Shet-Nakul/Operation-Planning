import React, { useState, useMemo, useContext } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Archive, Filter, Plus, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaffMember } from "./types";
import { AppStoreContext } from "../../context/AppStoreContext";

interface StaffDirectoryProps {
  staff: StaffMember[];
  onViewProfile?: (memberId: string) => void;
  onCreateNew?: () => void;
  onDelete?: (memberId: string) => void;
}

export default function StaffDirectory({ 
  staff, 
  onViewProfile, 
  onCreateNew,
  onDelete 
}: StaffDirectoryProps) {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error('AppStoreContext not found');
  const { store } = context;
  const [searchTerm, setSearchTerm] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [contractIdFilter, setContractIdFilter] = useState("");

  const filteredStaff = useMemo(() => {
    return staff.filter(member => {
      const matchesSearch = searchTerm === "" || 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.specialization.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSpec = specializationFilter === "" || 
        member.specialization.includes(specializationFilter);

      const matchesContract = contractIdFilter === "" || 
        member.contractId.includes(contractIdFilter);

      const dept = String(member.department ?? '').trim();
      const matchesDept = departmentFilter === "" || dept === departmentFilter;

      const isNotArchived = member.status !== 'Archived';

      return matchesSearch && matchesSpec && matchesDept && matchesContract && isNotArchived;
    });
  }, [staff, searchTerm, specializationFilter, departmentFilter, contractIdFilter]);

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
          className="bg-blue-700 text-white font-bold rounded-xl px-6 py-6 h-auto flex items-center gap-2 hover:bg-blue-800 transition-colors"
          onClick={onCreateNew}
        >
          <Plus size={20} />
          Add Staff Member
        </button>
      </div>

      {/* Search & Filters */}
      <section className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">Search Staff</label>
          <div className="relative">
            <input
              className="w-full bg-white border-none shadow-sm h-12 rounded-lg pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Search by name, title, or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          </div>
        </div>
        <div className="col-span-12 md:col-span-3">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">Specialization</label>
          <select 
            className="w-full bg-white border-none shadow-sm h-12 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={specializationFilter}
            onChange={(e) => setSpecializationFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {specializationOptions.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
        <div className="col-span-12 md:col-span-2">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">Department</label>
          <select
            className="w-full bg-white border-none shadow-sm h-12 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            disabled={departmentOptions.length === 0}
          >
            <option value="">{departmentOptions.length === 0 ? 'No departments' : 'All Departments'}</option>
            {departmentOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="col-span-12 md:col-span-2">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">Contract ID</label>
          <div className="relative">
            <input 
              className="w-full bg-white border-none shadow-sm h-12 rounded-lg pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="CID-0000"
              value={contractIdFilter}
              onChange={(e) => setContractIdFilter(e.target.value)}
            />
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          </div>
        </div>
      </section>

      {/* Staff List Table */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/50">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">Name & Professional Title</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">Specialization</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">Department</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">Contract ID</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">Supervisor</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-200 group">
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
                  <div className="flex gap-2 flex-wrap">
                    {member.specialization.map(tag => (
                      <span key={tag} className="bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-tighter rounded-full px-2 py-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">
                  {String(member.department ?? '').trim() || '—'}
                </td>
                <td className="px-6 py-5 text-center font-mono text-xs text-blue-600">
                  {member.contractId}
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">
                  {member.supervisor}
                </td>
                <td className="px-6 py-5">
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold text-xs",
                    member.status === 'Active' ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                  )}>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      member.status === 'Active' ? "bg-emerald-600" : "bg-orange-600"
                    )}></span>
                    {member.status}
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      className="text-blue-600 font-bold text-xs hover:bg-blue-50 px-3 py-2 rounded transition-colors"
                      onClick={() => onViewProfile?.(member.id)}
                    >
                      View Profile
                    </button>
                    <button 
                      className="text-slate-400 hover:text-orange-600 p-2 transition-colors"
                      onClick={() => onDelete?.(member.id)}
                    >
                      <Archive size={16} />
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
