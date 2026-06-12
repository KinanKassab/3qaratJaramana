import React from 'react';
import { Link } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { Home, ArrowLeft, ArrowRight } from 'lucide-react';

export function NotFoundPage() {
  const { language } = useUIStore();
  const Arrow = language === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-primary-500/20 mb-4 select-none">404</div>
        <h1 className="text-3xl font-bold text-dark-900 dark:text-dark-100 mb-3">
          {language === 'ar' ? 'الصفحة غير موجودة' : 'Page Not Found'}
        </h1>
        <p className="text-dark-500 dark:text-dark-400 mb-8 max-w-sm mx-auto">
          {language === 'ar'
            ? 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها'
            : 'Sorry, the page you are looking for does not exist or has been moved'}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/" className="btn-primary gap-2">
            <Home className="h-4 w-4" />
            {language === 'ar' ? 'الصفحة الرئيسية' : 'Go Home'}
          </Link>
          <Link to="/properties" className="btn-outline gap-2">
            <Arrow className="h-4 w-4" />
            {language === 'ar' ? 'تصفح العقارات' : 'Browse Properties'}
          </Link>
        </div>
      </div>
    </div>
  );
}
