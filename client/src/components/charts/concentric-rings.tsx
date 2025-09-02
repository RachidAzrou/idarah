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
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  
  return [
    "M", start.x, start.y, 
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
}

export function ConcentricRings({ categories, size = 280 }: ConcentricRingsProps) {
  const center = size / 2;
  const radii = [110, 86, 62]; // outer, middle, inner  
  const strokeWidth = 14;

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
          if (category.percent === 0 || category.count === 0) {
            return null;
          }
          
          // Calculate arc based on percentage
          const startAngle = -90; // Start at top
          const endAngle = startAngle + (category.percent / 100) * 360;
          
          // For small percentages, ensure minimum visible arc
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
              />
            </CustomTooltip>
          );
        })}
      </svg>
    </div>
  );
}