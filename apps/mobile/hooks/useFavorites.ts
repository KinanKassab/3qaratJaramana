import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { PropertyWithRelations } from '@shared/types/app.types';

const STORAGE_KEY = 'favorite_property_ids';

async function readFavoriteIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

async function writeFavoriteIds(ids: string[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useFavoriteIds() {
  return useQuery({
    queryKey: ['favorite-ids-mobile'],
    queryFn: async () => new Set(await readFavoriteIds()),
    staleTime: Infinity,
  });
}

export function useFavorites() {
  const { data: favoriteIds } = useFavoriteIds();

  return useQuery({
    queryKey: ['favorites-mobile', favoriteIds ? Array.from(favoriteIds).sort() : []],
    queryFn: async () => {
      const ids = Array.from(favoriteIds ?? []);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from('properties')
        .select(`*, images:property_images(*), location:locations(name_ar, name_en)`)
        .in('id', ids);
      if (error) throw error;
      return (data as PropertyWithRelations[]) ?? [];
    },
    enabled: Boolean(favoriteIds),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, isFavorite }: { propertyId: string; isFavorite: boolean }) => {
      const ids = new Set(await readFavoriteIds());
      if (isFavorite) ids.delete(propertyId);
      else ids.add(propertyId);
      await writeFavoriteIds(Array.from(ids));
      return ids;
    },
    onSuccess: (ids) => {
      queryClient.setQueryData(['favorite-ids-mobile'], ids);
      queryClient.invalidateQueries({ queryKey: ['favorites-mobile'] });
    },
  });
}
