import React from 'react';
import {
  CalendarDays,
  Clock,
  Layers,
  Lightbulb,
  Search,
  Settings,
  Plus,
  Lock,
  Download,
  Feather
} from 'lucide-react';
import { ActiveView } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavigationProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onOpenQuickAdd: () => void;
  appName: string;
  isPinLocked: boolean;
  onLockNow: () => void;
  memoryCount: number;
}

export const DesktopSidebar: React.FC<NavigationProps> = ({
  activeView,
  onSelectView,
  onOpenQuickAdd,
  appName,
  isPinLocked,
  onLockNow,
  memoryCount,
}) => {
  const navItems: { view: ActiveView; label: string; icon: React.FC<{ className?: string }> }[] = [
    { view: 'today', label: 'Today', icon: Clock },
    { view: 'calendar', label: 'Calendar', icon: CalendarDays },
    { view: 'memories', label: 'All Memories', icon: Layers },
    { view: 'ideas', label: 'Ideas & Plans', icon: Lightbulb },
    { view: 'search', label: 'Search', icon: Search },
    { view: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#FBF8F3] border-r border-[#EFE8DC] p-5 shrink-0 select-none justify-between h-screen sticky top-0">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-2xl bg-[#EAE0D3] border border-[#DFCFC0] flex items-center justify-center text-[#9C5237] shadow-2xs">
            <Feather className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg text-[#2D2A26] tracking-tight leading-tight">
              {appName}
            </h1>
            <p className="text-[11px] text-[#8C7A6B]">Personal Memory Vault</p>
          </div>
        </div>

        {/* Big Add Button */}
        <div className="px-1">
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-[#9C5237] hover:bg-[#85432B] text-white font-medium text-sm transition shadow-xs hover:shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add to today</span>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1">
          {navItems.map(({ view, label, icon: Icon }) => {
            const isActive = activeView === view;
            return (
              <button
                key={view}
                type="button"
                onClick={() => onSelectView(view)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-[#EAE0D3] text-[#3D2C1E] shadow-2xs font-semibold'
                    : 'text-[#6C5B4C] hover:bg-[#F4ECE1] hover:text-[#2D2A26]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#9C5237]' : 'text-[#8A7764]'
                  }`}
                />
                <span>{label}</span>
                {view === 'memories' && memoryCount > 0 && (
                  <span className="ml-auto text-[11px] text-[#8A7764] bg-white/60 px-2 py-0.5 rounded-full">
                    {memoryCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Utilities */}
      <div className="space-y-3 pt-4 border-t border-[#EFE8DC]">
        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Lock Vault button if PIN enabled */}
        {isPinLocked && (
          <button
            type="button"
            onClick={onLockNow}
            className="flex items-center gap-2 text-xs text-[#7D6B5A] hover:text-[#9C5237] px-2 py-1 transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Notebook</span>
          </button>
        )}

        <div className="px-2 text-[11px] text-[#A49483]">
          100% Private & Offline
        </div>
      </div>
    </aside>
  );
};

export const MobileHeader: React.FC<{
  appName: string;
  onOpenQuickAdd: () => void;
  onSelectView: (view: ActiveView) => void;
}> = ({ appName, onOpenQuickAdd, onSelectView }) => {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#FBF8F3]/95 backdrop-blur-xs border-b border-[#EFE8DC] sticky top-0 z-30">
      <div
        onClick={() => onSelectView('today')}
        className="flex items-center gap-2.5 cursor-pointer"
      >
        <div className="w-8 h-8 rounded-xl bg-[#EAE0D3] border border-[#DFCFC0] flex items-center justify-center text-[#9C5237]">
          <Feather className="w-4 h-4" />
        </div>
        <span className="font-serif font-bold text-base text-[#2D2A26]">
          {appName}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <PWAInstallButton compact={true} />
        <button
          type="button"
          onClick={() => onSelectView('search')}
          className="p-2 rounded-full text-[#6C5B4C] hover:bg-[#F2ECE2] transition cursor-pointer"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export const MobileBottomNav: React.FC<{
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onOpenQuickAdd: () => void;
}> = ({ activeView, onSelectView, onOpenQuickAdd }) => {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#FBF8F3]/98 backdrop-blur-md border-t border-[#EFE8DC] px-2 py-1.5 flex items-center justify-around z-40">
      <button
        type="button"
        onClick={() => onSelectView('today')}
        className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-medium transition cursor-pointer ${
          activeView === 'today' ? 'text-[#9C5237]' : 'text-[#8A7764]'
        }`}
      >
        <Clock className="w-5 h-5" />
        <span>Today</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectView('calendar')}
        className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-medium transition cursor-pointer ${
          activeView === 'calendar' ? 'text-[#9C5237]' : 'text-[#8A7764]'
        }`}
      >
        <CalendarDays className="w-5 h-5" />
        <span>Calendar</span>
      </button>

      {/* Floating Center Add Button */}
      <button
        type="button"
        onClick={onOpenQuickAdd}
        className="-mt-5 w-12 h-12 rounded-full bg-[#9C5237] hover:bg-[#85432B] text-white flex items-center justify-center shadow-md active:scale-95 transition cursor-pointer"
        title="Add to today"
      >
        <Plus className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={() => onSelectView('ideas')}
        className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-medium transition cursor-pointer ${
          activeView === 'ideas' ? 'text-[#9C5237]' : 'text-[#8A7764]'
        }`}
      >
        <Lightbulb className="w-5 h-5" />
        <span>Ideas</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectView('settings')}
        className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-medium transition cursor-pointer ${
          activeView === 'settings' ? 'text-[#9C5237]' : 'text-[#8A7764]'
        }`}
      >
        <Settings className="w-5 h-5" />
        <span>Settings</span>
      </button>
    </nav>
  );
};
