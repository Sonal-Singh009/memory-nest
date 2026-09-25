import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-4 z-40 flex items-center gap-2 rounded-full bg-[#EAE0D3]/95 backdrop-blur-xs px-3.5 py-1.5 text-xs font-medium text-[#5E4733] shadow-md border border-[#DFCFC0]">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C87C5B] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9C5237]"></span>
      </span>
      <WifiOff className="w-3.5 h-3.5 text-[#9C5237]" />
      <span>Offline Mode — All memories are saved locally in your vault</span>
    </div>
  );
};
