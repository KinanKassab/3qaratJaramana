import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/stores/uiStore';
import { formatPrice, getLocalizedText } from '@shared/utils/format';
import type { PropertyWithRelations } from '@shared/types/app.types';

function PropertyCard({ property }: { property: PropertyWithRelations }) {
  const router = useRouter();
  const { language } = useUIStore();
  const cover = property.images?.find(i => i.is_cover)?.url ?? property.images?.[0]?.url;
  const title = getLocalizedText(property.title_ar, property.title_en, language);
  const location = property.location
    ? getLocalizedText(property.location.name_ar, property.location.name_en, language)
    : '';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/property/${property.id}`)}
      activeOpacity={0.9}
    >
      {cover && <Image source={{ uri: cover }} style={styles.cardImage} />}
      <View style={styles.cardBody}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, property.listing_type === 'sale' ? styles.badgeSale : styles.badgeRent]}>
            <Text style={styles.badgeText}>
              {property.listing_type === 'sale'
                ? (language === 'ar' ? 'للبيع' : 'For Sale')
                : (language === 'ar' ? 'للإيجار' : 'For Rent')}
            </Text>
          </View>
        </View>
        <Text style={styles.cardPrice} numberOfLines={1}>
          {formatPrice(property.price, language, property.currency ?? 'SYP')}
        </Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
        {location ? (
          <View style={styles.locationRow}>
            <MapPin size={12} color="#C4A35A" />
            <Text style={styles.locationText}>{location}</Text>
          </View>
        ) : null}
        <View style={styles.statsRow}>
          {property.bedrooms != null && (
            <Text style={styles.stat}>{property.bedrooms} {language === 'ar' ? 'غرف' : 'Beds'}</Text>
          )}
          {property.bathrooms != null && (
            <Text style={styles.stat}>{property.bathrooms} {language === 'ar' ? 'حمام' : 'Bath'}</Text>
          )}
          {property.area != null && (
            <Text style={styles.stat}>{property.area} م²</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { language } = useUIStore();
  const isAr = language === 'ar';

  const { data: latest, isLoading: loadingLatest } = useQuery({
    queryKey: ['latest-mobile'],
    queryFn: async () => {
      const { data } = await supabase
        .from('properties')
        .select(`*, images:property_images(*), location:locations(name_ar, name_en)`)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(8);
      return (data ?? []) as PropertyWithRelations[];
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Banner */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>
          {isAr ? 'ابحث عن عقارك\nالمثالي' : 'Find Your\nPerfect Property'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {isAr ? 'جرمانا — ريف دمشق' : 'Jaramana — Rif Dimashq'}
        </Text>
      </View>

      {/* Latest */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{isAr ? 'أحدث العقارات' : 'Latest Properties'}</Text>
        {loadingLatest ? (
          <ActivityIndicator color="#C4A35A" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.grid}>
            {(latest ?? []).map(p => <PropertyCard key={p.id} property={p} />)}
          </View>
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  hero: {
    backgroundColor: '#1B3A5C',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 34,
    marginBottom: 8,
    textAlign: 'right',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#C4A35A',
    textAlign: 'right',
  },
  section: { marginTop: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginHorizontal: 16,
    marginBottom: 12,
    textAlign: 'right',
  },
  grid: { paddingHorizontal: 16, gap: 12 },
  card: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: { width: '100%', height: 140 },
  cardBody: { padding: 12 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeSale: { backgroundColor: '#1B3A5C' },
  badgeRent: { backgroundColor: '#C4A35A' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  cardPrice: { fontSize: 15, fontWeight: '800', color: '#C4A35A', marginBottom: 4 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#212529', marginBottom: 6, lineHeight: 18 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  locationText: { fontSize: 11, color: '#6c757d' },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { fontSize: 11, color: '#6c757d', backgroundColor: '#f1f3f5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
});
