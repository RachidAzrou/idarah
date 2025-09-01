"use client";

import { useState } from "react";
import { AnnouncementsConfig, AnnouncementSlide } from "@/lib/mock/public-screens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface AnnouncementsConfigFormProps {
  config: AnnouncementsConfig;
  onChange: (config: AnnouncementsConfig) => void;
}

export function AnnouncementsConfigForm({ config, onChange }: AnnouncementsConfigFormProps) {
  const updateConfig = (updates: Partial<AnnouncementsConfig>) => {
    onChange({ ...config, ...updates });
  };

  const updateAutoplay = (updates: Partial<AnnouncementsConfig['autoplay']>) => {
    onChange({
      ...config,
      autoplay: { ...config.autoplay, ...updates }
    });
  };

  const updateStyle = (updates: Partial<AnnouncementsConfig['style']>) => {
    onChange({
      ...config,
      style: { ...config.style, ...updates }
    });
  };

  const addSlide = () => {
    const newSlide: AnnouncementSlide = {
      id: `slide-${Date.now()}`,
      title: '',
      body: '',
      active: true,
      durationSec: 8
    };
    updateConfig({ slides: [...config.slides, newSlide] });
  };

  const updateSlide = (index: number, updates: Partial<AnnouncementSlide>) => {
    const updatedSlides = [...config.slides];
    updatedSlides[index] = { ...updatedSlides[index], ...updates };
    updateConfig({ slides: updatedSlides });
  };

  const removeSlide = (index: number) => {
    const updatedSlides = config.slides.filter((_, i) => i !== index);
    updateConfig({ slides: updatedSlides });
  };

  return (
    <div className="space-y-6">
      {/* Slides Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Slides</h4>
          <Button onClick={addSlide} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Slide toevoegen
          </Button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {config.slides.map((slide, index) => (
            <Card key={slide.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    Slide {index + 1}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={slide.active}
                      onCheckedChange={(checked) => updateSlide(index, { active: checked })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSlide(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Titel *</Label>
                  <Input
                    value={slide.title}
                    onChange={(e) => updateSlide(index, { title: e.target.value })}
                    placeholder="Bijvoorbeeld: Belangrijke mededeling"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Inhoud</Label>
                  <Textarea
                    value={slide.body || ''}
                    onChange={(e) => updateSlide(index, { body: e.target.value })}
                    placeholder="Voeg hier de inhoud van je mededeling toe..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Media URL</Label>
                    <Input
                      value={slide.mediaUrl || ''}
                      onChange={(e) => updateSlide(index, { mediaUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Media type</Label>
                    <Select 
                      value={slide.mediaType || ''} 
                      onValueChange={(value: 'image' | 'video') => updateSlide(index, { mediaType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Afbeelding</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Geldig vanaf</Label>
                    <Input
                      type="date"
                      value={slide.validFrom?.split('T')[0] || ''}
                      onChange={(e) => updateSlide(index, { 
                        validFrom: e.target.value ? `${e.target.value}T00:00:00Z` : undefined 
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Geldig tot</Label>
                    <Input
                      type="date"
                      value={slide.validTo?.split('T')[0] || ''}
                      onChange={(e) => updateSlide(index, { 
                        validTo: e.target.value ? `${e.target.value}T23:59:59Z` : undefined 
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Duur (sec)</Label>
                    <Input
                      type="number"
                      min="3"
                      max="60"
                      value={slide.durationSec}
                      onChange={(e) => updateSlide(index, { durationSec: parseInt(e.target.value) || 8 })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {config.slides.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-2">Nog geen slides toegevoegd</div>
            <Button onClick={addSlide} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Eerste slide toevoegen
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Autoplay Settings */}
      <div className="space-y-4">
        <h4 className="font-medium">Autoplay instellingen</h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Autoplay</Label>
              <div className="text-xs text-gray-500">
                Automatisch doorschakelen tussen slides
              </div>
            </div>
            <Switch
              checked={config.autoplay.enabled}
              onCheckedChange={(checked) => updateAutoplay({ enabled: checked })}
            />
          </div>

          {config.autoplay.enabled && (
            <>
              <div className="space-y-2">
                <Label>Interval (seconden)</Label>
                <Input
                  type="number"
                  min="3"
                  max="60"
                  value={config.autoplay.interval}
                  onChange={(e) => updateAutoplay({ interval: parseInt(e.target.value) || 8 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Volgorde</Label>
                <Select 
                  value={config.autoplay.order} 
                  onValueChange={(value: 'date' | 'manual' | 'shuffle') => updateAutoplay({ order: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Op datum</SelectItem>
                    <SelectItem value="manual">Handmatige volgorde</SelectItem>
                    <SelectItem value="shuffle">Willekeurig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Style Settings */}
      <div className="space-y-4">
        <h4 className="font-medium">Stijl instellingen</h4>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Tekst contrast</Label>
            <Select 
              value={config.style.textContrast} 
              onValueChange={(value: 'light' | 'dark') => updateStyle({ textContrast: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Licht (op donkere achtergrond)</SelectItem>
                <SelectItem value="dark">Donker (op lichte achtergrond)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Achtergrond</Label>
            <Select 
              value={config.style.background} 
              onValueChange={(value: 'white' | 'black' | 'transparent') => updateStyle({ background: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="white">Wit</SelectItem>
                <SelectItem value="black">Zwart</SelectItem>
                <SelectItem value="transparent">Transparant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Max tekst breedte (px)</Label>
            <Input
              type="number"
              min="400"
              max="1200"
              value={config.style.maxTextWidth}
              onChange={(e) => updateStyle({ maxTextWidth: parseInt(e.target.value) || 800 })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}