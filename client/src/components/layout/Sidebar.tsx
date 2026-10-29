import { Activity, ScrollText, FileText, LayoutDashboard, PlusSquare, Settings, Users, Briefcase, Package, BarChart3, Building2, Pill, PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';

const karmarkerLogo = new URL('../../assets/karmarkar_color_logo.png', import.meta.url).href;

export type AppTabId =
  | 'surgery-control-center'
  | 'surgery-analytics'
  | 'requests'
  | 'contracts'
  | 'staff'
  | 'staff-approvals'
  | 'hr-pool'
  | 'non-human-pool'
  | 'non-renewable-resources'
  | 'admin-organizations'
  | 'admin-users'
  | 'settings'
  | 'activity-log';

type SidebarProps = {
  activeTab: AppTabId;
  onSelectTab: (id: AppTabId) => void;
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
  role?: string;
  isSupervisor?: boolean;
  pendingApprovals?: number;
};

const mainNavItems: { id: AppTabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'surgery-analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'surgery-control-center', label: 'Current Status', icon: Activity },
  { id: 'requests', label: 'Surgery Requests', icon: PlusSquare },
];

const resourceLibraryItems: { id: AppTabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'contracts', label: 'Staff Contracts', icon: FileText },
  { id: 'staff', label: 'Staff Library', icon: Users },
  { id: 'hr-pool', label: 'Human Resource Pool', icon: Briefcase },
  { id: 'non-human-pool', label: 'Equipment & Assets', icon: Package },
  { id: 'non-renewable-resources', label: 'Medicine Inventory', icon: Pill },
];

const adminItems: { id: AppTabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'admin-organizations', label: 'Organization', icon: Building2 },
  { id: 'admin-users', label: 'Users', icon: Users },
  { id: 'activity-log', label: 'Activity Log', icon: ScrollText },
];

