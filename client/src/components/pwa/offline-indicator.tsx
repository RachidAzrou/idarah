import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { WifiOff, Wifi, Clock } from 'lucide-react';
import { NetworkStatus } from '@/lib/pwa';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(NetworkStatus.isOnline());
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    // Initialize network monitoring
    const cleanup = NetworkStatus.init((online) => {
      setIsOnline(online);
      
      if (!online) {
        setShowOfflineMessage(true);
      } else {
        // Hide offline message after 3 seconds when back online
        setTimeout(() => setShowOfflineMessage(false), 3000);
      }
    });

    return cleanup;
  }, []);

  // Don't show indicator if online and no recent offline event
  if (isOnline && !showOfflineMessage) {
    return null;
  }

  return (
    <Card className={`fixed top-4 right-4 z-50 shadow-lg transition-all duration-300 ${
      isOnline 
        ? 'bg-green-50 border-green-200' 
        : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isOnline 
              ? 'bg-green-100' 
              : 'bg-amber-100'
          }`}>
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-amber-600" />
            )}
          </div>
          
          <div className="flex-1">
            <div className={`text-sm font-medium ${
              isOnline ? 'text-green-800' : 'text-amber-800'
            }`}>
              {isOnline ? 'Verbinding hersteld' : 'Offline modus'}
            </div>
            <div className={`text-xs ${
              isOnline ? 'text-green-600' : 'text-amber-600'
            }`}>
              {isOnline ? (
                'Alle functies beschikbaar'
              ) : (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Momentopname - beperkte functionaliteit
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}