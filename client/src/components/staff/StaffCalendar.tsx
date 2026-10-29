import { useEffect, useState } from 'react';
import { getCatalogShifts, type ServerShift } from '../../services/api-catalogs';
import { getAllRosterings, mergeEmployeeRosterings, type ServerEmployeeRosteringByDate } from '../../services/api-rosterings';
import { getStaffRequests } from '../../services/api-staff-requests';
import EmployeeCalendar from './EmployeeCalendar';

export default function StaffCalendar({ employeeId, organizationId }: { employeeId: string; organizationId: number }) {
  const [assignments, setAssignments] = useState<ServerEmployeeRosteringByDate>({});
  const [shifts, setShifts] = useState<ServerShift[]>([]);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([getAllRosterings({ orgId: organizationId }), getCatalogShifts({ orgId: organizationId }), getStaffRequests(employeeId.replace(/^#/, ''))])
      .then(([rows, catalog, requests]) => {
        if (cancelled) return;
        const merged = mergeEmployeeRosterings(rows, employeeId);
        for (const request of requests.filter(row => row.staff_id === employeeId.replace(/^#/, '') && row.status === 'APPROVED').reverse()) {
          const date = new Date(`${request.start_date}T00:00:00Z`);
          const end = new Date(`${request.end_date}T00:00:00Z`);
          while (date <= end) {
            const iso = date.toISOString().slice(0, 10);
            merged[iso] = { shift: request.metadata?.swap ? request.metadata.preferred_shift : request.shift || 'V', pool: merged[iso]?.pool };
            date.setUTCDate(date.getUTCDate() + 1);
          }
        }
        setAssignments(merged);
        setShifts(catalog);
      })
      .catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to load employee calendar.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [employeeId, organizationId]);

  return <EmployeeCalendar assignments={assignments} shifts={shifts} month={month} selectedDate={selectedDate} loading={loading} error={error} onMonthChange={setMonth} onSelectDate={setSelectedDate} />;
}
