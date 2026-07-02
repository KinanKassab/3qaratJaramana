import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList, Linking,
  StyleSheet, ActivityIndicator, Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import {
  MapPin, Bed, Bath, Maximize2, Phone, MessageCircle,
  Share2, Heart, ArrowLeft,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { useUIStore } from '@/stores/uiStore';
import { formatPrice, formatArea, getLocalizedText } from '@shared/utils/format';
import { buildWhatsAppContactLink } from '@shared/utils/whatsapp';
import type { PropertyWithRelations } from '@shared/types/app.types';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language } = useUIStore();
  const isAr = language === 'ar';
  const { data: favoriteIds } = useFavoriteIds();
  const { mutate: toggleFavoriteMutation } = useToggleFavorite();
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property-mobile', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('properties')
        .select(`
          *,
          images:property_images(*),
          location:locations(name_ar, name_en),
          category:categories(name_ar, name_en),
          agent:users!properties_agent_id_fkey(id, full_name, phone)
        `)
        .eq('id', id!)
        .single();

      if (data) {
        await supabase.rpc('increment_view_count', { p_property_id: data.id });
      }
      return data as PropertyWithRelations;
    },
    enabled: !!id,
  });

  const isFavorited = property ? (favoriteIds?.has(property.id) ?? false) : false;

  const toggleFavorite = () => {
    if (!property) return;
    toggleFavoriteMutation({ propertyId: property.id, isFavorite: isFavorited });
  };

  const handleShare = async () => {
    if (!property) return;
    await Share.share({
      message: `${getLocalizedText(property.title_ar, property.title_en, language)}\nhttps://3qaratjaramana.com/property/${property.slug}`,
    });
    await supabase.rpc('increment_analytics', {
      p_property_id: property.id,
      p_event_type: 'share',
    });
  };

  const handleWhatsApp = async () => {
    if (!property?.agent?.phone) return;
    const title = getLocalizedText(property.title_ar, property.title_en, language);
    const url = buildWhatsAppContactLink(property.agent.phone, `أريد الاستفسار عن: ${title}`);
    await supabase.rpc('increment_analytics', {
      p_property_id: property.id,
      p_event_type: 'whatsapp_click',
    });
    Linking.openURL(url);
  };

  if (isLoading || !property) {
    return <ActivityIndicator color="#C4A35A" style={{ flex: 1, marginTop: 100 }} />;
  }

  const images = property.images ?? [];
  const title = getLocalizedText(property.title_ar, property.title_en, language);
  const description = getLocalizedText(property.description_ar, property.description_en, language);
  const locationName = property.location
    ? getLocalizedText(property.location.name_ar, property.location.name_en, language)
    : null;

  const stats = [
    property.bedrooms != null && { label: isAr ? 'غرف' : 'Beds', value: property.bedrooms, Icon: Bed },
    property.bathrooms != null && { label: isAr ? 'حمام' : 'Bath', value: property.bathrooms, Icon: Bath },
    property.area != null && { label: isAr ? 'مساحة' : 'Area', value: formatArea(property.area, language), Icon: Maximize2 },
  ].filter(Boolean);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <View style={styles.imageContainer}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
              setCurrentImageIdx(idx);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item.url }} style={styles.image} contentFit="cover" />
            )}
            keyExtractor={(_, idx) => String(idx)}
          />
          <View style={styles.imageDots}>
            {images.map((_, idx) => (
              <View key={idx} style={[styles.dot, idx === currentImageIdx && styles.dotActive]} />
            ))}
          </View>
          {/* Back + favorite */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.favoriteBtn} onPress={toggleFavorite}>
            <Heart size={20} color={isFavorited ? '#ef4444' : '#fff'} fill={isFavorited ? '#ef4444' : 'transparent'} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Price + badges */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(property.price, language, 'SYP')}</Text>
            <View style={[styles.badge, property.listing_type === 'sale' ? styles.badgeSale : styles.badgeRent]}>
              <Text style={styles.badgeText}>{property.listing_type === 'sale' ? (isAr ? 'للبيع' : 'For Sale') : (isAr ? 'للإيجار' : 'For Rent')}</Text>
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>

          {locationName && (
            <View style={styles.locationRow}>
              <MapPin size={14} color="#C4A35A" />
              <Text style={styles.locationText}>{locationName}</Text>
            </View>
          )}

          {/* Stats */}
          {stats.length > 0 && (
            <View style={styles.statsGrid}>
              {stats.map((stat: any) => (
                <View key={stat.label} style={styles.statCard}>
                  <stat.Icon size={20} color="#C4A35A" />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          {description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{isAr ? 'وصف العقار' : 'Description'}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
          )}

          {/* Agent */}
          {property.agent && (
            <View style={styles.agentCard}>
              <View style={styles.agentAvatar}>
                <Text style={styles.agentAvatarText}>{property.agent.full_name?.[0]}</Text>
              </View>
              <View>
                <Text style={styles.agentName}>{property.agent.full_name}</Text>
                <Text style={styles.agentRole}>{isAr ? 'الوكيل العقاري' : 'Property Agent'}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Contact CTA */}
      <View style={styles.cta}>
        {property.agent?.phone && (
          <TouchableOpacity
            style={[styles.ctaBtn, styles.ctaBtnPhone]}
            onPress={() => Linking.openURL(`tel:${property.agent!.phone}`)}
          >
            <Phone size={18} color="#fff" />
            <Text style={styles.ctaBtnText}>{isAr ? 'اتصل' : 'Call'}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.ctaBtn, styles.ctaBtnWhatsApp]} onPress={handleWhatsApp}>
          <MessageCircle size={18} color="#fff" />
          <Text style={styles.ctaBtnText}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctaBtn, styles.ctaBtnShare]} onPress={handleShare}>
          <Share2 size={18} color="#6c757d" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  imageContainer: { height: 300, position: 'relative' },
  image: { width: 375, height: 300 },
  imageDots: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 16 },
  backBtn: { position: 'absolute', top: 16, start: 16, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 8 },
  favoriteBtn: { position: 'absolute', top: 16, end: 16, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 8 },
  content: { padding: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  price: { fontSize: 22, fontWeight: '800', color: '#C4A35A' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeSale: { backgroundColor: '#1B3A5C' },
  badgeRent: { backgroundColor: '#C4A35A' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '700', color: '#212529', marginBottom: 8, textAlign: 'right', lineHeight: 24 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  locationText: { fontSize: 13, color: '#6c757d' },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#212529' },
  statLabel: { fontSize: 11, color: '#6c757d' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#212529', marginBottom: 8, textAlign: 'right' },
  description: { fontSize: 14, color: '#495057', lineHeight: 22, textAlign: 'right' },
  agentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 16 },
  agentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#C4A35A', alignItems: 'center', justifyContent: 'center' },
  agentAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  agentName: { fontSize: 14, fontWeight: '700', color: '#212529' },
  agentRole: { fontSize: 12, color: '#6c757d' },
  cta: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e9ecef' },
  ctaBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 14 },
  ctaBtnPhone: { backgroundColor: '#1B3A5C' },
  ctaBtnWhatsApp: { backgroundColor: '#25d366' },
  ctaBtnShare: { flex: 0, paddingHorizontal: 16, backgroundColor: '#f1f3f5', borderWidth: 1, borderColor: '#dee2e6' },
  ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
