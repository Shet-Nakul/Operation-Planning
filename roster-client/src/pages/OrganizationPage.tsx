import { useEffect, useState, type FormEvent } from 'react';
import { Building2, Briefcase, FileText, Pencil, RefreshCw, Save, UserCheck, Users, X } from 'lucide-react';
import { getOrganizationById, getOrganizationStats, updateOrganizationById, type OrganizationStats, type ServerOrganization } from '../services/api-organizations';
import { useAppStore } from '../context/AppStoreContext';
import { organizationUpdate, type OrganizationDetails } from '../lib/organizationForm';

const input = 'w-full bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary px-4 py-3 rounded-t-xl outline-none text-sm';
const metrics: { key: keyof OrganizationStats; label: string; icon: typeof Users }[] = [
  { key: 'staff', label: 'Total staff', icon: Users },
  { key: 'departments', label: 'Departments', icon: Building2 },
  { key: 'contracts', label: 'Staff contracts', icon: FileText },
  { key: 'humanPools', label: 'Staff pools', icon: Briefcase },
  { key: 'users', label: 'User accounts', icon: Users },
  { key: 'activeUsers', label: 'Active user accounts', icon: UserCheck },
];

export default function OrganizationPage({ onSaved }: { onSaved: (name: string) => void }) {
  const { activeOrgId, pushToast } = useAppStore();
  const [organization, setOrganization] = useState<ServerOrganization | null>(null);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [draft, setDraft] = useState<OrganizationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statsError, setStatsError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(''); setStatsError(''); setOrganization(null); setStats(null);
    Promise.allSettled([getOrganizationById(activeOrgId), getOrganizationStats(activeOrgId)]).then(([details, totals]) => {
      if (cancelled) return;
      if (details.status === 'fulfilled') setOrganization(details.value);
      else setError(details.reason instanceof Error ? details.reason.message : 'Unable to load organization');
      if (totals.status === 'fulfilled') setStats(totals.value);
      else setStatsError(totals.reason instanceof Error ? totals.reason.message : 'Unable to load organization statistics');
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [activeOrgId, refresh]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft || !organization || saving) return;
    setSaving(true); setError('');
    try {
      const saved = await updateOrganizationById(activeOrgId, organizationUpdate(draft, organization.contact_email));
      setOrganization(saved); setDraft(null); onSaved(saved.name); pushToast('Organization updated.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update organization'); }
    finally { setSaving(false); }
  };

  return <div className="max-w-6xl mx-auto space-y-8 py-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-wider text-primary">Administration</p><h1 className="mt-2 text-3xl font-extrabold">Organization Details</h1></div>
      <button type="button" disabled={loading || saving} onClick={() => { setDraft(null); setRefresh(value => value + 1); }} className="inline-flex h-10 items-center gap-2 px-4 rounded-lg border border-slate-200 bg-white text-sm font-semibold disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Refresh</button>
    </header>
    {error && <p role="alert" className="rounded-lg bg-red-50 border border-red-100 text-red-700 p-4 text-sm">{error}</p>}
    {statsError && <p role="alert" className="rounded-lg bg-red-50 border border-red-100 text-red-700 p-4 text-sm">Unable to load statistics: {statsError}</p>}
    {loading && <p role="status" className="text-sm text-slate-500">Loading organization details...</p>}
    {organization && <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1"><div className="bg-slate-50 p-3 rounded-xl shrink-0"><Building2 size={24} className="text-blue-700" /></div><div className="min-w-0"><h2 className="text-xl font-bold break-words">{organization.name}</h2><p className="text-xs text-slate-500 mt-1">Organization #{organization.id}</p></div></div>
        <span className="px-2 py-1 rounded bg-teal-50 text-teal-700 text-xs font-bold">{organization.status}</span>
        {!draft && <button type="button" onClick={() => setDraft({ name: organization.name, location: organization.location ?? '', contact_number: organization.contact_number ?? '', contact_email: organization.contact_email ?? '' })} className="inline-flex h-10 items-center gap-2 px-4 rounded-lg border border-slate-200 text-sm font-semibold"><Pencil size={16} />Edit details</button>}
      </div>
      {draft ? <form onSubmit={save} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {([['name', 'Organization name'], ['location', 'Location'], ['contact_email', 'Contact email'], ['contact_number', 'Contact number']] as const).map(([field, label]) => <label key={field} className="block space-y-1.5"><span className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">{label}</span><input required={field === 'name'} type={field === 'contact_email' ? 'email' : 'text'} value={draft[field]} onChange={event => setDraft({ ...draft, [field]: event.target.value })} className={input} /></label>)}
        </div>
        <div className="flex gap-2"><button type="submit" disabled={saving || !draft.name.trim()} className="inline-flex h-10 items-center gap-2 px-4 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-50"><Save size={16} />{saving ? 'Saving...' : 'Save'}</button><button type="button" disabled={saving} onClick={() => { setDraft(null); setError(''); }} className="inline-flex h-10 items-center gap-2 px-4 rounded-lg border border-slate-200 text-sm font-semibold"><X size={16} />Cancel</button></div>
      </form> : <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[{ label: 'Location', value: organization.location }, { label: 'Contact email', value: organization.contact_email }, { label: 'Contact number', value: organization.contact_number }, { label: 'Registered', value: organization.created_at ? new Date(organization.created_at).toLocaleDateString() : '' }].map(detail => <div key={detail.label} className="min-w-0"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{detail.label}</dt><dd className="mt-2 text-sm font-medium break-words">{detail.value || 'Not set'}</dd></div>)}
      </dl>}
    </section>}
    {stats && <section><h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">People & Organization</h2><dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{metrics.map(metric => <div key={metric.key} className="min-w-0 min-h-44 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col"><div className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-xl mb-5"><metric.icon size={24} className="text-blue-700" /></div><dt className="font-bold text-base text-slate-900 mb-2">{metric.label}</dt><dd className="mt-auto text-3xl font-black text-slate-900">{stats[metric.key].toLocaleString()}</dd></div>)}</dl></section>}
  </div>;
}
