import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminGuard } from '@/components/AdminGuard';
import { Spinner } from '@/components/ui/Spinner';

const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const PropertiesManagementPage = lazy(() => import('@/pages/PropertiesManagementPage').then(m => ({ default: m.PropertiesManagementPage })));
const PropertyFormPage = lazy(() => import('@/pages/PropertyFormPage').then(m => ({ default: m.PropertyFormPage })));
const PropertyAnalyticsPage = lazy(() => import('@/pages/PropertyAnalyticsPage').then(m => ({ default: m.PropertyAnalyticsPage })));
const UsersPage = lazy(() => import('@/pages/UsersPage').then(m => ({ default: m.UsersPage })));
const AppointmentsPage = lazy(() => import('@/pages/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const LocationsPage = lazy(() => import('@/pages/LocationsPage').then(m => ({ default: m.LocationsPage })));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));

function LoadingFallback() {
  return (
    <div className="h-64 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AdminGuard />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/properties" element={<PropertiesManagementPage />} />
              <Route path="/properties/new" element={<PropertyFormPage />} />
              <Route path="/properties/:id/edit" element={<PropertyFormPage />} />
              <Route path="/properties/:id/analytics" element={<PropertyAnalyticsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
