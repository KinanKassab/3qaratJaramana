import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { buildUserFavoritesQuery } from '@shared/supabase/queries/users';

export function useFavorites() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await buildUserFavoritesQuery(supabase, user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(user),
  });
}

export function useFavoriteIds() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['favorite-ids', user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data, error } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return new Set((data ?? []).map((f: { property_id: string }) => f.property_id));
    },
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({ propertyId, isFavorite }: { propertyId: string; isFavorite: boolean }) => {
      if (!user) throw new Error('Must be logged in to favorite');

      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, property_id: propertyId });
        if (error) throw error;
      }
    },
    onMutate: async ({ propertyId, isFavorite }) => {
      if (!user) return;
      await queryClient.cancelQueries({ queryKey: ['favorite-ids', user.id] });
      const prev = queryClient.getQueryData<Set<string>>(['favorite-ids', user.id]);
      queryClient.setQueryData<Set<string>>(['favorite-ids', user.id], (old) => {
        const next = new Set(old ?? []);
        if (isFavorite) next.delete(propertyId);
        else next.add(propertyId);
        return next;
      });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (user && context?.prev) {
        queryClient.setQueryData(['favorite-ids', user.id], context.prev);
      }
    },
    onSettled: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['favorites', user.id] });
        queryClient.invalidateQueries({ queryKey: ['favorite-ids', user.id] });
      }
    },
  });
}
