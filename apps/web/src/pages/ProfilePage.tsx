import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Heart, Clock, Bookmark, Calendar, User, Bell, LogOut, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { supabase } from '@/lib/supabase';
import { userProfileSchema } from '@shared/utils/validation';
import { formatDate, getLocalizedText } from '@shared/utils/format';
import { SEO } from '@/components/SEO';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import type { PropertyWithRelations, Appointment } from '@shared/types/app.types';
import type { z } from 'zod';

type Tab = 'favorites' | 'appointments' | 'saved_searches' | 'profile' | 'notifications';

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, logout, updateProfile } = useAuthStore();
  const { language } = useUIStore();
  const [tab, setTab] = useState<Tab>('favorites');
  const [favorites, setFavorites] = useState<PropertyWithRelations[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const profileForm = useForm<z.infer<typeof userProfileSchema>>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      full_name: user?.full_name ?? '',
      phone: user?.phone ?? '',
      preferred_language: (user?.preferred_language as 'ar' | 'en') ?? 'ar',
    },
  });

  if (!user) {
    return <Navigate to="/auth" state={{ from: '/profile' }} replace />;
  }

  useEffect(() => {
    if (tab === 'favorites') loadFavorites();
    if (tab === 'appointments') loadAppointments();
    if (tab === 'notifications') loadNotifications();
  }, [tab]);

  const loadFavorites = async () => {
    setLoadingData(true);
    const { data } = await supabase
      .from('favorites')
      .select(`
        property:properties(
          *,
          images:property_images(id, url, is_cover, sort_order),
          location:locations(id, name_ar, name_en, slug),
          category:categories(id, name_ar, name_en, slug, icon),
          agent:users(id, full_name, phone, avatar_url)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setFavorites((data?.map((f: any) => f.property) ?? []) as PropertyWithRelations[]);
    setLoadingData(false);
  };

  const loadAppointments = async () => {
    setLoadingData(true);
    const { data } = await supabase
      .from('appointments')
      .select(`
        *,
        property:properties(
          id, title_ar, title_en, slug,
          images:property_images(url, is_cover)
        )
      `)
      .eq('requester_id', user.id)
      .order('scheduled_at', { ascending: false });
    setAppointments((data ?? []) as Appointment[]);
    setLoadingData(false);
  };

  const loadNotifications = async () => {
    setLoadingData(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(data ?? []);
    setLoadingData(false);
  };

  const handleSaveProfile = async (data: z.infer<typeof userProfileSchema>) => {
    setSavingProfile(true);
    await updateProfile(data);
    setSavingProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const markNotificationRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'favorites', label: language === 'ar' ? 'المفضلة' : 'Favorites', icon: Heart },
    { id: 'appointments', label: t('appointment.title'), icon: Calendar },
    { id: 'notifications', label: language === 'ar' ? 'الإشعارات' : 'Notifications', icon: Bell },
    { id: 'profile', label: language === 'ar' ? 'الملف الشخصي' : 'Profile', icon: User },
  ];

  const appointmentStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
    confirmed: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    completed: 'bg-dark-100 text-dark-600 dark:bg-dark-700 dark:text-dark-400',
  };

  return (
    <>
      <SEO title={language === 'ar' ? 'حسابي' : 'My Account'} url="/profile" />

      <div className="pt-24 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Avatar src={user.avatar_url} name={user.full_name} size="lg" />
              <div>
                <h1 className="text-xl font-bold text-dark-900 dark:text-dark-100">{user.full_name}</h1>
                <p className="text-dark-500 text-sm">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-dark-500 hover:text-red-500 transition-colors text-sm"
            >
              <LogOut className="h-4 w-4" />
              {language === 'ar' ? 'تسجيل خروج' : 'Log Out'}
            </button>
          </div>

          {/* Tab nav */}
          <div className="flex gap-1 bg-dark-100 dark:bg-dark-800 rounded-xl p-1 mb-8 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${tab === t.id
                    ? 'bg-white dark:bg-dark-600 text-dark-900 dark:text-dark-100 shadow-sm'
                    : 'text-dark-500 hover:text-dark-700'
                  }
                `}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Favorites */}
          {tab === 'favorites' && (
            loadingData
              ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
                </div>
              : favorites.length === 0
                ? <div className="text-center py-16">
                    <Heart className="h-12 w-12 text-dark-300 mx-auto mb-3" />
                    <p className="text-dark-500">{language === 'ar' ? 'لا توجد عقارات في المفضلة' : 'No favorite properties yet'}</p>
                    <Link to="/properties" className="btn-primary mt-4">{t('nav.properties')}</Link>
                  </div>
                : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((p) => <PropertyCard key={p.id} property={p} />)}
                  </div>
          )}

          {/* Appointments */}
          {tab === 'appointments' && (
            loadingData
              ? <Skeleton className="h-48 w-full" />
              : appointments.length === 0
                ? <div className="text-center py-16">
                    <Calendar className="h-12 w-12 text-dark-300 mx-auto mb-3" />
                    <p className="text-dark-500">{language === 'ar' ? 'لا توجد مواعيد' : 'No appointments yet'}</p>
                  </div>
                : <div className="space-y-4">
                    {appointments.map((appt: any) => (
                      <div key={appt.id} className="bg-white dark:bg-dark-800 rounded-2xl p-5 shadow-card flex gap-4">
                        {appt.property?.images?.[0] && (
                          <img
                            src={appt.property.images.find((i: any) => i.is_cover)?.url ?? appt.property.images[0]?.url}
                            className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                            alt=""
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to={`/property/${appt.property?.slug}`}
                              className="font-semibold text-dark-900 dark:text-dark-100 hover:text-primary-500 line-clamp-1"
                            >
                              {appt.property ? getLocalizedText(appt.property.title_ar, appt.property.title_en, language) : '—'}
                            </Link>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${appointmentStatusColors[appt.status] ?? ''}`}>
                              {appt.status}
                            </span>
                          </div>
                          <p className="text-dark-500 text-sm mt-1">
                            {formatDate(appt.scheduled_at, language)}
                          </p>
                          {appt.notes && (
                            <p className="text-dark-400 text-xs mt-1 line-clamp-1">{appt.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            loadingData
              ? <Skeleton className="h-48 w-full" />
              : notifications.length === 0
                ? <div className="text-center py-16">
                    <Bell className="h-12 w-12 text-dark-300 mx-auto mb-3" />
                    <p className="text-dark-500">{language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p>
                  </div>
                : <div className="space-y-3">
                    {notifications.map((n: any) => (
                      <div
                        key={n.id}
                        onClick={() => !n.is_read && markNotificationRead(n.id)}
                        className={`
                          p-4 rounded-xl border cursor-pointer transition-colors
                          ${n.is_read
                            ? 'border-dark-100 dark:border-dark-700 bg-white dark:bg-dark-800'
                            : 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/20'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-dark-900 dark:text-dark-100 text-sm">
                            {getLocalizedText(n.title_ar, n.title_en, language)}
                          </p>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-dark-500 text-xs mt-1">
                          {getLocalizedText(n.body_ar, n.body_en, language)}
                        </p>
                        <p className="text-dark-400 text-xs mt-1">{formatDate(n.created_at, language)}</p>
                      </div>
                    ))}
                  </div>
          )}

          {/* Profile edit */}
          {tab === 'profile' && (
            <div className="max-w-lg">
              <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                    {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <input {...profileForm.register('full_name')} type="text" className="input-base" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                    {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <input {...profileForm.register('phone')} type="tel" className="input-base" dir="ltr" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                    {language === 'ar' ? 'اللغة المفضلة' : 'Preferred Language'}
                  </label>
                  <select {...profileForm.register('preferred_language')} className="input-base">
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-primary"
                >
                  {savingProfile
                    ? <Spinner size="sm" />
                    : profileSaved
                      ? <><Check className="h-4 w-4" /> {language === 'ar' ? 'تم الحفظ' : 'Saved'}</>
                      : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')
                  }
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
