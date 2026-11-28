import { useEffect, useState, type ReactNode } from 'react';
import { BadgeCheck, Briefcase, CalendarDays, FileText, LockKeyhole, RefreshCw, UserRound, Users } from 'lucide-react';
import { getContracts, type ServerContract } from '../../services/api-contracts';
import { getPools, type ServerPoolListItem } from '../../services/api-pools';
import { getStaffRequests, type StaffRequest } from '../../services/api-staff-requests';
import type { ServerStaff } from '../../services/api-staff';

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && !!item.trim()) : [];
}

function dateLabel(value?: string) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return <div className="min-w-0"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1.5 whitespace-pre-wrap break-words text-sm font-semibold text-slate-800">{value?.trim() || 'Not recorded'}</dd></div>;
}

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <section aria-label={title} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-sm">
    <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4 text-primary">{icon}<h3 className="text-sm font-bold text-slate-900">{title}</h3></div>
    <div className="p-6">{children}</div>
  </section>;
}

export default function StaffSelfProfile({ staff, onRefresh, refreshing }: { staff: ServerStaff; onRefresh: () => void; refreshing: boolean }) {
  const [pools, setPools] = useState<ServerPoolListItem[]>([]);
  const [contracts, setContracts] = useState<ServerContract[]>([]);
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrors([]);
    Promise.allSettled([
      getPools({ orgId: staff.organization_id }),
      getContracts({ orgId: staff.organization_id }),
      getStaffRequests(staff.staff_id),
    ]).then(([poolResult, contractResult, requestResult]) => {
      if (cancelled) return;
      setPools(poolResult.status === 'fulfilled' ? poolResult.value : []);
      setContracts(contractResult.status === 'fulfilled' ? contractResult.value : []);
      setRequests(requestResult.status === 'fulfilled' ? requestResult.value : []);
      setErrors([poolResult, contractResult, requestResult].flatMap((result, index) => result.status === 'rejected'
        ? [`Unable to load ${['pool details', 'contract details', 'upcoming time off'][index]}: ${result.reason instanceof Error ? result.reason.message : 'Request failed'}`] : []));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [staff.id, staff.staff_id, staff.organization_id]);

  const contract = contracts.find(item => item.contract_id === staff.contract_id);
  const memberships = Array.isArray(staff.pool_assignments) ? staff.pool_assignments.flatMap((assignment: unknown) => {
    const data = record(assignment);
    const id = typeof assignment === 'string' ? assignment : typeof data.pool_id === 'string' ? data.pool_id : '';
    const name = typeof data.pool_name === 'string' ? data.pool_name : '';
    return id || name ? [{ id, name, pool: pools.find(pool => pool.pool_id === id) }] : [];
  }) : [];
  const distribution = record(staff.role_distribution);
  const roles = [...new Set([...strings(staff.roles), ...Object.keys(distribution)])];
  const skills = strings(staff.skills);
  const certifications = strings(staff.certifications);
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const upcoming = requests.filter(request => request.staff_id === staff.staff_id && request.status === 'APPROVED' &&
    (request.request_category === 'LEAVE' || request.shift === 'O') && request.end_date >= todayIso)
    .sort((first, second) => first.start_date.localeCompare(second.start_date));
  const initials = staff.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();

  return <div className="min-w-0 space-y-6 pb-12">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="text-3xl font-extrabold text-slate-900">My Profile</h2><p className="mt-2 text-sm text-slate-500">Your saved staff information and pool memberships</p></div>
      <button type="button" onClick={onRefresh} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />Refresh profile</button>
    </header>
    <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800"><LockKeyhole size={15} className="shrink-0" />This profile is view only. Contact your hospital administrator to update your information.</div>
    {errors.map(error => <p role="alert" key={error} className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</p>)}
    {loading && <p role="status" className="text-sm text-slate-500">Loading profile assignments...</p>}

    <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-6">
        <section aria-label="Staff identity" className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-sm">
          <div className="h-20 bg-gradient-to-r from-primary to-blue-500" />
          <div className="px-6 pb-6">
            <div className="-mt-10 mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-blue-100 text-2xl font-extrabold text-blue-700">{staff.profile_picture && !imageFailed ? <img src={staff.profile_picture} alt="" className="h-full w-full object-cover" onError={() => setImageFailed(true)} /> : initials}</div>
            <h3 className="break-words text-xl font-extrabold text-slate-900">{staff.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{staff.designation || 'Designation not recorded'}</p>
            <p className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 font-mono text-xs font-semibold text-blue-700">{staff.staff_id}</p>
            <dl className="mt-6 space-y-4 border-t border-slate-100 pt-5"><Field label="Department" value={staff.department} /><Field label="Primary supervisor" value={staff.supervisor} /><Field label="Profile created" value={dateLabel(staff.created_at)} /><Field label="Last updated" value={dateLabel(staff.updated_at)} /></dl>
          </div>
        </section>
        <Section title="Upcoming Time Off" icon={<CalendarDays size={17} />}>
          <div className="space-y-4">{upcoming.map(request => <div key={request.id} className="border-l-2 border-emerald-500 pl-3"><p className="text-sm font-bold text-slate-800">{request.leave_type_name || (request.request_category === 'LEAVE' ? 'Leave type not recorded' : 'Shift Off')}</p><p className="mt-1 text-xs text-slate-500">{request.start_date} - {request.end_date}</p><span className="mt-1 inline-block text-[10px] font-bold text-emerald-700">Approved</span></div>)}
            {!loading && !upcoming.length && <p className="text-xs text-slate-500">{errors.some(error => error.includes('upcoming time off')) ? 'Time-off information is unavailable.' : 'No approved upcoming time off.'}</p>}
          </div>
        </Section>
      </aside>

      <div className="min-w-0 space-y-6">
        <Section title="Personal & Contact Information" icon={<UserRound size={17} />}>
          <dl className="grid gap-6 sm:grid-cols-2"><Field label="Full name" value={staff.name} /><Field label="Employee ID" value={staff.staff_id} /><Field label="Email address" value={staff.email} /><Field label="Phone number" value={staff.phone} /><Field label="Address" value={staff.address} /></dl>
        </Section>
        <Section title="Employment & Contract" icon={<Briefcase size={17} />}>
          <dl className="grid gap-6 sm:grid-cols-2"><Field label="Designation" value={staff.designation} /><Field label="Department" value={staff.department} /><Field label="Supervisor" value={staff.supervisor} /><Field label="Contract ID" value={staff.contract_id} /><Field label="Contract name" value={contract?.name} /><Field label="Contract type" value={contract?.type} /><Field label="Contract status" value={contract?.status} /></dl>
        </Section>
        <Section title="Skills & Certifications" icon={<BadgeCheck size={17} />}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div><h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Skills</h4><div className="flex flex-wrap gap-2">{skills.map(skill => <span key={skill} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{skill}</span>)}{!skills.length && <p className="text-xs text-slate-500">No skills recorded.</p>}</div></div>
            <div><h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Certifications</h4><ul className="space-y-2">{certifications.map(item => <li key={item} className="flex items-start gap-2 text-xs text-slate-700"><BadgeCheck size={14} className="shrink-0 text-emerald-600" />{item}</li>)}</ul>{!certifications.length && <p className="text-xs text-slate-500">No certifications recorded.</p>}</div>
          </div>
        </Section>
        <Section title="Roles & Resource Distribution" icon={<FileText size={17} />}>
          <div className="space-y-4">{roles.map(role => {
            const fraction = distribution[role];
            const percentage = typeof fraction === 'number' && Number.isFinite(fraction) ? fraction * 100 : null;
            return <div key={role}><div className="mb-2 flex justify-between gap-3 text-xs"><span className="font-bold text-slate-800">{role}</span><span className="shrink-0 text-slate-500">{percentage === null ? 'Allocation not recorded' : `${Math.round(percentage)}%`}</span></div>{percentage !== null && <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} /></div>}</div>;
          })}{!roles.length && <p className="text-xs text-slate-500">No roles or resource distribution recorded.</p>}</div>
        </Section>
        <Section title="My Pools" icon={<Users size={17} />}>
          <div className="grid gap-3 sm:grid-cols-2">{memberships.map((membership, index) => <div key={`${membership.id}-${index}`} className="rounded-xl border border-blue-100 bg-blue-50/40 p-4"><p className="text-sm font-bold text-slate-900">{membership.pool?.pool_name || membership.name || membership.id}</p>{membership.id && <p className="mt-1 font-mono text-[10px] text-blue-700">{membership.id}</p>}<dl className="mt-4 space-y-3"><Field label="Department" value={membership.pool?.department} /><Field label="Location" value={membership.pool?.location} /><Field label="Primary role" value={membership.pool?.primary_role} /></dl></div>)}</div>
          {!memberships.length && <p className="text-xs text-slate-500">No pools assigned.</p>}
        </Section>
      </div>
    </div>
  </div>;
}
