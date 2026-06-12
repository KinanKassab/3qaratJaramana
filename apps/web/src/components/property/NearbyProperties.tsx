import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { useNearbyProperties } from '@/hooks/useProperties';
import { PropertyCard } from './PropertyCard';
import { Skeleton } from '@/components/ui/Skeleton';

interface NearbyPropertiesProps {
  lat?: number | null;
  lng?: number | null;
  excludeId?: string;
}

export function NearbyProperties({ lat, lng, excludeId }: NearbyPropertiesProps) {
  const { t } = useTranslation();
  const { data: nearby, isLoading } = useNearbyProperties(lat, lng, excludeId);

  if (!lat || !lng) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <MapPin className="h-5 w-5 text-primary-500" />
        <h3 className="text-xl font-bold text-dark-900 dark:text-dark-100">
          {t('property.nearby')}
        </h3>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="space-y-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : nearby && nearby.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {nearby.map((property, idx) => (
            <PropertyCard key={property.id} property={property} index={idx} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
