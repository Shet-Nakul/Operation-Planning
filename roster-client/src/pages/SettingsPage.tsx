import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { CalendarDays, Pencil, Plus, RotateCcw, Save, Settings, ShieldAlert, Trash2, X } from 'lucide-react';
import { useAppStore } from '../context/AppStoreContext';
import { apiFetch, createForbiddenPatternRecord, getForbiddenPatternRecords, getOrgGlobalSettings, updateForbiddenPatternRecord, upsertOrgGlobalSettings, type ServerForbiddenPatternRecord } from '../lib/api';
import { DEFAULT_FORBIDDEN_PATTERNS } from '../types/settings';
import { toSolverForbiddenPatterns } from '../lib/forbiddenPatterns';

type Catalog = 'shift' | 'leave_types' | 'departments' | 'skills' | 'specializations' | 'roles';
type CatalogRow = { id: number; name: string; alias?: string; start_time?: string; end_time?: string; description?: string | null; status?: string | null };
const catalogs: { value: Catalog; label: string; description: string }[] = [
  { value: 'roles', label: 'Roles', description: 'Role labels used across staff rostering.' },
  { value: 'specializations', label: 'Specializations', description: 'Clinical specialties attached to staff.' },
  { value: 'skills', label: 'Skills', description: 'Capabilities and competencies available for assignments.' },
  { value: 'departments', label: 'Departments', description: 'Operational departments used by planning and reporting.' },
  { value: 'leave_types', label: 'Leave Types', description: 'Leave categories available for staff requests.' },
  { value: 'shift', label: 'Shifts', description: 'Named shift templates with hours and short codes.' },
];
const empty = { name: '', alias: '', start_time: '', end_time: '', description: '', status: 'ACTIVE' };
const input = 'w-full min-w-0 bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary focus:ring-0 rounded-t-xl px-4 py-3 text-sm font-bold normal-case tracking-normal outline-none';
const editInput = 'w-full min-w-0 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold normal-case tracking-normal outline-none focus:ring-2 focus:ring-primary/20';
const fieldLabel = 'block space-y-1.5 text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider';

