import {
  Activity,
  FileText,
  HelpCircle,
  LayoutDashboard,
  PlusSquare,
  Settings,
  ShieldAlert,
  Users,
  Briefcase,
  Package,
  BarChart3,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type AppTabId =
  | 'surgery-control-center'
  | 'surgery-analytics'
  | 'requests'
  | 'contracts'
  | 'staff'
  | 'hr-pool'
  | 'non-human-pool'
  | 'settings';

type SidebarProps = {
  activeTab: AppTabId;
  onSelectTab: (id: AppTabId) => void;
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
];

export function Sidebar({ activeTab, onSelectTab }: SidebarProps) {
  return (
    <aside className="w-72 bg-white border-r border-surface-container-high h-screen fixed left-0 top-0 z-40 flex flex-col py-6 px-3">
      <div className="px-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-primary leading-none font-headline">Mercy Central</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Surgical Unit A</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto">
        <div className="space-y-0.5">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm text-left',
                activeTab === item.id
                  ? 'bg-primary/8 text-primary shadow-sm border-l-[3px] border-primary -ml-px pl-[13px]'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border-l-[3px] border-transparent',
              )}
            >
              <item.icon size={20} className={cn(activeTab === item.id ? 'text-primary' : 'text-on-surface-variant/70')} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Resource Library</p>
          <div className="space-y-0.5">
            {resourceLibraryItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm text-left',
                  activeTab === item.id
                    ? 'bg-primary/8 text-primary shadow-sm border-l-[3px] border-primary -ml-px pl-[13px]'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border-l-[3px] border-transparent',
                )}
              >
                <item.icon size={20} className={cn(activeTab === item.id ? 'text-primary' : 'text-on-surface-variant/70')} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="mt-auto pt-4 border-t border-surface-container space-y-0.5">
        <button
          type="button"
          onClick={() => onSelectTab('settings')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'settings' 
              ? "bg-primary/8 text-primary shadow-sm border-l-[3px] border-primary -ml-px pl-[13px]" 
              : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border-l-[3px] border-transparent"
          )}
        >
          <Settings size={18} className={cn(activeTab === 'settings' ? 'text-primary' : 'text-on-surface-variant/70')} />
          Settings
        </button>
        <button
          type="button"
          className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low rounded-lg text-sm font-medium transition-colors"
        >
          <HelpCircle size={18} />
          Support
        </button>
        <button
          type="button"
          className="w-full mt-2 bg-error-container text-on-error-container px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <ShieldAlert size={16} />
          Emergency Lockout
        </button>
      </div>
    </aside>
  );
}
