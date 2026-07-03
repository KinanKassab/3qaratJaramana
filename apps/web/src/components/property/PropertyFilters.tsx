import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';
import { useUIStore } from '@/stores/uiStore';
import { getLocalizedText } from '@shared/utils/format';
import type { PropertyFilters as Filters } from '@shared/types/app.types';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';

interface PropertyFiltersProps {
  onFiltersChange: (filters: Filters) => void;
  initialFilters?: Filters;
  collapsed?: boolean;
}

// Filter keys whose URL param name differs from the filter key
const URL_KEYS: Partial<Record<keyof Filters, string>> = {
  listing_type: 'type',
  sort_by: 'sort',
  is_featured: 'featured',
  search: 'q',
};

interface PricePreset {
  id: string;
  label_ar: string;
  label_en: string;
  min?: number;
  max?: number;
}

// Ready-made price ranges (SYP) — sale prices vs monthly rent
const SALE_PRICE_PRESETS: PricePreset[] = [
  { id: 'lt500m', label_ar: 'أقل من 500 مليون', label_en: 'Under 500M', max: 500_000_000 },
  { id: '500m-1b', label_ar: '500 مليون – 1 مليار', label_en: '500M – 1B', min: 500_000_000, max: 1_000_000_000 },
  { id: '1b-2b', label_ar: '1 – 2 مليار', label_en: '1B – 2B', min: 1_000_000_000, max: 2_000_000_000 },
  { id: 'gt2b', label_ar: 'أكثر من 2 مليار', label_en: 'Over 2B', min: 2_000_000_000 },
];

const RENT_PRICE_PRESETS: PricePreset[] = [
  { id: 'lt1m', label_ar: 'أقل من مليون', label_en: 'Under 1M', max: 1_000_000 },
  { id: '1m-2m', label_ar: '1 – 2 مليون', label_en: '1M – 2M', min: 1_000_000, max: 2_000_000 },
  { id: '2m-5m', label_ar: '2 – 5 مليون', label_en: '2M – 5M', min: 2_000_000, max: 5_000_000 },
  { id: 'gt5m', label_ar: 'أكثر من 5 مليون', label_en: 'Over 5M', min: 5_000_000 },
];

export function PropertyFilters({ onFiltersChange, collapsed = false }: PropertyFiltersProps) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useUIStore();
  // All active districts are Jaramana neighborhoods — the platform is Jaramana-only
  const { data: districts } = useLocations('district');
  const [expanded, setExpanded] = useState(!collapsed);

  const [filters, setFilters] = useState<Filters>(() => ({
    listing_type: (searchParams.get('type') as 'sale' | 'rent') ?? 'sale',
    location_id: searchParams.get('location_id') ?? undefined,
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    bedrooms: searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : undefined,
    bathrooms: searchParams.get('bathrooms') ? Number(searchParams.get('bathrooms')) : undefined,
    is_featured: searchParams.get('featured') === 'true' ? true : undefined,
    sort_by: (searchParams.get('sort') as Filters['sort_by']) ?? 'price_asc',
    search: searchParams.get('q') ?? undefined,
  }));

  const pricePresets = filters.listing_type === 'rent' ? RENT_PRICE_PRESETS : SALE_PRICE_PRESETS;
  const activePreset = pricePresets.find(
    (p) => p.min === filters.min_price && p.max === filters.max_price
  );
  const [customPrice, setCustomPrice] = useState(
    () => !!(filters.min_price || filters.max_price) && !activePreset
  );

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const applyFilters = (patch: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      const param = URL_KEYS[key as keyof Filters] ?? key;
      if (value === undefined || value === '' || value === null) {
        params.delete(param);
      } else {
        params.set(param, String(value));
      }
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    applyFilters({ [key]: value } as Partial<Filters>);
  };

  const resetFilters = () => {
    setFilters({ listing_type: 'sale', sort_by: 'price_asc', page: 1 });
    setCustomPrice(false);
    setSearchParams({ type: 'sale' });
  };

  const districtOptions = [
    { value: '', label: t('filters.all_districts') },
    ...(districts ?? []).map((d) => ({
      value: d.id,
      label: getLocalizedText(d.name_ar, d.name_en, language),
    })),
  ];

  const sortOptions = [
    { value: 'price_asc', label: t('filters.price_low') },
    { value: 'price_desc', label: t('filters.price_high') },
    { value: 'views', label: t('filters.most_viewed') },
  ];

  const bedroomOptions = [1, 2, 3, 4, 5];

  const hasActiveFilters =
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

      {/* Listing type toggle: sale or rent only — always visible */}
      <div className="flex gap-2 mb-4">
        {(['sale', 'rent'] as const).map((type) => (
          <button
            key={type}
            onClick={() => {
              // Price presets differ between sale and rent — clear the range on switch
              applyFilters({ listing_type: type, min_price: undefined, max_price: undefined });
              setCustomPrice(false);
            }}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-colors border',
              filters.listing_type === type
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-400 hover:border-primary-300'
            )}
          >
            {type === 'sale' ? t('property.for_sale') : t('property.for_rent')}
          </button>
        ))}
      </div>

      {expanded && (
        <div className="space-y-4">
          {/* Neighborhood — the only location filter (Jaramana is the only area) */}
          <Select
            label={t('filters.district')}
            options={districtOptions}
            value={filters.location_id ?? ''}
            onChange={(e) => updateFilter('location_id', e.target.value || undefined)}
          />

          {/* Price range — ready-made presets + custom */}
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              {t('filters.price_range')}
            </label>
            <div className="flex gap-2 flex-wrap mb-2">
              {pricePresets.map((preset) => {
                const isActive = !customPrice && activePreset?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setCustomPrice(false);
                      if (isActive) {
                        applyFilters({ min_price: undefined, max_price: undefined });
                      } else {
                        applyFilters({ min_price: preset.min, max_price: preset.max });
                      }
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                      isActive
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-400 hover:border-primary-300'
                    )}
                  >
                    {language === 'ar' ? preset.label_ar : preset.label_en}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  if (customPrice) {
                    setCustomPrice(false);
                    applyFilters({ min_price: undefined, max_price: undefined });
                  } else {
                    setCustomPrice(true);
                  }
                }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                  customPrice
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-400 hover:border-primary-300'
                )}
              >
                {t('filters.custom')}
              </button>
            </div>

            {customPrice && (
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
            )}
          </div>

          {/* Bedrooms (with living room) */}
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
                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors min-w-[44px]',
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
            value={filters.sort_by ?? 'price_asc'}
            onChange={(e) => updateFilter('sort_by', e.target.value as Filters['sort_by'])}
          />
        </div>
      )}
    </div>
  );
}
