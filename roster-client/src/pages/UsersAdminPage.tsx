import { Fragment, useContext, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Plus, RefreshCw, Save, Search, Trash2, X, Pencil, Users, UserCheck, ShieldCheck } from 'lucide-react';
import { AppStoreContext } from '../context/AppStoreContext';
import CatalogSelect from '../components/ui/CatalogSelect';
import { DirectoryPagination } from '../components/ui/DirectoryPagination';
import { cn } from '../lib/utils';
import {
  createUser,
  deleteUserById,
  getOrganizations,
  getRoles,
  getUsers,
  updateUserById,
  type ServerOrganization,
  type ServerRole,
  type ServerUser,
} from '../lib/api';

type CreateDraft = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role_id: string;
  organization_id: string;
  is_active: boolean;
};

type EditDraft = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role_id: string;
  organization_id: string;
  is_active: boolean;
};

export default function UsersAdminPage() {
  const app = useContext(AppStoreContext);
  const pushToast = app?.pushToast;

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filterOrgId, setFilterOrgId] = useState<string>('all');
  const [search, setSearch] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ServerUser[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);

  const [roles, setRoles] = useState<ServerRole[]>([]);
  const [orgs, setOrgs] = useState<ServerOrganization[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);

  const [createDraft, setCreateDraft] = useState<CreateDraft>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role_id: '',
    organization_id: '',
    is_active: true,
  });
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role_id: '',
    organization_id: '',
    is_active: true,
  });
  const [savingId, setSavingId] = useState<number | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [tempPasswords, setTempPasswords] = useState<Record<number, string>>({});
  const [revealedTempPassword, setRevealedTempPassword] = useState<Record<number, boolean>>({});

  const generatePassword = (length = 12) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    const bytes = new Uint32Array(length);
    crypto.getRandomValues(bytes);
    let out = '';
    for (let i = 0; i < bytes.length; i += 1) out += chars[bytes[i] % chars.length];
    return out;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setMetaLoading(true);
      try {
        const [rolesRes, orgRes] = await Promise.all([getRoles(), getOrganizations({ page: 1, limit: 200 })]);
        if (cancelled) return;
        setRoles(Array.isArray(rolesRes) ? rolesRes : []);
        setOrgs(Array.isArray(orgRes.data) ? orgRes.data : []);
      } catch (e: any) {
        if (cancelled) return;
        pushToast?.(e?.message ?? 'Failed to load roles/organizations');
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pushToast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const orgId = filterOrgId === 'all' ? undefined : Number(filterOrgId);
        const res = await getUsers({
          page,
          limit,
          orgId: Number.isFinite(orgId as any) ? (orgId as any) : undefined,
        });
        if (cancelled) return;
        setRows(Array.isArray(res.data) ? res.data : []);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotal(res.pagination?.total || 0);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? 'Failed to load users');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterOrgId, limit, page, refreshTick]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase().trim();
    return rows.filter((u) => {
      const fullName = `${u.first_name ?? ''} ${u.last_name ?? ''}`.toLowerCase();
      const email = (u.email ?? '').toLowerCase();
      const roleName = (u.role?.name ?? '').toLowerCase();
      const orgName = (u.organization?.name ?? '').toLowerCase();
      const idStr = String(u.id);
      return fullName.includes(q) || email.includes(q) || roleName.includes(q) || orgName.includes(q) || idStr.includes(q);
    });
  }, [rows, search]);

  const assignableRoles = roles.filter((role) => role.name === 'USER');
  useEffect(() => {
    if (assignableRoles.length === 0) return;
    setCreateDraft((s) => ({ ...s, role_id: String(assignableRoles[0].id) }));
  }, [roles]);

  const canCreate = useMemo(() => {
    if (creating) return false;
    return (
      createDraft.first_name.trim() !== '' &&
      createDraft.email.trim() !== '' &&
      createDraft.role_id.trim() !== ''
    );
  }, [createDraft.email, createDraft.first_name, createDraft.role_id, creating]);

  const create = async () => {
    if (!canCreate) return;
    setCreating(true);
    try {
      const created = await createUser({
        first_name: createDraft.first_name.trim(),
        last_name: createDraft.last_name.trim() || undefined,
        email: createDraft.email.trim(),
        password: createDraft.password.trim() || undefined,
        role_id: Number(createDraft.role_id),
        organization_id: createDraft.organization_id.trim() ? Number(createDraft.organization_id) : undefined,
        is_active: createDraft.is_active,
      });
      setTempPasswords((s) => ({ ...s, [created.id]: created.credentials.password }));
      setRevealedTempPassword((s) => ({ ...s, [created.id]: false }));
      pushToast?.('User created.');
      setCreateDraft((s) => ({ ...s, first_name: '', last_name: '', email: '', password: '' }));
      setRefreshTick((x) => x + 1);
    } catch (e: any) {
      pushToast?.(e?.message ?? 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (u: ServerUser) => {
    setEditingId(u.id);
    setEditDraft({
      first_name: String(u.first_name ?? ''),
      last_name: String(u.last_name ?? ''),
      email: String(u.email ?? ''),
      password: '',
      role_id: String(u.role_id ?? u.role?.id ?? ''),
      organization_id: u.organization_id == null ? '' : String(u.organization_id),
      is_active: Boolean(u.is_active),
    });
    setShowEditPassword(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSavingId(null);
    setShowEditPassword(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSavingId(editingId);
    try {
      const nextPassword = editDraft.password.trim();
      const payload: any = {
        first_name: editDraft.first_name.trim(),
        last_name: editDraft.last_name.trim() || undefined,
        email: editDraft.email.trim(),
        role_id: editDraft.role_id.trim() ? Number(editDraft.role_id) : undefined,
        organization_id: editDraft.organization_id.trim() ? Number(editDraft.organization_id) : undefined,
        is_active: editDraft.is_active,
      };
      if (nextPassword) payload.password = nextPassword;
      await updateUserById(editingId, payload);
      if (nextPassword) {
        setTempPasswords((s) => ({ ...s, [editingId]: nextPassword }));
        setRevealedTempPassword((s) => ({ ...s, [editingId]: false }));
      }
      pushToast?.('User updated.');
      cancelEdit();
      setRefreshTick((x) => x + 1);
    } catch (e: any) {
      pushToast?.(e?.message ?? 'Update failed');
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (id: number) => {
    const ok = globalThis.confirm?.('Delete this user?') ?? true;
    if (!ok) return;
    try {
      await deleteUserById(id);
      pushToast?.('User deleted.');
      if (editingId === id) cancelEdit();
      setRefreshTick((x) => x + 1);
    } catch (e: any) {
      pushToast?.(e?.message ?? 'Delete failed');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-w-0 space-y-8 pb-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900">Users</h2>
          <p className="text-sm text-slate-500">Manage user accounts, roles, organization assignments, and access</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRefreshTick((x) => x + 1)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-50"
          >
            <RefreshCw size={16} className={cn(isLoading ? 'animate-spin' : '')} />
            Refresh
          </button>
        </div>
      </header>

      <section aria-label="User overview" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Users', value: total, icon: Users, color: 'bg-blue-50 text-blue-700' },
          { label: 'Active on This Page', value: rows.filter(user => user.is_active).length, icon: UserCheck, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Roles on This Page', value: new Set(rows.map(user => user.role_id)).size, icon: ShieldCheck, color: 'bg-indigo-50 text-indigo-700' },
        ].map(metric => <div key={metric.label} className="flex items-center gap-4 rounded-2xl border border-slate-200/50 bg-white p-5 shadow-sm"><div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', metric.color)}><metric.icon size={21} /></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{metric.label}</p><p className="mt-1 text-2xl font-extrabold text-slate-900">{metric.value}</p></div></div>)}
      </section>

      <section aria-labelledby="create-user-heading" className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5"><h3 id="create-user-heading" className="flex items-center gap-2 text-base font-bold text-slate-900"><Plus size={18} className="text-primary" />Create User</h3><p className="mt-1 text-xs text-slate-500">Add a staff account and assign organization access</p></div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <input
              aria-label="New user first name"
              value={createDraft.first_name}
              onChange={(e) => setCreateDraft((s) => ({ ...s, first_name: e.target.value }))}
              placeholder="First name"
              className="h-11 px-4 rounded-t-xl bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary focus:ring-0 outline-none text-sm font-semibold text-slate-800"
            />
            <input
              aria-label="New user last name"
              value={createDraft.last_name}
              onChange={(e) => setCreateDraft((s) => ({ ...s, last_name: e.target.value }))}
              placeholder="Last name"
              className="h-11 px-4 rounded-t-xl bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary focus:ring-0 outline-none text-sm font-semibold text-slate-800"
            />
            <input
              aria-label="New user email"
              value={createDraft.email}
              onChange={(e) => setCreateDraft((s) => ({ ...s, email: e.target.value }))}
              placeholder="Email"
              type="email"
              className="h-11 px-4 rounded-t-xl bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary focus:ring-0 outline-none text-sm font-semibold text-slate-800 md:col-span-2"
            />
            <div className="flex flex-col md:flex-row gap-3 md:col-span-6">
              <CatalogSelect
                value={createDraft.role_id}
                onChange={(value) => setCreateDraft((s) => ({ ...s, role_id: value }))}
                disabled={metaLoading}
                options={assignableRoles.map((r) => ({ value: String(r.id), label: r.name }))}
                placeholder="Select role"
                emptyLabel="No roles"
                className="w-full md:w-64"
              />
              <CatalogSelect
                value={createDraft.organization_id}
                onChange={(value) => setCreateDraft((s) => ({ ...s, organization_id: value }))}
                disabled={metaLoading}
                options={orgs.map((o) => ({ value: String(o.id), label: `${o.name} (#${o.id})` }))}
                placeholder="No organization"
                allowClear
                clearLabel="No organization"
                className="w-full md:w-72"
              />
              <label className="h-11 px-4 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700 inline-flex items-center gap-2 w-full md:w-auto">
                <input
                  type="checkbox"
                  checked={createDraft.is_active}
                  onChange={(e) => setCreateDraft((s) => ({ ...s, is_active: e.target.checked }))}
                />
                Active
              </label>
              <button
                type="button"
                disabled={!canCreate}
                onClick={() => create()}
                className="h-11 px-4 rounded-xl bg-primary text-on-primary font-extrabold text-sm hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shrink-0 w-full md:w-auto"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="user-directory-heading" className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5"><h3 id="user-directory-heading" className="flex items-center gap-2 text-base font-bold text-slate-900"><Users size={18} className="text-primary" />User Directory</h3><p className="mt-1 text-xs text-slate-500">Manage accounts and credentials. Search applies to the current page.</p></div>
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/40">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                aria-label="Search users on this page"
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search users…"
                className="w-full h-9 pl-10 pr-4 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-xs text-slate-700"
                autoComplete="off"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                aria-label="Filter users by organization"
                value={filterOrgId}
                onChange={(e) => {
                  setFilterOrgId(e.target.value);
                  setPage(1);
                }}
                disabled={metaLoading}
                className="h-9 max-w-full px-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              >
                <option value="all">All orgs</option>
                {orgs.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    {o.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Users per page"
                value={String(limit)}
                onChange={(e) => {
                  const next = Number(e.target.value) || 20;
                  setLimit(next);
                  setPage(1);
                }}
                className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="p-5 border-b border-slate-100 bg-rose-50 text-rose-700 font-semibold text-sm">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table aria-label="Users" className="w-full min-w-[1000px] text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                {['User ID', 'Name & Email', 'Role', 'Organization', 'Password', 'Status', 'Actions'].map(heading => <th key={heading} scope="col" className={cn('px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500', heading === 'Actions' && 'text-center')}>{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                    Loading users…
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Users size={28} className="mx-auto mb-3 text-slate-300" /><p className="text-sm font-bold text-slate-700">No users found.</p><p className="mt-1 text-xs text-slate-500">{search ? 'Try another search on this page.' : 'Add a user or change the organization filter.'}</p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((u) => {
                  const isEditing = editingId === u.id;
                  const isSaving = savingId === u.id;
                  const fullName = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email;
                  const tempPassword = tempPasswords[u.id];
                  const isTempPasswordRevealed = Boolean(revealedTempPassword[u.id]);
                  return (
                    <Fragment key={u.id}>
                      <tr
                        className={cn(
                          'border-b border-slate-100 transition-colors',
                          isEditing ? 'bg-slate-50' : 'hover:bg-slate-50/50',
                        )}
                      >
                        <td className="px-6 py-5 font-mono text-xs text-slate-600">#{u.id}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{fullName.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}</div><div><div className="text-sm font-bold text-slate-900">{fullName}</div><div className="text-xs text-slate-500 mt-1">{u.email}</div></div></div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">{u.role?.name ?? `#${u.role_id}`}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-slate-700">{u.organization?.name ?? '—'}</div>
                        </td>
                        <td className="px-6 py-4">
                          {tempPassword ? (
                            <div className="flex flex-col items-start gap-2">
                              <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-slate-700 font-mono">
                                {isTempPasswordRevealed ? tempPassword : '••••••••'}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isTempPasswordRevealed) {
                                    const ok = globalThis.confirm?.('Reveal password text?') ?? true;
                                    if (!ok) return;
                                  }
                                  setRevealedTempPassword((s) => ({ ...s, [u.id]: !isTempPasswordRevealed }));
                                }}
                                className="text-slate-500 hover:text-slate-700"
                                aria-label={isTempPasswordRevealed ? 'Hide password' : 'Show password'}
                                title={isTempPasswordRevealed ? 'Hide password' : 'Show password'}
                              >
                                {isTempPasswordRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                              </div>
                              <button type="button" onClick={() => pushToast?.('Email delivery is not configured yet. Share the generated credentials securely.')} className="text-xs font-bold text-primary hover:underline">Send credentials by email</button>
                            </div>
                          ) : (
                            <div className="text-sm font-semibold text-slate-400">—</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold',
                              u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600',
                            )}
                          >
                            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{u.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(u)}
                              className={cn(
                                'h-9 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 font-extrabold text-xs transition-colors inline-flex items-center gap-2',
                                isEditing ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-50',
                              )}
                              disabled={isEditing}
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(u.id)}
                              className="h-9 px-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-extrabold text-xs hover:bg-rose-100 transition-colors inline-flex items-center gap-2"
                              disabled={isEditing}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isEditing ? (
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <td colSpan={7} className="px-6 py-5">
                            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4">
                              <div className="text-[10px] uppercase tracking-wider font-bold text-primary mb-3">Edit user</div>
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                                <div className="lg:col-span-3">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider mb-1">First name</div>
                                  <input
                                    aria-label="Edit user first name"
                                    value={editDraft.first_name}
                                    onChange={(e) => setEditDraft((s) => ({ ...s, first_name: e.target.value }))}
                                    className="w-full h-10 px-3 rounded-t-xl bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary focus:ring-0 outline-none text-sm font-semibold text-slate-800"
                                  />
                                </div>
                                <div className="lg:col-span-3">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider mb-1">Last name</div>
                                  <input
                                    aria-label="Edit user last name"
                                    value={editDraft.last_name}
                                    onChange={(e) => setEditDraft((s) => ({ ...s, last_name: e.target.value }))}
                                    className="w-full h-10 px-3 rounded-t-xl bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary focus:ring-0 outline-none text-sm font-semibold text-slate-800"
                                  />
                                </div>
                                <div className="lg:col-span-3">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider mb-1">Email</div>
                                  <input
                                    aria-label="Edit user email"
                                    value={editDraft.email}
                                    onChange={(e) => setEditDraft((s) => ({ ...s, email: e.target.value }))}
                                    type="email"
                                    className="w-full h-10 px-3 rounded-t-xl bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary focus:ring-0 outline-none text-sm font-semibold text-slate-800"
                                  />
                                </div>
                                <div className="lg:col-span-3">
                                  <div className="flex items-center justify-between gap-3 mb-1">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">New password</div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = generatePassword();
                                        setEditDraft((s) => ({ ...s, password: next }));
                                        setShowEditPassword(true);
                                      }}
                                      className="text-xs font-extrabold text-primary hover:opacity-80"
                                    >
                                      Generate
                                    </button>
                                  </div>
                                  <div className="relative">
                                    <input
                                      value={editDraft.password}
                                      onChange={(e) => setEditDraft((s) => ({ ...s, password: e.target.value }))}
                                      type={showEditPassword ? 'text' : 'password'}
                                      placeholder="Optional"
                                      className="w-full h-10 px-3 pr-10 rounded-t-xl bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary focus:ring-0 outline-none text-sm font-semibold text-slate-800"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!showEditPassword) {
                                          const ok = globalThis.confirm?.('Reveal password text?') ?? true;
                                          if (!ok) return;
                                        }
                                        setShowEditPassword((v) => !v);
                                      }}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                      aria-label={showEditPassword ? 'Hide password' : 'Show password'}
                                      title={showEditPassword ? 'Hide password' : 'Show password'}
                                    >
                                      {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                  </div>
                                </div>

                                <div className="lg:col-span-4">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider mb-1">Role</div>
                                  <CatalogSelect
                                    value={editDraft.role_id}
                                    onChange={(value) => setEditDraft((s) => ({ ...s, role_id: value }))}
                                    options={roles.map((r) => ({ value: String(r.id), label: `${r.name} (#${r.id})` }))}
                                    placeholder="Select role"
                                    emptyLabel="No roles"
                                  />
                                </div>
                                <div className="lg:col-span-5">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider mb-1">Organization</div>
                                  <CatalogSelect
                                    value={editDraft.organization_id}
                                    onChange={(value) => setEditDraft((s) => ({ ...s, organization_id: value }))}
                                    options={orgs.map((o) => ({ value: String(o.id), label: `${o.name} (#${o.id})` }))}
                                    placeholder="No organization"
                                    allowClear
                                    clearLabel="No organization"
                                  />
                                </div>
                                <div className="lg:col-span-3 flex items-center justify-between gap-3">
                                  <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <input
                                      type="checkbox"
                                      checked={editDraft.is_active}
                                      onChange={(e) => setEditDraft((s) => ({ ...s, is_active: e.target.checked }))}
                                    />
                                    Active
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => saveEdit()}
                                      disabled={isSaving || editDraft.first_name.trim() === '' || editDraft.email.trim() === ''}
                                      className="h-10 px-4 rounded-xl bg-primary text-on-primary font-extrabold text-sm hover:opacity-95 transition-opacity disabled:opacity-60 inline-flex items-center gap-2"
                                    >
                                      <Save size={16} />
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => cancelEdit()}
                                      disabled={isSaving}
                                      className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-extrabold text-sm hover:bg-slate-50 transition-colors disabled:opacity-60 inline-flex items-center gap-2"
                                    >
                                      <X size={16} />
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {search.trim() && <p className="border-t border-slate-100 px-6 py-3 text-xs text-slate-500">{filteredRows.length} matching users on this page</p>}
        <DirectoryPagination page={page} totalPages={totalPages} total={total} limit={limit} label="users" disabled={isLoading} onChange={setPage} />
      </section>
    </motion.div>
  );
}
