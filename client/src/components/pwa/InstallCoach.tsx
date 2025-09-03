import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePlatform } from '@/hooks/usePlatform';
import { useA2HS } from '@/hooks/useA2HS';
import { storage } from '@/lib/storage';

const installMessages = {
  title: "Zet je lidkaart op je startscherm",
  subtitle: "Zo open je ze snel en blijft ze altijd bij de hand.",
  buttons: {
    install: "App installeren",
    later: "Later",
    never: "Niet meer tonen",
  },
  ios: [
    "Tik op Deel (het vierkantje met pijltje omhoog).",
    "Kies 'Zet op beginscherm' in de lijst.",
    "Bevestig met 'Toevoegen'.",
  ],
  android: [
    "Als er een knop 'App installeren' verschijnt, tik daarop om meteen toe te voegen.",
    "Of open het Menu ⋮ rechtsboven.",
    "Kies 'App installeren' of 'Aan startscherm toevoegen'.",
    "Bevestig.",
  ],
  samsung: [
    "Open het Menu ☰ (linksonder of rechtsboven, afhankelijk van toestel).",
    "Kies 'Toevoegen aan startscherm'.",
    "Bevestig.",
  ],
  desktop: [
    "Klik in de adresbalk op het installatie-icoon (⤓ of +).",
    "Kies 'Installeren'.",
    "Je lidkaart opent voortaan in een apart venster als app.",
  ],
  fallback: [
    "Sla deze pagina op als snelkoppeling via het browsermenu.",
    "Daarna vind je de lidkaart terug in je startscherm of favorieten.",
  ],
} as const;

interface InstallCoachProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallCoach({ isOpen, onClose }: InstallCoachProps) {
  const platform = usePlatform();
  const { canPrompt, promptInstall } = useA2HS();

  // Select platform-specific instructions
  let steps: readonly string[] = [];
  switch (platform) {
    case "ios-safari":
      steps = installMessages.ios;
      break;
    case "android-chrome":
      steps = installMessages.android;
      break;
    case "samsung-internet":
      steps = installMessages.samsung;
      break;
    case "desktop-chromium":
      steps = installMessages.desktop;
      break;
    default:
      steps = installMessages.fallback;
  }

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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleDismiss(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => handleDismiss(false)}>
      <DialogContent 
        className="max-w-md focus:outline-none"
        onKeyDown={handleKeyDown}
        aria-labelledby="install-coach-title"
        aria-describedby="install-coach-subtitle"
      >
        <DialogHeader className="space-y-3">
          <DialogTitle id="install-coach-title" className="text-lg font-semibold">
            {installMessages.title}
          </DialogTitle>
          
          <p id="install-coach-subtitle" className="text-sm text-muted-foreground">
            {installMessages.subtitle}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Platform-specific instructions */}
          <div className="space-y-4">
            <ol className="list-decimal ml-6 space-y-1 text-sm text-muted-foreground">
              {steps.map((step, index) => (
                <li key={index} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            {canPrompt && (
              <Button 
                onClick={handleInstall}
                className="w-full"
                data-testid="button-install-app"
              >
                {installMessages.buttons.install}
              </Button>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleDismiss(false)}
                className="flex-1"
                data-testid="button-install-later"
              >
                {installMessages.buttons.later}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => handleDismiss(true)}
                className="flex-1 text-muted-foreground"
                data-testid="button-install-dismiss"
              >
                {installMessages.buttons.never}
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