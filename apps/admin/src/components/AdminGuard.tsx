import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Spinner } from '@/components/ui/Spinner';

export function AdminGuard() {
  const { user, session } = useAuthStore();

  if (session === null && user === null) {
    return <Navigate to="/login" replace />;
  }

  if (user && user.role !== 'admin' && user.role !== 'agent') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-dark-900 mb-2">غير مصرح</h2>
          <p className="text-dark-500">ليس لديك صلاحية للوصول إلى لوحة التحكم</p>
        </div>
      </div>
    );
  }

  if (!user && session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <Outlet />;
}
