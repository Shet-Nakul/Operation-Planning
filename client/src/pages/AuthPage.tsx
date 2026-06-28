import { useContext, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, UserPlus } from 'lucide-react';
import { AppStoreContext } from '../context/AppStoreContext';
import { authLogin, authRegister, type AuthUser } from '../lib/api';
import { cn } from '../lib/utils';

type AuthPageProps = {
  onAuthenticated: (user: AuthUser | null) => void;
};

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  const app = useContext(AppStoreContext);
  const pushToast = app?.pushToast;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
  const [error, setError] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role_id: '1',
    organization_id: '',
  });

  const canSubmit = useMemo(() => {
    if (status !== 'idle') return false;
    if (mode === 'login') return loginForm.email.trim() !== '' && loginForm.password.trim() !== '';
    return (
      registerForm.first_name.trim() !== '' &&
      registerForm.email.trim() !== '' &&
      registerForm.password.trim().length >= 6 &&
      String(registerForm.role_id).trim() !== ''
    );
  }, [loginForm.email, loginForm.password, mode, registerForm.email, registerForm.first_name, registerForm.password, registerForm.role_id, status]);

  const submit = async () => {
    if (!canSubmit) return;
    setStatus('submitting');
    setError(null);
    try {
      if (mode === 'login') {
        const res = await authLogin({ email: loginForm.email.trim(), password: loginForm.password });
        onAuthenticated(res.user ?? null);
        pushToast?.('Signed in.');
      } else {
        const role_id = Number(registerForm.role_id);
        const organization_id = registerForm.organization_id.trim() ? Number(registerForm.organization_id) : undefined;
        await authRegister({
          first_name: registerForm.first_name.trim(),
          last_name: registerForm.last_name.trim() || undefined,
          email: registerForm.email.trim(),
          password: registerForm.password,
          role_id,
          organization_id,
        });
        setMode('login');
        setLoginForm({ email: registerForm.email.trim(), password: '' });
        setRegisterForm((s) => ({ ...s, password: '' }));
        pushToast?.('Registration complete. Please sign in.');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Request failed');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 pt-7 pb-5 border-b border-slate-100">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-headline truncate">
                  Operation Planning
                </h1>
                <p className="text-sm text-slate-500 font-semibold mt-1">
                  Sign in to manage resources, users, and planning workflows.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={cn(
                  'h-10 rounded-lg text-sm font-extrabold transition-colors inline-flex items-center justify-center gap-2',
                  mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900',
                )}
              >
                <LogIn size={16} />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={cn(
                  'h-10 rounded-lg text-sm font-extrabold transition-colors inline-flex items-center justify-center gap-2',
                  mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900',
                )}
              >
                <UserPlus size={16} />
                Register
              </button>
            </div>
          </div>

          {error && (
            <div className="px-6 py-4 border-b border-slate-100 bg-rose-50 text-rose-700 text-sm font-semibold">
              {error}
            </div>
          )}

          <div className="p-6 space-y-4">
            {mode === 'login' ? (
              <>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Email</label>
                  <input
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((s) => ({ ...s, email: e.target.value }))}
                    type="email"
                    autoComplete="email"
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
                    placeholder="admin@centralhospital.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Password</label>
                  <input
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((s) => ({ ...s, password: e.target.value }))}
                    type="password"
                    autoComplete="current-password"
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
                    placeholder="••••••••"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">First name</label>
                    <input
                      value={registerForm.first_name}
                      onChange={(e) => setRegisterForm((s) => ({ ...s, first_name: e.target.value }))}
                      type="text"
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Last name</label>
                    <input
                      value={registerForm.last_name}
                      onChange={(e) => setRegisterForm((s) => ({ ...s, last_name: e.target.value }))}
                      type="text"
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Email</label>
                  <input
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm((s) => ({ ...s, email: e.target.value }))}
                    type="email"
                    autoComplete="email"
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Password</label>
                  <input
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm((s) => ({ ...s, password: e.target.value }))}
                    type="password"
                    autoComplete="new-password"
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Role ID</label>
                    <input
                      value={registerForm.role_id}
                      onChange={(e) => setRegisterForm((s) => ({ ...s, role_id: e.target.value }))}
                      type="number"
                      min={1}
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Org ID</label>
                    <input
                      value={registerForm.organization_id}
                      onChange={(e) => setRegisterForm((s) => ({ ...s, organization_id: e.target.value }))}
                      type="number"
                      min={1}
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => submit()}
              className="w-full h-11 rounded-xl bg-primary text-on-primary font-extrabold text-sm hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

