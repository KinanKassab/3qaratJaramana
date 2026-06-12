import { initI18n } from '@shared/i18n/config';

const savedLanguage = localStorage.getItem('language') as 'ar' | 'en' | null;
const defaultLang = savedLanguage ?? 'ar';

export const i18nReady = initI18n(defaultLang);

export { i18n } from '@shared/i18n/config';
