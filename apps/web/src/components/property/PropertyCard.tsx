import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Bed, Bath, Maximize2, MapPin, Eye, Scale } from 'lucide-react';
import type { PropertyWithRelations } from '@shared/types/app.types';
import { formatPrice, formatArea, getLocalizedText } from '@shared/utils/format';
import { useUIStore } from '@/stores/uiStore';
import { useComparisonStore } from '@/stores/comparisonStore';
import { Badge } from '@/components/ui/Badge';
import { FavoriteButton } from './FavoriteButton';
import { cn } from '@/lib/cn';

interface PropertyCardProps {
  property: PropertyWithRelations;
  className?: string;
  index?: number;
}

export function PropertyCard({ property, className, index = 0 }: PropertyCardProps) {
  const { t } = useTranslation();
  const { language } = useUIStore();
  const { addToComparison, removeFromComparison, isInComparison } = useComparisonStore();
  const inComparison = isInComparison(property.id);

  const coverImage = property.images?.find((img) => img.is_cover) ?? property.images?.[0];
  const title = getLocalizedText(property.title_ar, property.title_en, language);
  const locationName = property.location
    ? getLocalizedText(property.location.name_ar, property.location.name_en, language)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={cn('group card cursor-pointer', className)}
    >
      <Link to={`/property/${property.slug}`} className="block">
        {/* Image */}
        <div className="relative overflow-hidden h-44 sm:h-52">
          {coverImage ? (
            <img
              src={coverImage.url}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-dark-200 to-dark-300 dark:from-dark-700 dark:to-dark-600 flex items-center justify-center">
              <span className="text-dark-400 dark:text-dark-500 text-4xl">🏠</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 start-3 flex flex-wrap gap-1.5">
            <Badge variant={property.listing_type === 'sale' ? 'sale' : 'rent'}>
              {property.listing_type === 'sale' ? t('property.for_sale') : t('property.for_rent')}
            </Badge>
            {property.is_featured && (
              <Badge variant="featured">{t('property.featured')}</Badge>
            )}
            {property.status === 'sold' && (
              <Badge variant="sold">{t('property.sold')}</Badge>
            )}
            {property.status === 'rented' && (
              <Badge variant="rented">{t('property.rented')}</Badge>
            )}
          </div>

          {/* View count */}
          <div className="absolute bottom-3 end-3 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
            <Eye className="h-3 w-3" />
            <span>{property.view_count}</span>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <div className="flex items-start justify-between mb-2">
          <div className="text-xl font-bold text-primary-600 dark:text-primary-400" dir="ltr">
            {formatPrice(property.price, language, 'SYP', property.price_period)}
          </div>
          <div className="flex items-center gap-1.5">
            {/* Compare button — labeled pill so visitors discover the feature */}
            <button
              onClick={(e) => {
                e.preventDefault();
                if (inComparison) {
                  removeFromComparison(property.id);
                } else {
                  addToComparison(property);
                }
              }}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                inComparison
                  ? 'text-white bg-primary-500 border-primary-500'
                  : 'text-dark-500 dark:text-dark-400 border-dark-200 dark:border-dark-600 hover:text-primary-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30'
              )}
              title={inComparison ? t('property.remove_from_compare') : t('property.add_to_compare')}
            >
              <Scale className="h-3.5 w-3.5" />
              {inComparison ? t('property.compare_added') : t('property.compare')}
            </button>

            {/* Favorite button */}
            <FavoriteButton propertyId={property.id} />
          </div>
        </div>

        {/* Title */}
        <Link to={`/property/${property.slug}`}>
          <h3 className="font-semibold text-dark-900 dark:text-dark-100 line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-2">
            {title}
          </h3>
        </Link>

        {/* Location */}
        {locationName && (
          <div className="flex items-center gap-1.5 text-dark-500 dark:text-dark-400 text-sm mb-3">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{locationName}</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-dark-600 dark:text-dark-400 text-sm pt-3 border-t border-dark-100 dark:border-dark-700">
          {property.bedrooms != null && (
            <div className="flex items-center gap-1.5">
              <Bed className="h-4 w-4 text-primary-500" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms != null && (
            <div className="flex items-center gap-1.5">
              <Bath className="h-4 w-4 text-primary-500" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.area != null && (
            <div className="flex items-center gap-1.5">
              <Maximize2 className="h-4 w-4 text-primary-500" />
              <span>{formatArea(property.area, language)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
