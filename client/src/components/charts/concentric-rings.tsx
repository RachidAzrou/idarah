import React from 'react';

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
  const startAngle = -90; // Start at 12 o'clock

  return (
    <div className="flex items-center justify-center w-full">
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Leden per categorie"
        className="drop-shadow-sm max-w-full h-auto"
      >
        {/* Background tracks */}
        {radii.map((radius, index) => (
          <circle
            key={`track-${index}`}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#E9EDF5"
            strokeWidth={strokeWidth}
          />
        ))}
        
        {/* Progress arcs */}
        {categories.map((category, index) => {
          const radius = radii[index];
          const sweep = Math.min((category.percent / 100) * 300, 300);
          const endAngle = startAngle + sweep;
          const pathData = describeArc(center, center, radius, startAngle, endAngle);
          
          return (
            <path
              key={category.key}
              d={pathData}
              fill="none"
              stroke={category.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="animate-drawArc"
              style={{
                animationDelay: `${index * 0.3}s`,
                animationDuration: '1.2s'
              }}
            >
              <title>{`${category.label}: ${category.percent}%`}</title>
            </path>
          );
        })}
      </svg>
    </div>
  );
}