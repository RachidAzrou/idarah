import React from 'react';
import { CustomTooltip } from '@/components/ui/CustomTooltip';

interface Category {
  key: string;
  label: string;
  count: number;
  percent: number;
  color: string;
}

interface ConcentricRingsProps {
  categories: Category[];
  size?: number;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  
  // For arcs close to 360 degrees, ensure we use the large arc flag
  const angleSpan = endAngle - startAngle;
  const largeArcFlag = angleSpan >= 180 ? "1" : "0";
  
  return [
    "M", start.x, start.y, 
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
}

export function ConcentricRings({ categories, size = 280 }: ConcentricRingsProps) {
  const center = size / 2;
  const radii = [100, 76, 52]; // outer, middle, inner - adjusted for visibility
  const strokeWidth = 16;
  

  return (
    <div className="flex items-center justify-center">
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Leden per categorie"
        className="drop-shadow-sm"
      >
        {/* Background circles for all categories */}
        {categories.map((category, index) => {
          const radius = radii[index];
          return (
            <circle
              key={`track-${category.key}`}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#E9EDF5"
              strokeWidth={strokeWidth}
            />
          );
        })}
        
        {/* Progress arcs for categories with data */}
        {categories.map((category, index) => {
          const radius = radii[index];
          
          // Skip categories with no data
          if (category.count === 0) {
            return null;
          }
          
          // For 100%, render a complete circle instead of an arc
          if (category.percent >= 100) {
            return (
              <CustomTooltip
                key={`circle-${category.key}`}
                title={category.label}
                count={category.count}
                percentage={category.percent}
                color={category.color}
              >
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={category.color}
                  strokeWidth={strokeWidth}
                  className="hover:stroke-opacity-80 transition-all duration-200 cursor-pointer"
                  style={{ 
                    strokeOpacity: 1,
                    strokeLinecap: 'round'
                  }}
                />
              </CustomTooltip>
            );
          }
          
          // For partial percentages, calculate arc normally
          const startAngle = -90; // Start at top
          const endAngle = startAngle + (category.percent / 100) * 360;
          
          // Ensure minimum visible arc for small percentages
          const actualEndAngle = endAngle - startAngle < 10 ? startAngle + 10 : endAngle;
          
          const pathData = describeArc(center, center, radius, startAngle, actualEndAngle);
          
          return (
            <CustomTooltip
              key={`arc-${category.key}`}
              title={category.label}
              count={category.count}
              percentage={category.percent}
              color={category.color}
            >
              <path
                d={pathData}
                fill="none"
                stroke={category.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className="hover:stroke-opacity-80 transition-all duration-200 cursor-pointer"
                style={{ 
                  strokeDasharray: 'none',
                  strokeOpacity: 1
                }}
              />
            </CustomTooltip>
          );
        })}
      </svg>
    </div>
  );
}