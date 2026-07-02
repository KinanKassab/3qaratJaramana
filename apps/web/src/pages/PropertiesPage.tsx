import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal } from 'lucide-react';
import { useProperties } from '@/hooks/useProperties';
import { useUIStore } from '@/stores/uiStore';
import { PropertyGrid } from '@/components/property/PropertyGrid';
import { PropertyFilters } from '@/components/property/PropertyFilters';
import { Pagination } from '@/components/ui/Pagination';
import { SEO } from '@/components/SEO';
import { Modal } from '@/components/ui/Modal';
import type { PropertyFilters as Filters } from '@shared/types/app.types';

export function PropertiesPage() {
  const { t } = useTranslation();
  const { language } = useUIStore();
  const [filters, setFilters] = useState<Filters>({ page: 1, per_page: 12 });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, isLoading } = useProperties(filters);

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters((prev) => ({ ...newFilters, per_page: prev.per_page ?? 12 }));
  }, []);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <SEO
        title={language === 'ar' ? 'جميع العقارات' : 'All Properties'}
        description={language === 'ar'
          ? 'تصفح جميع العقارات المتاحة للبيع والإيجار في جرمانا'
          : 'Browse all properties for sale and rent in Jaramana'}
        url="/properties"
      />

      <div className="pt-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters — desktop */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24">
                <PropertyFilters onFiltersChange={handleFiltersChange} />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-100">
                    {language === 'ar' ? 'العقارات' : 'Properties'}
                  </h1>
                  {data && (
                    <p className="text-dark-500 dark:text-dark-400 text-sm mt-1">
                      {t('filters.showing')} {data.data.length} {t('filters.of')} {data.total} {t('filters.results')}
                    </p>
                  )}
                </div>

                {/* Mobile filter button */}
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 text-sm font-medium hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {t('filters.title')}
                </button>
              </div>

              {/* Grid */}
              <PropertyGrid
                properties={data?.data}
                loading={isLoading}
                skeletonCount={12}
              />

              {/* Pagination */}
              {data && data.total_pages > 1 && (
                <div className="mt-10">
                  <Pagination
                    page={filters.page ?? 1}
                    totalPages={data.total_pages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      <Modal
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t('filters.title')}
        size="sm"
      >
        <PropertyFilters onFiltersChange={handleFiltersChange} />
      </Modal>
    </>
  );
}
