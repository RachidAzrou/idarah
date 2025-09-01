"use client";

import { useEffect, useState } from "react";

export function SyncClient() {
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      return; // Skip sync animations if user prefers reduced motion
    }

    // Mock sync indicator (in real app this would sync with server)
    const interval = setInterval(() => {
      setLastSync(new Date());
    }, 30000); // Update every 30 seconds

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div 
      className="fixed bottom-4 left-4 text-xs text-gray-500 z-50"
      aria-live="polite"
    >
      <div className={`flex items-center gap-2 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
        <div 
          className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span>
          {isOnline ? 'Online' : 'Offline'} • Laatst gesynchroniseerd: {lastSync.toLocaleTimeString('nl-BE')}
        </span>
      </div>
    </div>
  );
}