import { useContext, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ChevronRight, Stethoscope, Edit3, Share2, History, RotateCcw, X, Plus, Plane, StickyNote, Clock, CalendarIcon, ChevronLeft, Archive } from "lucide-react";
import { StaffMember, ScheduleBlock, type EffortRole } from "./types";
import { cn } from "../../lib/utils";
import { AppStoreContext } from "../../context/AppStoreContext";
import { getPools } from "../../lib/api";
import { getEmployeeRostering, type ServerEmployeeRosteringByDate } from "../../lib/rostering/api";

interface ProfileDetailProps {
  member: StaffMember;
  onUpdate: (member: StaffMember) => Promise<void> | void;
  onBack?: () => void;
  onArchive?: (memberId: string) => Promise<void> | void;
  rosteringFocus?: {
    orgId: number;
    employeeId: string;
    dateIso: string;
    shiftKey: string;
    poolId: string;
  } | null;
}

export default function ProfileDetail({ member, onUpdate, onBack, onArchive, rosteringFocus }: ProfileDetailProps) {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error('AppStoreContext not found');
  const { store } = context;

  const [activeTab, setActiveTab] = useState<"timetable" | "calendar" | "employee-calendar">("timetable");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [poolNameById, setPoolNameById] = useState<Record<string, string>>({});
  const [employeeRostering, setEmployeeRostering] = useState<ServerEmployeeRosteringByDate | null>(null);
  const [employeeRosteringLoading, setEmployeeRosteringLoading] = useState(false);
  const [employeeRosteringError, setEmployeeRosteringError] = useState<string | null>(null);
  const [employeeCalendarSelectedDateIso, setEmployeeCalendarSelectedDateIso] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [editDraft, setEditDraft] = useState({
    name: member.name,
    title: member.title,
    email: member.email,
    supervisor: member.supervisor,
    contractId: member.contractId,
    skillsText: member.skills.join(', '),
  });
  const [newBlock, setNewBlock] = useState<Partial<ScheduleBlock>>({
    day: "Monday",
    startTime: "08:00",
    endTime: "12:00",
    role: "Clinical (Direct Patient Care)"
  });

  const startEdit = () => {
    setEditDraft({
      name: member.name,
      title: member.title,
      email: member.email,
      supervisor: member.supervisor,
      contractId: member.contractId,
      skillsText: member.skills.join(', '),
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const saveEdit = async () => {
    const name = editDraft.name.trim();
    const email = editDraft.email.trim();
    if (!name || !email) return;

    const skills = editDraft.skillsText
      .split(/[,\n;]/g)
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSaving(true);
    try {
      await onUpdate({
        ...member,
        name,
        title: editDraft.title.trim() || member.title,
        email,
        supervisor: editDraft.supervisor.trim() || member.supervisor,
        contractId: editDraft.contractId.trim() || member.contractId,
        skills: skills.length > 0 ? skills : member.skills,
        specialization: skills.length > 0 ? skills : member.specialization,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBlock = async () => {
    const block: ScheduleBlock = {
      id: Math.random().toString(36).substr(2, 9),
      day: newBlock.day || "Monday",
      startTime: newBlock.startTime || "08:00",
      endTime: newBlock.endTime || "12:00",
      role: newBlock.role || "Clinical"
    };

    const updatedMember = {
      ...member,
      weeklySchedule: [...member.weeklySchedule, block]
    };

    await onUpdate(updatedMember);
    setIsModalOpen(false);
  };

  const removeBlock = async (blockId: string) => {
    const updatedMember = {
      ...member,
      weeklySchedule: member.weeklySchedule.filter(b => b.id !== blockId)
    };
    await onUpdate(updatedMember);
  };

  useEffect(() => {
    let cancelled = false;
    const orgId = store.settings?.orgGlobalSettings?.organization_id ?? 1;
    (async () => {
      try {
        const rows = await getPools({ orgId });
        if (cancelled) return;
        const map: Record<string, string> = {};
        rows.forEach((r) => {
          const id = String(r.pool_id ?? '').trim();
          const name = String(r.pool_name ?? '').trim();
          if (id && name) map[id] = name;
        });
        setPoolNameById(map);
      } catch {
        if (!cancelled) setPoolNameById({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store.settings?.orgGlobalSettings?.organization_id]);

  useEffect(() => {
    const memberEmployeeId = String(member.employeeId ?? '').replace(/^#/, '');
    const focus = rosteringFocus ?? null;
    const isFocused = Boolean(focus && focus.employeeId && focus.employeeId === memberEmployeeId);
    const shouldLoad = activeTab === "employee-calendar" || isFocused;
    if (!shouldLoad) return;

    const orgId = (focus?.orgId ?? store.settings?.orgGlobalSettings?.organization_id ?? 1) as number;
    const employeeId = memberEmployeeId;
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth() + 1;

    let cancelled = false;
    (async () => {
      setEmployeeRosteringLoading(true);
      setEmployeeRosteringError(null);
      try {
        const data = await getEmployeeRostering({ orgId, employeeId, year, month });
        if (cancelled) return;
        setEmployeeRostering(data);
      } catch (e: any) {
        if (cancelled) return;
        setEmployeeRostering(null);
        setEmployeeRosteringError(String(e?.message ?? 'Failed to load employee rostering'));
      } finally {
        if (!cancelled) setEmployeeRosteringLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, calendarMonth, member.employeeId, rosteringFocus, store.settings?.orgGlobalSettings?.organization_id]);

  useEffect(() => {
    const focus = rosteringFocus ?? null;
    const memberEmployeeId = String(member.employeeId ?? '').replace(/^#/, '');
    if (!focus || !focus.employeeId || focus.employeeId !== memberEmployeeId) return;
    const parts = String(focus.dateIso ?? '').split('-').map((x) => Number(x));
    if (parts.length === 3 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      setCalendarMonth(new Date(parts[0], parts[1] - 1, 1));
    }
    setEmployeeCalendarSelectedDateIso(String(focus.dateIso ?? '') || null);
    setActiveTab("employee-calendar");
  }, [member.employeeId, rosteringFocus]);

  const contractLabel = useMemo(() => {
    const c = (store.contracts || []).find((x) => x.contractId === member.contractId);
    if (!c) return member.contractId;
    return `${c.contractId} — ${c.name}`;
  }, [member.contractId, store.contracts]);

  const poolLabels = useMemo(() => {
    const ids = Array.isArray(member.pools) ? member.pools : [];
    return ids.map((id) => poolNameById[id] || id);
  }, [member.pools, poolNameById]);

  const employeeAssignmentByDate = useMemo(() => {
    return employeeRostering ?? {};
  }, [employeeRostering]);

  const shiftTimeByKey = useMemo(() => {
    const m = new Map<string, string>();
    const rows = (store.settings?.catalogs as any)?.shifts ?? [];
    for (const s of Array.isArray(rows) ? rows : []) {
      const name = String(s?.name ?? '').trim();
      const start = String(s?.start_time ?? '').trim();
      const end = String(s?.end_time ?? '').trim();
      const label = start && end ? `${start} - ${end}` : '';
      if (!label) continue;
      if (name) {
        m.set(name, label);
        m.set(name.toLowerCase(), label);
        const alias = name.slice(0, 1).toUpperCase();
        if (alias) m.set(alias, label);
      }
    }
    return m;
  }, [store.settings?.catalogs]);

  const shiftMetaByKey = useMemo(() => {
    const m = new Map<string, { code: string; name: string; time: string }>();
    const rows = (store.settings?.catalogs as any)?.shifts ?? [];
    for (const s of Array.isArray(rows) ? rows : []) {
      const name = String(s?.name ?? '').trim();
      const code = name.slice(0, 1).toUpperCase();
      const start = String(s?.start_time ?? '').trim();
      const end = String(s?.end_time ?? '').trim();
      const time = start && end ? `${start} - ${end}` : '';
      if (!code || !name) continue;
      const meta = { code, name, time };
      m.set(code, meta);
      m.set(name, meta);
      m.set(name.toLowerCase(), meta);
    }
    return m;
  }, [store.settings?.catalogs]);

  const shiftTimeLabel = (shift: string) => {
    const raw = String(shift ?? '').trim();
    if (!raw) return '';
    return (
      shiftTimeByKey.get(raw) ??
      shiftTimeByKey.get(raw.toLowerCase()) ??
      shiftTimeByKey.get(raw.slice(0, 1).toUpperCase()) ??
      ''
    );
  };

  const shiftVisual = (shift: string) => {
    const raw = String(shift ?? '').trim();
    const code = raw ? raw.slice(0, 1).toUpperCase() : '';
    if (!raw || raw === 'O' || raw.toLowerCase() === 'off') {
      return {
        code: 'O',
        label: 'Off',
        time: '',
        badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
      };
    }

    const meta = shiftMetaByKey.get(raw) ?? shiftMetaByKey.get(raw.toLowerCase()) ?? shiftMetaByKey.get(code);
    const name = meta?.name ?? raw;
    const time = meta?.time ?? shiftTimeLabel(raw);
    const s = name.toLowerCase();

    const badgeClass = s.includes('night')
      ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
      : s.includes('late') || s.includes('afternoon') || s.includes('evening')
        ? 'bg-orange-50 text-orange-800 border border-orange-200'
        : s.includes('early') || s.includes('morning')
          ? 'bg-amber-50 text-amber-800 border border-amber-200'
          : s.includes('day')
            ? 'bg-blue-50 text-blue-800 border border-blue-200'
            : 'bg-slate-50 text-slate-800 border border-slate-200';

    return {
      code: meta?.code ?? code,
      label: name,
      time,
      badgeClass,
    };
  };

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const isoForCalendarDay = (day: number) => {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth() + 1;
    return `${y}-${pad2(m)}-${pad2(day)}`;
  };

  const staffTypeTags = useMemo(() => {
    const raw = Array.isArray(member.specialization) ? member.specialization : [];
    const trimmed = raw.map((x) => String(x ?? '').trim()).filter(Boolean);
    return Array.from(new Set(trimmed));
  }, [member.specialization]);

  const keySkills = useMemo(() => {
    const raw = Array.isArray(member.skills) ? member.skills : [];
    const trimmed = raw.map((x) => String(x ?? '').trim()).filter(Boolean);
    const unique = Array.from(new Set(trimmed));
    if (staffTypeTags.length === 0) return unique;
    const staffTypeSet = new Set(staffTypeTags.map((x) => x.toLowerCase()));
    return unique.filter((s) => !staffTypeSet.has(s.toLowerCase()));
  }, [member.skills, staffTypeTags]);

  const primaryTags = useMemo(() => {
    if (staffTypeTags.length > 0) return staffTypeTags;
    return keySkills;
  }, [keySkills, staffTypeTags]);

  const primaryTagLabel = useMemo(() => {
    if (staffTypeTags.length > 0) return 'Staff Type';
    if (keySkills.length > 0) return 'Key Skills';
    return '';
  }, [keySkills.length, staffTypeTags.length]);

  const totalEffort = useMemo(() => {
    const roles = Array.isArray(member.effortRoles) ? member.effortRoles : [];
    return roles.reduce((acc, r) => acc + (Number(r.percentage) || 0), 0);
  }, [member.effortRoles]);

  const calendarMonthLabel = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(calendarMonth);
  }, [calendarMonth]);

  const calendarStartOffset = useMemo(() => {
    const dow = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
    return (dow + 6) % 7;
  }, [calendarMonth]);

  const calendarDaysInMonth = useMemo(() => {
    return new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  }, [calendarMonth]);

  const shiftCalendarMonth = (delta: number) => {
    setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 pb-12"
    >
      {/* Profile Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="flex items-start gap-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/10 border-4 border-white bg-blue-100 flex items-center justify-center text-blue-700 text-3xl font-bold">
              {member.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md border-2 border-white">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              {member.status.toUpperCase()}
            </div>
          </div>

          <div className="pt-2">
            <nav className="flex items-center gap-2 text-slate-400 text-xs mb-3">
              <span className="hover:text-blue-600 cursor-pointer" onClick={onBack}>Individuals</span>
              <ChevronRight size={10} />
              <span className="text-blue-700 font-semibold">{member.name}</span>
            </nav>
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Full Name</label>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={editDraft.name}
                      onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Email</label>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={editDraft.email}
                      onChange={(e) => setEditDraft((d) => ({ ...d, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Title</label>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={editDraft.title}
                      onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Supervisor</label>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={editDraft.supervisor}
                      onChange={(e) => setEditDraft((d) => ({ ...d, supervisor: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Contract ID</label>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={editDraft.contractId}
                      onChange={(e) => setEditDraft((d) => ({ ...d, contractId: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Skills (comma separated)</label>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={editDraft.skillsText}
                      onChange={(e) => setEditDraft((d) => ({ ...d, skillsText: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    disabled={isSaving}
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-5 py-2.5 rounded-xl font-bold bg-blue-700 text-white hover:bg-blue-800 transition-colors disabled:opacity-60"
                    disabled={isSaving || !editDraft.name.trim() || !editDraft.email.trim()}
                    onClick={saveEdit}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1">{member.name}</h2>
                <p className="text-slate-500 font-medium flex items-center gap-2">
                  <Stethoscope size={16} className="text-blue-600" />
                  {member.title}
                </p>
              </>
            )}
            
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="bg-slate-100 px-3 py-2 rounded-xl border border-slate-200/50">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Employee ID</p>
                <p className="text-sm font-semibold text-slate-900">{member.employeeId}</p>
              </div>
              <div className="bg-slate-100 px-3 py-2 rounded-xl border border-slate-200/50">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Contact</p>
                <p className="text-sm font-semibold text-slate-900">{member.email}</p>
              </div>
            </div>

            {primaryTags.length > 0 ? (
              <div className="mt-4 flex items-center gap-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold shrink-0">{primaryTagLabel}:</p>
                <div className="flex flex-wrap gap-1.5">
                  {primaryTags.map((t) => (
                    <span key={t} className="bg-blue-50 text-blue-700 text-[9px] font-bold rounded-md border border-blue-100 px-2 py-1">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            className="px-6 py-8 bg-slate-100 text-slate-900 font-bold rounded-xl hover:bg-slate-200 border-none flex flex-col items-center gap-1 h-auto transition-colors disabled:opacity-60"
            disabled={isSaving}
            onClick={() => (isEditing ? cancelEdit() : startEdit())}
          >
            <Edit3 size={20} />
            <span className="text-[10px] leading-tight text-center">{isEditing ? 'Close\nEdit' : 'Edit\nProfile'}</span>
          </button>
          <button className="px-6 py-8 bg-gradient-to-b from-blue-600 to-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 flex flex-col items-center gap-1 h-auto transition-colors">
            <Share2 size={20} />
            <span className="text-[10px] leading-tight text-center">Export<br/>Data</span>
          </button>
          <button
            className="px-6 py-8 bg-orange-50 text-orange-700 font-bold rounded-xl border border-orange-200 flex flex-col items-center gap-1 h-auto transition-colors hover:bg-orange-100"
            onClick={() => onArchive?.(member.id)}
          >
            <Archive size={20} />
            <span className="text-[10px] leading-tight text-center">Delete<br/>Profile</span>
          </button>
        </div>
      </section>

      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-4">Profile Details</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Department</p>
                <p className="text-sm font-bold text-slate-900">{String(member.department ?? '').trim() || '—'}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Supervisor</p>
                <p className="text-sm font-bold text-slate-900">{String(member.supervisor ?? '').trim() || '—'}</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Contract</p>
              <p className="text-sm font-bold text-slate-900">{contractLabel || '—'}</p>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-4">Resource Distribution</h4>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
            {(member.effortRoles || []).map((r: EffortRole) => (
              <div
                key={r.id}
                className={cn(
                  "h-full",
                  r.type === 'CLINICAL' ? "bg-emerald-600" : r.type === 'RESEARCH' ? "bg-blue-600" : "bg-slate-500"
                )}
                style={{ width: `${Math.max(0, Math.min(100, Number(r.percentage) || 0))}%` }}
              />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {(member.effortRoles || []).map((r: EffortRole) => (
              <div key={r.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{r.description || r.type}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{r.type}</p>
                </div>
                <p className="text-xs font-extrabold text-slate-700 tabular-nums">{Math.round(Number(r.percentage) || 0)}%</p>
              </div>
            ))}
            {(member.effortRoles || []).length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">—</p>
            ) : null}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</p>
            <p className={cn("text-xs font-extrabold tabular-nums", totalEffort === 100 ? "text-emerald-700" : "text-rose-700")}>
              {Math.round(totalEffort)}%
            </p>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-4">Pools</h4>
          <div className="flex flex-wrap gap-2">
            {poolLabels.length > 0 ? (
              poolLabels.map((p, idx) => (
                <span
                  key={`${member.id}-pool-${idx}`}
                  className="bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-100 px-3 py-1"
                >
                  {p}
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-400 font-medium">No pools assigned.</p>
            )}
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <div className="w-full">
        <div className="bg-slate-100 p-1.5 rounded-2xl h-auto w-full max-w-2xl mb-8 flex">
          <button 
            onClick={() => setActiveTab("timetable")}
            className={cn(
              "flex-1 py-3 rounded-xl font-bold text-sm gap-2 flex items-center justify-center transition-colors",
              activeTab === "timetable" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Clock size={18} />
            Weekly Timetable
          </button>
          <button 
            onClick={() => setActiveTab("calendar")}
            className={cn(
              "flex-1 py-3 rounded-xl font-bold text-sm gap-2 flex items-center justify-center transition-colors",
              activeTab === "calendar" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <CalendarIcon size={18} />
            Availability Calendar
          </button>
          <button 
            onClick={() => setActiveTab("employee-calendar")}
            className={cn(
              "flex-1 py-3 rounded-xl font-bold text-sm gap-2 flex items-center justify-center transition-colors",
              activeTab === "employee-calendar" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <CalendarIcon size={18} />
            Employee Calendar
          </button>
        </div>

        {activeTab === "timetable" && (
          <div className="grid grid-cols-12 gap-8 outline-none">
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Standard Weekly Template</h3>
                    <p className="text-sm text-slate-500">Define recurring working blocks for the standard rotation.</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                      <History size={20} />
                    </button>
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                      <RotateCcw size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {days.map(day => {
                    const blocks = member.weeklySchedule.filter(b => b.day === day);
                    const isWeekend = day === "Saturday" || day === "Sunday";

                    return (
                      <div key={day} className={cn("flex items-center gap-4 group", isWeekend && "opacity-50")}>
                        <div className="w-24 shrink-0 font-bold text-slate-400 uppercase tracking-widest text-[11px]">
                          {day}
                        </div>
                        <div className={cn(
                          "flex-1 h-14 rounded-2xl relative flex items-center px-4 overflow-hidden",
                          isWeekend ? "bg-slate-50 border border-dashed border-slate-200" : "bg-slate-50"
                        )}>
                          {blocks.length > 0 ? (
                            blocks.map((block) => (
                              <div 
                                key={block.id}
                                className="h-10 bg-blue-50 border-l-4 border-blue-600 rounded-lg flex items-center px-3 justify-between group/block cursor-pointer hover:bg-blue-100 transition-all"
                                style={{ width: '60%' }}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-blue-700">{block.startTime} - {block.endTime}</span>
                                  <span className="text-[10px] font-medium text-blue-600/70">{block.role}</span>
                                </div>
                                <button 
                                  onClick={() => removeBlock(block.id)}
                                  className="opacity-0 group-hover/block:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="w-full flex justify-center">
                              <span className="text-[10px] font-bold tracking-widest text-slate-300">
                                {isWeekend ? "OFF DUTY" : "NO BLOCKS DEFINED"}
                              </span>
                            </div>
                          )}
                          {!isWeekend && (
                            <button 
                              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-600 p-2"
                              onClick={() => {
                                setNewBlock(prev => ({ ...prev, day }));
                                setIsModalOpen(true);
                              }}
                            >
                              <Plus size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-blue-600 rounded-sm"></span>
                      <span className="text-xs font-semibold text-slate-600">Core Shift</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-emerald-600 rounded-sm"></span>
                      <span className="text-xs font-semibold text-slate-600">Clinic</span>
                    </div>
                  </div>
                  <button className="text-blue-700 font-bold text-sm hover:bg-blue-50 px-3 py-2 rounded transition-colors">
                    Save Template Changes
                  </button>
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900">{calendarMonthLabel}</h3>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => shiftCalendarMonth(-1)}
                      className="p-2 text-slate-400 hover:text-slate-600"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => shiftCalendarMonth(1)}
                      className="p-2 text-slate-400 hover:text-slate-600"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center mb-4">
                  {["M", "T", "W", "T", "F", "S", "S"].map(d => (
                    <div key={d} className="text-[10px] font-bold text-slate-400">{d}</div>
                  ))}
                  {Array.from({ length: calendarStartOffset }).map((_, i) => (
                    <div key={`pad-${i}`} className="aspect-square" />
                  ))}
                  {Array.from({ length: calendarDaysInMonth }).map((_, i) => {
                    const today = new Date();
                    const day = i + 1;
                    const isToday =
                      today.getFullYear() === calendarMonth.getFullYear() &&
                      today.getMonth() === calendarMonth.getMonth() &&
                      today.getDate() === day;
                    return (
                      <div
                        key={day}
                        className={cn(
                          "aspect-square flex items-center justify-center text-xs font-semibold rounded-lg",
                          isToday ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-3 mt-8 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-xs font-medium text-slate-600">On-Duty</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">18 Days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                      <span className="text-xs font-medium text-slate-600">Vacation</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">12 Days</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-4">Upcoming Time Off</h4>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <Plane size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Annual Leave</p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-tight">Dec 12 - Dec 24, 2024</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-900">Availability Notes</h4>
                  <StickyNote size={16} className="text-slate-300" />
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] leading-relaxed text-slate-600 italic">
                    "Preferring early morning slots for Main Surgery. Unavailable for emergency overnight rotations during December."
                  </p>
                </div>
                <button className="w-full mt-3 border border-dashed border-slate-200 text-[10px] font-bold text-slate-400 hover:text-blue-600 hover:border-blue-600 py-2 rounded transition-colors">
                  + ADD NOTE
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="text-center py-12">
              <CalendarIcon size={48} className="text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Availability Calendar</h3>
              <p className="text-slate-500">Calendar view coming soon with detailed availability and time-off tracking.</p>
            </div>
          </div>
        )}

        {activeTab === "employee-calendar" && (
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Employee Calendar</h3>
                <p className="text-sm text-slate-500">Monthly assignments from rostering results.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => shiftCalendarMonth(-1)}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900">
                  {calendarMonthLabel}
                </div>
                <button
                  type="button"
                  onClick={() => shiftCalendarMonth(1)}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {employeeRosteringLoading ? (
              <div className="py-10 text-center text-slate-500 font-medium">Loading employee rostering…</div>
            ) : employeeRosteringError ? (
              <div className="py-10 text-center text-rose-700 font-semibold">{employeeRosteringError}</div>
            ) : (
              <div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(() => {
                    const items = new Map<string, ReturnType<typeof shiftVisual>>();
                    for (const v of Object.values(employeeAssignmentByDate as any)) {
                      const shift = String((v as any)?.shift ?? '').trim();
                      if (!shift) continue;
                      const visual = shiftVisual(shift);
                      const key = visual.code || visual.label;
                      if (!items.has(key)) items.set(key, visual);
                    }
                    if (items.size === 0) items.set('O', shiftVisual('O'));
                    return Array.from(items.values()).sort((a, b) => a.label.localeCompare(b.label));
                  })().map((v) => (
                    <div key={`${v.code}-${v.label}`} className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl", v.badgeClass)}>
                      <span className="text-[10px] font-black uppercase tracking-widest">{v.code}</span>
                      <span className="text-xs font-extrabold">{v.label}</span>
                      <span className="text-xs font-semibold opacity-70">{v.time || ''}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2 text-center mb-4">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: calendarStartOffset }).map((_, i) => (
                    <div key={`pad-${i}`} className="aspect-square" />
                  ))}
                  {Array.from({ length: calendarDaysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const iso = isoForCalendarDay(day);
                    const today = new Date();
                    const isToday =
                      today.getFullYear() === calendarMonth.getFullYear() &&
                      today.getMonth() === calendarMonth.getMonth() &&
                      today.getDate() === day;
                    const focusIso = employeeCalendarSelectedDateIso || (rosteringFocus?.dateIso ?? null);
                    const isFocus = Boolean(focusIso && iso === focusIso);
                    const assignment = (employeeAssignmentByDate as any)[iso] as any;
                    const shift = String(assignment?.shift ?? '').trim();
                    const pool = String(assignment?.pool ?? '').trim();
                    const visual = shiftVisual(shift);
                    const hasAssignment = Boolean(shift || pool);
                    return (
                      <button
                        type="button"
                        key={iso}
                        onClick={() => setEmployeeCalendarSelectedDateIso(iso)}
                        className={cn(
                          "aspect-[5/4] rounded-xl border text-left p-2 flex flex-col justify-between transition-colors",
                          isFocus ? "border-blue-600 bg-blue-50/40" : "border-slate-200 hover:bg-slate-50",
                          isToday ? "ring-2 ring-blue-600/20" : ""
                        )}
                      >
                        <div className={cn("text-sm font-extrabold", isFocus ? "text-blue-700" : "text-slate-900")}>
                          {day}
                        </div>
                        {hasAssignment ? (
                          <div className="mt-1 space-y-1">
                            <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-lg w-fit", visual.badgeClass)}>
                              <span className="text-[10px] font-black uppercase tracking-widest">{visual.code}</span>
                              <span className="text-[11px] font-extrabold">{visual.label}</span>
                            </div>
                            <div className="text-xs font-bold text-slate-600 truncate">{pool || "—"}</div>
                            <div className="text-[11px] font-semibold text-slate-400 truncate">{visual.time || "—"}</div>
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-slate-300 uppercase tracking-widest">—</div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected Day</div>
                  <div className="mt-2 flex items-center justify-between gap-4">
                    <div className="text-sm font-bold text-slate-900">
                      {employeeCalendarSelectedDateIso ?? (rosteringFocus?.dateIso ?? "—")}
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const iso = employeeCalendarSelectedDateIso ?? (rosteringFocus?.dateIso ?? "");
                        const a = iso ? ((employeeAssignmentByDate as any)[iso] as any) : null;
                        const shift = String(a?.shift ?? "").trim();
                        const pool = String(a?.pool ?? "").trim();
                        const visual = shiftVisual(shift);
                        if (!shift && !pool) return <span className="text-xs font-semibold text-slate-400">No assignment</span>;
                        return (
                          <>
                            <span className="text-xs font-extrabold text-slate-800">
                              Shift: {visual.label} ({visual.code})
                            </span>
                            <span className="text-xs font-semibold text-slate-500">•</span>
                            <span className="text-xs font-extrabold text-slate-800">Pool: {pool || "—"}</span>
                            <span className="text-xs font-semibold text-slate-500">•</span>
                            <span className="text-xs font-extrabold text-slate-800">Time: {visual.time || "—"}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule Block Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
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
    </motion.div>
  );
}
