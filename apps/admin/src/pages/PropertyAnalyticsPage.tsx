import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye, Heart, Calendar, MessageCircle, Share2, ArrowLeft, TrendingUp } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/stores/uiStore';
import { formatDate, getLocalizedText } from '@shared/utils/format';
import { Spinner } from '@/components/ui/Spinner';

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-1">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span className="text-dark-500 text-sm">{label}</span>
      </div>
      <p className="text-3xl font-bold text-dark-900 dark:text-dark-100 mt-2">{value.toLocaleString()}</p>
    </div>
  );
}

export function PropertyAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const { language } = useUIStore();
  const isAr = language === 'ar';

  const { data: property, isLoading: loadingProp } = useQuery({
    queryKey: ['property-detail', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, title_ar, title_en, images:property_images(url, is_cover)')
        .eq('id', id!)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['property-analytics', id],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_property_analytics', { p_property_id: id });
      return data as {
        total_views: number;
        unique_sessions: number;
        favorites_count: number;
        appointments_count: number;
        whatsapp_clicks: number;
        share_count: number;
      };
    },
    enabled: !!id,
  });

  const { data: viewsPerDay } = useQuery({
    queryKey: ['views-per-day', id],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_property_views_per_day', {
        p_property_id: id,
        p_days: 30,
      });
      return (data ?? []).map((row: any) => ({
        date: row.view_date?.slice(5) ?? '',
        views: row.view_count ?? 0,
      }));
    },
    enabled: !!id,
  });

  const { data: mostViewed } = useQuery({
    queryKey: ['most-viewed'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_most_viewed_properties', { p_limit: 10 });
      return data ?? [];
    },
  });

  const { data: appointmentsByLocation } = useQuery({
    queryKey: ['appointments-by-location'],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('property:properties(location:locations(name_ar, name_en))')
        .not('property', 'is', null);

      const counts: Record<string, { name: string; count: number }> = {};
      (data ?? []).forEach((a: any) => {
        const loc = a.property?.location;
        if (!loc) return;
        const name = isAr ? loc.name_ar : loc.name_en;
        if (!counts[name]) counts[name] = { name, count: 0 };
        counts[name].count++;
      });

      return Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    },
  });

  const isLoading = loadingProp || loadingAnalytics;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  const cover = property?.images?.find((i: any) => i.is_cover)?.url ?? property?.images?.[0]?.url;
  const title = property ? getLocalizedText(property.title_ar, property.title_en, language) : '';

  const statCards = [
    { icon: Eye, label: isAr ? 'إجمالي المشاهدات' : 'Total Views', value: analytics?.total_views ?? 0, color: 'bg-blue-500' },
    { icon: Eye, label: isAr ? 'جلسات فريدة' : 'Unique Sessions', value: analytics?.unique_sessions ?? 0, color: 'bg-indigo-500' },
    { icon: Heart, label: isAr ? 'المفضلة' : 'Favorites', value: analytics?.favorites_count ?? 0, color: 'bg-red-500' },
    { icon: Calendar, label: isAr ? 'المواعيد' : 'Appointments', value: analytics?.appointments_count ?? 0, color: 'bg-amber-500' },
    { icon: MessageCircle, label: isAr ? 'نقرات واتساب' : 'WhatsApp Clicks', value: analytics?.whatsapp_clicks ?? 0, color: 'bg-emerald-500' },
    { icon: Share2, label: isAr ? 'مشاركات' : 'Shares', value: analytics?.share_count ?? 0, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/properties" className="mt-1 p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-4 flex-1">
          {cover && (
            <img src={cover} alt={title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
          )}
          <div>
            <h1 className="text-xl font-bold text-dark-900 dark:text-dark-100">{title}</h1>
            <p className="text-dark-500 text-sm mt-0.5">
              {isAr ? 'تحليلات العقار' : 'Property Analytics'}
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Views over time */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-primary-500" />
          <h2 className="font-semibold text-dark-900 dark:text-dark-100">
            {isAr ? 'المشاهدات اليومية (آخر 30 يوماً)' : 'Daily Views (Last 30 Days)'}
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={viewsPerDay ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="views"
              name={isAr ? 'مشاهدات' : 'Views'}
              stroke="#C4A35A"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Two-column: most viewed + most requested locations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most viewed properties */}
        <div className="card">
          <h2 className="font-semibold text-dark-900 dark:text-dark-100 mb-5">
            {isAr ? 'أكثر العقارات مشاهدةً' : 'Most Viewed Properties'}
          </h2>
          <div className="space-y-3">
            {(mostViewed ?? []).map((p: any, idx: number) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-6 text-center text-sm font-bold text-dark-400">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/properties/${p.id}/analytics`}
                    className="text-sm font-medium text-dark-900 dark:text-dark-100 hover:text-primary-500 truncate block"
                  >
                    {isAr ? p.title_ar : (p.title_en ?? p.title_ar)}
                  </Link>
                </div>
                <div className="flex items-center gap-1 text-dark-500 text-sm flex-shrink-0">
                  <Eye className="h-3.5 w-3.5" />
                  {(p.view_count ?? 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most requested locations */}
        <div className="card">
          <h2 className="font-semibold text-dark-900 dark:text-dark-100 mb-5">
            {isAr ? 'أكثر المناطق طلباً' : 'Most Requested Areas'}
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={appointmentsByLocation ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar
                dataKey="count"
                name={isAr ? 'المواعيد' : 'Appointments'}
                fill="#1B3A5C"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