export default function SettingsPage() {
  const { activeOrgId, pushToast, refreshSettings } = useAppStore();
  const [catalog, setCatalog] = useState<Catalog>('shift');
  const [section, setSection] = useState<'catalogs' | 'patterns' | 'horizon'>('catalogs');
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rulesError, setRulesError] = useState('');
  const [rulesLoaded, setRulesLoaded] = useState(false);
  const [horizon, setHorizon] = useState<number | ''>('');
  const [patternRecord, setPatternRecord] = useState<ServerForbiddenPatternRecord | null>(null);
  const [patterns, setPatterns] = useState<Record<string, unknown>[]>([]);
  const catalogSequence = useRef(0);

  const loadCatalog = useCallback(async () => {
    const sequence = ++catalogSequence.current;
    setLoading(true); setError('');
    try {
      const result = await apiFetch<CatalogRow[]>(`/api/catalogs/${catalog}?orgId=${activeOrgId}`);
      if (!Array.isArray(result)) throw new Error('Invalid catalog response');
      if (sequence === catalogSequence.current) setRows(result);
    } catch (reason) {
      if (sequence === catalogSequence.current) { setRows([]); setError(reason instanceof Error ? reason.message : 'Unable to load catalog'); }
    } finally { if (sequence === catalogSequence.current) setLoading(false); }
  }, [catalog, activeOrgId]);
  useEffect(() => { void loadCatalog(); return () => { catalogSequence.current += 1; }; }, [loadCatalog]);
  useEffect(() => {
    let cancelled = false;
    setRulesLoaded(false);
    setRulesError('');
    Promise.allSettled([getOrgGlobalSettings(activeOrgId), getForbiddenPatternRecords({ orgId: activeOrgId })])
      .then(([settings, records]) => {
        if (cancelled) return;
        const failures: string[] = [];
        if (settings.status === 'fulfilled') setHorizon(settings.value.roster_planning_horizon);
        else failures.push(`horizon: ${settings.reason instanceof Error ? settings.reason.message : 'Unknown error'}`);
        if (records.status === 'fulfilled') {
          const record = records.value.find(item => item.scope?.toUpperCase() === 'GLOBAL') ?? null;
          if (record && !Array.isArray(record.forbidden_patterns)) failures.push('shift rules: invalid response');
          else {
            setPatternRecord(record);
            setPatterns(record?.forbidden_patterns ?? []);
            setRulesLoaded(true);
          }
        } else failures.push(`shift rules: ${records.reason instanceof Error ? records.reason.message : 'Unknown error'}`);
        if (failures.length) setRulesError(`Unable to load ${failures.join('; ')}`);
      });
    return () => { cancelled = true; };
  }, [activeOrgId]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || (catalog === 'shift' && (!form.alias.trim() || !form.start_time || !form.end_time))) return;
    setBusy(true); setError('');
    try {
      const body = catalog === 'shift'
        ? { name: form.name.trim(), alias: form.alias.trim(), start_time: form.start_time, end_time: form.end_time, description: form.description }
        : { name: form.name.trim(), ...(catalog !== 'roles' ? { description: form.description } : {}) };
      await apiFetch(`/api/catalogs/${catalog}${editId === null ? '' : `/${editId}`}`, {
        method: editId === null ? 'POST' : 'PUT',
        body: JSON.stringify(editId === null ? { ...body, organization_id: activeOrgId } : { ...body, status: form.status }),
      });
      setForm(empty); setEditId(null); await loadCatalog(); refreshSettings(); pushToast('Catalog saved.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save catalog'); }
    finally { setBusy(false); }
  };
  const remove = async (row: CatalogRow) => {
    if (!window.confirm(`Delete ${row.name}?`)) return;
    setBusy(true); setError('');
    try { await apiFetch(`/api/catalogs/${catalog}/${row.id}`, { method: 'DELETE' }); await loadCatalog(); refreshSettings(); pushToast('Catalog entry deleted.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to delete catalog entry'); }
    finally { setBusy(false); }
  };
  const saveHorizon = async () => {
    if (typeof horizon !== 'number' || !Number.isInteger(horizon) || horizon < 1) { setError('Roster horizon must be a positive whole number.'); return; }
    setBusy(true); setError('');
    try { await upsertOrgGlobalSettings({ organization_id: activeOrgId, roster_planning_horizon: horizon }); refreshSettings(); pushToast('Roster horizon saved.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save roster horizon'); }
    finally { setBusy(false); }
  };
  const savePatterns = async (next: Record<string, unknown>[]) => {
    setBusy(true); setError('');
    try {
      const saved = patternRecord
        ? await updateForbiddenPatternRecord(patternRecord.id, { forbidden_patterns: next })
        : await createForbiddenPatternRecord({ organization_id: activeOrgId, scope: 'GLOBAL', applies_to: 'ALL_CONTRACT_TYPES', forbidden_patterns: next, metadata: {} });
      setPatternRecord(saved); setPatterns(Array.isArray(saved.forbidden_patterns) ? saved.forbidden_patterns : []); refreshSettings(); pushToast('Shift rules saved.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save shift rules'); }
    finally { setBusy(false); }
  };
  const sections = [
    { id: 'catalogs' as const, label: 'Catalogs', description: 'Master data and reusable planning lists.', icon: Settings },
    { id: 'patterns' as const, label: 'Forbidden Patterns', description: 'Safety rules for disallowed shift combinations.', icon: ShieldAlert },
    { id: 'horizon' as const, label: 'Roster Planning', description: 'Organization-wide rostering defaults.', icon: CalendarDays },
  ];
  const currentCatalog = catalogs.find(item => item.value === catalog)!;
  const enabledPatternCount = patterns.filter(pattern => Boolean(pattern.active ?? pattern.enabled ?? true)).length;
  const catalogForm = (editing: boolean) => <form onSubmit={save} className={editing ? 'space-y-3' : catalog === 'shift' ? 'bg-white rounded-2xl p-6 space-y-4 border border-slate-100 shadow-sm' : 'space-y-3'}>
    {catalog === 'shift' && !editing && <h5 className="text-sm font-bold text-primary uppercase tracking-wider">Create Shift</h5>}
    <div className={`grid grid-cols-1 gap-3 ${catalog === 'shift' ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
      <label className={fieldLabel}>Name<input required className={editing ? editInput : input} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
      {catalog === 'shift' ? <>
        <label className={fieldLabel}>Short Code<input required className={editing ? editInput : input} value={form.alias} onChange={event => setForm({ ...form, alias: event.target.value })} /></label>
        <label className={fieldLabel}>Start<input required type="time" className={editing ? editInput : input} value={form.start_time} onChange={event => setForm({ ...form, start_time: event.target.value })} /></label>
        <label className={fieldLabel}>End<input required type="time" className={editing ? editInput : input} value={form.end_time} onChange={event => setForm({ ...form, end_time: event.target.value })} /></label>
        <label className={`${fieldLabel} md:col-span-2`}>Description (optional)<textarea rows={3} className={`${editing ? editInput : input} resize-none`} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label>
      </> : catalog !== 'roles' && <label className={`${fieldLabel} md:col-span-2`}>Description (optional)<input className={editing ? editInput : input} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label>}
      {editing && <label className={`${fieldLabel} ${catalog === 'shift' ? 'md:col-span-2' : 'md:col-span-3'}`}>Status<select className={editInput} value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>}
    </div>
    <div className={editing ? 'flex gap-2' : ''}>
      <button disabled={busy} className={`inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-2xl text-sm font-black hover:opacity-90 disabled:opacity-60 ${editing ? '' : 'w-full'}`}>{editing ? <Save size={16} /> : <Plus size={16} />}{editing ? 'Save changes' : 'Add'}</button>
      {editing && <button type="button" disabled={busy} className="inline-flex items-center justify-center gap-2 bg-slate-200 text-slate-700 px-4 py-3 rounded-2xl text-sm font-black hover:bg-slate-300 disabled:opacity-60" onClick={() => { setEditId(null); setForm(empty); }}><X size={16} />Cancel</button>}
    </div>
  </form>;
  return <div className="max-w-7xl mx-auto space-y-6">
    <header className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6 lg:p-8">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-3"><Settings size={14} />System Administration</div>
      <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Rostering Settings</h1>
      <p className="text-slate-500 mt-3 font-medium">Manage staff catalogs, shift rules and rostering defaults.</p>
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4"><p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Catalog Groups</p><p className="mt-2 text-2xl font-black text-slate-900">{catalogs.length}</p><p className="mt-1 text-sm font-medium text-slate-500">Staff and scheduling catalogs</p></div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4"><p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Pattern Safety</p><p className="mt-2 text-2xl font-black text-slate-900">{rulesLoaded ? enabledPatternCount : '—'}</p><p className="mt-1 text-sm font-medium text-slate-500">{rulesLoaded ? `${patterns.length} rule(s) currently configured` : 'Rules unavailable'}</p></div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4"><p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Roster Horizon</p><p className="mt-2 text-2xl font-black text-slate-900">{horizon === '' ? '—' : `${horizon} days`}</p><p className="mt-1 text-sm font-medium text-slate-500">Planning window</p></div>
      </div>
    </header>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
    {rulesError && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{rulesError}</p>}
    <nav aria-label="Rostering settings sections" className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm grid gap-3 lg:grid-cols-3">
      {sections.map(item => <button key={item.id} type="button" onClick={() => setSection(item.id)} aria-pressed={section === item.id} className={`flex items-start gap-4 rounded-[1.5rem] border px-5 py-4 text-left transition-all ${section === item.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'}`}>
        <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${section === item.id ? 'bg-primary text-white' : 'border border-slate-200 bg-white text-slate-500'}`}><item.icon size={18} /></span>
        <span className="min-w-0"><span className={`block text-sm font-black ${section === item.id ? 'text-primary' : 'text-slate-900'}`}>{item.label}</span><span className="block mt-1 text-sm font-medium text-slate-500">{item.description}</span></span>
      </button>)}
    </nav>
    {section === 'catalogs' && <section className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
      <div className="p-6 lg:p-8 border-b border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><p className="flex items-center gap-2 text-slate-400 text-[11px] font-black uppercase tracking-[0.18em] mb-2"><Settings size={13} />Catalog Workspace</p><h2 className="text-2xl font-black text-slate-900 mb-2">{currentCatalog.label}</h2><p className="text-sm text-slate-500 font-medium">{currentCatalog.description}</p></div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Records</p><p className="mt-1 text-lg font-black text-slate-900">{loading || error ? '—' : rows.length}</p></div>
          <button type="button" onClick={() => void loadCatalog()} disabled={loading || busy} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60"><RotateCcw size={16} />{loading ? 'Syncing…' : 'Sync'}</button>
        </div>
      </div>
      <div className="p-6 lg:p-8 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <nav aria-label="Catalog navigation" className="rounded-[1.75rem] border border-slate-200 bg-white p-3 h-fit xl:sticky xl:top-28">
          <p className="px-3 pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Catalog Navigation</p>
          <div className="space-y-0.5">{catalogs.map(item => <button key={item.value} type="button" onClick={() => { setCatalog(item.value); setForm(empty); setEditId(null); }} aria-current={catalog === item.value ? 'page' : undefined} className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium text-left transition-all border-l-[3px] ${catalog === item.value ? 'bg-primary/8 text-primary shadow-sm border-primary -ml-px pl-[13px]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-transparent'}`}><span>{item.label}</span>{catalog === item.value && !loading && !error && <span className="text-xs font-bold">{rows.length}</span>}</button>)}</div>
        </nav>
        <section className="min-w-0 space-y-4">
          <h3 className="text-sm font-black text-slate-900">{currentCatalog.label}</h3>
          {editId === null && catalogForm(false)}
          <div className="space-y-3">
            {catalog === 'shift' && <h4 className="text-sm font-black text-slate-900">Existing Shifts</h4>}
            {loading ? <p role="status" className="text-sm text-slate-500">Loading catalog...</p> : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rows.map(row => <div key={row.id} className={`p-4 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden ${(row.status || 'ACTIVE').toUpperCase() === 'INACTIVE' ? 'opacity-70 grayscale' : ''}`}>
                {editId === row.id ? catalogForm(true) : <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="font-black text-slate-900 break-words">{row.name} {catalog === 'shift' && <span className="text-xs font-mono text-slate-500">({row.alias})</span>}</p>{catalog === 'shift' && <p className="text-xs font-mono text-slate-500">{row.start_time}–{row.end_time}</p>}{row.description && <p className="text-xs text-slate-500 font-medium mt-1 break-words">{row.description}</p>}</div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" disabled={busy} title={`Edit ${row.name}`} aria-label={`Edit ${row.name}`} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-60" onClick={() => { setEditId(row.id); setForm({ name: row.name, alias: row.alias || '', start_time: row.start_time || '', end_time: row.end_time || '', description: row.description || '', status: (row.status || 'ACTIVE').toUpperCase() }); }}><Pencil size={16} /></button>
                    <button type="button" disabled={busy} title={`Delete ${row.name}`} aria-label={`Delete ${row.name}`} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-error hover:bg-error-container disabled:opacity-60" onClick={() => void remove(row)}><Trash2 size={16} /></button>
                  </div>
                </div>}
                {(row.status || 'ACTIVE').toUpperCase() === 'INACTIVE' && <div className="mt-4 -mx-4 -mb-4 px-4 py-2 bg-rose-600 text-white text-xs font-black">Deactivated</div>}
              </div>)}
              {!rows.length && !error && <p className="text-sm text-slate-400 font-medium">No {currentCatalog.label.toLowerCase()} yet.</p>}
            </div>}
          </div>
        </section>
      </div>
    </section>}
    {section === 'horizon' && <section className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
      <div className="p-6 lg:p-8 border-b border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><p className="flex items-center gap-2 text-slate-400 text-[11px] font-black uppercase tracking-[0.18em] mb-2"><CalendarDays size={13} />Planning Defaults</p><h2 className="text-2xl font-black text-slate-900 mb-2">Roster Planning</h2><p className="text-sm text-slate-500 font-medium">Configure the planning horizon used for staff rosters.</p></div>
        <button disabled={busy || horizon === ''} onClick={() => void saveHorizon()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold bg-primary text-on-primary hover:opacity-90 disabled:opacity-60"><Save size={16} />Save</button>
      </div>
      <div className="p-6 lg:p-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <label className="block space-y-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Roster Planning Horizon (days)</span><input type="number" min="1" step="1" className="w-full bg-slate-50 border-none rounded-2xl h-12 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all shadow-inner" value={horizon} onChange={event => setHorizon(event.target.value === '' ? '' : Number(event.target.value))} /></label>
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 space-y-4 h-fit"><div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Planning Summary</p><h3 className="mt-2 text-lg font-black text-slate-900">Current Defaults</h3></div><div className="rounded-2xl border border-slate-200 bg-white px-4 py-3"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Roster Horizon</p><p className="mt-1 text-base font-black text-slate-900">{horizon === '' ? '—' : `${horizon} days`}</p></div></div>
      </div>
    </section>}
    {section === 'patterns' && <section className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
      <div className="p-6 lg:p-8 border-b border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><p className="flex items-center gap-2 text-slate-400 text-[11px] font-black uppercase tracking-[0.18em] mb-2"><ShieldAlert size={13} />Safety Rules</p><h2 className="text-2xl font-black text-slate-900 mb-2">Pattern Constraints</h2><p className="text-sm text-slate-500 font-medium">Enable or disable global shift sequence rules.</p></div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Enabled</p><p className="mt-1 text-lg font-black text-slate-900">{rulesLoaded ? enabledPatternCount : '—'}</p></div>
      </div>
      <div className="p-6 lg:p-8">
        <div className="rounded-[1.75rem] border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {patterns.map((pattern, index) => {
            const label = String(pattern.label ?? (Array.isArray(pattern.pattern) ? pattern.pattern.join(' → ') : pattern.pattern ?? pattern.name ?? `Rule ${index + 1}`));
            const description = String(pattern.reason ?? pattern.description ?? '');
            const enabled = Boolean(pattern.active ?? pattern.enabled ?? true);
            return <div key={index} className="p-6 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex min-w-0 items-center gap-5"><div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${enabled ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}><ShieldAlert size={20} /></div><div className="min-w-0"><h3 className="font-bold text-slate-900 break-words">{label} {!enabled && <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest">Disabled</span>}</h3>{description && <p className="text-xs text-slate-500 font-medium mt-0.5 break-words">{description}</p>}</div></div>
              <button type="button" role="switch" aria-label={label} aria-checked={enabled} disabled={busy} onClick={() => void savePatterns(patterns.map((item, i) => i === index ? { ...item, active: !enabled, enabled: !enabled } : item))} className={`w-12 h-6 shrink-0 rounded-full relative transition-all duration-300 disabled:opacity-60 ${enabled ? 'bg-rose-600' : 'bg-slate-200'}`}><span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${enabled ? 'left-7' : 'left-1'}`} /></button>
            </div>;
          })}
          {rulesLoaded && !patterns.length && <div className="p-8 text-center"><p className="text-sm text-slate-500 font-medium">No forbidden patterns configured yet.</p>{!patternRecord && <button disabled={busy} onClick={() => void savePatterns(toSolverForbiddenPatterns(DEFAULT_FORBIDDEN_PATTERNS))} className="mt-4 inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-2xl text-sm font-black hover:opacity-90 disabled:opacity-60"><Plus size={16} />Create default rules</button>}</div>}
        </div>
      </div>
    </section>}
  </div>;
}
