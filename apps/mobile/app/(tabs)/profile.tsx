import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { applyRTL } from '@/utils/rtl';
import {
  User, Heart, Calendar, Bell, Globe, Moon, Sun, LogOut, ChevronRight,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { language, theme, setLanguage, setTheme } = useUIStore();
  const isAr = language === 'ar';

  const handleLogout = () => {
    Alert.alert(
      isAr ? 'تسجيل الخروج' : 'Log Out',
      isAr ? 'هل أنت متأكد؟' : 'Are you sure?',
      [
        { text: isAr ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: isAr ? 'خروج' : 'Log Out', onPress: logout, style: 'destructive' },
      ],
    );
  };

  const handleLanguageToggle = async () => {
    const newLang: 'ar' | 'en' = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    await applyRTL(newLang);
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <User size={56} color="#dee2e6" />
        <Text style={styles.emptyText}>{isAr ? 'سجل دخولك لعرض ملفك الشخصي' : 'Login to view your profile'}</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/auth/login')}>
          <Text style={styles.loginBtnText}>{isAr ? 'تسجيل الدخول' : 'Log In'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/auth/register')} style={{ marginTop: 12 }}>
          <Text style={styles.registerText}>{isAr ? 'إنشاء حساب جديد' : 'Create Account'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const menuItems = [
    { icon: Heart, label: isAr ? 'المفضلة' : 'Favorites', onPress: () => router.push('/(tabs)/favorites') },
    { icon: Calendar, label: isAr ? 'مواعيدي' : 'My Appointments', onPress: () => router.push('/appointments') },
    { icon: Bell, label: isAr ? 'الإشعارات' : 'Notifications', onPress: () => router.push('/notifications') },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.full_name?.[0] ?? 'U'}</Text>
        </View>
        <Text style={styles.name}>{user.full_name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      {/* Menu */}
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

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={18} color="#ef4444" />
        <Text style={styles.logoutText}>{isAr ? 'تسجيل الخروج' : 'Log Out'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { color: '#6c757d', marginTop: 12, fontSize: 15, textAlign: 'center' },
  loginBtn: { marginTop: 20, backgroundColor: '#C4A35A', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 14 },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  registerText: { color: '#1B3A5C', fontSize: 14, fontWeight: '600' },
  header: { backgroundColor: '#1B3A5C', alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#C4A35A', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  name: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: '#b8c5d1' },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f3f5' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#212529' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 24, padding: 14, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#fecaca' },
  logoutText: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
});
