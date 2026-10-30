import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Wifi, WifiOff } from 'lucide-react';

export const OnlineOfflineBadge: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div
      role="status"
      aria-label={isOnline ? 'Network status: Online' : 'Network status: Offline, reading from local IndexedDB'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
        isOnline
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
          : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
      }`}
      title={
        isOnline
          ? 'Online: Ready to sync feeds and discover new blogs'
          : 'Offline: Reading from local IndexedDB cache'
      }
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isOnline ? 'bg-emerald-400' : 'bg-amber-400'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isOnline ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        />
      </span>
      {isOnline ? (
        <span className="flex items-center gap-1">
          <Wifi className="w-3 h-3" />
          <span>Online</span>
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <WifiOff className="w-3 h-3" />
          <span>Offline</span>
        </span>
      )}
    </div>
  );
};
