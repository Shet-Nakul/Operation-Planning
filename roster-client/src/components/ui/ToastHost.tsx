import { useEffect, useState } from 'react';
import type { ToastState } from '../../context/AppStoreContext';

export function ToastHost({ toast }: { toast: ToastState | null }) {
  const [progressPct, setProgressPct] = useState(100);

  useEffect(() => {
    if (!toast) return;
    setProgressPct(100);

    const tick = () => {
      const elapsed = Date.now() - toast.createdAt;
      const duration = Math.max(1, toast.durationMs);
      const remainingRatio = Math.max(0, 1 - elapsed / duration);
      setProgressPct(remainingRatio * 100);
    };

    tick();
    const interval = setInterval(tick, 50);
    return () => clearInterval(interval);
  }, [toast?.id]);

  if (!toast) return null;

  const tone =
    toast.variant === 'error'
      ? { container: 'bg-error text-white', bar: 'bg-white/90' }
      : toast.variant === 'info'
        ? { container: 'bg-primary text-on-primary', bar: 'bg-white/90' }
        : { container: 'bg-emerald-800 text-white', bar: 'bg-white/90' };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-[min(92vw,30rem)] rounded-2xl shadow-xl overflow-hidden ${tone.container}`}
    >
      <div className="px-5 py-4 text-sm font-semibold text-center">{toast.message}</div>
      <div className="h-1 w-full bg-white/25">
        <div className={`h-full ${tone.bar} transition-[width] duration-75`} style={{ width: `${progressPct}%` }} />
      </div>
    </div>
  );
}
