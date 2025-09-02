"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

const predefinedColors = [
  "#000000", "#1a1a1a", "#333333", "#4d4d4d", "#666666", "#808080", "#999999", "#b3b3b3", "#cccccc", "#e6e6e6", "#f5f5f5", "#ffffff",
  "#ff0000", "#ff4d4d", "#ff9999", "#ffcccc", "#ffe6e6", "#800000", "#cc0000", "#ff6666", "#ffb3b3", "#ffd9d9", "#ffeeee", "#fff2f2",
  "#ff8000", "#ffaa55", "#ffcc99", "#ffe6cc", "#fff0e6", "#804000", "#cc6600", "#ff9933", "#ffcc66", "#ffe0b3", "#ffedd9", "#fff7f0",
  "#ffff00", "#ffff4d", "#ffff99", "#ffffcc", "#ffffe6", "#808000", "#cccc00", "#ffff66", "#ffffb3", "#ffffd9", "#ffffee", "#fffff2",
  "#80ff00", "#aaff55", "#ccff99", "#e6ffcc", "#f0ffe6", "#408000", "#66cc00", "#99ff33", "#ccff66", "#e0ffb3", "#edffdd", "#f7fff0",
  "#00ff00", "#4dff4d", "#99ff99", "#ccffcc", "#e6ffe6", "#008000", "#00cc00", "#66ff66", "#b3ffb3", "#d9ffd9", "#eeffee", "#f2fff2",
  "#00ff80", "#55ffaa", "#99ffcc", "#ccffe6", "#e6fff0", "#008040", "#00cc66", "#33ff99", "#66ffcc", "#b3ffe0", "#ddfedd", "#f0fff7",
  "#00ffff", "#4dffff", "#99ffff", "#ccffff", "#e6ffff", "#008080", "#00cccc", "#66ffff", "#b3ffff", "#d9ffff", "#eeffff", "#f2ffff",
  "#0080ff", "#55aaff", "#99ccff", "#cce6ff", "#e6f0ff", "#004080", "#0066cc", "#3399ff", "#66ccff", "#b3e0ff", "#ddedff", "#f0f7ff",
  "#0000ff", "#4d4dff", "#9999ff", "#ccccff", "#e6e6ff", "#000080", "#0000cc", "#6666ff", "#b3b3ff", "#d9d9ff", "#eeeeff", "#f2f2ff",
  "#8000ff", "#aa55ff", "#cc99ff", "#e6ccff", "#f0e6ff", "#400080", "#6600cc", "#9933ff", "#cc66ff", "#e0b3ff", "#edddff", "#f7f0ff",
  "#ff00ff", "#ff4dff", "#ff99ff", "#ffccff", "#ffe6ff", "#800080", "#cc00cc", "#ff66ff", "#ffb3ff", "#ffd9ff", "#ffeeff", "#fff2ff",
  "#ff0080", "#ff55aa", "#ff99cc", "#ffcce6", "#ffe6f0", "#800040", "#cc0066", "#ff3399", "#ff66cc", "#ffb3e0", "#ffddfd", "#fff0f7"
];

export function ColorPicker({ value, onChange, className = "" }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value);

  const handleHexChange = (hex: string) => {
    setHexInput(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hex);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`h-10 w-full justify-start gap-3 ${className}`}
        >
          <div
            className="w-6 h-6 rounded border border-gray-300 shadow-sm"
            style={{ backgroundColor: value }}
          />
          <span className="text-sm font-mono">{value.toUpperCase()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          {/* Current Color Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div
              className="w-12 h-12 rounded-lg border-2 border-white shadow-lg"
              style={{ backgroundColor: value }}
            />
            <div>
              <div className="text-sm font-medium">Geselecteerde kleur</div>
              <div className="text-xs font-mono text-gray-600">{value.toUpperCase()}</div>
            </div>
          </div>

          {/* Hex Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Hex kleur</label>
            <Input
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="#000000"
              className="font-mono"
            />
          </div>

          {/* Native Color Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Kleurenkiezer</label>
            <input
              type="color"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setHexInput(e.target.value);
              }}
              className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
            />
          </div>

          {/* Predefined Colors Grid */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Vooraf gedefinieerde kleuren</label>
            <div className="grid grid-cols-12 gap-1">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    onChange(color);
                    setHexInput(color);
                  }}
                  className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                    value === color ? 'border-gray-800 ring-2 ring-blue-500' : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color.toUpperCase()}
                />
              ))}
            </div>
          </div>

          {/* Common Colors */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Veel gebruikte kleuren</label>
            <div className="flex gap-2">
              {["#000000", "#ffffff", "#2563eb", "#dc2626", "#16a34a", "#f59e0b", "#7c3aed", "#e11d48"].map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    onChange(color);
                    setHexInput(color);
                  }}
                  className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                    value === color ? 'border-gray-800 ring-2 ring-blue-500' : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color.toUpperCase()}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}