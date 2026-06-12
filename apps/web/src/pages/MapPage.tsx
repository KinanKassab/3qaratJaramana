import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, X } from 'lucide-react';
import { useProperties } from '@/hooks/useProperties';
import { useUIStore } from '@/stores/uiStore';
import { PropertyMap } from '@/components/property/PropertyMap';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PropertyFilters } from '@/components/property/PropertyFilters';
import { Skeleton } from '@/components/ui/Skeleton';
import { SEO } from '@/components/SEO';
import type { PropertyFilters as Filters } from '@shared/types/app.types';

export function MapPage() {
  const { t } = useTranslation();
  const { language } = useUIStore();
  const [filters, setFilters] = useState<Filters>({ page: 1, per_page: 50 });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, isLoading } = useProperties(filters);
  const properties = data?.data ?? [];

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters({ ...newFilters, per_page: 50, page: 1 });
  }, []);

  return (
    <>
      <SEO
        title={language === 'ar' ? 'خريطة العقارات' : 'Property Map'}
        description={language === 'ar'
          ? 'استعرض العقارات على الخريطة التفاعلية'
          : 'Browse properties on the interactive map'}
        url="/map"
      />

      <div className="pt-16 h-screen flex flex-col">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside
            className={`
              fixed inset-y-0 start-0 z-40 w-80 bg-white dark:bg-dark-900 shadow-xl
              transform transition-transform duration-300 overflow-y-auto
              lg:relative lg:translate-x-0 lg:shadow-none lg:border-e border-dark-200 dark:border-dark-700
              ${filtersOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
          >
            <div className="pt-20 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-dark-900 dark:text-dark-100">
                  {t('filters.title')}
                </h2>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="lg:hidden p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <PropertyFilters onFiltersChange={handleFiltersChange} />

              {/* Results list */}
              <div className="mt-6">
                <h3 className="font-semibold text-dark-800 dark:text-dark-200 mb-3 text-sm">
                  {data
                    ? `${data.total} ${language === 'ar' ? 'عقار' : 'Properties'}`
                    : language === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}
                </h3>
                <div className="space-y-3">
                  {isLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                      ))
                    : properties.slice(0, 10).map((property) => (
                        <PropertyCard key={property.id} property={property} />
                      ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Map */}
          <div className="flex-1 relative">
            <button
              onClick={() => setFiltersOpen(true)}
              className="lg:hidden absolute top-4 start-4 z-30 flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-800 rounded-xl shadow-lg text-sm font-medium"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t('filters.title')}
            </button>

            <PropertyMap
              properties={properties}
              height="100%"
              zoom={12}
            />
          </div>
        </div>
      </div>
    </>
  );
}
