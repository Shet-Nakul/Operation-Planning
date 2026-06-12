import { Bell, HelpCircle, LogOut, MessageSquare, PlusSquare, Search } from 'lucide-react';

export type ShellUser = {
  name: string;
  role: string;
  avatar: string;
};

type TopNavProps = {
  title: string;
  user: ShellUser;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showNewRequest?: boolean;
  onNewRequest?: () => void;
  onLogout?: () => void;
};

export function TopNav({ title, user, searchQuery, onSearchChange, showNewRequest, onNewRequest, onLogout }: TopNavProps) {
  return (
    <header className="fixed top-0 left-72 right-0 h-16 z-50 bg-white/85 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 border-b border-surface-container-high">
      <div className="flex items-center gap-6 lg:gap-8 flex-1 min-w-0">
        <span className="text-lg lg:text-xl font-bold text-primary font-headline truncate shrink-0">{title}</span>
        <div className="relative flex-1 max-w-md hidden md:block min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search patient or surgeon..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
            autoComplete="off"
          />
        </div>
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
          {onLogout ? (
            <button
              type="button"
              onClick={() => onLogout()}
              className="hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container-low"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={20} />
            </button>
          ) : null}
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
