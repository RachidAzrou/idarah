import React from "react";

interface AspectBoxProps {
  children: React.ReactNode;
}

export function AspectBox({ children }: AspectBoxProps) {
  return (
    <div
      className="relative mx-auto aspect-[1586/1000]"
      style={{
        width: 'clamp(300px, 40vmin, 500px)',
        maxWidth: '70vw',
        maxHeight: '60vh'
      }}
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}