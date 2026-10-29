import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import UsersAdminPage from '../../src/pages/UsersAdminPage';
import ActivityLogPage from '../../src/pages/ActivityLogPage';
import { Sidebar, type AppTabId } from '../../src/components/layout/Sidebar';
import '../../src/index.css';

function Fixture() {
  const [tab, setTab] = useState<AppTabId>(new URLSearchParams(location.search).get('page') === 'activity' ? 'activity-log' : 'admin-users');
  const [collapsed, setCollapsed] = useState(false);
  return <>
    <Sidebar activeTab={tab} onSelectTab={setTab} collapsed={collapsed} onToggle={() => setCollapsed(previous => !previous)} onLogout={() => {}} role="ADMIN" />
    <main className={collapsed ? 'ml-20 min-w-0 p-4 sm:p-8' : 'ml-72 min-w-0 p-4 sm:p-8'}>
      {tab === 'activity-log' ? <ActivityLogPage /> : <UsersAdminPage />}
    </main>
  </>;
}

createRoot(document.getElementById('root')!).render(<Fixture />);
