import React from 'react';
import '../../styles/card-canvas.css';

interface CardCanvasProps {
  children: React.ReactNode;
  className?: string;
}

export function CardCanvas({ children, className = '' }: CardCanvasProps) {
  // Check if we're in a modal/constrained container by checking if className contains modal indicators
  const isConstrained = className.includes('rounded-lg') || className.includes('modal') || className.includes('preview');
  
  return (
    <div 
      className={`
        relative w-full overflow-hidden
        grid place-items-center
        bg-spotlight bg-vignette bg-sheen bg-grain bg-rimlight
        ${isConstrained ? 'h-full p-4' : 'min-h-screen px-[max(env(safe-area-inset-left),16px)] py-[max(env(safe-area-inset-top),16px)]'}
        ${className}
      `}
      style={!isConstrained ? {
        paddingLeft: 'max(env(safe-area-inset-left), 16px)',
        paddingRight: 'max(env(safe-area-inset-right), 16px)',
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
      } : {}}
    >
      {/* Card container with responsive sizing */}
      <div 
        className={`
          mx-auto aspect-[1586/1000] 
          ${isConstrained ? 'w-full h-auto' : 'w-[min(95vw,calc(75vh*1.586))] sm:w-[min(96vw,calc(96vh*1.586))] lg:w-[clamp(600px,75vmin,920px)]'}
          relative z-10
        `}
      >
        {React.isValidElement(children) && children.type && typeof children.type === 'function' && children.type.name === 'MembershipCard' 
          ? React.cloneElement(children as React.ReactElement<any>, { isConstrained })
          : children}
      </div>
    </div>
  );
}