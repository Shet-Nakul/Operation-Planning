import { useEffect, useState } from 'react';
import { getStaffRequests } from '../services/api-staff-requests';

export function usePendingStaffRequests(accountKey: string | null) {
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    let sequence = 0;
    setCount(0);
    setError('');
    if (!accountKey) return;
    const refresh = async () => {
      const current = ++sequence;
      try {
        const requests = await getStaffRequests();
        if (!cancelled && current === sequence) {
          setCount(requests.filter(request => request.status === 'PENDING' && request.can_review).length);
          setError('');
        }
      } catch (reason) {
        if (!cancelled && current === sequence) setError(reason instanceof Error ? reason.message : 'Unable to load approval notifications');
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    window.addEventListener('staff-requests-changed', refresh);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('staff-requests-changed', refresh);
    };
  }, [accountKey]);
  return { count, error };
}
