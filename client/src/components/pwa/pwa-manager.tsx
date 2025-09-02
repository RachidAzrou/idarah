import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Smartphone, 
  Download, 
  Trash2, 
  WifiOff, 
  Wifi, 
  RefreshCw,
  Database,
  Settings
} from 'lucide-react';
import { CacheManager, NetworkStatus, NotificationManager, PWAInstaller } from '@/lib/pwa';

export function PWAManager() {
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [isOnline, setIsOnline] = useState(NetworkStatus.isOnline());
  const [isInstalled, setIsInstalled] = useState(PWAInstaller.isInstalled());
  const [isInstallable, setIsInstallable] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Load initial data
    loadCacheSize();
    setNotificationPermission(NotificationManager.getPermission());

    // Listen for PWA events
    const handleInstallable = () => setIsInstallable(true);
    const handleInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
    };
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);
    window.addEventListener('network-online', handleOnline);
    window.addEventListener('network-offline', handleOffline);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
      window.removeEventListener('network-online', handleOnline);
      window.removeEventListener('network-offline', handleOffline);
    };
  }, []);

  const loadCacheSize = async () => {
    try {
      const size = await CacheManager.getCacheSize();
      setCacheSize(size);
    } catch (error) {
      console.error('Failed to get cache size:', error);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await CacheManager.clearCache();
      setCacheSize(0);
      console.log('[PWA] Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleRefreshCache = async () => {
    setIsRefreshing(true);
    try {
      // Reload the page to refresh cache
      window.location.reload();
    } catch (error) {
      console.error('Failed to refresh cache:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleInstallApp = async () => {
    try {
      await PWAInstaller.showInstallPrompt();
    } catch (error) {
      console.error('Install failed:', error);
    }
  };

  const handleRequestNotifications = async () => {
    try {
      const permission = await NotificationManager.requestPermission();
      setNotificationPermission(permission);
    } catch (error) {
      console.error('Notification permission failed:', error);
    }
  };

  const handleTestNotification = () => {
    NotificationManager.showNotification('Test Melding', {
      body: 'Dit is een test melding van de Ledenbeheer app',
      tag: 'test-notification'
    });
  };

  return (
    <div className="space-y-6">
      {/* PWA Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            PWA Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Verbinding</span>
                <Badge variant={isOnline ? 'default' : 'destructive'}>
                  {isOnline ? (
                    <>
                      <Wifi className="h-3 w-3 mr-1" />
                      Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 mr-1" />
                      Offline
                    </>
                  )}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Installatie</span>
                <Badge variant={isInstalled ? 'default' : 'secondary'}>
                  {isInstalled ? 'Geïnstalleerd' : 'Browser'}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cache Grootte</span>
                <span className="text-sm text-muted-foreground">
                  {CacheManager.formatBytes(cacheSize)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Meldingen</span>
                <Badge variant={
                  notificationPermission === 'granted' ? 'default' :
                  notificationPermission === 'denied' ? 'destructive' : 'secondary'
                }>
                  {notificationPermission === 'granted' ? 'Toegestaan' :
                   notificationPermission === 'denied' ? 'Geweigerd' :
                   notificationPermission === 'unsupported' ? 'Niet ondersteund' : 'Niet gevraagd'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PWA Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            PWA Acties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Install App */}
            {!isInstalled && isInstallable && (
              <Button 
                onClick={handleInstallApp} 
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                App Installeren
              </Button>
            )}

            {/* Clear Cache */}
            <Button 
              onClick={handleClearCache} 
              disabled={isClearing || cacheSize === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isClearing ? 'Wissen...' : 'Cache Wissen'}
            </Button>

            {/* Refresh Cache */}
            <Button 
              onClick={handleRefreshCache} 
              disabled={isRefreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Vernieuwen...' : 'Cache Vernieuwen'}
            </Button>

            {/* Request Notifications */}
            {notificationPermission === 'default' && (
              <Button 
                onClick={handleRequestNotifications} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Meldingen Toestaan
              </Button>
            )}

            {/* Test Notification */}
            {notificationPermission === 'granted' && (
              <Button 
                onClick={handleTestNotification} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Test Melding
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Development Info */}
      {import.meta.env.DEV && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Ontwikkelaar Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Omgeving:</span>
                <Badge variant="secondary">Ontwikkeling</Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Service Worker:</span>
                <Badge variant="secondary">Uitgeschakeld</Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">User Agent:</span>
                <span className="text-xs text-muted-foreground max-w-64 truncate">
                  {navigator.userAgent}
                </span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md">
              <strong>Opmerking:</strong> In ontwikkelingsmodus is de service worker uitgeschakeld. 
              PWA functies zoals offline ondersteuning werken alleen in productie.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}