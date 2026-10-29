import { useContext, useState } from 'react';
import { motion } from 'motion/react';
import { AppStoreContext } from '../context/AppStoreContext';
import { authLogin, type AuthUser } from '../lib/api';

const logo = new URL('../assets/karmarkar_color_logo.png', import.meta.url).href;

type AuthPageProps = {
  onAuthenticated: (user: AuthUser | null) => void;
};

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  const app = useContext(AppStoreContext);
  const pushToast = app?.pushToast;

  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
  const [error, setError] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const canSubmit = status === 'idle' && loginForm.email.trim() !== '' && loginForm.password.trim() !== '';

  const submit = async () => {
    if (!canSubmit) return;
    setStatus('submitting');
    setError(null);
    try {
      const res = await authLogin({ email: loginForm.email.trim(), password: loginForm.password });
      onAuthenticated(res.user ?? null);
      pushToast?.('Signed in.');
    } catch (e: any) {
      setError(e?.message ?? 'Request failed');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative mb-3 h-20 w-20 shrink-0 overflow-hidden">
            <img
              src={logo}
              alt="Karmaker logo"
              className="absolute left-1/2 top-1/2 w-[246%] max-w-none -translate-x-1/2 -translate-y-1/2"
              style={{ clipPath: 'polygon(50.1% 17.2%, 70.4% 83.5%, 29.7% 83.5%)' }}
            />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-headline">Karmaker</h1>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 pt-7 pb-5 border-b border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-headline">Sign in</h2>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              Manage resources, users, and planning workflows.
            </p>
          </div>

          {error && (
            <div className="px-6 py-4 border-b border-slate-100 bg-rose-50 text-rose-700 text-sm font-semibold">
              {error}
            </div>
          )}

          <div className="p-6 space-y-4">
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

            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => submit()}
              className="w-full h-11 rounded-xl bg-primary text-on-primary font-extrabold text-sm hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? 'Please wait…' : 'Sign in'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

