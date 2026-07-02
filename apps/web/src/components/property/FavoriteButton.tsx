import React from 'react';
import { Heart } from 'lucide-react';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { cn } from '@/lib/cn';

interface FavoriteButtonProps {
  propertyId: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function FavoriteButton({ propertyId, className, size = 'sm' }: FavoriteButtonProps) {
  const { data: favoriteIds } = useFavoriteIds();
  const { mutate: toggle, isPending } = useToggleFavorite();

  const isFavorite = favoriteIds?.has(propertyId) ?? false;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle({ propertyId, isFavorite });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'p-1.5 rounded-lg transition-all duration-200',
        isFavorite
          ? 'text-red-500 bg-red-50 dark:bg-red-950/30'
          : 'text-dark-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30',
        isPending && 'opacity-60 cursor-not-allowed',
        className
      )}
      title={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
    >
      <Heart className={cn(size === 'sm' ? 'h-4 w-4' : 'h-5 w-5', isFavorite && 'fill-current')} />
    </button>
  );
}
