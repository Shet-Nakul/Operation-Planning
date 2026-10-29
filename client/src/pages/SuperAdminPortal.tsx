import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, Check, Copy, Eye, EyeOff, KeyRound, LogOut, Mail, MapPin, PanelLeftClose, PanelLeftOpen, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import CatalogSelect from '../components/ui/CatalogSelect';
import { createOrganization, deleteOrganizationById, getOrganizations, getUsers, updateOrganizationById, updateUserById, deleteUserById, type ServerOrganization, type ServerUser } from '../services/api-organizations';
import { getActivityLogs, type ServerActivityLog } from '../services/api-contracts';
import { apiFetch } from '../services/api-core';

type View = 'organizations' | 'register' | 'account';
type OrgTab = 'admins' | 'users' | 'activity';
type Credential = { email: string; password: string };
const blankDraft = { name: '', location: '', contact_email: '', contact_number: '', admin_first_name: '', admin_last_name: '', admin_email: '', status: 'ACTIVE' };
const logo = new URL('../assets/karmarkar_color_logo.png', import.meta.url).href;
const inputClass = 'w-full bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary focus:ring-0 text-slate-900 font-medium px-4 py-3 rounded-t-xl transition-all outline-none text-sm';
const commandClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50';

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="block min-w-0 space-y-1.5"><span className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">{label}</span><input required={required} aria-label={label} type={type} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} /></label>;
}

