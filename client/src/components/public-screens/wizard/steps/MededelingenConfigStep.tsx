"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Upload, Eye } from "lucide-react";
import { ColorPicker } from "@/components/ui/color-wheel";
import { MededelingenSlide } from "@/lib/mock/public-screens";

interface MededelingenSettings {
  slides: MededelingenSlide[];
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

interface MededelingenConfigStepProps {
  data: {
    mededelingenSettings?: MededelingenSettings;
  };
  onUpdate: (data: any) => void;
}

export function MededelingenConfigStep({ data, onUpdate }: MededelingenConfigStepProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const settings = data.mededelingenSettings || {
    slides: [{
      id: 'slide1',
      title: 'Eerste bericht',
      body: '',
      active: true,
      durationSec: 10
    }],
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

  const addSlide = () => {
    const newSlide: MededelingenSlide = {
      id: `slide${Date.now()}`,
      title: `Bericht ${settings.slides.length + 1}`,
      body: '',
      active: true,
      durationSec: 10
    };
    
    updateSettings({
      slides: [...settings.slides, newSlide]
    });
  };

  const removeSlide = (slideId: string) => {
    if (settings.slides.length <= 1) return;
    
    updateSettings({
      slides: settings.slides.filter(s => s.id !== slideId)
    });
    
    if (currentSlide >= settings.slides.length - 1) {
      setCurrentSlide(Math.max(0, settings.slides.length - 2));
    }
  };

  const updateSlide = (slideId: string, updates: Partial<MededelingenSlide>) => {
    updateSettings({
      slides: settings.slides.map(slide => 
        slide.id === slideId ? { ...slide, ...updates } : slide
      )
    });
  };

  const handleImageUpload = (slideId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Voor nu simuleren we een upload - in een echte app zou je dit naar een server uploaden
      const imageUrl = URL.createObjectURL(file);
      updateSlide(slideId, { 
        mediaUrl: imageUrl, 
        mediaType: 'image' 
      });
    }
  };

  const PreviewSlide = ({ slide }: { slide: MededelingenSlide }) => (
    <div 
      className="relative w-full h-64 rounded-lg overflow-hidden flex items-center justify-center"
      style={{ 
        backgroundColor: settings.style.backgroundColor,
        color: settings.style.textColor 
      }}
    >
      {slide.mediaUrl && (
        <img 
          src={slide.mediaUrl} 
          alt={slide.title}
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
      )}
      <div 
        className="relative z-10 text-center px-6"
        style={{ maxWidth: settings.style.maxTextWidth }}
      >
        <h2 className="text-xl font-bold mb-2">{slide.title}</h2>
        {slide.body && (
          <p className="text-sm opacity-90">{slide.body}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Berichten beheer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Berichten ({settings.slides.length})</h3>
          <Button onClick={addSlide} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nieuw bericht
          </Button>
        </div>

        {/* Berichten tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {settings.slides.map((slide, index) => (
            <Button
              key={slide.id}
              variant={currentSlide === index ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentSlide(index)}
              className="shrink-0"
            >
              {slide.title}
            </Button>
          ))}
        </div>

        {/* Huidig bericht bewerken */}
        {settings.slides[currentSlide] && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Bericht {currentSlide + 1} bewerken
                </CardTitle>
                {settings.slides.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeSlide(settings.slides[currentSlide].id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Titel</Label>
                  <Input
                    value={settings.slides[currentSlide].title}
                    onChange={(e) => updateSlide(settings.slides[currentSlide].id, { title: e.target.value })}
                    placeholder="Titel van het bericht"
                  />
                </div>
                <div>
                  <Label>Weergavetijd (seconden)</Label>
                  <Input
                    type="number"
                    value={settings.slides[currentSlide].durationSec}
                    onChange={(e) => updateSlide(settings.slides[currentSlide].id, { durationSec: parseInt(e.target.value) || 10 })}
                    min={1}
                    max={60}
                  />
                </div>
              </div>

              <div>
                <Label>Berichttekst</Label>
                <Textarea
                  value={settings.slides[currentSlide].body || ''}
                  onChange={(e) => updateSlide(settings.slides[currentSlide].id, { body: e.target.value })}
                  placeholder="De inhoud van je bericht..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Afbeelding (optioneel)</Label>
                <div className="flex gap-3 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(settings.slides[currentSlide].id, e)}
                    className="hidden"
                    id={`image-upload-${settings.slides[currentSlide].id}`}
                  />
                  <Button
                    variant="outline"
                    asChild
                    className="gap-2"
                  >
                    <label htmlFor={`image-upload-${settings.slides[currentSlide].id}`}>
                      <Upload className="w-4 h-4" />
                      Afbeelding uploaden
                    </label>
                  </Button>
                  {settings.slides[currentSlide].mediaUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSlide(settings.slides[currentSlide].id, { mediaUrl: undefined, mediaType: undefined })}
                    >
                      Verwijderen
                    </Button>
                  )}
                </div>
                {settings.slides[currentSlide].mediaUrl && (
                  <img 
                    src={settings.slides[currentSlide].mediaUrl} 
                    alt="Preview" 
                    className="mt-2 w-32 h-20 object-cover rounded border"
                  />
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.slides[currentSlide].active}
                  onCheckedChange={(active) => updateSlide(settings.slides[currentSlide].id, { active })}
                />
                <Label>Actief in carrousel</Label>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Carrousel instellingen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Carrousel instellingen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.autoplay.enabled}
              onCheckedChange={(enabled) => updateSettings({
                autoplay: { ...settings.autoplay, enabled }
              })}
            />
            <Label>Automatisch afspelen</Label>
          </div>

          {settings.autoplay.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Standaard interval (seconden)</Label>
                <Input
                  type="number"
                  value={settings.autoplay.interval}
                  onChange={(e) => updateSettings({
                    autoplay: { 
                      ...settings.autoplay, 
                      interval: parseInt(e.target.value) || 8 
                    }
                  })}
                  min={1}
                  max={60}
                />
              </div>
              <div>
                <Label>Volgorde</Label>
                <Select
                  value={settings.autoplay.order}
                  onValueChange={(order: 'date' | 'manual' | 'shuffle') => updateSettings({
                    autoplay: { ...settings.autoplay, order }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Handmatige volgorde</SelectItem>
                    <SelectItem value="date">Op datum</SelectItem>
                    <SelectItem value="shuffle">Willekeurig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Styling */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Styling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tekstkleur</Label>
              <ColorPicker
                value={settings.style.textColor}
                onChange={(color) => updateSettings({
                  style: { ...settings.style, textColor: color }
                })}
              />
            </div>
            <div>
              <Label>Achtergrondkleur</Label>
              <ColorPicker
                value={settings.style.backgroundColor}
                onChange={(color) => updateSettings({
                  style: { ...settings.style, backgroundColor: color }
                })}
              />
            </div>
          </div>
          <div>
            <Label>Maximale tekstbreedte (pixels)</Label>
            <Input
              type="number"
              value={settings.style.maxTextWidth}
              onChange={(e) => updateSettings({
                style: { 
                  ...settings.style, 
                  maxTextWidth: parseInt(e.target.value) || 800 
                }
              })}
              min={300}
              max={1200}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Preview</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Verberg' : 'Toon'} preview
            </Button>
          </div>
        </CardHeader>
        {showPreview && (
          <CardContent>
            {settings.slides[currentSlide] && (
              <PreviewSlide slide={settings.slides[currentSlide]} />
            )}
            {settings.slides.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {settings.slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentSlide ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}