import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUIStore } from '@/stores/uiStore';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const { language } = useUIStore();
  const isRTL = language === 'ar';

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={cn(
          'p-2 rounded-lg border border-dark-200 dark:border-dark-600',
          'hover:bg-dark-100 dark:hover:bg-dark-700 disabled:opacity-40 disabled:cursor-not-allowed',
          'transition-colors'
        )}
        aria-label="Previous page"
      >
        <PrevIcon className="h-4 w-4" />
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={cn(
            'w-10 h-10 rounded-lg font-medium text-sm transition-colors',
            p === page
              ? 'bg-primary-500 text-white'
              : 'border border-dark-200 dark:border-dark-600 hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300'
          )}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={cn(
          'p-2 rounded-lg border border-dark-200 dark:border-dark-600',
          'hover:bg-dark-100 dark:hover:bg-dark-700 disabled:opacity-40 disabled:cursor-not-allowed',
          'transition-colors'
        )}
        aria-label="Next page"
      >
        <NextIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
