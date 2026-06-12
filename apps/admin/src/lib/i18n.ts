import { initI18n } from '@shared/i18n/config';

initI18n(localStorage.getItem('language') as 'ar' | 'en' ?? 'ar');
