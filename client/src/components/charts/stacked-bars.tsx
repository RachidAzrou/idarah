import React from 'react';
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
  return (
    <div className={cn("space-y-2 md:space-y-3", className)}>
      {buckets.map((bucket, index) => {
        const rowTotal = bucket.male + bucket.female;
        const maleWidth = rowTotal > 0 ? (bucket.male / rowTotal) * 100 : 0;
        const femaleWidth = rowTotal > 0 ? (bucket.female / rowTotal) * 100 : 0;
        
        return (
          <div key={index} className="flex items-center gap-2 md:gap-3">
            {/* Label */}
            <div className="w-12 md:w-14 flex-shrink-0">
              <span className="text-xs md:text-sm font-['Poppins']" style={{ color: '#475569' }}>
                {bucket.label}
              </span>
            </div>
            
            {/* Stacked Bar */}
            <div className="flex-1 relative min-w-0">
              <div 
                className="h-3 md:h-4 rounded-full relative overflow-hidden"
                style={{ backgroundColor: colors.track }}
              >
                {/* Male segment */}
                {bucket.male > 0 && (
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-200 ease-out"
                    style={{
                      width: `${maleWidth}%`,
                      background: `linear-gradient(to right, #1E40AF, ${colors.male})`,
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
                      background: `linear-gradient(to right, ${colors.female}, #C084FC)`,
                    }}
                  />
                )}
              </div>
            </div>
            
            {/* Percentage */}
            <div className="w-12 md:w-14 text-right flex-shrink-0">
              <span className="text-xs md:text-sm font-['Poppins']" style={{ color: '#475569' }}>
                {bucket.percent.toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}