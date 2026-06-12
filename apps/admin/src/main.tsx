import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import '@/lib/i18n';
import App from './App';
import '@/styles/global.css';

function Root() {
  const { initialize } = useAuthStore();
  const { theme, language } = useUIStore();

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  React.useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [language, theme]);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </HelmetProvider>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
