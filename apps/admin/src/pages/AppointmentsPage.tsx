import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/stores/uiStore';
import { formatDate, getLocalizedText } from '@shared/utils/format';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';

const PAGE_SIZE = 20;

const statusConfig: Record<string, { variant: any; ar: string; en: string }> = {
  pending: { variant: 'warning', ar: 'معلق', en: 'Pending' },
  confirmed: { variant: 'success', ar: 'مؤكد', en: 'Confirmed' },
  cancelled: { variant: 'danger', ar: 'ملغى', en: 'Cancelled' },
  completed: { variant: 'default', ar: 'منتهي', en: 'Completed' },
};

export function AppointmentsPage() {
  const { language } = useUIStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const isAr = language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-appointments', page, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          id, requester_name, requester_phone, scheduled_at, status, notes, created_at,
          property:properties(id, title_ar, title_en, slug),
          agent:users!appointments_agent_id_fkey(full_name)
        `, { count: 'exact' });

      if (statusFilter) query = query.eq('status', statusFilter);

      const { data, count } = await query
        .order('scheduled_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      return { data: data ?? [], total: count ?? 0, totalPages: Math.ceil((count ?? 0) / PAGE_SIZE) };
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from('appointments').update({ status }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-appointments'] }),
  });

  const exportCSV = () => {
    if (!data?.data.length) return;
    const rows = [
      ['Name', 'Phone', 'Property', 'Date', 'Status', 'Notes'],
      ...(data.data.map((a: any) => [
        a.requester_name,
        a.requester_phone,
        a.property ? getLocalizedText(a.property.title_ar, a.property.title_en, language) : '',
        new Date(a.scheduled_at).toLocaleString(),
        a.status,
        a.notes ?? '',
      ])),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appointments.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-100">
          {isAr ? 'المواعيد' : 'Appointments'}
        </h1>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-base w-auto text-sm"
          >
            <option value="">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
            {Object.entries(statusConfig).map(([k, v]) => (
              <option key={k} value={k}>{isAr ? v.ar : v.en}</option>
            ))}
          </select>
          <button onClick={exportCSV} className="btn-outline gap-2">
            <Download className="h-4 w-4" />
            CSV
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-100 dark:border-dark-700">
                  <th className="table-header">{isAr ? 'مقدم الطلب' : 'Requester'}</th>
                  <th className="table-header">{isAr ? 'العقار' : 'Property'}</th>
                  <th className="table-header">{isAr ? 'الوكيل' : 'Agent'}</th>
                  <th className="table-header">{isAr ? 'الموعد' : 'Date'}</th>
                  <th className="table-header">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="table-header">{isAr ? 'ملاحظات' : 'Notes'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
                {data?.data.map((a: any) => {
                  const sc = statusConfig[a.status];
                  return (
                    <tr key={a.id} className="hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors">
                      <td className="table-cell">
                        <p className="font-medium text-dark-900 dark:text-dark-100">{a.requester_name}</p>
                        <p className="text-xs text-dark-400" dir="ltr">{a.requester_phone}</p>
                      </td>
                      <td className="table-cell">
                        <p className="text-sm text-dark-700 dark:text-dark-300 line-clamp-1">
                          {a.property ? getLocalizedText(a.property.title_ar, a.property.title_en, language) : '—'}
                        </p>
                      </td>
                      <td className="table-cell text-dark-500 text-sm">
                        {a.agent?.full_name ?? '—'}
                      </td>
                      <td className="table-cell text-dark-500 text-xs">
                        {formatDate(a.scheduled_at, language)}
                      </td>
                      <td className="table-cell">
                        <select
                          value={a.status}
                          onChange={(e) => updateStatus.mutate({ id: a.id, status: e.target.value })}
                          className="text-xs border border-dark-200 dark:border-dark-600 rounded-lg px-2 py-1 bg-transparent"
                        >
                          {Object.entries(statusConfig).map(([k, v]) => (
                            <option key={k} value={k}>{isAr ? v.ar : v.en}</option>
                          ))}
                        </select>
                      </td>
                      <td className="table-cell text-dark-400 text-xs max-w-[150px] truncate">
                        {a.notes ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
