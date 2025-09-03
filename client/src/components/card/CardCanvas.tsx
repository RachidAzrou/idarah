import React from 'react';
import '../../styles/card-canvas.css';

interface CardCanvasProps {
  children: React.ReactNode;
  className?: string;
}

export function CardCanvas({ children, className = '' }: CardCanvasProps) {
  return (
    <div 
      className={`
        relative min-h-screen w-full overflow-hidden
        grid place-items-center
        bg-spotlight bg-vignette bg-sheen bg-grain bg-rimlight
        px-[max(env(safe-area-inset-left),16px)] 
        py-[max(env(safe-area-inset-top),16px)]
        ${className}
      `}
      style={{
        paddingLeft: 'max(env(safe-area-inset-left), 16px)',
        paddingRight: 'max(env(safe-area-inset-right), 16px)',
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
      }}
    >
      {/* Card container with responsive sizing */}
      <div 
        className={`
          mx-auto aspect-[1586/1000] 
          w-[min(92vw,calc(70vh*1.586))]
          sm:w-[min(94vw,calc(94vh*1.586))]
          lg:w-[clamp(560px,70vmin,880px)]
          relative z-10
        `}
      >
        {children}
      </div>
    </div>
  );
}