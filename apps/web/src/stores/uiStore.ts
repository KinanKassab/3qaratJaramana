import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@shared/types/app.types';

interface UIState {
  theme: 'light' | 'dark';
  language: Language;
  mobileMenuOpen: boolean;

  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'ar',
      mobileMenuOpen: false,

      setTheme: (theme) => {
        set({ theme });
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      toggleTheme: () => {
        const current = get().theme;
        get().setTheme(current === 'light' ? 'dark' : 'light');
      },

      setLanguage: (lang) => {
        set({ language: lang });
        localStorage.setItem('language', lang);
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
      },

      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({ theme: state.theme, language: state.language }),
    }
  )
);
