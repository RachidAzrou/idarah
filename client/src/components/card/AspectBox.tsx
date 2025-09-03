import React from "react";

interface AspectBoxProps {
  children: React.ReactNode;
}

export function AspectBox({ children }: AspectBoxProps) {
  return (
    <div
      className="
        relative mx-auto aspect-[1586/1000]
        w-[clamp(560px,70vmin,880px)]
        max-w-[94vw] max-h-[94vh]
      "
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}