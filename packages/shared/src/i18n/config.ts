import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './ar.json';
import en from './en.json';

export const i18nResources = {
  ar: { translation: ar },
  en: { translation: en },
} as const;

export function initI18n(defaultLanguage: 'ar' | 'en' = 'ar') {
  return i18n.use(initReactI18next).init({
    resources: i18nResources,
    lng: defaultLanguage,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

export { i18n };
