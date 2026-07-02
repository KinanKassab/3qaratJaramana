import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { FullPageSpinner } from '@/components/ui/Spinner';

const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })));
const PropertiesPage = lazy(() => import('@/pages/PropertiesPage').then(m => ({ default: m.PropertiesPage })));
const PropertyDetailPage = lazy(() => import('@/pages/PropertyDetailPage').then(m => ({ default: m.PropertyDetailPage })));
const ComparisonPage = lazy(() => import('@/pages/ComparisonPage').then(m => ({ default: m.ComparisonPage })));
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/property/:slug" element={<PropertyDetailPage />} />
            <Route path="/compare" element={<ComparisonPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
