"use client";

import { useState } from "react";
import { PublicScreen, ScreenType, publicScreensStore, PaymentMatrixConfig, AnnouncementsConfig } from "@/lib/mock/public-screens";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { MatrixConfigForm } from "./types/PaymentMatrix/MatrixConfigForm";
import { AnnouncementsConfigForm } from "./types/Announcements/AnnouncementsConfigForm";

interface NewScreenDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (screen: PublicScreen) => void;
}

type Step = 'type' | 'basic' | 'config';

export function NewScreenDialog({ open, onClose, onSave }: NewScreenDialogProps) {
  const [step, setStep] = useState<Step>('type');
  const [selectedType, setSelectedType] = useState<ScreenType | null>(null);
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  const [config, setConfig] = useState<PaymentMatrixConfig | AnnouncementsConfig | null>(null);

  const handleClose = () => {
    setStep('type');
    setSelectedType(null);
    setName('');
    setActive(true);
    setConfig(null);
    onClose();
  };

  const getDefaultConfig = (type: ScreenType): PaymentMatrixConfig | AnnouncementsConfig => {
    if (type === 'PAYMENT_MATRIX') {
      return {
        year: new Date().getFullYear(),
        filters: {
          categories: [],
          activeOnly: true
        },
        display: {
          showChart: true,
          compactLabels: true,
          showPercentage: true
        },
        colors: {
          paid: "#2563EB",
          open: "#DBEAFE",
          overdue: "#FCA5A5",
          unknown: "#9CA3AF"
        },
        layout: {
          maxRowHeight: 48,
          columnWidth: 48
        }
      } as PaymentMatrixConfig;
    } else {
      return {
        slides: [],
        autoplay: {
          enabled: true,
          interval: 8,
          order: 'date'
        },
        style: {
          textContrast: 'light',
          background: 'black',
          maxTextWidth: 800
        }
      } as AnnouncementsConfig;
    }
  };

  const handleNext = () => {
    if (step === 'type' && selectedType) {
      setStep('basic');
    } else if (step === 'basic' && name.trim()) {
      setConfig(getDefaultConfig(selectedType!));
      setStep('config');
    }
  };

  const handleSave = () => {
    if (!selectedType || !name.trim() || !config) return;

    const screen = publicScreensStore.create({
      name: name.trim(),
      type: selectedType,
      active,
      config
    });

    onSave(screen);
    handleClose();
  };

  const canProceed = () => {
    switch (step) {
      case 'type': return selectedType !== null;
      case 'basic': return name.trim().length > 0;
      case 'config': return config !== null;
      default: return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nieuw publiek scherm</DialogTitle>
        </DialogHeader>

        {step === 'type' && (
          <div className="space-y-6">
            <div className="text-sm text-gray-600">
              Kies het type scherm dat je wilt aanmaken:
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${
                  selectedType === 'PAYMENT_MATRIX' 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedType('PAYMENT_MATRIX')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Betaalstatus Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Toon een overzicht van betalingen per lid en maand met visuele indicatoren en statistieken.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">Grid weergave</Badge>
                    <Badge variant="outline" className="text-xs">Donut grafiek</Badge>
                    <Badge variant="outline" className="text-xs">Filters</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  selectedType === 'ANNOUNCEMENTS' 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedType('ANNOUNCEMENTS')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Mededelingen Carousel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Toon een draaiende carousel van mededelingen met tekst, afbeeldingen en automatische overgang.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">Autoplay</Badge>
                    <Badge variant="outline" className="text-xs">Media support</Badge>
                    <Badge variant="outline" className="text-xs">Geplande content</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 'basic' && (
          <div className="space-y-6">
            <div className="text-sm text-gray-600">
              Basis instellingen voor je nieuwe {selectedType === 'PAYMENT_MATRIX' ? 'betaalstatus matrix' : 'mededelingen carousel'}:
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="screen-name">Naam *</Label>
                <Input
                  id="screen-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bijvoorbeeld: Betaalstatus 2025"
                  data-testid="input-screen-name"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Status</Label>
                  <div className="text-sm text-gray-500">
                    Scherm direct activeren na aanmaken
                  </div>
                </div>
                <Switch
                  checked={active}
                  onCheckedChange={setActive}
                  data-testid="switch-active"
                />
              </div>
            </div>
          </div>
        )}

        {step === 'config' && selectedType && config && (
          <div className="space-y-6">
            <div className="text-sm text-gray-600">
              Configureer de instellingen voor je {selectedType === 'PAYMENT_MATRIX' ? 'betaalstatus matrix' : 'mededelingen carousel'}:
            </div>
            
            {selectedType === 'PAYMENT_MATRIX' && (
              <MatrixConfigForm
                config={config as PaymentMatrixConfig}
                onChange={setConfig}
              />
            )}
            
            {selectedType === 'ANNOUNCEMENTS' && (
              <AnnouncementsConfigForm
                config={config as AnnouncementsConfig}
                onChange={setConfig}
              />
            )}
          </div>
        )}

        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={step === 'type' ? handleClose : () => setStep(step === 'config' ? 'basic' : 'type')}
          >
            {step === 'type' ? 'Annuleren' : (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Vorige
              </>
            )}
          </Button>
          
          <Button
            onClick={step === 'config' ? handleSave : handleNext}
            disabled={!canProceed()}
          >
            {step === 'config' ? 'Scherm aanmaken' : (
              <>
                Volgende
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}