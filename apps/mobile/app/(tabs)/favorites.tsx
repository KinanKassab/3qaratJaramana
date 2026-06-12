import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { formatPrice, getLocalizedText } from '@shared/utils/format';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { language } = useUIStore();
  const isAr = language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['favorites-mobile', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('favorites')
        .select(`property:properties(*, images:property_images(*), location:locations(name_ar, name_en))`)
        .eq('user_id', user.id);
      return (data?.map((f: any) => f.property) ?? []);
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <View style={styles.centered}>
        <Heart size={48} color="#dee2e6" />
        <Text style={styles.emptyText}>{isAr ? 'سجل دخولك لرؤية المفضلة' : 'Login to see favorites'}</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/auth/login')}>
          <Text style={styles.loginBtnText}>{isAr ? 'تسجيل الدخول' : 'Log In'}</Text>
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
      renderItem={({ item }: any) => {
        const cover = item.images?.find((i: any) => i.is_cover)?.url ?? item.images?.[0]?.url;
        const title = getLocalizedText(item.title_ar, item.title_en, language);
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/property/${item.id}`)}
            activeOpacity={0.9}
          >
            {cover && <Image source={{ uri: cover }} style={styles.image} />}
            <View style={styles.body}>
              <Text style={styles.price}>{formatPrice(item.price, language, 'SYP')}</Text>
              <Text style={styles.title} numberOfLines={2}>{title}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Heart size={48} color="#dee2e6" />
          <Text style={styles.emptyText}>{isAr ? 'لا توجد عقارات في المفضلة' : 'No favorites yet'}</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { color: '#6c757d', marginTop: 12, fontSize: 15 },
  loginBtn: { marginTop: 16, backgroundColor: '#C4A35A', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  image: { width: 100, height: 90 },
  body: { flex: 1, padding: 12 },
  price: { fontSize: 15, fontWeight: '800', color: '#C4A35A', marginBottom: 4 },
  title: { fontSize: 13, fontWeight: '600', color: '#212529', lineHeight: 18, textAlign: 'right' },
});
