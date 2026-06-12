import React from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { formatDate, getLocalizedText } from '@shared/utils/format';
import { Calendar } from 'lucide-react-native';

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#10b981',
  cancelled: '#ef4444',
  completed: '#6b7280',
};

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { language } = useUIStore();
  const isAr = language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['appointments-mobile', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('appointments')
        .select('*, property:properties(title_ar, title_en, slug)')
        .eq('requester_id', user.id)
        .order('scheduled_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{isAr ? 'سجل دخولك لرؤية المواعيد' : 'Login to view appointments'}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/auth/login')}>
          <Text style={styles.btnText}>{isAr ? 'تسجيل الدخول' : 'Log In'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) return <ActivityIndicator color="#C4A35A" style={{ marginTop: 40 }} />;

  return (
    <FlatList
      data={data}
      keyExtractor={(item: any) => item.id}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      ListHeaderComponent={<Text style={styles.heading}>{isAr ? 'مواعيدي' : 'My Appointments'}</Text>}
      renderItem={({ item }: any) => (
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.propertyTitle} numberOfLines={1}>
              {item.property ? getLocalizedText(item.property.title_ar, item.property.title_en, language) : '—'}
            </Text>
            <View style={[styles.statusDot, { backgroundColor: statusColors[item.status] ?? '#6b7280' }]} />
          </View>
          <View style={styles.row}>
            <Calendar size={14} color="#6c757d" />
            <Text style={styles.date}>{formatDate(item.scheduled_at, language)}</Text>
          </View>
          {item.notes ? <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text> : null}
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Calendar size={48} color="#dee2e6" />
          <Text style={styles.emptyText}>{isAr ? 'لا توجد مواعيد' : 'No appointments yet'}</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  heading: { fontSize: 18, fontWeight: '700', color: '#212529', marginBottom: 4, textAlign: 'right' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  propertyTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#212529', textAlign: 'right' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginStart: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: { fontSize: 12, color: '#6c757d' },
  notes: { fontSize: 12, color: '#6c757d', marginTop: 6, textAlign: 'right' },
  emptyText: { color: '#6c757d', marginTop: 12, fontSize: 15 },
  btn: { marginTop: 16, backgroundColor: '#C4A35A', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '700' },
});
