import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Location } from '@shared/types/app.types';

export function useLocations(type?: 'city' | 'district', parentId?: string) {
  return useQuery({
    queryKey: ['locations', type, parentId],
    queryFn: async () => {
      let query = supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (type) query = query.eq('type', type);
      if (parentId) query = query.eq('parent_id', parentId);

      const { data, error } = await query;
      if (error) throw error;
      return (data as Location[]) ?? [];
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useCities() {
  return useLocations('city');
}

export function useDistricts(cityId?: string) {
  return useQuery({
    queryKey: ['districts', cityId],
    queryFn: async () => {
      if (!cityId) return [];
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('type', 'district')
        .eq('parent_id', cityId)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data as Location[]) ?? [];
    },
    enabled: Boolean(cityId),
    staleTime: 30 * 60 * 1000,
  });
}
