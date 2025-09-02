// PWA Utilities voor Ledenbeheer

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// PWA Install Prompt Management
export const PWAInstaller = {
  // Check if app is installable
  isInstallable: () => {
    return deferredPrompt !== null;
  },

  // Check if app is already installed
  isInstalled: () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           // @ts-ignore
           window.navigator.standalone === true;
  },

  // Initialize PWA install prompt
  init: () => {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] Install prompt available');
      e.preventDefault();
      deferredPrompt = e;
      
      // Dispatch custom event for components to listen
      window.dispatchEvent(new CustomEvent('pwa-installable'));
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed');
      deferredPrompt = null;
      
      // Show success message
      window.dispatchEvent(new CustomEvent('pwa-installed'));
    });
  },

  // Show install prompt
  showInstallPrompt: async () => {
    if (!deferredPrompt) {
      throw new Error('Install prompt not available');
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      console.log('[PWA] User choice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted install');
      } else {
        console.log('[PWA] User dismissed install');
      }
      
      deferredPrompt = null;
      return choiceResult.outcome;
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      throw error;
    }
  }
};

// Online/Offline Status Management
export const NetworkStatus = {
  // Check if currently online
  isOnline: () => navigator.onLine,

  // Initialize network status monitoring
  init: (onStatusChange?: (isOnline: boolean) => void) => {
    const handleOnline = () => {
      console.log('[PWA] Network: Online');
      onStatusChange?.(true);
      window.dispatchEvent(new CustomEvent('network-online'));
    };

    const handleOffline = () => {
      console.log('[PWA] Network: Offline');
      onStatusChange?.(false);
      window.dispatchEvent(new CustomEvent('network-offline'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
};

// Cache Management
export const CacheManager = {
  // Clear all caches
  clearCache: async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('[PWA] All caches cleared');
    }
  },

  // Get cache size
  getCacheSize: async (): Promise<number> => {
    if (!('caches' in window)) return 0;

    let totalSize = 0;
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }
    
    return totalSize;
  },

  // Format bytes to human readable
  formatBytes: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

// Background Sync
export const BackgroundSync = {
  // Register background sync
  register: async (tag: string = 'background-sync') => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log('[PWA] Background sync registered:', tag);
      } catch (error) {
        console.error('[PWA] Background sync registration failed:', error);
      }
    }
  }
};

// Notification Management
export const NotificationManager = {
  // Check notification permission
  getPermission: () => {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  },

  // Request notification permission
  requestPermission: async (): Promise<NotificationPermission | 'unsupported'> => {
    if (!('Notification' in window)) {
      return 'unsupported';
    }

    const permission = await Notification.requestPermission();
    console.log('[PWA] Notification permission:', permission);
    return permission;
  },

  // Show local notification
  showNotification: (title: string, options?: NotificationOptions) => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          icon: '/icon-192.svg',
          badge: '/icon-192.svg',
          ...options
        });
      });
    }
  }
};

// Initialize all PWA features
export const initPWA = () => {
  console.log('[PWA] Initializing PWA features...');
  
  // Always initialize these features regardless of service worker support
  PWAInstaller.init();
  NetworkStatus.init();
  
  // Log environment info
  if (import.meta.env.DEV) {
    console.log('[PWA] Running in development mode - service worker disabled');
  }
  
  if (PWAInstaller.isInstalled()) {
    console.log('[PWA] App is running as installed PWA');
  }
  
  console.log('[PWA] PWA features initialized');
};