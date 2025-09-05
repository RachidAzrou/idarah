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
    <>
      {React.isValidElement(children) && children.type && typeof children.type === 'function' && children.type.name === 'MembershipCard' 
        ? React.cloneElement(children as React.ReactElement<any>, { isConstrained })
        : children}
    </>
  );
}