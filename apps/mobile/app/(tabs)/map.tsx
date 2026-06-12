import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/stores/uiStore';
import { formatPrice, getLocalizedText } from '@shared/utils/format';
import type { PropertyWithRelations } from '@shared/types/app.types';

const JARAMANA = { latitude: 33.487, longitude: 36.341, latitudeDelta: 0.08, longitudeDelta: 0.08 };

export default function MapScreen() {
  const router = useRouter();
  const { language } = useUIStore();
  const isAr = language === 'ar';

  const { data: properties } = useQuery({
    queryKey: ['map-properties'],
    queryFn: async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, slug, title_ar, title_en, price, is_featured, latitude, longitude')
        .eq('status', 'available')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(100);
      return (data ?? []) as PropertyWithRelations[];
    },
  });

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={JARAMANA}
        showsUserLocation
        showsMyLocationButton
      >
        {(properties ?? []).map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude!, longitude: p.longitude! }}
            pinColor={p.is_featured ? '#C4A35A' : '#1B3A5C'}
          >
            <Callout onPress={() => router.push(`/property/${p.id}`)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle} numberOfLines={2}>
                  {getLocalizedText(p.title_ar, p.title_en, language)}
                </Text>
                <Text style={styles.calloutPrice}>{formatPrice(p.price, language, 'SYP')}</Text>
                <Text style={styles.calloutLink}>{isAr ? 'عرض التفاصيل' : 'View Details'}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  callout: { width: 180, padding: 8 },
  calloutTitle: { fontSize: 12, fontWeight: '600', color: '#212529', marginBottom: 4 },
  calloutPrice: { fontSize: 13, fontWeight: '700', color: '#C4A35A', marginBottom: 4 },
  calloutLink: { fontSize: 11, color: '#1B3A5C', fontWeight: '600' },
});
