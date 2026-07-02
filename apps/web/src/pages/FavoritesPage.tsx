import React from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useFavorites } from '@/hooks/useFavorites';
import { PropertyGrid } from '@/components/property/PropertyGrid';
import { SEO } from '@/components/SEO';

export function FavoritesPage() {
  const { language } = useUIStore();
  const { data: favorites, isLoading } = useFavorites();

  return (
    <>
      <SEO title={language === 'ar' ? 'المفضلة' : 'Favorites'} url="/favorites" />

      <div className="pt-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-100 mb-6">
            {language === 'ar' ? 'المفضلة' : 'Favorites'}
          </h1>
          <PropertyGrid properties={favorites} loading={isLoading} />
        </div>
      </div>
    </>
  );
}
