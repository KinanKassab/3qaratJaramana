import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, Users, Calendar, Eye, TrendingUp,
  CheckCircle2, Clock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/stores/uiStore';
import { formatDate } from '@shared/utils/format';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-dark-500 text-sm">{label}</p>
        <p className="text-2xl font-bold text-dark-900 dark:text-dark-100">{value}</p>
        {sub && <p className="text-xs text-dark-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { language } = useUIStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_dashboard_stats');
      return data as {
        total_properties: number;
        total_users: number;
        total_appointments: number;
        pending_appointments: number;
        total_views: number;
        new_properties_this_month: number;
        new_users_this_month: number;
      };
    },
  });

  const { data: recentProperties } = useQuery({
    queryKey: ['recent-properties'],
    queryFn: async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, title_ar, title_en, price, status, listing_type, created_at, images:property_images(url, is_cover)')
        .order('created_at', { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const { data: viewsChart } = useQuery({
    queryKey: ['views-chart'],
    queryFn: async () => {
      const { data } = await supabase
        .from('property_views')
        .select('viewed_at')
        .gte('viewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      const byDay: Record<string, number> = {};
      (data ?? []).forEach((v: any) => {
        const day = v.viewed_at.slice(0, 10);
        byDay[day] = (byDay[day] ?? 0) + 1;
      });
      return Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([date, views]) => ({ date: date.slice(5), views }));
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  const statCards = [
    { icon: Building2, label: language === 'ar' ? 'إجمالي العقارات' : 'Total Properties', value: stats?.total_properties ?? 0, sub: `+${stats?.new_properties_this_month ?? 0} ${language === 'ar' ? 'هذا الشهر' : 'this month'}`, color: 'bg-secondary-600' },
    { icon: Users, label: language === 'ar' ? 'المستخدمون' : 'Users', value: stats?.total_users ?? 0, sub: `+${stats?.new_users_this_month ?? 0} ${language === 'ar' ? 'هذا الشهر' : 'this month'}`, color: 'bg-blue-500' },
    { icon: Calendar, label: language === 'ar' ? 'المواعيد' : 'Appointments', value: stats?.total_appointments ?? 0, sub: `${stats?.pending_appointments ?? 0} ${language === 'ar' ? 'معلق' : 'pending'}`, color: 'bg-amber-500' },
    { icon: Eye, label: language === 'ar' ? 'إجمالي المشاهدات' : 'Total Views', value: stats?.total_views ?? 0, color: 'bg-emerald-500' },
  ];

  const statusVariants: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
    available: 'success',
    sold: 'danger',
    rented: 'info' as any,
    draft: 'default',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-100">
          {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
        </h1>
        <p className="text-dark-500 text-sm mt-1">
          {language === 'ar' ? 'مرحباً بك في لوحة إدارة عقارات جرمانا' : 'Welcome to 3qarat Jaramana admin panel'}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-dark-900 dark:text-dark-100 mb-4">
            {language === 'ar' ? 'المشاهدات (آخر 14 يوماً)' : 'Views (Last 14 Days)'}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={viewsChart ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="views" stroke="#C4A35A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-dark-900 dark:text-dark-100 mb-4">
            {language === 'ar' ? 'أحدث العقارات' : 'Recent Properties'}
          </h3>
          <div className="space-y-3">
            {(recentProperties ?? []).map((p: any) => {
              const cover = p.images?.find((i: any) => i.is_cover)?.url ?? p.images?.[0]?.url;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  {cover ? (
                    <img src={cover} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-dark-100 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-900 dark:text-dark-100 truncate">
                      {language === 'ar' ? p.title_ar : (p.title_en ?? p.title_ar)}
                    </p>
                    <p className="text-xs text-dark-400">{formatDate(p.created_at, language)}</p>
                  </div>
                  <Badge variant={statusVariants[p.status] ?? 'default'}>
                    {p.status}
                  </Badge>
                </div>
              );
            })}
          </div>
          <Link to="/properties" className="btn-ghost mt-4 w-full justify-center text-xs">
            {language === 'ar' ? 'عرض الكل' : 'View All'}
          </Link>
        </div>
      </div>
    </div>
  );
}
