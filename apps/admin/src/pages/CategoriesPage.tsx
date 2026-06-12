import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/stores/uiStore';
import { Spinner } from '@/components/ui/Spinner';

interface CategoryForm {
  name_ar: string;
  name_en: string;
  slug: string;
  icon: string;
  sort_order: number;
}

const emptyForm: CategoryForm = { name_ar: '', name_en: '', slug: '', icon: 'building', sort_order: 0 };

export function CategoriesPage() {
  const { language } = useUIStore();
  const queryClient = useQueryClient();
  const isAr = language === 'ar';
  const [editId, setEditId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('sort_order');
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editId) {
        await supabase.from('categories').update(form).eq('id', editId);
      } else {
        await supabase.from('categories').insert(form);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setEditId(null);
      setAddingNew(false);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('categories').delete().eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
  });

  const startEdit = (cat: any) => {
    setEditId(cat.id);
    setForm({ name_ar: cat.name_ar, name_en: cat.name_en, slug: cat.slug, icon: cat.icon, sort_order: cat.sort_order });
    setAddingNew(false);
  };

  const cancelEdit = () => {
    setEditId(null);
    setAddingNew(false);
    setForm(emptyForm);
  };

  const FormRow = ({ isNew = false }: { isNew?: boolean }) => (
    <tr className="bg-primary-50 dark:bg-primary-950/20">
      <td className="table-cell"><input value={form.name_ar} onChange={e => setForm(p => ({ ...p, name_ar: e.target.value }))} className="input-base" placeholder="اسم بالعربية" dir="rtl" /></td>
      <td className="table-cell"><input value={form.name_en} onChange={e => setForm(p => ({ ...p, name_en: e.target.value }))} className="input-base" placeholder="English name" dir="ltr" /></td>
      <td className="table-cell"><input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} className="input-base" placeholder="slug" dir="ltr" /></td>
      <td className="table-cell"><input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} className="input-base" placeholder="icon" /></td>
      <td className="table-cell"><input value={form.sort_order} type="number" onChange={e => setForm(p => ({ ...p, sort_order: +e.target.value }))} className="input-base w-16" /></td>
      <td className="table-cell">
        <div className="flex gap-2">
          <button onClick={() => saveMutation.mutate()} className="btn-primary p-1.5" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Spinner size="sm" /> : <Check className="h-4 w-4" />}
          </button>
          <button onClick={cancelEdit} className="btn-outline p-1.5"><X className="h-4 w-4" /></button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-100">{isAr ? 'الفئات' : 'Categories'}</h1>
        <button onClick={() => { setAddingNew(true); setEditId(null); setForm(emptyForm); }} className="btn-primary">
          <Plus className="h-4 w-4" />{isAr ? 'إضافة فئة' : 'Add Category'}
        </button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-card overflow-hidden">
        {isLoading ? <div className="flex items-center justify-center h-32"><Spinner /></div> : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-100 dark:border-dark-700">
                {[isAr ? 'الاسم (ع)' : 'Name (AR)', isAr ? 'الاسم (إن)' : 'Name (EN)', 'Slug', isAr ? 'الأيقونة' : 'Icon', isAr ? 'الترتيب' : 'Order', isAr ? 'الإجراءات' : 'Actions'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
              {addingNew && <FormRow isNew />}
              {(categories ?? []).map((cat: any) => (
                editId === cat.id ? <FormRow key={cat.id} /> : (
                  <tr key={cat.id} className="hover:bg-dark-50 dark:hover:bg-dark-700/50">
                    <td className="table-cell font-medium">{cat.name_ar}</td>
                    <td className="table-cell">{cat.name_en}</td>
                    <td className="table-cell text-dark-400 text-xs font-mono">{cat.slug}</td>
                    <td className="table-cell text-dark-400 text-xs">{cat.icon}</td>
                    <td className="table-cell text-dark-400">{cat.sort_order}</td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(cat)} className="btn-ghost p-1.5"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => deleteMutation.mutate(cat.id)} className="btn-ghost p-1.5 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
