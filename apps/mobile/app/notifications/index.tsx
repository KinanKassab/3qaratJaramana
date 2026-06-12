import React from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { formatDate, getLocalizedText } from '@shared/utils/format';
import { Bell } from 'lucide-react-native';

export default function NotificationsScreen() {
  const { user } = useAuthStore();
  const { language } = useUIStore();
  const isAr = language === 'ar';
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-mobile', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      return data ?? [];
    },
    enabled: !!user,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-mobile'] }),
  });

  if (isLoading) return <ActivityIndicator color="#C4A35A" style={{ marginTop: 40 }} />;

  return (
    <FlatList
      data={data}
      keyExtractor={(item: any) => item.id}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      ListHeaderComponent={<Text style={styles.heading}>{isAr ? 'الإشعارات' : 'Notifications'}</Text>}
      renderItem={({ item }: any) => (
        <TouchableOpacity
          style={[styles.card, !item.is_read && styles.cardUnread]}
          onPress={() => !item.is_read && markRead.mutate(item.id)}
          activeOpacity={0.85}
        >
          <View style={styles.cardTop}>
            <Text style={styles.title}>
              {getLocalizedText(item.title_ar, item.title_en, language)}
            </Text>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.body} numberOfLines={2}>
            {getLocalizedText(item.body_ar, item.body_en, language)}
          </Text>
          <Text style={styles.time}>{formatDate(item.created_at, language)}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Bell size={48} color="#dee2e6" />
          <Text style={styles.emptyText}>{isAr ? 'لا توجد إشعارات' : 'No notifications'}</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 18, fontWeight: '700', color: '#212529', marginBottom: 4, textAlign: 'right' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  cardUnread: { borderStartWidth: 3, borderStartColor: '#C4A35A' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: '#212529', textAlign: 'right' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C4A35A', marginTop: 4, marginStart: 8 },
  body: { fontSize: 13, color: '#495057', textAlign: 'right', lineHeight: 19 },
  time: { fontSize: 11, color: '#adb5bd', marginTop: 6 },
  centered: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#6c757d', marginTop: 12, fontSize: 15 },
});
