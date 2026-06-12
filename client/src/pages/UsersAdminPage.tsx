import { Fragment, useContext, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Plus, RefreshCw, Save, Search, Trash2, X, Pencil } from 'lucide-react';
import { AppStoreContext } from '../context/AppStoreContext';
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
  const [showCreatePassword, setShowCreatePassword] = useState(false);
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

  useEffect(() => {
    if (roles.length === 0) return;
    setCreateDraft((s) => (s.role_id ? s : { ...s, role_id: String(roles[0].id) }));
  }, [roles]);

  const canCreate = useMemo(() => {
    if (creating) return false;
    return (
      createDraft.first_name.trim() !== '' &&
      createDraft.email.trim() !== '' &&
      createDraft.password.trim().length >= 6 &&
      createDraft.role_id.trim() !== ''
    );
  }, [createDraft.email, createDraft.first_name, createDraft.password, createDraft.role_id, creating]);

  const create = async () => {
    if (!canCreate) return;
    setCreating(true);
    try {
      const plainPassword = createDraft.password;
      const created = await createUser({
        first_name: createDraft.first_name.trim(),
        last_name: createDraft.last_name.trim() || undefined,
        email: createDraft.email.trim(),
        password: plainPassword,
        role_id: Number(createDraft.role_id),
        organization_id: createDraft.organization_id.trim() ? Number(createDraft.organization_id) : undefined,
        is_active: createDraft.is_active,
      });
      setTempPasswords((s) => ({ ...s, [created.id]: plainPassword }));
      setRevealedTempPassword((s) => ({ ...s, [created.id]: false }));
      pushToast?.('User created.');
      setCreateDraft((s) => ({ ...s, first_name: '', last_name: '', email: '', password: '' }));
      setShowCreatePassword(false);
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-8 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <span className="text-blue-700 font-bold text-sm tracking-widest uppercase">Administration</span>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight font-manrope">Users</h2>
          <p className="text-slate-500 font-medium max-w-2xl">Create users and manage roles, org assignment, and active status.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRefreshTick((x) => x + 1)}
            disabled={isLoading}
            className="h-11 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-60 inline-flex items-center gap-2"
          >
            <RefreshCw size={16} className={cn(isLoading ? 'animate-spin' : '')} />
            Refresh
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <div className="text-[11px] uppercase tracking-widest font-black text-slate-500 mb-3">Create user</div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <input
              value={createDraft.first_name}
              onChange={(e) => setCreateDraft((s) => ({ ...s, first_name: e.target.value }))}
              placeholder="First name"
              className="h-11 px-4 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
            />
            <input
              value={createDraft.last_name}
              onChange={(e) => setCreateDraft((s) => ({ ...s, last_name: e.target.value }))}
              placeholder="Last name"
              className="h-11 px-4 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
            />
            <input
              value={createDraft.email}
              onChange={(e) => setCreateDraft((s) => ({ ...s, email: e.target.value }))}
              placeholder="Email"
              type="email"
              className="h-11 px-4 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800 md:col-span-2"
            />
            <div className="relative">
              <input
                value={createDraft.password}
                onChange={(e) => setCreateDraft((s) => ({ ...s, password: e.target.value }))}
                placeholder="Password (min 6)"
                type={showCreatePassword ? 'text' : 'password'}
                className="h-11 w-full px-4 pr-11 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
              />
              <button
                type="button"
                onClick={() => {
                  if (!showCreatePassword) {
                    const ok = globalThis.confirm?.('Reveal password text?') ?? true;
                    if (!ok) return;
                  }
                  setShowCreatePassword((v) => !v);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                aria-label={showCreatePassword ? 'Hide password' : 'Show password'}
                title={showCreatePassword ? 'Hide password' : 'Show password'}
              >
                {showCreatePassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-3 md:col-span-6">
              <select
                value={createDraft.role_id}
                onChange={(e) => setCreateDraft((s) => ({ ...s, role_id: e.target.value }))}
                disabled={metaLoading}
                className="h-11 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 outline-none disabled:opacity-60 w-full md:w-64"
              >
                {roles.length === 0 ? <option value="">No roles</option> : null}
                {roles.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name} (#{r.id})
                  </option>
                ))}
              </select>
              <select
                value={createDraft.organization_id}
                onChange={(e) => setCreateDraft((s) => ({ ...s, organization_id: e.target.value }))}
                disabled={metaLoading}
                className="h-11 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 outline-none disabled:opacity-60 w-full md:w-72"
              >
                <option value="">No organization</option>
                {orgs.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    {o.name} (#{o.id})
                  </option>
                ))}
              </select>
              <label className="h-11 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 inline-flex items-center gap-2 w-full md:w-auto">
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

        <div className="p-5 border-b border-slate-100 bg-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search users…"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-700"
                autoComplete="off"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filterOrgId}
                onChange={(e) => {
                  setFilterOrgId(e.target.value);
                  setPage(1);
                }}
                disabled={metaLoading}
                className="h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 outline-none disabled:opacity-60"
              >
                <option value="all">All orgs</option>
                {orgs.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    {o.name}
                  </option>
                ))}
              </select>
              <select
                value={String(limit)}
                onChange={(e) => {
                  const next = Number(e.target.value) || 20;
                  setLimit(next);
                  setPage(1);
                }}
                className="h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 outline-none"
              >
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-5 border-b border-slate-100 bg-rose-50 text-rose-700 font-semibold text-sm">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500">User</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500">Role</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500">Organization</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500">Password</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500">Status</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-black text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-sm font-semibold text-slate-500">
                    Loading users…
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-sm font-semibold text-slate-500">
                    No users found.
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
                          isEditing ? 'bg-slate-50' : 'hover:bg-slate-50',
                        )}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-800">{fullName}</div>
                          <div className="text-xs text-slate-500 font-semibold mt-1">{u.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-slate-700">{u.role?.name ?? `#${u.role_id}`}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-slate-700">{u.organization?.name ?? '—'}</div>
                        </td>
                        <td className="px-6 py-4">
                          {tempPassword ? (
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
                          ) : (
                            <div className="text-sm font-semibold text-slate-400">—</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black border',
                              u.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200',
                            )}
                          >
                            {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
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
                          <td colSpan={6} className="px-6 py-5">
                            <div className="bg-white border border-slate-200 rounded-2xl p-4">
                              <div className="text-[11px] uppercase tracking-widest font-black text-slate-500 mb-3">Edit user</div>
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                                <div className="lg:col-span-3">
                                  <div className="text-xs font-bold text-slate-600 mb-1">First name</div>
                                  <input
                                    value={editDraft.first_name}
                                    onChange={(e) => setEditDraft((s) => ({ ...s, first_name: e.target.value }))}
                                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
                                  />
                                </div>
                                <div className="lg:col-span-3">
                                  <div className="text-xs font-bold text-slate-600 mb-1">Last name</div>
                                  <input
                                    value={editDraft.last_name}
                                    onChange={(e) => setEditDraft((s) => ({ ...s, last_name: e.target.value }))}
                                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
                                  />
                                </div>
                                <div className="lg:col-span-3">
                                  <div className="text-xs font-bold text-slate-600 mb-1">Email</div>
                                  <input
                                    value={editDraft.email}
                                    onChange={(e) => setEditDraft((s) => ({ ...s, email: e.target.value }))}
                                    type="email"
                                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
                                  />
                                </div>
                                <div className="lg:col-span-3">
                                  <div className="flex items-center justify-between gap-3 mb-1">
                                    <div className="text-xs font-bold text-slate-600">New password</div>
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
                                      className="w-full h-10 px-3 pr-10 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
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
                                  <div className="text-xs font-bold text-slate-600 mb-1">Role</div>
                                  <select
                                    value={editDraft.role_id}
                                    onChange={(e) => setEditDraft((s) => ({ ...s, role_id: e.target.value }))}
                                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 outline-none"
                                  >
                                    {roles.map((r) => (
                                      <option key={r.id} value={String(r.id)}>
                                        {r.name} (#{r.id})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="lg:col-span-5">
                                  <div className="text-xs font-bold text-slate-600 mb-1">Organization</div>
                                  <select
                                    value={editDraft.organization_id}
                                    onChange={(e) => setEditDraft((s) => ({ ...s, organization_id: e.target.value }))}
                                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 outline-none"
                                  >
                                    <option value="">No organization</option>
                                    {orgs.map((o) => (
                                      <option key={o.id} value={String(o.id)}>
                                        {o.name} (#{o.id})
                                      </option>
                                    ))}
                                  </select>
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

        <div className="p-5 border-t border-slate-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-xs font-bold text-slate-500">
            Total: <span className="text-slate-900">{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="h-11 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-extrabold text-sm hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              Prev
            </button>
            <div className="text-sm font-extrabold text-slate-700">
              {page} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="h-11 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-extrabold text-sm hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
