import React from 'react';
import { useTranslation } from 'react-i18next';
import { Car, Waves, Dumbbell, ArrowUpDown, Shield, Trees, Wind, Zap, Wifi } from 'lucide-react';
import { cn } from '@/lib/cn';

const AMENITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  parking: Car,
  pool: Waves,
  gym: Dumbbell,
  elevator: ArrowUpDown,
  security: Shield,
  garden: Trees,
  air_conditioning: Wind,
  backup_power: Zap,
  internet: Wifi,
};

interface AmenitiesGridProps {
  amenities: string[];
  className?: string;
}

export function AmenitiesGrid({ amenities, className }: AmenitiesGridProps) {
  const { t } = useTranslation();

  if (!amenities || amenities.length === 0) return null;

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3', className)}>
      {amenities.map((amenity) => {
        const Icon = AMENITY_ICONS[amenity];
        const label = t(`amenities.${amenity}`, amenity);

        return (
          <div
            key={amenity}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-50 dark:bg-dark-700/50 border border-dark-100 dark:border-dark-700"
          >
            {Icon ? (
              <Icon className="h-4 w-4 text-primary-500 flex-shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full bg-primary-100 flex-shrink-0" />
            )}
            <span className="text-sm text-dark-700 dark:text-dark-300 font-medium">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
