import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking,
} from 'react-native';
import { useUIStore } from '@/stores/uiStore';
import { applyRTL } from '@/utils/rtl';
import { buildWhatsAppContactLink } from '@shared/utils/whatsapp';
import {
  Globe, Moon, Sun, Phone, MessageCircle, ChevronRight,
} from 'lucide-react-native';

const CONTACT_PHONE = '+963112345678';

export default function SettingsScreen() {
  const { language, theme, setLanguage, setTheme } = useUIStore();
  const isAr = language === 'ar';

  const handleLanguageToggle = async () => {
    const newLang: 'ar' | 'en' = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    await applyRTL(newLang);
  };

  const menuItems = [
    {
      icon: Phone,
      label: isAr ? 'اتصل بنا' : 'Call Us',
      onPress: () => Linking.openURL(`tel:${CONTACT_PHONE}`),
    },
    {
      icon: MessageCircle,
      label: isAr ? 'راسلنا واتساب' : 'WhatsApp Us',
      onPress: () => Linking.openURL(buildWhatsAppContactLink(CONTACT_PHONE)),
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>ع</Text>
        </View>
        <Text style={styles.name}>{isAr ? 'عقارات جرمانا' : '3qarat Jaramana'}</Text>
      </View>

      {/* Contact */}
      <View style={styles.section}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.onPress}>
            <item.icon size={20} color="#1B3A5C" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <ChevronRight size={16} color="#adb5bd" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem} onPress={handleLanguageToggle}>
          <Globe size={20} color="#1B3A5C" />
          <Text style={styles.menuLabel}>{isAr ? 'English' : 'العربية'}</Text>
          <ChevronRight size={16} color="#adb5bd" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun size={20} color="#1B3A5C" /> : <Moon size={20} color="#1B3A5C" />}
          <Text style={styles.menuLabel}>{theme === 'dark' ? (isAr ? 'وضع فاتح' : 'Light Mode') : (isAr ? 'وضع مظلم' : 'Dark Mode')}</Text>
          <ChevronRight size={16} color="#adb5bd" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#1B3A5C', alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#C4A35A', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  name: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f3f5' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#212529' },
});
