import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCheck, UserX } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/stores/uiStore';
import { formatDate } from '@shared/utils/format';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';

const PAGE_SIZE = 20;

const roleVariants: Record<string, any> = {
  admin: 'danger',
  agent: 'primary',
  user: 'default',
};

export function UsersPage() {
  const { language } = useUIStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const isAr = language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('id, full_name, email, phone, role, is_active, created_at, preferred_language', { count: 'exact' });

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      return { data: data ?? [], total: count ?? 0, totalPages: Math.ceil((count ?? 0) / PAGE_SIZE) };
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      await supabase.from('users').update({ role }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await supabase.from('users').update({ is_active }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-100">
          {isAr ? 'المستخدمون' : 'Users'}
        </h1>
        {data && (
          <span className="text-dark-500 text-sm">{data.total} {isAr ? 'مستخدم' : 'users'}</span>
        )}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
        <input
          type="text"
          placeholder={isAr ? 'بحث...' : 'Search...'}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input-base ps-9"
        />
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-100 dark:border-dark-700">
                  <th className="table-header">{isAr ? 'المستخدم' : 'User'}</th>
                  <th className="table-header">{isAr ? 'الدور' : 'Role'}</th>
                  <th className="table-header">{isAr ? 'الهاتف' : 'Phone'}</th>
                  <th className="table-header">{isAr ? 'اللغة' : 'Language'}</th>
                  <th className="table-header">{isAr ? 'التاريخ' : 'Joined'}</th>
                  <th className="table-header">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
                {data?.data.map((u: any) => (
                  <tr key={u.id} className="hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-dark-900 dark:text-dark-100">{u.full_name}</p>
                        <p className="text-xs text-dark-400" dir="ltr">{u.email}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <select
                        value={u.role}
                        onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value })}
                        className="text-xs border border-dark-200 dark:border-dark-600 rounded-lg px-2 py-1 bg-transparent"
                      >
                        <option value="user">{isAr ? 'مستخدم' : 'User'}</option>
                        <option value="agent">{isAr ? 'وكيل' : 'Agent'}</option>
                        <option value="admin">{isAr ? 'مدير' : 'Admin'}</option>
                      </select>
                    </td>
                    <td className="table-cell text-dark-500 text-xs" dir="ltr">{u.phone ?? '—'}</td>
                    <td className="table-cell">
                      <span className="text-xs text-dark-500">{u.preferred_language === 'ar' ? 'العربية' : 'English'}</span>
                    </td>
                    <td className="table-cell text-dark-400 text-xs">{formatDate(u.created_at, language)}</td>
                    <td className="table-cell">
                      <button
                        onClick={() => toggleActive.mutate({ id: u.id, is_active: !u.is_active })}
                        className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                          u.is_active ? 'text-emerald-600 hover:text-emerald-700' : 'text-red-500 hover:text-red-600'
                        }`}
                      >
                        {u.is_active
                          ? <><UserCheck className="h-3.5 w-3.5" />{isAr ? 'نشط' : 'Active'}</>
                          : <><UserX className="h-3.5 w-3.5" />{isAr ? 'موقوف' : 'Inactive'}</>
                        }
                      </button>
                    </td>
                  </tr>
                ))}
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
