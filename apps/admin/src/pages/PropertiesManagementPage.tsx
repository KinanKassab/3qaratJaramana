import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Edit, Trash2, BarChart2, Star, Eye,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/stores/uiStore';
import { formatPrice, formatDate } from '@shared/utils/format';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';

const PAGE_SIZE = 15;

const statusMap: Record<string, { variant: any; label: string; labelEn: string }> = {
  available: { variant: 'success', label: 'متاح', labelEn: 'Available' },
  sold: { variant: 'danger', label: 'مباع', labelEn: 'Sold' },
  rented: { variant: 'info', label: 'مؤجر', labelEn: 'Rented' },
  draft: { variant: 'default', label: 'مسودة', labelEn: 'Draft' },
};

export function PropertiesManagementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useUIStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-properties', page, search, statusFilter, sortField, sortAsc],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select(`
          id, title_ar, title_en, slug, price, status, listing_type,
          is_featured, view_count, created_at, agent_id,
          images:property_images(url, is_cover),
          location:locations(name_ar, name_en),
          category:categories(name_ar, name_en)
        `, { count: 'exact' });

      if (search) {
        query = query.or(`title_ar.ilike.%${search}%,title_en.ilike.%${search}%`);
      }
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      query = query
        .order(sortField, { ascending: sortAsc })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      const { data, count } = await query;
      return { data: data ?? [], total: count ?? 0, totalPages: Math.ceil((count ?? 0) / PAGE_SIZE) };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('properties').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      setDeleteId(null);
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      await supabase.from('properties').update({ is_featured: value }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-properties'] }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from('properties').update({ status }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-properties'] }),
  });

  const handleSort = useCallback((field: string) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  }, [sortField, sortAsc]);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-100">
          {language === 'ar' ? 'إدارة العقارات' : 'Properties Management'}
        </h1>
        <Link to="/properties/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          {language === 'ar' ? 'إضافة عقار' : 'Add Property'}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
          <input
            type="text"
            placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-base ps-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-base w-auto"
        >
          <option value="">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
          {Object.entries(statusMap).map(([k, v]) => (
            <option key={k} value={k}>{language === 'ar' ? v.label : v.labelEn}</option>
          ))}
        </select>
        {data && (
          <span className="text-dark-500 text-sm ms-auto">
            {data.total} {language === 'ar' ? 'عقار' : 'properties'}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-100 dark:border-dark-700">
                  <th className="table-header">{language === 'ar' ? 'العقار' : 'Property'}</th>
                  <th className="table-header cursor-pointer hover:text-dark-700" onClick={() => handleSort('price')}>
                    <span className="flex items-center gap-1">{language === 'ar' ? 'السعر' : 'Price'}<SortIcon field="price" /></span>
                  </th>
                  <th className="table-header">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="table-header">{language === 'ar' ? 'النوع' : 'Type'}</th>
                  <th className="table-header cursor-pointer hover:text-dark-700" onClick={() => handleSort('view_count')}>
                    <span className="flex items-center gap-1">{language === 'ar' ? 'المشاهدات' : 'Views'}<SortIcon field="view_count" /></span>
                  </th>
                  <th className="table-header cursor-pointer hover:text-dark-700" onClick={() => handleSort('created_at')}>
                    <span className="flex items-center gap-1">{language === 'ar' ? 'التاريخ' : 'Date'}<SortIcon field="created_at" /></span>
                  </th>
                  <th className="table-header">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
                {data?.data.map((p: any) => {
                  const cover = p.images?.find((i: any) => i.is_cover)?.url ?? p.images?.[0]?.url;
                  const title = language === 'ar' ? p.title_ar : (p.title_en ?? p.title_ar);
                  const status = statusMap[p.status];
                  return (
                    <tr key={p.id} className="hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-3 min-w-0">
                          {cover ? (
                            <img src={cover} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt="" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-dark-100 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-dark-900 dark:text-dark-100 truncate max-w-[200px]">{title}</p>
                            <p className="text-xs text-dark-400 truncate">
                              {language === 'ar' ? p.location?.name_ar : p.location?.name_en}
                            </p>
                          </div>
                          {p.is_featured && <Star className="h-3.5 w-3.5 text-primary-500 flex-shrink-0" />}
                        </div>
                      </td>
                      <td className="table-cell font-medium" dir="ltr">
                        {formatPrice(p.price, language, 'SYP')}
                      </td>
                      <td className="table-cell">
                        <select
                          value={p.status}
                          onChange={(e) => updateStatus.mutate({ id: p.id, status: e.target.value })}
                          className="text-xs border border-dark-200 dark:border-dark-600 rounded-lg px-2 py-1 bg-transparent"
                        >
                          {Object.entries(statusMap).map(([k, v]) => (
                            <option key={k} value={k}>{language === 'ar' ? v.label : v.labelEn}</option>
                          ))}
                        </select>
                      </td>
                      <td className="table-cell">
                        <Badge variant={p.listing_type === 'sale' ? 'primary' : 'info'}>
                          {p.listing_type === 'sale'
                            ? (language === 'ar' ? 'بيع' : 'Sale')
                            : (language === 'ar' ? 'إيجار' : 'Rent')}
                        </Badge>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 text-dark-500">
                          <Eye className="h-3.5 w-3.5" />
                          {p.view_count}
                        </div>
                      </td>
                      <td className="table-cell text-dark-400 text-xs">
                        {formatDate(p.created_at, language)}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleFeatured.mutate({ id: p.id, value: !p.is_featured })}
                            className={`p-1.5 rounded-lg transition-colors ${p.is_featured ? 'text-primary-500 bg-primary-50 hover:bg-primary-100' : 'text-dark-400 hover:bg-dark-100'}`}
                            title={p.is_featured ? 'إلغاء التمييز' : 'تمييز'}
                          >
                            <Star className="h-4 w-4" />
                          </button>
                          <Link
                            to={`/properties/${p.id}/analytics`}
                            className="p-1.5 rounded-lg text-dark-400 hover:bg-dark-100 hover:text-secondary-600 transition-colors"
                            title="التحليلات"
                          >
                            <BarChart2 className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/properties/${p.id}/edit`}
                            className="p-1.5 rounded-lg text-dark-400 hover:bg-dark-100 hover:text-dark-700 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteId(p.id)}
                            className="p-1.5 rounded-lg text-dark-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
        size="sm"
      >
        <p className="text-dark-600 dark:text-dark-400 mb-6">
          {language === 'ar'
            ? 'هل أنت متأكد من حذف هذا العقار؟ لا يمكن التراجع عن هذا الإجراء.'
            : 'Are you sure you want to delete this property? This action cannot be undone.'}
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-outline">
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            className="btn-danger"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <Spinner size="sm" /> : (language === 'ar' ? 'حذف' : 'Delete')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
