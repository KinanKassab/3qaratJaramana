import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  buildPropertiesQuery,
  buildPropertyBySlugQuery,
  buildLatestPropertiesQuery,
} from '@shared/supabase/queries/properties';
import type { PropertyFilters, PropertyWithRelations } from '@shared/types/app.types';

export function useProperties(filters: PropertyFilters = {}) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: async () => {
      const { data, error, count } = await buildPropertiesQuery(supabase, filters);
      if (error) throw error;
      return {
        data: (data as PropertyWithRelations[]) ?? [],
        total: count ?? 0,
        page: filters.page ?? 1,
        per_page: filters.per_page ?? 12,
        total_pages: Math.ceil((count ?? 0) / (filters.per_page ?? 12)),
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useInfiniteProperties(filters: Omit<PropertyFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: ['properties-infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data, error, count } = await buildPropertiesQuery(supabase, {
        ...filters,
        page: pageParam as number,
        per_page: filters.per_page ?? 12,
      });
      if (error) throw error;
      return {
        data: (data as PropertyWithRelations[]) ?? [],
        total: count ?? 0,
        page: pageParam as number,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const perPage = filters.per_page ?? 12;
      const hasMore = lastPage.page * perPage < lastPage.total;
      return hasMore ? lastPage.page + 1 : undefined;
    },
  });
}

export function useProperty(slug: string) {
  return useQuery({
    queryKey: ['property', slug],
    queryFn: async () => {
      const { data, error } = await buildPropertyBySlugQuery(supabase, slug);
      if (error) throw error;
      return data as PropertyWithRelations;
    },
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLatestProperties(limit = 8) {
  return useQuery({
    queryKey: ['latest-properties', limit],
    queryFn: async () => {
      const { data, error } = await buildLatestPropertiesQuery(supabase, limit);
      if (error) throw error;
      return (data as PropertyWithRelations[]) ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useNearbyProperties(
  lat: number | null | undefined,
  lng: number | null | undefined,
  excludeId?: string
) {
  return useQuery({
    queryKey: ['nearby-properties', lat, lng, excludeId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_nearby_properties', {
        p_lat: lat!,
        p_lng: lng!,
        p_radius_km: 5,
        p_limit: 6,
        p_exclude_id: excludeId,
      });
      if (error) throw error;

      if (!data || data.length === 0) return [];

      const ids = data.map((r: { id: string }) => r.id);
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select(
          `*, category:categories(*), location:locations(*),
           images:property_images(id, url, is_cover, sort_order),
           agent:users!properties_agent_id_fkey(id, full_name, phone)`
        )
        .in('id', ids);

      if (propError) throw propError;
      return (properties as PropertyWithRelations[]) ?? [];
    },
    enabled: lat != null && lng != null,
    staleTime: 10 * 60 * 1000,
  });
}
