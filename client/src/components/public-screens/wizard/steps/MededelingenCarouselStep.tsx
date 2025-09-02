"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Shuffle } from "lucide-react";

interface MededelingenSettings {
  slides: Array<{
    id: string;
    title: string;
    body?: string;
    active: boolean;
    durationSec: number;
  }>;
  autoplay: {
    enabled: boolean;
    interval: number;
    order: 'date' | 'manual' | 'shuffle';
  };
  style: {
    textColor: string;
    backgroundColor: string;
    maxTextWidth: number;
  };
}

interface MededelingenCarouselStepProps {
  data: {
    mededelingenSettings?: MededelingenSettings;
  };
  onUpdate: (data: any) => void;
}

const orderOptions = [
  { value: 'manual', label: 'Handmatige volgorde', icon: RotateCcw },
  { value: 'date', label: 'Op datum', icon: RotateCcw },
  { value: 'shuffle', label: 'Willekeurig', icon: Shuffle }
];

export function MededelingenCarouselStep({ data, onUpdate }: MededelingenCarouselStepProps) {
  const settings = data.mededelingenSettings || {
    slides: [],
    autoplay: {
      enabled: true,
      interval: 8,
      order: 'manual'
    },
    style: {
      textColor: '#ffffff',
      backgroundColor: '#1f2937',
      maxTextWidth: 800
    }
  };

  const updateSettings = (newSettings: Partial<MededelingenSettings>) => {
    onUpdate({
      mededelingenSettings: {
        ...settings,
        ...newSettings
      }
    });
  };

  const updateSettings = (newSettings: Partial<MededelingenSettings>) => {
    onUpdate({
      ...data,
      mededelingenSettings: {
        ...settings,
        ...newSettings
      }
    });
  };

  const updateAutoplay = (key: keyof typeof settings.autoplay, value: any) => {
    updateSettings({
      autoplay: {
        ...settings.autoplay,
        [key]: value
      }
    });
  };

  const activeSlides = settings.slides.filter(slide => slide.active);
  const totalDuration = activeSlides.reduce((sum, slide) => sum + slide.durationSec, 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Carrousel instellingen</h3>
        <p className="text-sm text-gray-600">
          Configureer hoe de berichten worden afgespeeld
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Afspeel instellingen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Afspeel instellingen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoplay-enabled">Automatisch afspelen</Label>
              <Switch
                id="autoplay-enabled"
                checked={settings.autoplay.enabled}
                onCheckedChange={(checked) => updateAutoplay('enabled', checked)}
                data-testid="switch-autoplay"
              />
            </div>

            {settings.autoplay.enabled && (
              <>
                <div>
                  <Label htmlFor="interval">Interval tussen berichten (seconden)</Label>
                  <Input
                    id="interval"
                    type="number"
                    value={settings.autoplay.interval}
                    onChange={(e) => updateAutoplay('interval', parseInt(e.target.value) || 8)}
                    min="1"
                    max="60"
                    data-testid="input-interval"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tijd tussen berichten (onafhankelijk van bericht duur)
                  </p>
                </div>

                <div>
                  <Label htmlFor="order">Afspeel volgorde</Label>
                  <Select
                    value={settings.autoplay.order}
                    onValueChange={(value: 'date' | 'manual' | 'shuffle') => updateAutoplay('order', value)}
                  >
                    <SelectTrigger data-testid="select-order">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {orderOptions.map(option => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Overzicht */}
        <Card>
          <CardHeader>
            <CardTitle>Carrousel overzicht</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Totaal berichten:</span>
                <span className="font-medium">{settings.slides.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Actieve berichten:</span>
                <span className="font-medium">{activeSlides.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Totale inhoud duur:</span>
                <span className="font-medium">{totalDuration}s</span>
              </div>
              {settings.autoplay.enabled && (
                <div className="flex justify-between text-sm">
                  <span>Cyclus duur:</span>
                  <span className="font-medium">
                    {totalDuration + (activeSlides.length * settings.autoplay.interval)}s
                  </span>
                </div>
              )}
            </div>

            {activeSlides.length === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Geen actieve berichten. Ga terug om berichten te activeren.
                </p>
              </div>
            )}

            {!settings.autoplay.enabled && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ Handmatige besturing. Berichten worden alleen getoond op actie.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Voorbeeld tijdlijn */}
      {settings.autoplay.enabled && activeSlides.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Voorbeeld tijdlijn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeSlides.slice(0, 3).map((slide, index) => (
                <div key={slide.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{slide.title}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {slide.durationSec}s + {settings.autoplay.interval}s
                  </div>
                </div>
              ))}
              {activeSlides.length > 3 && (
                <div className="text-center text-sm text-gray-500 py-2">
                  ... en {activeSlides.length - 3} andere berichten
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuratie samenvatting */}
      <div className="p-4 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">Carrousel configuratie</h4>
        <div className="text-sm text-green-700 space-y-1">
          <p>• Autoplay: {settings.autoplay.enabled ? 'Aan' : 'Uit'}</p>
          {settings.autoplay.enabled && (
            <>
              <p>• Interval: {settings.autoplay.interval} seconden</p>
              <p>• Volgorde: {orderOptions.find(o => o.value === settings.autoplay.order)?.label}</p>
              <p>• Volledige cyclus: {totalDuration + (activeSlides.length * settings.autoplay.interval)} seconden</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}