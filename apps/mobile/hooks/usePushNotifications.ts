import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-constants';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications(userId?: string) {
  useEffect(() => {
    if (!userId) return;

    async function registerToken() {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      await supabase.from('users').update({ expo_push_token: token }).eq('id', userId);
    }

    registerToken();
  }, [userId]);
}
