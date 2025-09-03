import React from "react";

interface AspectBoxProps {
  children: React.ReactNode;
}

export function AspectBox({ children }: AspectBoxProps) {
  return (
    <div
      className="
        relative mx-auto aspect-[1586/1000]
        w-[clamp(400px,50vmin,600px)]
        max-w-[80vw] max-h-[70vh]
      "
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}