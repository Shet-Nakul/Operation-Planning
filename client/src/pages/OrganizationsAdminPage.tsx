import { useContext, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Building2, Pencil, RefreshCw, Save, X, Users, Briefcase, Package, Boxes, Pill, AlertTriangle, FileText, UserCheck, Layers, Activity, Stethoscope } from 'lucide-react';
import { AppStoreContext } from '../context/AppStoreContext';
import { getOrganizationById, getOrganizationStats, readAuthSession, updateOrganizationById, type OrganizationStats, type ServerOrganization } from '../lib/api';

type Draft = { name: string; location: string; contact_number: string; contact_email: string };
const inputClass = 'w-full bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary focus:ring-0 text-slate-900 font-medium px-4 py-3 rounded-t-xl outline-none text-sm';
const metricIcons: Record<keyof OrganizationStats, typeof Users> = {
  staff: Users, departments: Building2, contracts: FileText, humanPools: Briefcase,
  users: Users, activeUsers: UserCheck, assetPools: Package, capacity: Layers,
  units: Boxes, availableUnits: Package, inventoryItems: Pill, inventoryAlerts: AlertTriangle,
  surgeries: Activity, operationTypes: Stethoscope,
};
const metricGroups: { title: string; metrics: { key: keyof OrganizationStats; label: string }[] }[] = [
  { title: 'People & Organization', metrics: [
    { key: 'staff', label: 'Total staff' }, { key: 'departments', label: 'Departments' },
    { key: 'contracts', label: 'Staff contracts' }, { key: 'humanPools', label: 'Human resource pools' },
    { key: 'users', label: 'User accounts' }, { key: 'activeUsers', label: 'Active user accounts' },
  ] },
  { title: 'Equipment & Inventory', metrics: [
    { key: 'assetPools', label: 'Equipment & asset pools' }, { key: 'capacity', label: 'Total pool capacity' },
    { key: 'units', label: 'Resource units' }, { key: 'availableUnits', label: 'Available resource units' },
    { key: 'inventoryItems', label: 'Inventory items' }, { key: 'inventoryAlerts', label: 'Shortage / out-of-stock items' },
  ] },
  { title: 'Operations', metrics: [
    { key: 'surgeries', label: 'Surgery records' }, { key: 'operationTypes', label: 'Operation types' },
  ] },
];

export default function OrganizationsAdminPage() {
  const app = useContext(AppStoreContext);
  const organizationId = readAuthSession().user?.organization_id;
  const [organization, setOrganization] = useState<ServerOrganization | null>(null);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setOrganization(null); setStats(null); setError(null); setLoading(true);
    if (!organizationId) {
      setError('No organization is assigned to this account.'); setLoading(false);
      return;
    }
    Promise.all([getOrganizationById(organizationId), getOrganizationStats(organizationId)])
      .then(([details, totals]) => {
        if (!cancelled) { setOrganization(details); setStats(totals); }
      })
      .catch((failure: Error) => { if (!cancelled) setError(failure.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [organizationId, refreshTick]);

  const save = async () => {
    if (!draft || !organizationId || saving) return;
    setSaving(true); setError(null);
    try {
      const updated = await updateOrganizationById(organizationId, {
        name: draft.name.trim(), location: draft.location.trim(),
        contact_number: draft.contact_number.trim(), contact_email: draft.contact_email.trim() || undefined,
      });
      setOrganization(updated); setDraft(null);
      app?.setActiveOrgName(updated.name); app?.pushToast('Organization updated.');
    } catch (failure: any) { setError(failure.message ?? 'Unable to update organization'); }
    finally { setSaving(false); }
  };

  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-8 py-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-wider text-primary">Administration</p><h1 className="mt-2 text-3xl font-extrabold font-headline">Organization Details</h1></div>
      <button type="button" disabled={loading || saving} onClick={() => setRefreshTick((current) => current + 1)} title="Refresh organization statistics" className="inline-flex h-10 items-center gap-2 px-4 rounded-lg border border-slate-200 bg-white text-sm font-semibold disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Refresh</button>
    </header>
    {error && <p role="alert" className="rounded-lg bg-error/5 border border-error/20 text-error p-4 text-sm">{error}</p>}
    {loading && <p role="status" className="text-sm text-slate-500">Loading organization details and statistics...</p>}
    {organization && <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0"><div className="bg-slate-50 p-3 rounded-xl shrink-0"><Building2 size={24} className="text-blue-700" /></div><div className="min-w-0"><h2 className="text-xl font-bold break-words">{organization.name}</h2><p className="text-xs text-slate-500 mt-1">Organization #{organization.id}</p></div></div>
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${organization.status === 'ACTIVE' ? 'bg-teal-100/80 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>{organization.status}</span>
        {!draft && <button type="button" onClick={() => setDraft({ name: organization.name, location: organization.location ?? '', contact_number: organization.contact_number ?? '', contact_email: organization.contact_email ?? '' })} className="inline-flex h-10 items-center gap-2 px-4 rounded-lg border border-slate-200 bg-white text-sm font-semibold"><Pencil size={16} />Edit details</button>}
      </div>
      {draft ? <form onSubmit={(event) => { event.preventDefault(); void save(); }} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{(['name', 'location', 'contact_email', 'contact_number'] as const).map((key) => <label key={key} className="block space-y-1.5"><span className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">{{ name: 'Organization name', location: 'Location', contact_email: 'Contact email', contact_number: 'Contact number' }[key]}</span><input className={inputClass} type={key === 'contact_email' ? 'email' : 'text'} required={key === 'name'} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></label>)}</div>
        <div className="flex gap-2"><button type="submit" disabled={saving || !draft.name.trim()} className="inline-flex h-10 items-center gap-2 px-4 rounded-lg bg-primary text-on-primary text-sm font-bold disabled:opacity-50"><Save size={16} />{saving ? 'Saving...' : 'Save'}</button><button type="button" disabled={saving} onClick={() => setDraft(null)} className="inline-flex h-10 items-center gap-2 px-4 rounded-lg border border-slate-200 text-sm font-semibold"><X size={16} />Cancel</button></div>
      </form> : <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{[
        { label: 'Location', value: organization.location }, { label: 'Contact email', value: organization.contact_email },
        { label: 'Contact number', value: organization.contact_number }, { label: 'Registered', value: new Date(organization.created_at).toLocaleDateString() },
      ].map((detail) => <div key={detail.label} className="min-w-0"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{detail.label}</dt><dd className="mt-2 text-sm font-medium break-words">{detail.value || 'Not set'}</dd></div>)}</dl>}
    </section>}
    {stats && <div className="space-y-8">{metricGroups.map((group) => <section key={group.title}>
      <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">{group.title}</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{group.metrics.map((metric) => {
        const Icon = metricIcons[metric.key];
        return <div key={metric.key} className="min-w-0 min-h-48 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-xl mb-6"><Icon size={24} className={metric.key === 'inventoryAlerts' ? 'text-amber-600' : 'text-blue-700'} /></div>
          <dt className="font-bold text-base text-slate-900 mb-2 break-words">{metric.label}</dt>
          <dd className="mt-auto text-3xl font-black text-slate-900 tabular-nums break-all">{stats[metric.key].toLocaleString()}</dd>
        </div>;
      })}</dl>
    </section>)}</div>}
  </motion.div>;
}