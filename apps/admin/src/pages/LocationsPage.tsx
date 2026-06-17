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
  type: 'country' | 'city' | 'district';
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
      const { data } = await supabase.from('locations').select('*').order('type').order('name_ar');
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const countries = (locations ?? []).filter((l: any) => l.type === 'country');
  const getCities = (parentId: string) => (locations ?? []).filter((l: any) => l.type === 'city' && l.parent_id === parentId);
  const getDistricts = (parentId: string) => (locations ?? []).filter((l: any) => l.type === 'district' && l.parent_id === parentId);

  const LocationRow = ({ loc, depth = 0 }: { loc: any; depth?: number }) => {
    const children = loc.type === 'country' ? getCities(loc.id) : loc.type === 'city' ? getDistricts(loc.id) : [];
    const isExpanded = expanded.has(loc.id);
    return (
      <>
        <tr className="hover:bg-dark-50 dark:hover:bg-dark-700/50 border-b border-dark-50 dark:border-dark-700">
          <td className="table-cell" style={{ paddingInlineStart: `${16 + depth * 24}px` }}>
            <div className="flex items-center gap-2">
              {children.length > 0 && (
                <button onClick={() => toggleExpand(loc.id)} className="text-dark-400">
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              )}
              <span className="font-medium text-dark-900 dark:text-dark-100">{loc.name_ar}</span>
            </div>
          </td>
          <td className="table-cell text-dark-500">{loc.name_en}</td>
          <td className="table-cell"><span className="text-xs bg-dark-100 dark:bg-dark-700 px-2 py-0.5 rounded-full">{loc.type}</span></td>
          <td className="table-cell text-dark-400 text-xs font-mono">{loc.slug}</td>
          <td className="table-cell">
            <button
              onClick={() => deleteMutation.mutate(loc.id)}
              className="p-1.5 text-dark-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </td>
        </tr>
        {isExpanded && children.map((child: any) => (
          <LocationRow key={child.id} loc={child} depth={depth + 1} />
        ))}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-100">{isAr ? 'المناطق' : 'Locations'}</h1>
        <button onClick={() => setAddModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" />{isAr ? 'إضافة موقع' : 'Add Location'}
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
              {countries.map((country: any) => <LocationRow key={country.id} loc={country} />)}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title={isAr ? 'إضافة موقع' : 'Add Location'} size="sm">
        <div className="space-y-4">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} className="input-base" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'النوع' : 'Type'}</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))} className="input-base">
                <option value="country">Country</option>
                <option value="city">City</option>
                <option value="district">District</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'الموقع الأب' : 'Parent Location'}</label>
            <select value={form.parent_id} onChange={e => setForm(p => ({ ...p, parent_id: e.target.value }))} className="input-base">
              <option value="">{isAr ? 'بدون أب' : 'No Parent'}</option>
              {(locations ?? []).map((l: any) => (
                <option key={l.id} value={l.id}>{l.name_ar} ({l.type})</option>
              ))}
            </select>
          </div>
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
