import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/stores/uiStore';
import { buildPropertiesQuery } from '@shared/supabase/queries/properties';
import { getLocalizedText, formatPrice } from '@shared/utils/format';
import { Image } from 'expo-image';
import type { PropertyFilters } from '@shared/types/app.types';

export default function SearchScreen() {
  const router = useRouter();
  const { language } = useUIStore();
  const isAr = language === 'ar';
  const [search, setSearch] = useState('');
  const [listingType, setListingType] = useState<'sale' | 'rent' | ''>('');
  const [filters, setFilters] = useState<PropertyFilters>({ page: 1, per_page: 20 });

  const { data, isLoading } = useQuery({
    queryKey: ['search-mobile', search, listingType, filters],
    queryFn: async () => {
      const f: PropertyFilters = { ...filters, search: search || undefined, listing_type: listingType || undefined };
      const { data } = await buildPropertiesQuery(supabase, f);
      return data ?? [];
    },
    enabled: true,
  });

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Search size={16} color="#6c757d" />
        <TextInput
          style={styles.searchInput}
          placeholder={isAr ? 'ابحث عن عقار...' : 'Search properties...'}
          value={search}
          onChangeText={setSearch}
          textAlign={isAr ? 'right' : 'left'}
        />
      </View>

      {/* Type filter */}
      <View style={styles.typeRow}>
        {(['', 'sale', 'rent'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setListingType(type)}
            style={[styles.typeBtn, listingType === type && styles.typeBtnActive]}
          >
            <Text style={[styles.typeBtnText, listingType === type && styles.typeBtnTextActive]}>
              {type === '' ? (isAr ? 'الكل' : 'All') : type === 'sale' ? (isAr ? 'بيع' : 'Sale') : (isAr ? 'إيجار' : 'Rent')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results */}
      {isLoading ? (
        <ActivityIndicator color="#C4A35A" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => {
            const cover = item.images?.find((i: any) => i.is_cover)?.url ?? item.images?.[0]?.url;
            const title = getLocalizedText(item.title_ar, item.title_en, language);
            return (
              <TouchableOpacity
                style={styles.resultCard}
                onPress={() => router.push(`/property/${item.id}`)}
                activeOpacity={0.9}
              >
                {cover && (
                  <Image source={{ uri: cover }} style={styles.resultImage} contentFit="cover" />
                )}
                <View style={styles.resultBody}>
                  <Text style={styles.resultTitle} numberOfLines={2}>{title}</Text>
                  <Text style={styles.resultPrice}>{formatPrice(item.price, language, item.currency ?? 'SYP')}</Text>
                  <Text style={styles.resultMeta}>
                    {[item.bedrooms != null && `${item.bedrooms} ${isAr ? 'غرف' : 'Beds'}`,
                      item.area != null && `${item.area}م²`].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>{isAr ? 'لا توجد نتائج' : 'No results found'}</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#212529' },
  typeRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeBtnActive: { backgroundColor: '#C4A35A', borderColor: '#C4A35A' },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#495057' },
  typeBtnTextActive: { color: '#fff' },
  resultCard: {
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
  resultImage: { width: 100, height: 90 },
  resultBody: { flex: 1, padding: 12 },
  resultTitle: { fontSize: 13, fontWeight: '600', color: '#212529', marginBottom: 4, textAlign: 'right' },
  resultPrice: { fontSize: 14, fontWeight: '700', color: '#C4A35A', marginBottom: 4 },
  resultMeta: { fontSize: 11, color: '#6c757d' },
  empty: { textAlign: 'center', color: '#6c757d', marginTop: 40 },
});
