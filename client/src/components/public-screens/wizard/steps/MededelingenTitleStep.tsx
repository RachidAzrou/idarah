"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPicker } from "@/components/ui/color-wheel";
import { Type, Palette } from "lucide-react";

interface TitleConfig {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: string;
}

interface SubtitleConfig {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: string;
}

interface MededelingenTitleStepProps {
  data: {
    title?: TitleConfig;
    subtitle?: SubtitleConfig;
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

export function MededelingenTitleStep({ data, onUpdate }: MededelingenTitleStepProps) {
  const titleConfig = data.title || {
    text: "",
    fontSize: 48,
    fontFamily: "Poppins",
    color: "#1f2937",
    fontWeight: "bold"
  };

  const subtitleConfig = data.subtitle || {
    text: "",
    fontSize: 24,
    fontFamily: "Poppins",
    color: "#6b7280",
    fontWeight: "normal"
  };

  const updateTitle = (updates: Partial<TitleConfig>) => {
    onUpdate({
      ...data,
      title: { ...titleConfig, ...updates }
    });
  };

  const updateSubtitle = (updates: Partial<SubtitleConfig>) => {
    onUpdate({
      ...data,
      subtitle: { ...subtitleConfig, ...updates }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Titel en ondertitel</h3>
        <p className="text-sm text-gray-600">
          Configureer de hoofdtitel en ondertitel voor je mededelingen scherm
        </p>
      </div>

      {/* Title Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Hoofdtitel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title-text">Titel tekst</Label>
            <Input
              id="title-text"
              value={titleConfig.text}
              onChange={(e) => updateTitle({ text: e.target.value })}
              placeholder="Voer de hoofdtitel in..."
              data-testid="input-title-text"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title-fontSize">Lettergrootte</Label>
              <Input
                id="title-fontSize"
                type="number"
                value={titleConfig.fontSize}
                onChange={(e) => updateTitle({ fontSize: parseInt(e.target.value) || 48 })}
                min="12"
                max="72"
                data-testid="input-title-fontsize"
              />
            </div>
            <div>
              <Label htmlFor="title-fontFamily">Lettertype</Label>
              <Select value={titleConfig.fontFamily} onValueChange={(value) => updateTitle({ fontFamily: value })}>
                <SelectTrigger data-testid="select-title-fontfamily">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title-fontWeight">Tekststijl</Label>
              <Select value={titleConfig.fontWeight} onValueChange={(value) => updateTitle({ fontWeight: value })}>
                <SelectTrigger data-testid="select-title-fontweight">
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
              <Label htmlFor="title-color">Tekstkleur</Label>
              <ColorPicker
                value={titleConfig.color}
                onChange={(color) => updateTitle({ color })}
                data-testid="colorpicker-title"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subtitle Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Ondertitel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subtitle-text">Ondertitel tekst</Label>
            <Input
              id="subtitle-text"
              value={subtitleConfig.text}
              onChange={(e) => updateSubtitle({ text: e.target.value })}
              placeholder="Voer de ondertitel in (optioneel)..."
              data-testid="input-subtitle-text"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subtitle-fontSize">Lettergrootte</Label>
              <Input
                id="subtitle-fontSize"
                type="number"
                value={subtitleConfig.fontSize}
                onChange={(e) => updateSubtitle({ fontSize: parseInt(e.target.value) || 24 })}
                min="12"
                max="48"
                data-testid="input-subtitle-fontsize"
              />
            </div>
            <div>
              <Label htmlFor="subtitle-fontFamily">Lettertype</Label>
              <Select value={subtitleConfig.fontFamily} onValueChange={(value) => updateSubtitle({ fontFamily: value })}>
                <SelectTrigger data-testid="select-subtitle-fontfamily">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subtitle-fontWeight">Tekststijl</Label>
              <Select value={subtitleConfig.fontWeight} onValueChange={(value) => updateSubtitle({ fontWeight: value })}>
                <SelectTrigger data-testid="select-subtitle-fontweight">
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
              <Label htmlFor="subtitle-color">Tekstkleur</Label>
              <ColorPicker
                value={subtitleConfig.color}
                onChange={(color) => updateSubtitle({ color })}
                data-testid="colorpicker-subtitle"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Voorbeeld</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            {titleConfig.text && (
              <h1 
                style={{
                  fontSize: `${titleConfig.fontSize}px`,
                  fontFamily: titleConfig.fontFamily,
                  fontWeight: titleConfig.fontWeight,
                  color: titleConfig.color,
                  marginBottom: '16px'
                }}
              >
                {titleConfig.text}
              </h1>
            )}
            {subtitleConfig.text && (
              <h2 
                style={{
                  fontSize: `${subtitleConfig.fontSize}px`,
                  fontFamily: subtitleConfig.fontFamily,
                  fontWeight: subtitleConfig.fontWeight,
                  color: subtitleConfig.color
                }}
              >
                {subtitleConfig.text}
              </h2>
            )}
            {!titleConfig.text && !subtitleConfig.text && (
              <p className="text-gray-400 italic">Voer een titel of ondertitel in om het voorbeeld te zien</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}