import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  PlusCircle,
  MapPin,
  Users,
  Clock,
  ArrowRight,
  Settings2,
  BarChart3,
  Stethoscope,
  Activity,
  Wind,
  AlertTriangle
} from 'lucide-react';
import { ViewState, type ResourcePool } from '../hr-pool/types';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { getCatalogDepartments, getPools } from '../../lib/api';
import { useAppStore } from '../../context/AppStoreContext';

interface PoolDirectoryProps {
  onNavigate: (view: ViewState) => void;
  onSelectPool: (poolId: string) => void;
}

const DEFAULT_ORG_ID = 1;

function toUiPool(p: any, departmentNameById: Map<number, string>): ResourcePool {
  const meta = (p?.metadata ?? {}) as any;
  const status = meta?.status === 'draft' || meta?.status === 'warning' || meta?.status === 'active' ? meta.status : 'active';
  const deptName =
    typeof p?.department === 'string' && p.department.trim()
      ? p.department
      : typeof p?.department_id === 'number'
        ? (departmentNameById.get(Number(p.department_id)) ?? '')
        : '';
  return {
    id: String(p.pool_id ?? p.poolId ?? ''),
    name: String(p.pool_name ?? p.poolName ?? ''),
    department: String(deptName),
    location: String(p.location ?? ''),
    totalMembers: Number(p.total_members ?? 0),
    weeklyHours: Number(p.weekly_hours ?? 0),
    contractSplit: `${Number(p.static_pct ?? 50)}/${Number(p.dynamic_pct ?? 50)}`,
    primarySkill: String(p.primary_role ?? ''),
    status,
    icon: String(meta?.icon ?? 'Users'),
    color: String(meta?.color ?? 'blue'),
  };
}

