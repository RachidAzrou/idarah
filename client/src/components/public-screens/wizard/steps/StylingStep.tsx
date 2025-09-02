"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-wheel";
import { TitleStyling } from "@/lib/mock/public-screens";

interface StylingStepProps {
  data: {
    title: TitleStyling;
    subtitle: TitleStyling;
  };
  onUpdate: (data: any) => void;
}

const fontFamilies = [
  { value: "Poppins", label: "Poppins" },
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Source Sans Pro", label: "Source Sans Pro" },
  { value: "Nunito", label: "Nunito" },
  { value: "PT Sans", label: "PT Sans" },
  { value: "Ubuntu", label: "Ubuntu" },
  { value: "Raleway", label: "Raleway" },
  { value: "Merriweather", label: "Merriweather" },
  { value: "Oswald", label: "Oswald" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Georgia", label: "Georgia" },
  { value: "Verdana", label: "Verdana" },
  { value: "Trebuchet MS", label: "Trebuchet MS" }
];

const fontWeights = [
  { value: "normal", label: "Normaal" },
  { value: "bold", label: "Vet" }
];

const colors = [
  { value: "#000000", label: "Zwart" },
  { value: "#1f2937", label: "Donkergrijs" },
  { value: "#374151", label: "Grijs" },
  { value: "#6b7280", label: "Lichtgrijs" },
  { value: "#9ca3af", label: "Zilvergijs" },
  { value: "#ffffff", label: "Wit" },
  { value: "#2563eb", label: "Blauw" },
  { value: "#1d4ed8", label: "Donkerblauw" },
  { value: "#3b82f6", label: "Lichtblauw" },
  { value: "#06b6d4", label: "Cyaan" },
  { value: "#0891b2", label: "Teal" },
  { value: "#059669", label: "Groen" },
  { value: "#16a34a", label: "Lichtgroen" },
  { value: "#65a30d", label: "Lime" },
  { value: "#eab308", label: "Geel" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ea580c", label: "Oranje" },
  { value: "#dc2626", label: "Rood" },
  { value: "#e11d48", label: "Rose" },
  { value: "#c2410c", label: "Donkeroranje" },
  { value: "#7c3aed", label: "Paars" },
  { value: "#a855f7", label: "Violet" },
  { value: "#d946ef", label: "Fuchsia" },
  { value: "#ec4899", label: "Roze" },
  { value: "#be185d", label: "Donkerroze" },
  { value: "#92400e", label: "Bruin" },
  { value: "#451a03", label: "Donkerbruin" }
];

const defaultTitleStyling: TitleStyling = {
  text: "",
  fontSize: 32,
  fontFamily: "Poppins",
  color: "#1f2937",
  fontWeight: "bold"
};

const defaultSubtitleStyling: TitleStyling = {
  text: "",
  fontSize: 18,
  fontFamily: "Poppins", 
  color: "#6b7280",
  fontWeight: "normal"
};

export function StylingStep({ data, onUpdate }: StylingStepProps) {
  // Ensure title and subtitle exist with defaults
  const safeTitle = data.title || defaultTitleStyling;
  const safeSubtitle = data.subtitle || defaultSubtitleStyling;

  const updateTitle = (field: keyof TitleStyling, value: any) => {
    onUpdate({
      ...data,
      title: { ...safeTitle, [field]: value }
    });
  };

  const updateSubtitle = (field: keyof TitleStyling, value: any) => {
    onUpdate({
      ...data,
      subtitle: { ...safeSubtitle, [field]: value }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Configuratie */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Titel en ondertitel instellen</h3>
          <p className="text-sm text-gray-600">
            Configureer de opmaak van de titel en ondertitel
          </p>
        </div>

        {/* Titel configuratie */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-medium">Titel</h4>
          
          <div>
            <Label htmlFor="title-text">Tekst *</Label>
            <Input
              id="title-text"
              value={safeTitle.text}
              onChange={(e) => updateTitle('text', e.target.value)}
              placeholder="Titel van het scherm"
              data-testid="input-title-text"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title-fontsize">Lettergrootte</Label>
              <Input
                id="title-fontsize"
                type="number"
                value={safeTitle.fontSize}
                onChange={(e) => updateTitle('fontSize', parseInt(e.target.value))}
                min="12"
                max="72"
                data-testid="input-title-fontsize"
              />
            </div>
            
            <div>
              <Label htmlFor="title-fontweight">Gewicht</Label>
              <Select value={safeTitle.fontWeight} onValueChange={(value) => updateTitle('fontWeight', value)}>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title-fontfamily">Lettertype</Label>
              <Select value={safeTitle.fontFamily} onValueChange={(value) => updateTitle('fontFamily', value)}>
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

            <div>
              <Label htmlFor="title-color">Kleur</Label>
              <ColorPicker
                value={safeTitle.color}
                onChange={(color) => updateTitle('color', color)}
              />
            </div>
          </div>
        </div>

        {/* Ondertitel configuratie */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-medium">Ondertitel</h4>
          
          <div>
            <Label htmlFor="subtitle-text">Tekst</Label>
            <Input
              id="subtitle-text"
              value={safeSubtitle.text}
              onChange={(e) => updateSubtitle('text', e.target.value)}
              placeholder="Ondertitel (optioneel)"
              data-testid="input-subtitle-text"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subtitle-fontsize">Lettergrootte</Label>
              <Input
                id="subtitle-fontsize"
                type="number"
                value={safeSubtitle.fontSize}
                onChange={(e) => updateSubtitle('fontSize', parseInt(e.target.value))}
                min="12"
                max="48"
                data-testid="input-subtitle-fontsize"
              />
            </div>
            
            <div>
              <Label htmlFor="subtitle-fontweight">Gewicht</Label>
              <Select value={safeSubtitle.fontWeight} onValueChange={(value) => updateSubtitle('fontWeight', value)}>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subtitle-fontfamily">Lettertype</Label>
              <Select value={safeSubtitle.fontFamily} onValueChange={(value) => updateSubtitle('fontFamily', value)}>
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

            <div>
              <Label htmlFor="subtitle-color">Kleur</Label>
              <ColorPicker
                value={safeSubtitle.color}
                onChange={(color) => updateSubtitle('color', color)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Live preview</h3>
          <p className="text-sm text-gray-600">
            Bekijk hoe de titel en ondertitel eruit zien
          </p>
        </div>

        <div className="p-6 border rounded-lg bg-white min-h-[300px] flex flex-col justify-center items-center space-y-4">
          {safeTitle.text && (
            <h1
              style={{
                fontSize: `${safeTitle.fontSize}px`,
                fontFamily: safeTitle.fontFamily,
                color: safeTitle.color,
                fontWeight: safeTitle.fontWeight,
                textAlign: 'center',
                margin: 0
              }}
              data-testid="preview-title"
            >
              {safeTitle.text}
            </h1>
          )}
          
          {safeSubtitle.text && (
            <h2
              style={{
                fontSize: `${safeSubtitle.fontSize}px`,
                fontFamily: safeSubtitle.fontFamily,
                color: safeSubtitle.color,
                fontWeight: safeSubtitle.fontWeight,
                textAlign: 'center',
                margin: 0
              }}
              data-testid="preview-subtitle"
            >
              {safeSubtitle.text}
            </h2>
          )}

          {!safeTitle.text && (
            <p className="text-gray-400 text-center">
              Voer een titel in om de preview te zien
            </p>
          )}
        </div>
      </div>
    </div>
  );
}