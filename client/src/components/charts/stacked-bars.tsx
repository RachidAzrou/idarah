import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export type Bucket = {
  label: string;
  male: number;
  female: number;
  percent: number;
};

interface StackedBarsProps {
  buckets: Bucket[];
  colors?: {
    male: string;
    female: string;
    track: string;
  };
  className?: string;
}

export function StackedBars({ 
  buckets, 
  colors = {
    male: '#3B82F6',
    female: '#A855F7',
    track: '#F4F6FA'
  },
  className 
}: StackedBarsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent, index: number) => {
    setHoveredIndex(index);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {buckets.map((bucket, index) => {
        const rowTotal = bucket.male + bucket.female;
        const maleWidth = rowTotal > 0 ? (bucket.male / rowTotal) * 100 : 0;
        const femaleWidth = rowTotal > 0 ? (bucket.female / rowTotal) * 100 : 0;
        
        return (
          <div key={index} className="flex items-center gap-3">
            {/* Label */}
            <div className="w-14 flex-shrink-0">
              <span className="text-sm font-['Poppins']" style={{ color: '#475569' }}>
                {bucket.label}
              </span>
            </div>
            
            {/* Stacked Bar */}
            <div className="flex-1 relative group">
              <div 
                className="h-4 rounded-full relative overflow-hidden cursor-pointer hover:h-5 transition-all duration-200"
                style={{ backgroundColor: colors.track }}
                onMouseMove={(e) => handleMouseMove(e, index)}
                onMouseLeave={handleMouseLeave}
                data-testid={`stacked-bar-${bucket.label.toLowerCase()}`}
              >
                {/* Male segment */}
                {bucket.male > 0 && (
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-200 ease-out"
                    style={{
                      width: `${maleWidth}%`,
                      backgroundColor: colors.male,
                    }}
                  />
                )}
                
                {/* Female segment */}
                {bucket.female > 0 && (
                  <div
                    className="absolute top-0 h-full rounded-full transition-all duration-200 ease-out"
                    style={{
                      left: `${maleWidth}%`,
                      width: `${femaleWidth}%`,
                      backgroundColor: colors.female,
                    }}
                  />
                )}
              </div>
            </div>
            
            {/* Percentage */}
            <div className="w-14 text-right">
              <span className="text-sm font-['Poppins']" style={{ color: '#475569' }}>
                {bucket.percent.toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}
      
      {/* Tooltip */}
      {hoveredIndex !== null && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div
            className="rounded-xl p-3 shadow-lg border text-sm"
            style={{
              backgroundColor: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Poppins',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="font-semibold text-gray-800 mb-2">
              {buckets[hoveredIndex].label}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors.male }}
                />
                <span className="text-gray-700">
                  {buckets[hoveredIndex].male} mannen
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors.female }}
                />
                <span className="text-gray-700">
                  {buckets[hoveredIndex].female} vrouwen
                </span>
              </div>
              <div className="border-t border-gray-200 pt-1 mt-2">
                <span className="font-medium text-gray-800">
                  Totaal: {buckets[hoveredIndex].male + buckets[hoveredIndex].female}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}