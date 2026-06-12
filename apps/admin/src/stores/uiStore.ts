import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  language: 'ar' | 'en';
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  setLanguage: (lang: 'ar' | 'en') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      language: 'ar',
      theme: 'light',
      sidebarCollapsed: false,

      setLanguage(lang) {
        set({ language: lang });
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
        localStorage.setItem('language', lang);
      },

      setTheme(theme) {
        set({ theme });
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },

      toggleSidebar() {
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }));
      },
    }),
    { name: 'admin-ui' },
  ),
);