export default function SuperAdminPortal({ onLogout }: { onLogout: () => void }) {
  const [view, setView] = useState<View>('organizations');
  const [collapsed, setCollapsed] = useState(false);
  const [organizations, setOrganizations] = useState<ServerOrganization[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [orgTab, setOrgTab] = useState<OrgTab>('admins');
  const [users, setUsers] = useState<ServerUser[]>([]);
  const [logs, setLogs] = useState<ServerActivityLog[]>([]);
  const [draft, setDraft] = useState(blankDraft);
  const [edit, setEdit] = useState<{ name: string; location: string } | null>(null);
  const [credential, setCredential] = useState<Credential | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<ServerUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [account, setAccount] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const selected = organizations.find((org) => org.id === selectedId);

  useEffect(() => {
    let cancelled = false;
    setBusy(true); setUsers([]); setLogs([]);
    const load = selectedId === null
      ? getOrganizations({ page: 1, limit: 500 }).then((result) => { if (!cancelled) setOrganizations(result.data); })
      : Promise.all([getUsers({ page: 1, limit: 1000, orgId: selectedId }), getActivityLogs({ page: 1, limit: 100, orgId: selectedId })]).then(([userResult, logResult]) => {
        if (!cancelled) { setUsers(userResult.data); setLogs(logResult.data); }
      });
    load.catch((failure: Error) => { if (!cancelled) setError(failure.message); }).finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError(null); setMessage(null);
    try { await action(); } catch (failure: any) { setError(failure.message ?? 'Request failed'); } finally { setBusy(false); }
  };
  const refresh = () => run(async () => {
    if (selectedId !== null) {
      const [userResult, logResult] = await Promise.all([getUsers({ page: 1, limit: 1000, orgId: selectedId }), getActivityLogs({ page: 1, limit: 100, orgId: selectedId })]);
      setUsers(userResult.data); setLogs(logResult.data);
    } else setOrganizations((await getOrganizations({ page: 1, limit: 500 })).data);
  });
  const navigate = (nextView: View) => {
    setAccount({ current: '', next: '', confirm: '' });
    setView(nextView); setSelectedId(null); setEdit(null); setCredential(null); setPasswordTarget(null); setNewPassword(''); setError(null); setMessage(null);
  };
  const issueCredential = (value: Credential) => { setCredential(value); setRevealed(false); };
  const copyCredential = () => run(async () => {
    if (!credential) return;
    await navigator.clipboard.writeText(`Email: ${credential.email}\nPassword: ${credential.password}`);
    setMessage('Credentials copied.');
  });
  const generatePassword = () => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    const bytes = crypto.getRandomValues(new Uint8Array(18));
    setNewPassword(Array.from(bytes, (value) => characters[value % characters.length]).join(''));
  };
  const register = () => run(async () => {
    const result = await createOrganization({
      name: draft.name.trim(), location: draft.location.trim() || undefined,
      contact_email: draft.contact_email.trim() || undefined, contact_number: draft.contact_number.trim() || undefined, status: draft.status,
      initial_admin: { first_name: draft.admin_first_name.trim(), last_name: draft.admin_last_name.trim() || undefined, email: draft.admin_email.trim() },
    });
    setOrganizations((current) => [result.organization, ...current]);
    setDraft(blankDraft); setView('organizations'); setSelectedId(result.organization.id); setOrgTab('admins'); issueCredential(result.credentials);
  });
  const resetPassword = () => run(async () => {
    if (!passwordTarget) return;
    await updateUserById(passwordTarget.id, { password: newPassword });
    issueCredential({ email: passwordTarget.email, password: newPassword });
    setPasswordTarget(null); setNewPassword(''); setMessage('Password updated.');
  });
  const visibleUsers = users.filter((user) => user.role?.name === (orgTab === 'admins' ? 'ADMIN' : 'USER'));
  const iconButton = (label: string, Icon: typeof Copy, action: () => void, disabled = false) => <button type="button" title={label} aria-label={label} onClick={action} disabled={disabled} className={`${commandClass} h-10 w-10 shrink-0 !px-0`}><Icon size={17} /></button>;

  return <div className="min-h-screen bg-surface text-on-surface">
    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-surface-container-high px-3 py-6 transition-[width] ${collapsed ? 'w-20' : 'w-72'} max-md:w-20`}>
      <div className="mb-8 flex items-center gap-3 px-1">
        <div className="relative w-12 h-12 shrink-0 overflow-hidden"><img src={logo} alt="Karmarker logo" className="absolute left-1/2 top-1/2 w-[246%] max-w-none -translate-x-1/2 -translate-y-1/2" style={{ clipPath: 'polygon(50.1% 17.2%, 70.4% 83.5%, 29.7% 83.5%)' }} /></div>
        {!collapsed && <h3 className="max-md:hidden text-[27px] font-black text-primary leading-none font-headline truncate">Karmarker</h3>}
      </div>
      {!collapsed && <p className="max-md:hidden mb-4 px-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Super Admin</p>}
      <nav className="flex-1 space-y-1">
        {([{ id: 'organizations', label: 'Organizations', icon: Building2 }, { id: 'account', label: 'My Account', icon: KeyRound }] as const).map((item) => <button key={item.id} type="button" title={item.label} aria-label={item.label} onClick={() => navigate(item.id)} className={`w-full flex items-center gap-3 pl-[15px] pr-2 py-3 rounded-lg text-sm font-medium text-left border-l-[3px] ${view === item.id || (view === 'register' && item.id === 'organizations') ? 'bg-primary/8 text-primary border-primary' : 'border-transparent text-on-surface-variant hover:bg-surface-container-low'}`}><item.icon size={20} className="shrink-0" />{!collapsed && <span className="max-md:hidden truncate">{item.label}</span>}</button>)}
      </nav>
      <div className="border-t border-surface-container pt-4 space-y-1">
        <button type="button" title="Sign out" aria-label="Sign out" onClick={onLogout} className="w-full flex items-center gap-3 pl-[18px] py-3 text-error text-sm font-medium"><LogOut size={20} />{!collapsed && <span className="max-md:hidden">Sign out</span>}</button>
        <button type="button" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(!collapsed)} className="max-md:hidden w-full flex items-center gap-3 pl-[18px] py-3 text-on-surface-variant text-sm font-medium">{collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}{!collapsed && 'Collapse sidebar'}</button>
      </div>
    </aside>
    <main className={`${collapsed ? 'ml-20' : 'ml-72'} max-md:ml-20 px-4 sm:px-8 py-8 transition-[margin]`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-primary">Super Admin</p><h1 className="mt-2 text-3xl font-extrabold font-headline break-words">{view === 'register' ? 'Register Organization' : view === 'account' ? 'My Account' : selected?.name ?? 'Organizations'}</h1></div>
          <div className="flex gap-2">{view === 'organizations' && !selected && <button type="button" onClick={() => navigate('register')} className="inline-flex items-center gap-2 min-h-10 px-4 rounded-lg bg-primary text-on-primary text-sm font-bold"><Plus size={17} />New organization</button>}{view !== 'account' && iconButton('Refresh', RefreshCw, () => void refresh(), busy)}</div>
        </header>
        {error && <p role="alert" className="bg-error/5 border border-error/20 rounded-lg p-3 text-sm text-error break-words">{error}</p>}
        {message && <p role="status" className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-primary">{message}</p>}
        {credential && <section aria-label="Issued credentials" className="border-y border-slate-200 py-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3"><KeyRound size={18} className="text-primary" /><strong className="text-sm">Issued credentials</strong><span className="text-sm break-all">{credential.email}</span><code className="break-all text-sm">{revealed ? credential.password : '************'}</code></div>
          <div className="flex flex-wrap gap-2">{iconButton(revealed ? 'Hide password' : 'View password', revealed ? EyeOff : Eye, () => setRevealed(!revealed))}{iconButton('Copy credentials', Copy, () => void copyCredential())}<button type="button" className={commandClass} onClick={() => setMessage('Email delivery is not configured. No credentials were sent.')}><Mail size={16} />Send by email</button><button type="button" disabled title="SMS delivery is not available yet" className={commandClass}>SMS</button>{iconButton('Dismiss credentials', X, () => setCredential(null))}</div>
        </section>}
        {view === 'register' && <form onSubmit={(event) => { event.preventDefault(); void register(); }} className="space-y-8">
          <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-primary" onClick={() => navigate('organizations')}><ArrowLeft size={16} />Organizations</button>
          <section className="space-y-5 border-b border-slate-200 pb-8"><h2 className="text-sm font-bold text-primary uppercase tracking-wider">Organization Details</h2><div className="grid md:grid-cols-2 gap-6">{(['name', 'location', 'contact_email', 'contact_number'] as const).map((key) => <Field key={key} label={{ name: 'Organization name', location: 'Location', contact_email: 'Contact email', contact_number: 'Contact number' }[key]} value={draft[key]} onChange={(value) => setDraft({ ...draft, [key]: value })} type={key === 'contact_email' ? 'email' : 'text'} required={key === 'name'} />)}<label className="space-y-1.5"><span className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">Status</span><CatalogSelect value={draft.status} onChange={(value) => setDraft({ ...draft, status: value })} options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]} /></label></div></section>
          <section className="space-y-5"><h2 className="text-sm font-bold text-primary uppercase tracking-wider">Initial Admin</h2><div className="grid md:grid-cols-2 gap-6"><Field label="Admin first name" required value={draft.admin_first_name} onChange={(value) => setDraft({ ...draft, admin_first_name: value })} /><Field label="Admin last name" value={draft.admin_last_name} onChange={(value) => setDraft({ ...draft, admin_last_name: value })} /><Field label="Admin email" type="email" required value={draft.admin_email} onChange={(value) => setDraft({ ...draft, admin_email: value })} /></div></section>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-primary text-on-primary px-5 py-3 font-bold text-sm disabled:opacity-50"><Plus size={17} />Register organization</button>
        </form>}
        {view === 'organizations' && !selected && <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {organizations.map((org) => <button key={org.id} type="button" onClick={() => { setSelectedId(org.id); setOrgTab('admins'); setError(null); }} className="text-left rounded-lg bg-white border border-slate-200 p-5 hover:border-primary hover:shadow-sm transition-all min-w-0"><div className="flex justify-between gap-3"><Building2 size={25} className="text-primary" /><span className="text-xs font-semibold text-on-surface-variant">{org.status}</span></div><h2 className="mt-5 text-lg font-bold break-words">{org.name}</h2><div className="mt-2 flex gap-2 text-sm text-slate-500"><MapPin size={15} className="shrink-0 mt-0.5" /><span className="break-words">{org.location || 'Location not set'}</span></div><p className="mt-4 text-xs font-mono text-slate-400">Organization #{org.id}</p></button>)}
          {!busy && !organizations.length && <p className="text-sm text-slate-500">No organizations registered.</p>}
        </div>}
        {view === 'organizations' && selected && <>
          <div className="flex flex-wrap justify-between gap-3"><button type="button" onClick={() => navigate('organizations')} className="inline-flex gap-2 items-center text-sm font-semibold text-primary"><ArrowLeft size={16} />Organizations</button><div className="flex gap-2"><button type="button" className={commandClass} onClick={() => setEdit({ name: selected.name, location: selected.location ?? '' })}><Save size={16} />Edit details</button>{iconButton('Delete organization', Trash2, () => { if (confirm(`Delete ${selected.name}?`)) void run(async () => { await deleteOrganizationById(selected.id); setOrganizations((current) => current.filter((org) => org.id !== selected.id)); navigate('organizations'); }); }, busy)}</div></div>
          {edit && <form onSubmit={(event) => { event.preventDefault(); void run(async () => { const updated = await updateOrganizationById(selected.id, edit); setOrganizations((current) => current.map((org) => org.id === updated.id ? updated : org)); setEdit(null); }); }} className="grid md:grid-cols-2 gap-4 border-y border-slate-200 py-5"><Field label="Organization name" required value={edit.name} onChange={(value) => setEdit({ ...edit, name: value })} /><Field label="Location" value={edit.location} onChange={(value) => setEdit({ ...edit, location: value })} /><div className="flex gap-2"><button type="submit" disabled={busy} className={commandClass}><Check size={16} />Save</button>{iconButton('Cancel edit', X, () => setEdit(null))}</div></form>}
          <nav aria-label="Organization sections" className="flex overflow-x-auto border-b border-slate-200">{(['admins', 'users', 'activity'] as const).map((tab) => <button key={tab} type="button" onClick={() => { setOrgTab(tab); setPasswordTarget(null); }} className={`shrink-0 px-5 py-3 text-sm font-bold border-b-2 ${orgTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>{tab === 'activity' ? 'Activity logs' : tab === 'admins' ? 'Admins' : 'Users'}</button>)}</nav>
          {passwordTarget && <form onSubmit={(event) => { event.preventDefault(); void resetPassword(); }} className="space-y-4 border-b border-slate-200 pb-5"><h2 className="font-bold text-sm break-all">Change password: {passwordTarget.email}</h2><div className="grid md:grid-cols-2 gap-4"><Field label="New password (at least 10 characters)" required type="password" value={newPassword} onChange={setNewPassword} /><div className="flex flex-wrap items-end gap-2"><button type="button" onClick={generatePassword} className={commandClass}><RefreshCw size={16} />Generate</button><button type="submit" disabled={busy || newPassword.length < 10} className={commandClass}><Save size={16} />Change password</button>{iconButton('Cancel password change', X, () => { setPasswordTarget(null); setNewPassword(''); })}</div></div></form>}
          {orgTab !== 'activity' ? <div className="overflow-x-auto"><table className="w-full text-sm text-left min-w-[600px]"><thead className="bg-slate-50 text-[10px] uppercase text-slate-400"><tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead><tbody>{visibleUsers.map((user) => <tr key={user.id} className="border-b border-slate-100"><td className="p-4 font-semibold">{user.first_name} {user.last_name}</td><td className="p-4">{user.email}</td><td className="p-4">{user.is_active ? 'Active' : 'Disabled'}</td><td className="p-4"><div className="flex justify-end gap-2">{iconButton('Change password', KeyRound, () => { setPasswordTarget(user); setNewPassword(''); setCredential(null); })}<button type="button" disabled={busy} className={commandClass} onClick={() => void run(async () => { await updateUserById(user.id, { is_active: !user.is_active }); setUsers((current) => current.map((row) => row.id === user.id ? { ...row, is_active: !user.is_active } : row)); })}>{user.is_active ? 'Disable' : 'Enable'}</button>{iconButton('Delete user', Trash2, () => { if (confirm(`Delete ${user.email}?`)) void run(async () => { await deleteUserById(user.id); setUsers((current) => current.filter((row) => row.id !== user.id)); }); }, busy)}</div></td></tr>)}</tbody></table>{!busy && !visibleUsers.length && <p className="py-6 text-sm text-slate-500">No {orgTab} in this organization.</p>}</div>
          : <div className="divide-y divide-slate-200">{logs.map((log) => <article key={log.id} className="py-4 space-y-1"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm">{log.action}</strong><time className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</time></div><p className="text-sm break-words">{log.description ?? log.entity}</p><p className="text-xs text-slate-500 break-all">{log.user?.email ?? 'System'}</p></article>)}{!busy && !logs.length && <p className="py-6 text-sm text-slate-500">No activity logs in this organization.</p>}</div>}
        </>}
        {view === 'account' && <form onSubmit={(event) => { event.preventDefault(); void run(async () => { await apiFetch('/api/account/password', { method: 'POST', body: JSON.stringify({ currentPassword: account.current, newPassword: account.next }) }); onLogout(); }); }} className="max-w-2xl space-y-6 border-y border-slate-200 py-6"><h2 className="text-sm font-bold text-primary uppercase tracking-wider">Change My Password</h2><Field label="Current password" type="password" required value={account.current} onChange={(value) => setAccount({ ...account, current: value })} /><Field label="New password" type="password" required value={account.next} onChange={(value) => setAccount({ ...account, next: value })} /><Field label="Confirm new password" type="password" required value={account.confirm} onChange={(value) => setAccount({ ...account, confirm: value })} /><button type="submit" disabled={busy || account.next.length < 10 || account.next !== account.confirm || !account.current} className="inline-flex gap-2 items-center px-4 py-3 rounded-lg bg-primary text-on-primary font-bold text-sm disabled:opacity-50"><KeyRound size={17} />Change password and sign out</button></form>}
        {busy && <p role="status" className="text-sm text-slate-500">Loading...</p>}
      </div>
    </main>
  </div>;
}