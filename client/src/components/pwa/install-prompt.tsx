import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone } from 'lucide-react';
import { PWAInstaller } from '@/lib/pwa';

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (PWAInstaller.isInstalled()) {
      return;
    }

    // Listen for installable event
    const handleInstallable = () => {
      setShowPrompt(true);
    };

    const handleInstalled = () => {
      setShowPrompt(false);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    try {
      setIsInstalling(true);
      const result = await PWAInstaller.showInstallPrompt();
      
      if (result === 'accepted') {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('install-prompt-dismissed', 'true');
  };

  // Don't show if dismissed this session
  if (sessionStorage.getItem('install-prompt-dismissed')) {
    return null;
  }

  if (!showPrompt) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-lg border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 mx-auto max-w-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Installeer Ledenbeheer
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Krijg snelle toegang tot uw lidkaarten en beheer, zelfs offline.
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="h-3 w-3 mr-1" />
                {isInstalling ? 'Installeren...' : 'Installeren'}
              </Button>
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                Later
              </Button>
            </div>
          </div>
          
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-6 w-6 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}