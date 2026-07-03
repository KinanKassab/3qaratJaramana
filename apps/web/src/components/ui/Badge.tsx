import React from 'react';
import { cn } from '@/lib/cn';

type BadgeVariant = 'sale' | 'rent' | 'sold' | 'rented' | 'available' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

const variantClasses: Record<BadgeVariant, string> = {
  sale: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sold: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  rented: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  available: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  default: 'bg-dark-100 text-dark-600 dark:bg-dark-700 dark:text-dark-300',
};

export function Badge({ variant = 'default', children, className, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg font-semibold',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
