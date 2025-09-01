"use client";

import { useState, useEffect } from "react";
import { PublicScreen, publicScreensStore, PaymentMatrixConfig, AnnouncementsConfig } from "@/lib/mock/public-screens";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, ExternalLink, Power, Link2 } from "lucide-react";
import { MatrixConfigForm } from "./types/PaymentMatrix/MatrixConfigForm";
import { AnnouncementsConfigForm } from "./types/Announcements/AnnouncementsConfigForm";
import { PreviewFrame } from "./PreviewFrame";
import { CopyField } from "@/components/ui/CopyField";

interface EditScreenDrawerProps {
  screen: PublicScreen | null;
  onClose: () => void;
  onSave: (screen: PublicScreen) => void;
}

export function EditScreenDrawer({ screen, onClose, onSave }: EditScreenDrawerProps) {
  const [name, setName] = useState('');
  const [active, setActive] = useState(false);
  const [config, setConfig] = useState<PaymentMatrixConfig | AnnouncementsConfig | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (screen) {
      setName(screen.name);
      setActive(screen.active);
      setConfig(screen.config);
      setHasChanges(false);
    }
  }, [screen]);

  const handleSave = () => {
    if (!screen || !config) return;

    const updatedScreen = publicScreensStore.update(screen.id, {
      name: name.trim(),
      active,
      config
    });

    onSave(updatedScreen);
    setHasChanges(false);
  };

  const handleToggleStatus = () => {
    if (!screen) return;
    
    const newActive = !active;
    setActive(newActive);
    setHasChanges(true);
    
    // Auto-save status changes
    const updatedScreen = publicScreensStore.update(screen.id, { active: newActive });
    onSave(updatedScreen);
  };

  const handleOpenPublic = () => {
    if (!screen) return;
    const publicUrl = `${window.location.origin}/public/screen/${screen.publicToken}`;
    window.open(publicUrl, '_blank');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setHasChanges(true);
  };

  const handleConfigChange = (newConfig: PaymentMatrixConfig | AnnouncementsConfig) => {
    setConfig(newConfig);
    setHasChanges(true);
  };

  if (!screen) return null;

  const publicUrl = `${window.location.origin}/public/screen/${screen.publicToken}`;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PAYMENT_MATRIX': return 'Betaalstatus Matrix';
      case 'ANNOUNCEMENTS': return 'Mededelingen Carousel';
      default: return type;
    }
  };

  return (
    <Sheet open={!!screen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-7xl overflow-y-auto">
        <SheetHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Scherm bewerken</SheetTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{getTypeLabel(screen.type)}</Badge>
                <Badge 
                  variant={active ? "default" : "secondary"}
                  className={active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                >
                  {active ? "Actief" : "Inactief"}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleOpenPublic}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open publiek
              </Button>
              <Button variant="outline" size="sm" onClick={handleToggleStatus}>
                <Power className="h-4 w-4 mr-2" />
                {active ? "Deactiveren" : "Activeren"}
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Configuratie</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-screen-name">Naam</Label>
                  <Input
                    id="edit-screen-name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    data-testid="input-edit-screen-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Publieke URL</Label>
                  <CopyField value={publicUrl} />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-4">Type-specifieke instellingen</h4>
              
              {screen.type === 'PAYMENT_MATRIX' && config && (
                <MatrixConfigForm
                  config={config as PaymentMatrixConfig}
                  onChange={handleConfigChange}
                />
              )}
              
              {screen.type === 'ANNOUNCEMENTS' && config && (
                <AnnouncementsConfigForm
                  config={config as AnnouncementsConfig}
                  onChange={handleConfigChange}
                />
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Wijzigingen opslaan
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Live preview</h3>
            <div className="border rounded-lg overflow-hidden bg-gray-50 h-96">
              <PreviewFrame screen={{ ...screen, name, active, config: config! }} />
            </div>
            <div className="text-sm text-gray-500">
              Preview toont hoe het scherm er publiek uit zal zien
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}