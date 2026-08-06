import type { ReactNode } from 'react';

interface SectionWrapperProps {
  children: ReactNode;
  className?: string;
}

export function SectionWrapper({ children, className = '' }: SectionWrapperProps) {
  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