export function Sidebar({ activeTab, onSelectTab, collapsed, onToggle, onLogout, role = 'ADMIN', isSupervisor = false, pendingApprovals = 0 }: SidebarProps) {
  const visibleAdminItems = [
    ...(role === 'USER' ? [] : adminItems),
    ...(role === 'ADMIN' || isSupervisor ? [{ id: 'staff-approvals' as const, label: 'My Team', icon: Users }] : []),
  ];
  const buttonSpacing = collapsed ? 'h-8 [@media(min-height:660px)]:h-9 [@media(min-height:740px)]:h-10 justify-center gap-0 pl-0 pr-[3px] py-0' : 'gap-3 pl-[15px] pr-2 py-3';
  const footerButtonSpacing = collapsed ? 'h-8 justify-center gap-0 pl-0 pr-[3px] py-0' : buttonSpacing;
  const iconSize = collapsed ? 18 : 20;
  return (
    <aside className={cn('bg-white border-r border-surface-container-high h-screen fixed left-0 top-0 z-40 flex flex-col px-3 transition-[width] duration-300 ease-in-out motion-reduce:transition-none', collapsed ? 'w-20 py-2' : 'w-72 py-6')}>
      <div className={cn('shrink-0 flex items-center px-1', collapsed ? 'mb-2 [@media(min-height:740px)]:mb-4 justify-center' : 'mb-8')}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('relative shrink-0 overflow-hidden', collapsed ? 'w-12 aspect-[1.12]' : 'w-12 h-12')}>
            <img
              src={karmarkerLogo}
              alt="Karmarker logo"
              className={cn('absolute left-1/2 top-1/2 h-auto max-w-none -translate-x-1/2 -translate-y-1/2', collapsed ? 'w-[240%]' : 'w-[246%]')}
              style={collapsed ? undefined : { clipPath: 'polygon(50.1% 17.2%, 70.4% 83.5%, 29.7% 83.5%)' }}
            />
          </div>
          {!collapsed && <h3 className="text-[27px] font-black text-primary leading-none font-headline truncate">Karmarker</h3>}
        </div>
      </div>

      <nav
        className={cn('flex-1 min-h-0 overflow-x-hidden', collapsed ? 'space-y-2 [@media(min-height:660px)]:space-y-3 [@media(min-height:740px)]:space-y-4 overflow-y-hidden' : 'space-y-6 overflow-y-auto')}
      >
        <div className="space-y-0.5">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
              className={cn(
                'w-full flex items-center rounded-lg transition-colors font-medium text-sm text-left',
                buttonSpacing,
                activeTab === item.id
                  ? 'bg-primary/8 text-primary shadow-sm border-l-[3px] border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border-l-[3px] border-transparent',
              )}
            >
              <item.icon size={iconSize} className={cn('shrink-0', activeTab === item.id ? 'text-primary' : 'text-on-surface-variant/70')} />
              <span aria-hidden="true" className={cn('overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out motion-reduce:transition-none', collapsed ? 'max-w-0 opacity-0' : 'max-w-48 opacity-100')}>{item.label}</span>
            </button>
          ))}
        </div>

        <div className={collapsed ? 'space-y-0' : 'space-y-2'}>
          <p aria-hidden={collapsed} className={cn('px-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 overflow-hidden whitespace-nowrap transition-[max-height,opacity] duration-300 ease-in-out motion-reduce:transition-none', collapsed ? 'hidden' : 'max-h-6 opacity-100')}>Resource Library</p>
          <div className="space-y-0.5">
            {resourceLibraryItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-label={item.label}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'w-full flex items-center rounded-lg transition-colors font-medium text-sm text-left',
                  buttonSpacing,
                  activeTab === item.id
                    ? 'bg-primary/8 text-primary shadow-sm border-l-[3px] border-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border-l-[3px] border-transparent',
                )}
              >
                <item.icon size={iconSize} className={cn('shrink-0', activeTab === item.id ? 'text-primary' : 'text-on-surface-variant/70')} />
                <span aria-hidden="true" className={cn('overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out motion-reduce:transition-none', collapsed ? 'max-w-0 opacity-0' : 'max-w-48 opacity-100')}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {visibleAdminItems.length > 0 && <div className={collapsed ? 'space-y-0' : 'space-y-2'}>
          <p aria-hidden={collapsed} className={cn('px-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 overflow-hidden whitespace-nowrap transition-[max-height,opacity] duration-300 ease-in-out motion-reduce:transition-none', collapsed ? 'hidden' : 'max-h-6 opacity-100')}>Administration</p>
          <div className="space-y-0.5">
            {visibleAdminItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-label={item.id === 'staff-approvals' && pendingApprovals > 0 ? `${item.label}, ${pendingApprovals} requests require approval` : item.label}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'relative w-full flex items-center rounded-lg transition-colors font-medium text-sm text-left',
                  buttonSpacing,
                  activeTab === item.id
                    ? 'bg-primary/8 text-primary shadow-sm border-l-[3px] border-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border-l-[3px] border-transparent',
                )}
              >
                <item.icon size={iconSize} className={cn('shrink-0', activeTab === item.id ? 'text-primary' : 'text-on-surface-variant/70')} />
                {item.id === 'staff-approvals' && pendingApprovals > 0 && <span className={cn('rounded-full bg-red-600 text-white min-w-5 h-5 px-1 text-[10px] font-bold flex items-center justify-center', collapsed ? 'absolute top-0 right-0' : 'order-last ml-auto')}>{pendingApprovals}</span>}
                <span aria-hidden="true" className={cn('overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out motion-reduce:transition-none', collapsed ? 'max-w-0 opacity-0' : 'max-w-48 opacity-100')}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>}
      </nav>

      <div className={cn('mt-auto shrink-0 border-t border-surface-container space-y-0.5', collapsed ? 'pt-2' : 'pt-4')}>
        <button
          type="button"
          onClick={() => {
            if (globalThis.confirm('Are you sure you want to log out?')) onLogout();
          }}
          aria-label="Log out"
          title="Log out"
          className={cn('w-full flex items-center rounded-lg text-sm font-medium transition-colors text-error hover:bg-error/8 border-l-[3px] border-transparent', footerButtonSpacing)}
        >
          <LogOut size={iconSize} className="shrink-0" />
          <span aria-hidden="true" className={cn('overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out motion-reduce:transition-none', collapsed ? 'max-w-0 opacity-0' : 'max-w-48 opacity-100')}>Log out</span>
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn('w-full flex items-center rounded-lg text-sm font-medium transition-colors text-on-surface-variant hover:bg-surface-container-low hover:text-primary border-l-[3px] border-transparent', footerButtonSpacing)}
        >
          {collapsed ? <PanelLeftOpen size={iconSize} className="shrink-0" /> : <PanelLeftClose size={iconSize} className="shrink-0" />}
          <span aria-hidden="true" className={cn('overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out motion-reduce:transition-none', collapsed ? 'max-w-0 opacity-0' : 'max-w-48 opacity-100')}>Collapse sidebar</span>
        </button>
      </div>
    </aside>
  );
}
