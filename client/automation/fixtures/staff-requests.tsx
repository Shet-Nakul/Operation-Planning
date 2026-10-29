import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import StaffPortalPage from '../../src/pages/StaffPortalPage';
import SupervisorRequestsPage from '../../src/pages/SupervisorRequestsPage';
import { Sidebar, type AppTabId } from '../../src/components/layout/Sidebar';
import { usePendingStaffRequests } from '../../src/hooks/usePendingStaffRequests';
import { readAuthSession } from '../../src/services/api-core';
import ProfileDetail from '../../src/components/staff/ProfileDetail';
import { AppStoreProvider } from '../../src/context/AppStoreContext';
import '../../src/index.css';

function Fixture() {
  const user = readAuthSession().user!;
  const notifications = usePendingStaffRequests(String(user.id));
  const [tab, setTab] = useState<AppTabId>('staff-approvals');
  const [collapsed, setCollapsed] = useState(false);
  if (new URLSearchParams(window.location.search).has('admin-calendar')) return <AppStoreProvider>
    <ProfileDetail member={{
      id: '1', employeeId: '#STAFF-1', name: 'Test Staff', email: 'staff@example.test',
      title: 'Nurse', supervisor: 'Test Supervisor', contractId: '', specialization: [],
      status: 'Active', skills: [], weeklySchedule: [], effortRoles: [], pools: [],
    }} onUpdate={() => {}} canEdit={false} />
  </AppStoreProvider>;
  if (user.role === 'USER') return <StaffPortalPage orgName="Test Hospital" onLogout={() => {}} pendingApprovals={notifications.count} notificationError={notifications.error} />;
  return <>
    <Sidebar activeTab={tab} onSelectTab={setTab} collapsed={collapsed} onToggle={() => setCollapsed(previous => !previous)} onLogout={() => {}} role="ADMIN" pendingApprovals={notifications.count} />
    <main className={collapsed ? 'ml-20 p-8' : 'ml-72 p-8'}>{tab === 'staff-approvals' && <SupervisorRequestsPage />}</main>
  </>;
}

createRoot(document.getElementById('root')!).render(<Fixture />);
