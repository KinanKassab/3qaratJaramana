import React from 'react';
import { SearchX } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="w-20 h-20 rounded-full bg-dark-100 dark:bg-dark-800 flex items-center justify-center mb-6">
        {icon ?? <SearchX className="h-10 w-10 text-dark-400" />}
      </div>
      <h3 className="text-xl font-bold text-dark-800 dark:text-dark-200 mb-2">{title}</h3>
      {description && (
        <p className="text-dark-500 dark:text-dark-400 max-w-sm">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          <Button onClick={action.onClick}>{action.label}</Button>
        </div>
      )}
    </div>
  );
}
