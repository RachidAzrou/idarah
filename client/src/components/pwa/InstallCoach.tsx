import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Smartphone, Monitor, Share, Menu, MoreVertical } from 'lucide-react';
import { usePlatform, type Platform } from '@/hooks/usePlatform';
import { useA2HS } from '@/hooks/useA2HS';
import { storage } from '@/lib/storage';

interface InstallInstructions {
  title: string;
  steps: string[];
  icon: React.ComponentType<{ className?: string }>;
}

const platformInstructions: Record<Platform, InstallInstructions> = {
  'ios-safari': {
    title: 'Op je iPhone/iPad',
    steps: [
      'Tik op het Deel-icoon onderaan',
      'Scroll naar beneden en tik "Zet op beginscherm"',
      'Tik "Toevoegen" om te bevestigen'
    ],
    icon: Share
  },
  'android-chrome': {
    title: 'Op je Android (Chrome)',
    steps: [
      'Tik op "App installeren" knop (verschijnt automatisch)',
      'Of tik het menu (⋮) rechtsboven',
      'Kies "App installeren" of "Toevoegen aan startscherm"'
    ],
    icon: Smartphone
  },
  'samsung-internet': {
    title: 'Op je Samsung browser',
    steps: [
      'Tik het menu (☰) onderaan',
      'Kies "Toevoegen aan startscherm"',
      'Bevestig met "Toevoegen"'
    ],
    icon: Menu
  },
  'desktop-chromium': {
    title: 'Op je computer',
    steps: [
      'Klik op het install-icoon in de adresbalk',
      'Of klik het menu (⋮) rechtsboven',
      'Kies "Ledenbeheer installeren..."'
    ],
    icon: Monitor
  },
  'other': {
    title: 'Op je apparaat',
    steps: [
      'Zoek naar een "Installeren" optie in het browsermenu',
      'Of "Toevoegen aan startscherm"',
      'Volg de instructies van je browser'
    ],
    icon: MoreVertical
  }
};

interface InstallCoachProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallCoach({ isOpen, onClose }: InstallCoachProps) {
  const platform = usePlatform();
  const { canPrompt, promptInstall } = useA2HS();
  const instructions = platformInstructions[platform];
  const Icon = instructions.icon;

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      onClose();
    }
  };

  const handleDismiss = (permanent: boolean) => {
    if (permanent) {
      storage.set(storage.PWA_INSTALL_COACH_DISMISSED, 'true');
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => handleDismiss(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Zet je lidkaart op je startscherm
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismiss(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Zo open je ze snel en blijft ze altijd bij de hand.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Platform specific instructions */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-medium">{instructions.title}</h3>
            </div>
            
            <ol className="space-y-2 text-sm text-muted-foreground">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {canPrompt && platform === 'android-chrome' && (
              <Button 
                onClick={handleInstall}
                className="w-full"
                data-testid="button-install-app"
              >
                App installeren
              </Button>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleDismiss(false)}
                className="flex-1"
                data-testid="button-install-later"
              >
                Later
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => handleDismiss(true)}
                className="flex-1 text-muted-foreground"
                data-testid="button-install-dismiss"
              >
                Niet meer tonen
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage InstallCoach state
export function useInstallCoach() {
  const [isOpen, setIsOpen] = useState(false);
  const { isInstalled } = useA2HS();

  useEffect(() => {
    // Don't show if already installed or previously dismissed
    if (isInstalled) return;
    
    const dismissed = storage.get(storage.PWA_INSTALL_COACH_DISMISSED);
    if (dismissed === 'true') return;

    // Show after a short delay to avoid interfering with page load
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isInstalled]);

  return {
    isOpen,
    close: () => setIsOpen(false)
  };
}