import React from 'react';
import { cn } from '@/lib/cn';

const variants = {
  default: 'bg-dark-100 text-dark-700 dark:bg-dark-700 dark:text-dark-300',
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
};

export function Badge({
  variant = 'default',
  children,
  className,
}: {
  variant?: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
