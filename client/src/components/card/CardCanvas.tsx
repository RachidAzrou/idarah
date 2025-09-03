import React from 'react';

interface CardCanvasProps {
  children: React.ReactNode;
  className?: string;
}

export function CardCanvas({ children, className = '' }: CardCanvasProps) {
  // Check if we're in a modal/constrained container by checking if className contains modal indicators
  const isConstrained = className.includes('rounded-lg') || className.includes('modal') || className.includes('preview');
  
  if (isConstrained) {
    // Modal/preview mode - keep existing behavior
    return (
      <div className={`relative w-full h-full overflow-hidden grid place-items-center bg-spotlight bg-vignette bg-sheen bg-grain bg-rimlight p-4 ${className}`}>
        <div className="mx-auto aspect-[1586/1000] w-full h-auto relative z-10">
          {children}
        </div>
      </div>
    );
  }

  // Standalone fullscreen mode - premium dark background
  return (
    <div
      className={`
        relative min-h-screen w-full overflow-hidden
        grid place-items-center
        px-[max(env(safe-area-inset-left),16px)]
        py-[max(env(safe-area-inset-top),16px)]
        bg-grain
        ${className}
      `}
      style={{
        paddingLeft: 'max(env(safe-area-inset-left), 16px)',
        paddingRight: 'max(env(safe-area-inset-right), 16px)',
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
      }}
    >
      {/* Spotlight background */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: "radial-gradient(120% 80% at 50% 40%, #0E264A 0%, #0B1220 60%, #0A1426 100%)",
        }}
      />
      {/* Vignette overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: "radial-gradient(80% 60% at 50% 50%, transparent 0%, rgba(0,0,0,.35) 70%, rgba(0,0,0,.6) 100%)",
        }}
      />
      {/* Sheen overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 mix-blend-screen"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,.06) 0%, transparent 35%, transparent 65%, rgba(255,255,255,.03) 100%)",
        }}
      />
      {/* Rim light behind card */}
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          width: "80vmin",
          height: "52vmin",
          filter: "blur(40px)",
          borderRadius: "9999px",
          background: "rgba(37,99,235,0.20)",
        }}
      />
      {children}
    </div>
  );
}