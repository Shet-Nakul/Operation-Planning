import { Bell, HelpCircle, Hospital, MessageSquare, PlusSquare } from 'lucide-react';

export type ShellUser = {
  name: string;
  role: string;
  avatar: string;
};

type TopNavProps = {
  sidebarCollapsed: boolean;
  hospitalName: string;
  user: ShellUser;
  showNewRequest?: boolean;
  onNewRequest?: () => void;
};

export function TopNav({ sidebarCollapsed, hospitalName, user, showNewRequest, onNewRequest }: TopNavProps) {
  return (
    <header className={`fixed top-0 ${sidebarCollapsed ? 'left-20' : 'left-72'} right-0 h-16 z-50 bg-white/85 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 border-b border-surface-container-high transition-[left] duration-300 ease-in-out motion-reduce:transition-none`}>
      <div className="flex items-center gap-2 flex-1 min-w-0 pr-4">
        <Hospital size={22} className="shrink-0 text-primary" aria-hidden="true" />
        <span title={hospitalName} className="text-lg lg:text-xl font-bold text-primary font-headline truncate">{hospitalName}</span>
      </div>

      <div className="flex items-center gap-4 lg:gap-6 shrink-0">
        <div className="flex items-center gap-3 text-on-surface-variant/70">
          <button type="button" className="hover:text-primary transition-colors relative p-1 rounded-full hover:bg-surface-container-low">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-white" />
          </button>
          <button type="button" className="hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container-low">
            <MessageSquare size={20} />
          </button>
          <button type="button" className="md:hidden p-1 rounded-full hover:bg-surface-container-low">
            <HelpCircle size={20} />
          </button>
        </div>

        {showNewRequest && (
          <button
            type="button"
            onClick={() => onNewRequest?.()}
            className="hidden sm:inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-semibold tracking-tight hover:opacity-90 transition-all"
          >
            <PlusSquare size={18} />
            New Request
          </button>
        )}

        <div className="hidden sm:flex items-center gap-3 border-l border-surface-container-high pl-4 lg:pl-6">
          <div className="text-right min-w-0">
            <p className="text-sm font-bold text-on-surface leading-none truncate max-w-[140px] lg:max-w-[180px]">{user.name}</p>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter mt-1 truncate max-w-[140px] lg:max-w-[180px]">
              {user.role}
            </p>
          </div>
          <img
            src={user.avatar}
            alt=""
            className="w-10 h-10 rounded-full object-cover border-2 border-primary/10 shadow-sm shrink-0"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
}
