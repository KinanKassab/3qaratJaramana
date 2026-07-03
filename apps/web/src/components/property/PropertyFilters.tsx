import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';
import { useUIStore } from '@/stores/uiStore';
import { getLocalizedText } from '@shared/utils/format';
import type { PropertyFilters as Filters, Currency } from '@shared/types/app.types';
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
  search: 'q',
  location_ids: 'location_id',
};

interface PricePreset {
  id: string;
  label_ar: string;
  label_en: string;
  min?: number;
  max?: number;
}

// Ready-made price ranges per currency:
// USD in thousands, SYP in millions
const USD_PRICE_PRESETS: PricePreset[] = [
  { id: 'usd-5-20', label_ar: '5 - 20 ألف', label_en: '5–20K', min: 5_000, max: 20_000 },
  { id: 'usd-20-35', label_ar: '20 - 35 ألف', label_en: '20–35K', min: 20_000, max: 35_000 },
  { id: 'usd-35-50', label_ar: '35 - 50 ألف', label_en: '35–50K', min: 35_000, max: 50_000 },
  { id: 'usd-50-80', label_ar: '50 - 80 ألف', label_en: '50–80K', min: 50_000, max: 80_000 },
  { id: 'usd-80-150', label_ar: '80 - 150 ألف', label_en: '80–150K', min: 80_000, max: 150_000 },
  { id: 'usd-150plus', label_ar: 'أكثر من 150 ألف', label_en: '150K+', min: 150_000 },
];

const SYP_PRICE_PRESETS: PricePreset[] = [
  { id: 'syp-100-200', label_ar: '100 - 200 مليون', label_en: '100–200M', min: 100_000_000, max: 200_000_000 },
  { id: 'syp-200-300', label_ar: '200 - 300 مليون', label_en: '200–300M', min: 200_000_000, max: 300_000_000 },
  { id: 'syp-300-500', label_ar: '300 - 500 مليون', label_en: '300–500M', min: 300_000_000, max: 500_000_000 },
  { id: 'syp-500-950', label_ar: '500 - 950 مليون', label_en: '500–950M', min: 500_000_000, max: 950_000_000 },
  { id: 'syp-950-1300', label_ar: '950 - 1300 مليون', label_en: '950–1300M', min: 950_000_000, max: 1_300_000_000 },
  { id: 'syp-1300plus', label_ar: 'أكثر من 1300 مليون', label_en: '1300M+', min: 1_300_000_000 },
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
    location_ids: searchParams.get('location_id')?.split(',').filter(Boolean) ?? [],
    currency: (searchParams.get('currency') as Currency) ?? 'SYP',
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    bedrooms: searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : undefined,
    bathrooms: searchParams.get('bathrooms') ? Number(searchParams.get('bathrooms')) : undefined,
    sort_by: (searchParams.get('sort') as Filters['sort_by']) ?? 'price_asc',
    search: searchParams.get('q') ?? undefined,
  }));

  const pricePresets = filters.currency === 'USD' ? USD_PRICE_PRESETS : SYP_PRICE_PRESETS;
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
      const serialized = Array.isArray(value) ? value.join(',') : value;
      if (serialized === undefined || serialized === '' || serialized === null) {
        params.delete(param);
      } else {
        params.set(param, String(serialized));
      }
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    applyFilters({ [key]: value } as Partial<Filters>);
  };

  const toggleNeighborhood = (id: string) => {
    const current = filters.location_ids ?? [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    applyFilters({ location_ids: next });
  };

  const resetFilters = () => {
    setFilters({ listing_type: 'sale', currency: 'SYP', sort_by: 'price_asc', page: 1 });
    setCustomPrice(false);
    setSearchParams({ type: 'sale' });
  };

  const sortOptions = [
    { value: 'price_asc', label: t('filters.price_low') },
    { value: 'price_desc', label: t('filters.price_high') },
    { value: 'views', label: t('filters.most_viewed') },
  ];

  const bedroomOptions = [1, 2, 3, 4, 5];

  const selectedCount = filters.location_ids?.length ?? 0;

  const hasActiveFilters =
    selectedCount > 0 ||
    filters.min_price ||
    filters.max_price ||
    filters.bedrooms ||
    filters.bathrooms;

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
            onClick={() => updateFilter('listing_type', type)}
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
          {/* Neighborhoods — multi-select checkboxes */}
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              {t('filters.district')}
              {selectedCount > 0 && (
                <span className="ms-1.5 text-xs text-primary-600 dark:text-primary-400 font-semibold">
                  ({selectedCount})
                </span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 max-h-52 overflow-y-auto rounded-xl border border-dark-100 dark:border-dark-700 p-3">
              {(districts ?? []).map((d) => {
                const checked = filters.location_ids?.includes(d.id) ?? false;
                return (
                  <label
                    key={d.id}
                    className="flex items-center gap-2 cursor-pointer py-1 text-sm text-dark-700 dark:text-dark-300"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleNeighborhood(d.id)}
                      className="w-4 h-4 rounded text-primary-500 accent-primary-500 flex-shrink-0"
                    />
                    <span className="truncate">
                      {getLocalizedText(d.name_ar, d.name_en, language)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Price range — currency toggle + ready-made presets + custom */}
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              {t('filters.price_range')}
            </label>

            {/* Currency toggle */}
            <div className="flex gap-2 mb-2">
              {(['SYP', 'USD'] as const).map((cur) => (
                <button
                  key={cur}
                  onClick={() => {
                    if (filters.currency === cur) return;
                    // Presets differ between currencies — clear the range on switch
                    setCustomPrice(false);
                    applyFilters({ currency: cur, min_price: undefined, max_price: undefined });
                  }}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                    filters.currency === cur
                      ? 'bg-secondary-800 text-white border-secondary-800 dark:bg-primary-500 dark:border-primary-500'
                      : 'border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-400 hover:border-primary-300'
                  )}
                >
                  {cur === 'USD' ? `${t('filters.usd')} $` : t('filters.syp')}
                </button>
              ))}
            </div>

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
