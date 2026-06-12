import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function applyRTL(language: 'ar' | 'en') {
  const shouldBeRTL = language === 'ar';
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    await AsyncStorage.setItem('language', language);
  }
}

export function isRTL() {
  return I18nManager.isRTL;
}
