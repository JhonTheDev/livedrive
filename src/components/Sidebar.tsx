import { Home, ShieldCheck, FolderClosed, Settings, UserRound, LogIn } from 'lucide-react';
import { SidebarTab } from '../types';
import { AuthMode, AuthSession } from '../auth';

interface SidebarProps {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  privateCount: number;
  isAuthenticated: boolean;
  currentSession: AuthSession | null;
  onAuthRequest: (mode: AuthMode) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  privateCount,
  isAuthenticated,
  currentSession,
  onAuthRequest,
}: SidebarProps) {
  const menuItems = [
    { id: 'home' as SidebarTab, icon: Home, label: 'All' },
    { id: 'vault' as SidebarTab, icon: ShieldCheck, label: 'Vault', badge: privateCount },
    { id: 'collections' as SidebarTab, icon: FolderClosed, label: 'Collections' },
    { id: 'settings' as SidebarTab, icon: Settings, label: 'Settings' },
  ];

  return (
    <aside 
      id="sidebar-container"
      className="w-20 h-screen bg-[#0A0A0A] border-r border-white/5 flex flex-col items-center py-8 shrink-0 ease-in-out duration-300 z-10 justify-between"
    >
      {/* Top Logo Panel - Geometric Balance Style */}
      <div className="flex flex-col items-center">
        <div 
          id="sidebar-logo"
          className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 hover:border-white/30 transition-all duration-300 group cursor-pointer"
        >
          <div className="w-4 h-4 bg-white rounded-sm group-hover:rotate-45 transition-transform duration-500"></div>
        </div>
      </div>

      {/* Nav Actions */}
      <nav id="sidebar-nav" className="flex flex-col gap-6 my-auto">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div key={item.id} className="relative group flex justify-center">
              <button
                id={`sidebar-btn-${item.id}`}
                onClick={() => {
                  if (item.id === 'vault' && !isAuthenticated) {
                    onAuthRequest('login');
                    return;
                  }

                  setActiveTab(item.id);
                }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative ${
                  isActive
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'text-white/40 hover:text-white border border-transparent'
                }`}
                title={item.label}
              >
                <IconComponent className="w-5 h-5 stroke-[1.5]" />
                
                {/* Micro notification dot / Badge */}
                {item.badge !== undefined && item.badge > 0 && !isActive && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </button>

              {/* Tooltip */}
              <div 
                className="absolute left-[88px] bg-[#0c0c0c] text-zinc-100 text-xs px-2.5 py-1.5 rounded-md border border-white/10 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-lg z-50 font-mono"
              >
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-2 bg-white/10 text-white text-[10px] px-1 rounded">
                    {item.badge}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Avatar Gradient Box */}
      <div className="mt-auto">
        <button
          type="button"
          onClick={() => onAuthRequest('login')}
          className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-gradient-to-tr from-[#1A1A1A] to-[#333] text-white/80 shadow-lg transition-all duration-300 hover:border-white/30 hover:text-white"
          title={isAuthenticated ? 'Account' : 'Login'}
        >
          {isAuthenticated ? (
            currentSession?.user.displayName ? (
              <span className="text-[10px] font-medium uppercase tracking-[0.25em]">{currentSession.user.displayName.slice(0, 2)}</span>
            ) : (
              <UserRound className="h-4 w-4 stroke-[1.5]" />
            )
          ) : (
            <LogIn className="h-4 w-4 stroke-[1.6]" />
          )}
        </button>
      </div>
    </aside>
  );
}