export const PoolDirectory: React.FC<PoolDirectoryProps> = ({ onNavigate, onSelectPool }) => {
  const { pushToast, store } = useAppStore();
  const [resourcePools, setResourcePools] = useState<ResourcePool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogDepartments, setCatalogDepartments] = useState<Array<{ id: number; name: string }>>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('All Skill Types');
  const [deptFilter, setDeptFilter] = useState('All Departments');

  const departmentNameById = useMemo(() => {
    const rows = catalogDepartments.length > 0 ? catalogDepartments : (store.settings?.catalogs?.departments ?? []);
    return new Map(rows.map((d) => [Number(d.id), String(d.name)]));
  }, [catalogDepartments, store.settings?.catalogs?.departments]);

  const departmentOptions = useMemo(() => {
    const sourceRows = catalogDepartments.length > 0 ? catalogDepartments : (store.settings?.catalogs?.departments ?? []);
    const fromSettings = sourceRows
      .map((d) => String(d?.name ?? '').trim())
      .filter(Boolean);
    return Array.from(new Set(fromSettings)).sort((a, b) => a.localeCompare(b));
  }, [catalogDepartments, store.settings?.catalogs?.departments]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getCatalogDepartments({ orgId: DEFAULT_ORG_ID });
        if (cancelled) return;
        const mapped = (Array.isArray(rows) ? rows : [])
          .map((r: any) => ({ id: Number(r?.id), name: String(r?.name ?? '').trim() }))
          .filter((r) => Number.isFinite(r.id) && r.name.length > 0);
        setCatalogDepartments(mapped);
      } catch {
        if (!cancelled) setCatalogDepartments([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await getPools({ orgId: DEFAULT_ORG_ID });
        if (cancelled) return;
        setResourcePools(rows.map((p) => toUiPool(p, departmentNameById)));
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? 'Failed to load pools');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [departmentNameById]);

  const filteredPools = useMemo(() => {
    return resourcePools.filter(pool => {
      const matchesSearch = pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSkill = skillFilter === 'All Skill Types' || pool.primarySkill === skillFilter;
      const matchesDept = deptFilter === 'All Departments' || pool.department === deptFilter;
      return matchesSearch && matchesSkill && matchesDept;
    });
  }, [resourcePools, searchTerm, skillFilter, deptFilter]);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Stethoscope': return Stethoscope;
      case 'Activity': return Activity;
      case 'Wind': return Wind;
      default: return Users;
    }
  };

  return (
    <div className="space-y-12">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Pool Directory</h1>
          <p className="text-slate-500 text-lg">Manage specialized clinical resource pools across hospital departments.</p>
        </div>
        <button
          onClick={() => onNavigate('new-pool')}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          Create New Pool
        </button>
      </section>

      <section className="bg-slate-50 p-6 rounded-2xl space-y-6 border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Search Pool</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Pool name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 rounded-xl text-sm transition-all shadow-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Skill Type</label>
            <select 
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 rounded-xl text-sm shadow-sm"
            >
              <option>All Skill Types</option>
              <option>Surgeon</option>
              <option>Nurse</option>
              <option>Anesthetist</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Department</label>
            <select 
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 rounded-xl text-sm shadow-sm"
            >
              <option>All Departments</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full bg-white hover:bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-200">
              <Settings2 className="w-4 h-4" />
              Advanced Filters
            </button>
          </div>
        </div>
      </section>

      <section className={cn(
        "grid gap-8",
        resourcePools.length > 0 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
      )}>
        {loading && (
          <div className="lg:col-span-2 py-10 text-center text-slate-500 font-medium">
            Loading pools…
          </div>
        )}
        {!loading && error && (
          <div className="lg:col-span-2 py-10 text-center text-red-600 font-medium">
            {error}
          </div>
        )}
        {filteredPools.map((pool, index) => {
          const Icon = getIcon(pool.icon);
          return (
            <motion.div
              key={pool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-2xl flex flex-col justify-between group hover:shadow-xl hover:shadow-blue-700/5 transition-all duration-300 border border-slate-200"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      pool.status === 'warning' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {pool.department}
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight">{pool.name}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{pool.location}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-2xl ${
                    pool.status === 'warning' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-6 border-y border-slate-200">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter mb-1">Total Members</p>
                    <p className="text-xl font-extrabold text-blue-700">{pool.totalMembers}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter mb-1">Weekly Hours</p>
                    <p className="text-xl font-extrabold text-blue-700">{pool.weeklyHours}h</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter mb-1">Contract Split</p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-900">{pool.contractSplit}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${pool.status === 'warning' ? 'bg-red-500' : 'bg-teal-700'}`}></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500 font-medium">Primary Skill:</span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">{pool.primarySkill}</span>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectPool(pool.id)}
                  className="text-blue-700 font-bold text-sm hover:underline flex items-center gap-1 group/btn"
                >
                  View Details
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </button>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-slate-100 text-slate-400 hover:text-blue-700 rounded-xl transition-colors">
                    <Settings2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => pushToast('Pool deletion is not available via the current API set.')}
                    className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-500 rounded-xl transition-colors"
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {resourcePools.length > 0 && filteredPools.length === 0 && (
          <div className="lg:col-span-2 py-20 text-center space-y-4">
            <p className="text-slate-400 font-medium">No resource pools found matching your criteria.</p>
          </div>
        )}

        <div 
          onClick={() => onNavigate('new-pool')}
          className={cn(
            "border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 hover:border-blue-700/50 hover:bg-blue-50/30 transition-all cursor-pointer group",
            resourcePools.length === 0 ? "p-20 w-full" : "p-12"
          )}
        >
          <div className="bg-slate-100 p-4 rounded-full group-hover:bg-blue-100/50 transition-colors">
            <PlusCircle className="w-8 h-8 text-slate-400 group-hover:text-blue-700" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xl">Create New Clinical Pool</h4>
            <p className="text-slate-500 text-sm max-w-[320px] mt-2">Define specific skill requirements and department allocation for a new resource team.</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        <div className="md:col-span-2 bg-blue-50 p-8 rounded-2xl flex flex-col justify-center border border-blue-200">
          <div className="flex flex-col sm:flex-row gap-8 items-center">
            <div className="space-y-2 text-center sm:text-left">
              <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest">Global Capacity</h4>
              <p className="text-5xl font-extrabold text-blue-700 tracking-tighter">94.2%</p>
              <p className="text-sm text-slate-600 font-medium">Average utilization across all 8 active pools this week.</p>
            </div>
            <div className="flex-1 h-32 flex items-end gap-1.5 w-full">
              {[60, 80, 70, 95, 85, 50, 75, 90].map((h, i) => (
                <div
                  key={i}
                  className={`w-full rounded-t-lg transition-all duration-500 ${i === 3 ? 'bg-blue-700' : 'bg-blue-200'}`}
                  style={{ height: `${h}%` }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl space-y-6 border border-slate-200 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending Demand</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-bold text-slate-700">ER Overspill</span>
              <span className="text-[10px] px-2 py-1 bg-red-100 text-red-700 rounded-lg font-bold">CRITICAL</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-bold text-slate-700">Night Shift Gap</span>
              <span className="text-[10px] px-2 py-1 bg-amber-100 text-amber-700 rounded-lg font-bold">WARNING</span>
            </div>
            <button className="w-full mt-2 text-blue-700 font-bold text-sm border-t border-slate-200 pt-4 hover:text-blue-800 transition-colors">
              Resolve All Gaps
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
