import React, { useEffect, useRef } from 'react';

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
  const svgRef = useRef<SVGSVGElement>(null);
  const center = size / 2;
  const radii = [110, 86, 62]; // outer, middle, inner
  const strokeWidth = 14;
  const startAngle = -60;
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    const arcs = svgRef.current.querySelectorAll('.progress-arc');
    
    // Animation on mount
    arcs.forEach((arc, index) => {
      const pathElement = arc as SVGPathElement;
      const totalLength = pathElement.getTotalLength();
      
      pathElement.style.strokeDasharray = `${totalLength} ${totalLength}`;
      pathElement.style.strokeDashoffset = `${totalLength}`;
      
      setTimeout(() => {
        pathElement.style.transition = 'stroke-dashoffset 400ms ease-out';
        pathElement.style.strokeDashoffset = '0';
      }, index * 100);
    });
    
    return () => {
      arcs.forEach(arc => {
        const pathElement = arc as SVGPathElement;
        pathElement.style.transition = '';
        pathElement.style.strokeDasharray = '';
        pathElement.style.strokeDashoffset = '';
      });
    };
  }, [categories]);

  return (
    <svg 
      ref={svgRef}
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Leden per categorie"
      className="drop-shadow-sm"
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
          strokeLinecap="round"
        />
      ))}
      
      {/* Progress arcs */}
      {categories.map((category, index) => {
        const radius = radii[index];
        const sweep = Math.min((category.percent / 100) * 300, 300);
        const endAngle = startAngle + sweep;
        const pathData = describeArc(center, center, radius, startAngle, endAngle);
        
        return (
          <g key={category.key}>
            <path
              className="progress-arc"
              d={pathData}
              fill="none"
              stroke={category.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            >
              <title>{`${category.label}: ${category.percent}%`}</title>
            </path>
          </g>
        );
      })}
    </svg>
  );
}