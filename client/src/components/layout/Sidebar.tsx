import { Activity, ScrollText, FileText, LayoutDashboard, PlusSquare, Settings, Users, Briefcase, Package, BarChart3, Building2, KeyRound, Pill, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '../../lib/utils';

export type AppTabId =
  | 'surgery-control-center'
  | 'surgery-analytics'
  | 'requests'
  | 'contracts'
  | 'staff'
  | 'hr-pool'
  | 'non-human-pool'
  | 'non-renewable-resources'
  | 'admin-organizations'
  | 'admin-users'
  | 'admin-roles'
  | 'settings'
  | 'activity-log';

type SidebarProps = {
  activeTab: AppTabId;
  onSelectTab: (id: AppTabId) => void;
  orgName?: string;
  collapsed: boolean;
  onToggle: () => void;
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
  { id: 'admin-organizations', label: 'Organizations', icon: Building2 },
  { id: 'admin-users', label: 'Users', icon: Users },
  { id: 'admin-roles', label: 'Roles', icon: KeyRound },
];

export function Sidebar({ activeTab, onSelectTab, orgName, collapsed, onToggle }: SidebarProps) {
  return (
    <aside className={cn('bg-white border-r border-surface-container-high h-screen fixed left-0 top-0 z-40 flex flex-col py-6 px-3 transition-[width] duration-300 ease-in-out motion-reduce:transition-none', collapsed ? 'w-20' : 'w-72')}>
      <div className="mb-8 flex items-center justify-between px-1">
        <div aria-hidden={collapsed} className={cn('flex items-center gap-3 min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out motion-reduce:transition-none', collapsed ? 'max-w-0 opacity-0' : 'max-w-48 opacity-100')}>
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shrink-0">
            <Activity size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-black text-primary leading-none font-headline truncate">{orgName || 'Mercy Central'}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Surgical Unit A</p>
          </div>
        </div>
        <button type="button" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="shrink-0 p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-primary">
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto">
        <div className="space-y-0.5">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-3 pl-[15px] pr-2 py-3 rounded-lg transition-colors font-medium text-sm text-left',
                activeTab === item.id
                  ? 'bg-primary/8 text-primary shadow-sm border-l-[3px] border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border-l-[3px] border-transparent',
              )}
            >
              <item.icon size={20} className={cn('shrink-0', activeTab === item.id ? 'text-primary' : 'text-on-surface-variant/70')} />
              <span aria-hidden="true" className={cn('overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out motion-reduce:transition-none', collapsed ? 'max-w-0 opacity-0' : 'max-w-48 opacity-100')}>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <p aria-hidden={collapsed} className={cn('px-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 overflow-hidden whitespace-nowrap transition-[max-height,opacity] duration-300 ease-in-out motion-reduce:transition-none', collapsed ? 'max-h-0 opacity-0' : 'max-h-6 opacity-100')}>Resource Library</p>
          <div className="space-y-0.5">
            {resourceLibraryItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-label={item.label}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'w-full flex items-center gap-3 pl-[15px] pr-2 py-3 rounded-lg transition-colors font-medium text-sm text-left',
                  activeTab === item.id
                    ? 'bg-primary/8 text-primary shadow-sm border-l-[3px] border-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border-l-[3px] border-transparent',
                )}
              >
                <item.icon size={20} className={cn('shrink-0', activeTab === item.id ? 'text-primary' : 'text-on-surface-variant/70')} />
                <span aria-hidden="true" className={cn('overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out motion-reduce:transition-none', collapsed ? 'max-w-0 opacity-0' : 'max-w-48 opacity-100')}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p aria-hidden={collapsed} className={cn('px-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 overflow-hidden whitespace-nowrap transition-[max-height,opacity] duration-300 ease-in-out motion-reduce:transition-none', collapsed ? 'max-h-0 opacity-0' : 'max-h-6 opacity-100')}>Administration</p>
          <div className="space-y-0.5">
            {adminItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-label={item.label}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'w-full flex items-center gap-3 pl-[15px] pr-2 py-3 rounded-lg transition-colors font-medium text-sm text-left',
                  activeTab === item.id
                    ? 'bg-primary/8 text-primary shadow-sm border-l-[3px] border-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border-l-[3px] border-transparent',
                )}
              >
                <item.icon size={20} className={cn('shrink-0', activeTab === item.id ? 'text-primary' : 'text-on-surface-variant/70')} />
                <span aria-hidden="true" className={cn('overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out motion-reduce:transition-none', collapsed ? 'max-w-0 opacity-0' : 'max-w-48 opacity-100')}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="mt-auto pt-4 border-t border-surface-container space-y-0.5">
        <button
          type="button"
          onClick={() => onSelectTab('settings')}
          aria-label="Settings"
          title={collapsed ? 'Settings' : undefined}
          className={cn(
            "w-full flex items-center gap-3 pl-[15px] pr-2 py-3 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'settings' 
              ? 'bg-primary/8 text-primary shadow-sm border-l-[3px] border-primary'
              : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border-l-[3px] border-transparent"
          )}
        >
          <Settings size={18} className={cn('shrink-0', activeTab === 'settings' ? 'text-primary' : 'text-on-surface-variant/70')} />
          <span aria-hidden="true" className={cn('overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out motion-reduce:transition-none', collapsed ? 'max-w-0 opacity-0' : 'max-w-48 opacity-100')}>Settings</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('activity-log')}
          aria-label="Activity Log"
          title={collapsed ? 'Activity Log' : undefined}
          className={cn(
            "w-full flex items-center gap-3 pl-[15px] pr-2 py-3 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'activity-log'
              ? 'bg-primary/8 text-primary shadow-sm border-l-[3px] border-primary'
              : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border-l-[3px] border-transparent"
          )}
        >
          <ScrollText size={18} className={cn('shrink-0', activeTab === 'activity-log' ? 'text-primary' : 'text-on-surface-variant/70')} />
          <span aria-hidden="true" className={cn('overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out motion-reduce:transition-none', collapsed ? 'max-w-0 opacity-0' : 'max-w-48 opacity-100')}>Activity Log</span>
        </button>
      </div>
    </aside>
  );
}
