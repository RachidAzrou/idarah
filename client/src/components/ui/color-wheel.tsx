"use client";

import { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";

interface ColorWheelProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

interface HSB {
  h: number; // 0-360
  s: number; // 0-100
  b: number; // 0-100
}

// Convert HSB to RGB
function hsbToRgb(h: number, s: number, b: number): { r: number; g: number; b: number } {
  h = h / 360;
  s = s / 100;
  b = b / 100;

  const c = b * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = b - c;

  let r = 0, g = 0, bl = 0;

  if (0 <= h && h < 1/6) {
    r = c; g = x; bl = 0;
  } else if (1/6 <= h && h < 2/6) {
    r = x; g = c; bl = 0;
  } else if (2/6 <= h && h < 3/6) {
    r = 0; g = c; bl = x;
  } else if (3/6 <= h && h < 4/6) {
    r = 0; g = x; bl = c;
  } else if (4/6 <= h && h < 5/6) {
    r = x; g = 0; bl = c;
  } else if (5/6 <= h && h < 1) {
    r = c; g = 0; bl = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((bl + m) * 255)
  };
}

// Convert RGB to HSB
function rgbToHsb(r: number, g: number, b: number): HSB {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  const s = max === 0 ? 0 : (delta / max) * 100;
  const br = max * 100;

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
  }

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  return { h, s: Math.round(s), b: Math.round(br) };
}

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function ColorWheel({ value, onChange, className = "" }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Parse initial color
  const rgb = hexToRgb(value) || { r: 255, g: 0, b: 0 };
  const [hsb, setHsb] = useState<HSB>(rgbToHsb(rgb.r, rgb.g, rgb.b));

  const wheelSize = 200;
  const center = wheelSize / 2;
  const radius = center - 10;

  // Draw the color wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, wheelSize, wheelSize);

    // Draw the color wheel
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 1) * Math.PI / 180;
      const endAngle = angle * Math.PI / 180;
      
      const rgb = hsbToRgb(angle, 100, 100);
      
      ctx.beginPath();
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.lineWidth = 20;
      ctx.strokeStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      ctx.stroke();
    }
  }, []);

  // Update color when HSB changes
  useEffect(() => {
    const rgb = hsbToRgb(hsb.h, hsb.s, hsb.b);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    onChange(hex);
  }, [hsb, onChange]);

  // Handle wheel click/drag
  const handleWheelInteraction = (e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - center;
    const y = e.clientY - rect.top - center;
    
    const distance = Math.sqrt(x * x + y * y);
    if (distance <= radius && distance >= radius - 20) {
      let angle = Math.atan2(y, x) * 180 / Math.PI;
      if (angle < 0) angle += 360;
      
      setHsb(prev => ({ ...prev, h: Math.round(angle) }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleWheelInteraction(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleWheelInteraction(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Calculate handle position
  const handleAngle = (hsb.h * Math.PI) / 180;
  const handleRadius = radius - 10;
  const handleX = center + Math.cos(handleAngle) * handleRadius;
  const handleY = center + Math.sin(handleAngle) * handleRadius;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Color Wheel */}
      <div className="relative" ref={wheelRef}>
        <canvas
          ref={canvasRef}
          width={wheelSize}
          height={wheelSize}
          className="cursor-pointer"
          onMouseDown={handleMouseDown}
        />
        {/* Handle */}
        <div
          className="absolute w-4 h-4 bg-white border-2 border-gray-800 rounded-full shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: handleX,
            top: handleY,
          }}
        />
        {/* Center preview */}
        <div
          className="absolute w-16 h-16 rounded-full border-4 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: center,
            top: center,
            backgroundColor: value,
          }}
        />
      </div>

      {/* Saturation Slider */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Verzadiging</label>
        <Slider
          value={[hsb.s]}
          onValueChange={([value]) => setHsb(prev => ({ ...prev, s: value }))}
          max={100}
          step={1}
          className="w-full"
        />
        <span className="text-xs text-gray-500">{hsb.s}%</span>
      </div>

      {/* Brightness Slider */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Helderheid</label>
        <Slider
          value={[hsb.b]}
          onValueChange={([value]) => setHsb(prev => ({ ...prev, b: value }))}
          max={100}
          step={1}
          className="w-full"
        />
        <span className="text-xs text-gray-500">{hsb.b}%</span>
      </div>

      {/* Hex Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Hex kleur</label>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const hex = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
              const rgb = hexToRgb(hex);
              if (rgb) {
                setHsb(rgbToHsb(rgb.r, rgb.g, rgb.b));
              }
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}