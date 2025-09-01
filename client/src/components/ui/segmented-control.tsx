import React from 'react';
import { cn } from '@/lib/utils';

interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div className={cn("flex bg-gray-100 rounded-lg p-1", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-4 py-1 text-sm font-medium rounded-md transition-all duration-200",
            value === option.value
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-700 hover:text-gray-900 hover:bg-gray-200"
          )}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}