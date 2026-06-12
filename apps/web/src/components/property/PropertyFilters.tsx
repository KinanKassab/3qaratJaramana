import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useCities, useDistricts } from '@/hooks/useLocations';
import { useCategories } from '@/hooks/useCategories';
import { useUIStore } from '@/stores/uiStore';
import { getLocalizedText } from '@shared/utils/format';
import type { PropertyFilters as Filters } from '@shared/types/app.types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';

interface PropertyFiltersProps {
  onFiltersChange: (filters: Filters) => void;
  initialFilters?: Filters;
  collapsed?: boolean;
}

export function PropertyFilters({ onFiltersChange, collapsed = false }: PropertyFiltersProps) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useUIStore();
  const { data: cities } = useCities();
  const { data: categories } = useCategories();
  const [expanded, setExpanded] = useState(!collapsed);
  const [selectedCityId, setSelectedCityId] = useState('');

  const { data: districts } = useDistricts(selectedCityId || undefined);

  const [filters, setFilters] = useState<Filters>(() => ({
    listing_type: (searchParams.get('type') as 'sale' | 'rent' | undefined) ?? undefined,
    category_id: searchParams.get('category_id') ?? undefined,
    location_id: searchParams.get('location_id') ?? undefined,
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    bedrooms: searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : undefined,
    bathrooms: searchParams.get('bathrooms') ? Number(searchParams.get('bathrooms')) : undefined,
    is_featured: searchParams.get('featured') === 'true' ? true : undefined,
    sort_by: (searchParams.get('sort') as Filters['sort_by']) ?? 'newest',
    search: searchParams.get('q') ?? undefined,
  }));

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    const params = new URLSearchParams(searchParams);
    if (value !== undefined && value !== '' && value !== null) {
      params.set(key, String(value));
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const resetFilters = () => {
    setFilters({ sort_by: 'newest', page: 1 });
    setSelectedCityId('');
    setSearchParams({});
  };

  const categoryOptions = [
    { value: '', label: t('filters.all_categories') },
    ...(categories ?? []).map((c) => ({
      value: c.id,
      label: getLocalizedText(c.name_ar, c.name_en, language),
    })),
  ];

  const cityOptions = [
    { value: '', label: t('filters.select_city') },
    ...(cities ?? []).map((c) => ({
      value: c.id,
      label: getLocalizedText(c.name_ar, c.name_en, language),
    })),
  ];

  const districtOptions = [
    { value: '', label: t('filters.select_district') },
    ...(districts ?? []).map((d) => ({
      value: d.id,
      label: getLocalizedText(d.name_ar, d.name_en, language),
    })),
  ];

  const sortOptions = [
    { value: 'newest', label: t('filters.newest') },
    { value: 'oldest', label: t('filters.oldest') },
    { value: 'price_asc', label: t('filters.price_low') },
    { value: 'price_desc', label: t('filters.price_high') },
    { value: 'views', label: t('filters.most_viewed') },
  ];

  const bedroomOptions = [1, 2, 3, 4, 5];

  const hasActiveFilters =
    filters.listing_type ||
    filters.category_id ||
    filters.location_id ||
    filters.min_price ||
    filters.max_price ||
    filters.bedrooms ||
    filters.bathrooms ||
    filters.is_featured;

  return (
    <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 font-semibold text-dark-800 dark:text-dark-100"
        >
          <SlidersHorizontal className="h-5 w-5 text-primary-500" />
          {t('filters.title')}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" /> {t('filters.reset')}
          </button>
        )}
      </div>

      {/* Listing type toggle — always visible */}
      <div className="flex gap-2 mb-4">
        {(['all', 'sale', 'rent'] as const).map((type) => (
          <button
            key={type}
            onClick={() => updateFilter('listing_type', type === 'all' ? undefined : type)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-colors border',
              (type === 'all' && !filters.listing_type) ||
                filters.listing_type === type
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-400 hover:border-primary-300'
            )}
          >
            {type === 'all'
              ? t('common.all')
              : type === 'sale'
              ? t('property.for_sale')
              : t('property.for_rent')}
          </button>
        ))}
      </div>

      {expanded && (
        <div className="space-y-4">
          {/* Category */}
          <Select
            label={t('filters.all_categories')}
            options={categoryOptions}
            value={filters.category_id ?? ''}
            onChange={(e) => updateFilter('category_id', e.target.value || undefined)}
          />

          {/* City */}
          <Select
            label={t('filters.select_city')}
            options={cityOptions}
            value={selectedCityId}
            onChange={(e) => {
              setSelectedCityId(e.target.value);
              updateFilter('location_id', undefined);
            }}
          />

          {/* District (cascading) */}
          {selectedCityId && (
            <Select
              label={t('filters.select_district')}
              options={districtOptions}
              value={filters.location_id ?? ''}
              onChange={(e) => updateFilter('location_id', e.target.value || undefined)}
            />
          )}

          {/* Price range */}
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              {t('filters.price_range')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder={t('common.from')}
                className="input-base text-sm"
                value={filters.min_price ?? ''}
                onChange={(e) =>
                  updateFilter('min_price', e.target.value ? Number(e.target.value) : undefined)
                }
              />
              <input
                type="number"
                placeholder={t('common.to')}
                className="input-base text-sm"
                value={filters.max_price ?? ''}
                onChange={(e) =>
                  updateFilter('max_price', e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              {t('filters.bedrooms')}
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => updateFilter('bedrooms', undefined)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                  !filters.bedrooms
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-400'
                )}
              >
                {t('filters.any')}
              </button>
              {bedroomOptions.map((n) => (
                <button
                  key={n}
                  onClick={() => updateFilter('bedrooms', filters.bedrooms === n ? undefined : n)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors min-w-[40px]',
                    filters.bedrooms === n
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-400'
                  )}
                >
                  {n}+
                </button>
              ))}
            </div>
          </div>

          {/* Featured only */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.is_featured === true}
              onChange={(e) => updateFilter('is_featured', e.target.checked ? true : undefined)}
              className="w-4 h-4 rounded text-primary-500 accent-primary-500"
            />
            <span className="text-sm font-medium text-dark-700 dark:text-dark-300">
              {t('filters.featured_only')}
            </span>
          </label>

          {/* Sort */}
          <Select
            label={t('filters.sort_by')}
            options={sortOptions}
            value={filters.sort_by ?? 'newest'}
            onChange={(e) => updateFilter('sort_by', e.target.value as Filters['sort_by'])}
          />
        </div>
      )}
    </div>
  );
}
