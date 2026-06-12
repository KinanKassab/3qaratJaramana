import React from 'react';
import { cn } from '@/lib/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-dark-200 border-t-primary-500',
        sizes[size],
        className
      )}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-dark-950/80 z-50">
      <Spinner size="lg" />
    </div>
  );
}
