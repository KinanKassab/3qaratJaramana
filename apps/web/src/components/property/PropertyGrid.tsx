import React from 'react';
import type { PropertyWithRelations } from '@shared/types/app.types';
import { PropertyCard } from './PropertyCard';
import { PropertyCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

interface PropertyGridProps {
  properties?: PropertyWithRelations[];
  loading?: boolean;
  skeletonCount?: number;
  className?: string;
  columns?: 2 | 3 | 4;
}

export function PropertyGrid({
  properties,
  loading = false,
  skeletonCount = 6,
  className,
  columns = 3,
}: PropertyGridProps) {
  const { t } = useTranslation();

  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (loading) {
    return (
      <div className={cn('grid gap-6', gridCols[columns], className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <EmptyState
        title={t('property.no_properties')}
        description={t('property.no_properties_desc')}
      />
    );
  }

  return (
    <div className={cn('grid gap-6', gridCols[columns], className)}>
      {properties.map((property, index) => (
        <PropertyCard key={property.id} property={property} index={index} />
      ))}
    </div>
  );
}
