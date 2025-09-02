"use client";

import { useState, useRef, useEffect } from 'react';

interface CustomTooltipProps {
  title: string;
  count: number;
  percentage: number;
  color: string;
  children: React.ReactNode;
}

export function CustomTooltip({ title, count, percentage, color, children }: CustomTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsVisible(true);
    updatePosition(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    updatePosition(e);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const updatePosition = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPosition({ x, y });
  };

  return (
    <div className="relative">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className="absolute z-50 pointer-events-none"
          style={{
            left: position.x + 10,
            top: position.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[140px]">
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: color }}
              />
              <span className="font-medium text-gray-900 text-sm">{title}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Aantal:</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Percentage:</span>
                <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
              </div>
            </div>
            {/* Arrow pointing down */}
            <div 
              className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid white',
                filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}