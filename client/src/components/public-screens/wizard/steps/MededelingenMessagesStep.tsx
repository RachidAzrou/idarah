"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, GripVertical, Eye, EyeOff } from "lucide-react";
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

interface MededelingenMessagesStepProps {
  data: {
    mededelingenSettings?: MededelingenSettings;
  };
  onUpdate: (data: any) => void;
}

const fontFamilies = [
  { value: "Poppins", label: "Poppins" },
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Georgia", label: "Georgia" }
];

const fontWeights = [
  { value: "normal", label: "Normaal" },
  { value: "bold", label: "Vet" },
  { value: "lighter", label: "Licht" }
];

export function MededelingenMessagesStep({ data, onUpdate }: MededelingenMessagesStepProps) {
  const [previewSlide, setPreviewSlide] = useState<string | null>(null);

  const settings = data.mededelingenSettings || {
    slides: [{
      id: 'slide1',
      title: 'Eerste bericht',
      body: '',
      active: true,
      durationSec: 10,
      styling: {
        titleFontSize: 32,
        titleFontWeight: 'bold',
        titleFontFamily: 'Poppins',
        titleColor: '#1f2937',
        bodyFontSize: 18,
        bodyFontWeight: 'normal',
        bodyFontFamily: 'Poppins',
        bodyColor: '#374151',
        backgroundColor: '#ffffff'
      }
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
      durationSec: 10,
      styling: {
        titleFontSize: 32,
        titleFontWeight: 'bold',
        titleFontFamily: 'Poppins',
        titleColor: '#1f2937',
        bodyFontSize: 18,
        bodyFontWeight: 'normal',
        bodyFontFamily: 'Poppins',
        bodyColor: '#374151',
        backgroundColor: '#ffffff'
      }
    };

    updateSettings({
      slides: [...settings.slides, newSlide]
    });
  };

  const updateSlide = (slideId: string, updates: Partial<MededelingenSlide>) => {
    const updatedSlides = settings.slides.map(slide =>
      slide.id === slideId ? { ...slide, ...updates } : slide
    );
    
    updateSettings({ slides: updatedSlides });
  };

  const updateSlideStyle = (slideId: string, styleKey: string, value: any) => {
    const updatedSlides = settings.slides.map(slide =>
      slide.id === slideId 
        ? { ...slide, styling: { ...slide.styling, [styleKey]: value } }
        : slide
    );
    
    updateSettings({ slides: updatedSlides });
  };

  const deleteSlide = (slideId: string) => {
    if (settings.slides.length <= 1) return; // Altijd minstens 1 slide
    
    updateSettings({
      slides: settings.slides.filter(slide => slide.id !== slideId)
    });
  };

  const moveSlide = (fromIndex: number, toIndex: number) => {
    const newSlides = [...settings.slides];
    const [movedSlide] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, movedSlide);
    
    updateSettings({ slides: newSlides });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Berichten beheren</h3>
        <p className="text-sm text-gray-600">
          Maak berichten aan, pas de styling aan en bepaal de volgorde
        </p>
      </div>

      <div className="space-y-4">
        {settings.slides.map((slide, index) => (
          <Card key={slide.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                  <CardTitle className="text-base">Bericht {index + 1}</CardTitle>
                  <Badge variant={slide.active ? "default" : "secondary"}>
                    {slide.active ? "Actief" : "Inactief"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewSlide(previewSlide === slide.id ? null : slide.id)}
                    data-testid={`preview-slide-${slide.id}`}
                  >
                    {previewSlide === slide.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  {settings.slides.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSlide(slide.id)}
                      data-testid={`delete-slide-${slide.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Bericht inhoud */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`title-${slide.id}`}>Titel *</Label>
                    <Input
                      id={`title-${slide.id}`}
                      value={slide.title}
                      onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                      placeholder="Titel van het bericht"
                      data-testid={`input-slide-title-${slide.id}`}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`body-${slide.id}`}>Tekst</Label>
                    <Textarea
                      id={`body-${slide.id}`}
                      value={slide.body || ''}
                      onChange={(e) => updateSlide(slide.id, { body: e.target.value })}
                      placeholder="Bericht tekst (optioneel)"
                      rows={3}
                      data-testid={`textarea-slide-body-${slide.id}`}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`duration-${slide.id}`}>Duur (seconden)</Label>
                    <Input
                      id={`duration-${slide.id}`}
                      type="number"
                      value={slide.durationSec}
                      onChange={(e) => updateSlide(slide.id, { durationSec: parseInt(e.target.value) || 10 })}
                      min="1"
                      max="60"
                      data-testid={`input-slide-duration-${slide.id}`}
                    />
                  </div>
                </div>

                {/* Styling */}
                <div className="space-y-4">
                  <h4 className="font-medium">Styling</h4>
                  
                  {/* Titel styling */}
                  <div className="space-y-3 p-3 border rounded-lg">
                    <h5 className="text-sm font-medium">Titel</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Grootte</Label>
                        <Input
                          type="number"
                          value={slide.styling?.titleFontSize || 32}
                          onChange={(e) => updateSlideStyle(slide.id, 'titleFontSize', parseInt(e.target.value))}
                          min="12"
                          max="72"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Gewicht</Label>
                        <Select 
                          value={slide.styling?.titleFontWeight || 'bold'} 
                          onValueChange={(value) => updateSlideStyle(slide.id, 'titleFontWeight', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontWeights.map(weight => (
                              <SelectItem key={weight.value} value={weight.value}>
                                {weight.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Font</Label>
                        <Select 
                          value={slide.styling?.titleFontFamily || 'Poppins'} 
                          onValueChange={(value) => updateSlideStyle(slide.id, 'titleFontFamily', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontFamilies.map(font => (
                              <SelectItem key={font.value} value={font.value}>
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Kleur</Label>
                        <ColorPicker
                          value={slide.styling?.titleColor || '#1f2937'}
                          onChange={(color) => updateSlideStyle(slide.id, 'titleColor', color)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tekst styling */}
                  <div className="space-y-3 p-3 border rounded-lg">
                    <h5 className="text-sm font-medium">Tekst</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Grootte</Label>
                        <Input
                          type="number"
                          value={slide.styling?.bodyFontSize || 18}
                          onChange={(e) => updateSlideStyle(slide.id, 'bodyFontSize', parseInt(e.target.value))}
                          min="12"
                          max="48"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Gewicht</Label>
                        <Select 
                          value={slide.styling?.bodyFontWeight || 'normal'} 
                          onValueChange={(value) => updateSlideStyle(slide.id, 'bodyFontWeight', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontWeights.map(weight => (
                              <SelectItem key={weight.value} value={weight.value}>
                                {weight.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Font</Label>
                        <Select 
                          value={slide.styling?.bodyFontFamily || 'Poppins'} 
                          onValueChange={(value) => updateSlideStyle(slide.id, 'bodyFontFamily', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontFamilies.map(font => (
                              <SelectItem key={font.value} value={font.value}>
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Kleur</Label>
                        <ColorPicker
                          value={slide.styling?.bodyColor || '#374151'}
                          onChange={(color) => updateSlideStyle(slide.id, 'bodyColor', color)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Achtergrond */}
                  <div className="space-y-3 p-3 border rounded-lg">
                    <h5 className="text-sm font-medium">Achtergrond</h5>
                    <div>
                      <Label className="text-xs">Kleur</Label>
                      <ColorPicker
                        value={slide.styling?.backgroundColor || '#ffffff'}
                        onChange={(color) => updateSlideStyle(slide.id, 'backgroundColor', color)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {previewSlide === slide.id && (
                <div className="mt-4 p-6 border rounded-lg" style={{ backgroundColor: slide.styling?.backgroundColor || '#ffffff' }}>
                  <div className="text-center space-y-3">
                    <h3
                      style={{
                        fontSize: `${slide.styling?.titleFontSize || 32}px`,
                        fontFamily: slide.styling?.titleFontFamily || 'Poppins',
                        fontWeight: slide.styling?.titleFontWeight || 'bold',
                        color: slide.styling?.titleColor || '#1f2937',
                        margin: 0
                      }}
                    >
                      {slide.title}
                    </h3>
                    {slide.body && (
                      <p
                        style={{
                          fontSize: `${slide.styling?.bodyFontSize || 18}px`,
                          fontFamily: slide.styling?.bodyFontFamily || 'Poppins',
                          fontWeight: slide.styling?.bodyFontWeight || 'normal',
                          color: slide.styling?.bodyColor || '#374151',
                          margin: 0
                        }}
                      >
                        {slide.body}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={addSlide}
        variant="outline"
        className="w-full"
        data-testid="add-slide-button"
      >
        <Plus className="w-4 h-4 mr-2" />
        Nieuw bericht toevoegen
      </Button>

      {settings.slides.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Berichten overzicht</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Aantal berichten: {settings.slides.length}</p>
            <p>• Actieve berichten: {settings.slides.filter(s => s.active).length}</p>
            <p>• Totale duur: {settings.slides.reduce((sum, slide) => sum + slide.durationSec, 0)} seconden</p>
          </div>
        </div>
      )}
    </div>
  );
}