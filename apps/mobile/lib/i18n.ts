import { initI18n } from '@shared/i18n/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function initMobileI18n() {
  const lang = await AsyncStorage.getItem('language');
  initI18n((lang as 'ar' | 'en') ?? 'ar');
}
