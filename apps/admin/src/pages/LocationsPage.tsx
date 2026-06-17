import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/stores/uiStore';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';

interface LocationFormData {
  name_ar: string;
  name_en: string;
  slug: string;
  type: 'city' | 'district';
  parent_id: string;
}

const emptyForm: LocationFormData = { name_ar: '', name_en: '', slug: '', type: 'city', parent_id: '' };

export function LocationsPage() {
  const { language } = useUIStore();
  const queryClient = useQueryClient();
  const isAr = language === 'ar';
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState<LocationFormData>(emptyForm);

  const { data: locations, isLoading } = useQuery({
    queryKey: ['admin-locations'],
    queryFn: async () => {
      const { data } = await supabase.from('locations').select('*').order('name_ar');
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('locations').insert({
        ...form,
        parent_id: form.parent_id || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
      setAddModal(false);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('locations').delete().eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-locations'] }),
  });

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const cities = (locations ?? []).filter((l: any) => l.type === 'city');
  const getDistricts = (cityId: string) => (locations ?? []).filter((l: any) => l.type === 'district' && l.parent_id === cityId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-100">{isAr ? 'المناطق' : 'Locations'}</h1>
        <button onClick={() => { setForm(emptyForm); setAddModal(true); }} className="btn-primary">
          <Plus className="h-4 w-4" />{isAr ? 'إضافة' : 'Add'}
        </button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-card overflow-hidden">
        {isLoading ? <div className="flex items-center justify-center h-32"><Spinner /></div> : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-100 dark:border-dark-700">
                {[isAr ? 'الاسم (ع)' : 'Name (AR)', isAr ? 'الاسم (إن)' : 'Name (EN)', isAr ? 'النوع' : 'Type', 'Slug', ''].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cities.map((city: any) => {
                const districts = getDistricts(city.id);
                const isExp = expanded.has(city.id);
                return (
                  <React.Fragment key={city.id}>
                    <tr className="hover:bg-dark-50 dark:hover:bg-dark-700/50 border-b border-dark-50 dark:border-dark-700">
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          {districts.length > 0 && (
                            <button onClick={() => toggleExpand(city.id)} className="text-dark-400">
                              {isExp ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            </button>
                          )}
                          <span className="font-medium text-dark-900 dark:text-dark-100">{city.name_ar}</span>
                        </div>
                      </td>
                      <td className="table-cell text-dark-500">{city.name_en}</td>
                      <td className="table-cell"><span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">{isAr ? 'مدينة' : 'City'}</span></td>
                      <td className="table-cell text-dark-400 text-xs font-mono">{city.slug}</td>
                      <td className="table-cell">
                        <button onClick={() => deleteMutation.mutate(city.id)} className="p-1.5 text-dark-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                    {isExp && districts.map((d: any) => (
                      <tr key={d.id} className="hover:bg-dark-50 dark:hover:bg-dark-700/50 border-b border-dark-50 dark:border-dark-700">
                        <td className="table-cell ps-10">
                          <span className="text-dark-700 dark:text-dark-300">{d.name_ar}</span>
                        </td>
                        <td className="table-cell text-dark-500">{d.name_en}</td>
                        <td className="table-cell"><span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-0.5 rounded-full">{isAr ? 'حي' : 'District'}</span></td>
                        <td className="table-cell text-dark-400 text-xs font-mono">{d.slug}</td>
                        <td className="table-cell">
                          <button onClick={() => deleteMutation.mutate(d.id)} className="p-1.5 text-dark-400 hover:text-red-500 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title={isAr ? 'إضافة موقع' : 'Add Location'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'النوع' : 'Type'}</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="city" checked={form.type === 'city'} onChange={() => setForm(p => ({ ...p, type: 'city', parent_id: '' }))} />
                <span>{isAr ? 'مدينة' : 'City'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="district" checked={form.type === 'district'} onChange={() => setForm(p => ({ ...p, type: 'district' }))} />
                <span>{isAr ? 'حي/منطقة' : 'District'}</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'الاسم (ع)' : 'Name AR'}</label>
              <input value={form.name_ar} onChange={e => setForm(p => ({ ...p, name_ar: e.target.value }))} className="input-base" dir="rtl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'الاسم (إن)' : 'Name EN'}</label>
              <input value={form.name_en} onChange={e => setForm(p => ({ ...p, name_en: e.target.value }))} className="input-base" dir="ltr" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Slug</label>
            <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} className="input-base" dir="ltr" placeholder={isAr ? 'مثال: jaramana' : 'e.g. jaramana'} />
          </div>

          {form.type === 'district' && (
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'المدينة' : 'City'}</label>
              <select value={form.parent_id} onChange={e => setForm(p => ({ ...p, parent_id: e.target.value }))} className="input-base" required>
                <option value="">{isAr ? 'اختر مدينة' : 'Select city'}</option>
                {cities.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name_ar}</option>
                ))}
              </select>
            </div>
          )}

          {saveMutation.isError && (
            <p className="text-red-500 text-sm">{(saveMutation.error as Error)?.message}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setAddModal(false)} className="btn-outline">{isAr ? 'إلغاء' : 'Cancel'}</button>
            <button onClick={() => saveMutation.mutate()} className="btn-primary" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Spinner size="sm" /> : (isAr ? 'إضافة' : 'Add')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
