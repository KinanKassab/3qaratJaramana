import React from 'react';
import { cn } from '@/lib/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-dark-100 dark:bg-dark-700 rounded-lg',
        'before:absolute before:inset-0 before:bg-gradient-to-r',
        'before:from-transparent before:via-white/20 before:to-transparent',
        'before:animate-shimmer before:bg-[length:200%_100%]',
        className
      )}
    />
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-2xl overflow-hidden shadow-card">
      <Skeleton className="h-52 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}
