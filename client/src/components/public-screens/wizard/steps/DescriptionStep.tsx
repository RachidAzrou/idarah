"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DescriptionStepProps {
  data: { name: string; description?: string };
  onUpdate: (data: any) => void;
}

export function DescriptionStep({ data, onUpdate }: DescriptionStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Naam en beschrijving</h3>
        <p className="text-sm text-gray-600">
          Geef het scherm een naam en optioneel een beschrijving voor intern gebruik
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="screen-name">Naam van het scherm *</Label>
          <Input
            id="screen-name"
            value={data.name}
            onChange={(e) => onUpdate({ ...data, name: e.target.value })}
            placeholder="Bijvoorbeeld: Ledenlijst hoofdgebouw"
            data-testid="input-screen-name"
          />
        </div>

        <div>
          <Label htmlFor="screen-description">Beschrijving (optioneel)</Label>
          <Textarea
            id="screen-description"
            value={data.description || ""}
            onChange={(e) => onUpdate({ ...data, description: e.target.value })}
            placeholder="Interne beschrijving van dit scherm (wordt niet getoond aan het publiek)"
            rows={3}
            data-testid="input-screen-description"
          />
          <p className="text-xs text-gray-500 mt-1">
            Deze beschrijving is alleen zichtbaar voor beheerders
          </p>
        </div>
      </div>
    </div>
  );
}