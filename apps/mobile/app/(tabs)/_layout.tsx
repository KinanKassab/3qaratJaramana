import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Search, Heart, User } from 'lucide-react-native';
import { useUIStore } from '@/stores/uiStore';

const ACTIVE_COLOR = '#C4A35A';
const INACTIVE_COLOR = '#6c757d';

export default function TabsLayout() {
  const { language } = useUIStore();
  const isAr = language === 'ar';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e9ecef',
        },
        headerStyle: { backgroundColor: '#1B3A5C' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontFamily: 'Cairo-SemiBold', fontSize: 18 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isAr ? 'الرئيسية' : 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          headerTitle: 'عقارات جرمانا',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: isAr ? 'بحث' : 'Search',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
<Tabs.Screen
        name="favorites"
        options={{
          title: isAr ? 'المفضلة' : 'Favorites',
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isAr ? 'الإعدادات' : 'Settings',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
