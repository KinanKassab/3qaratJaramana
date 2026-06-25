import type { TypedSupabaseClient } from '../client';
import type { PropertyFilters } from '../../types/app.types';

export const PROPERTY_SELECT = `
  *,
  category:categories(*),
  location:locations(*),
  images:property_images(id, url, storage_path, is_cover, sort_order, created_at),
  videos:property_videos(id, video_url, title_ar, title_en, created_at),
  agent:users!properties_agent_id_fkey(id, full_name, full_name_ar, phone, avatar_url, role)
` as const;

export async function buildPropertiesQuery(
  supabase: TypedSupabaseClient,
  filters: PropertyFilters = {}
) {
  let query = supabase
    .from('properties')
    .select(PROPERTY_SELECT, { count: 'exact' });

  // Exclude drafts for public queries
  if (filters.status) {
    query = query.eq('status', filters.status);
  } else {
    query = query.neq('status', 'draft');
  }

  if (filters.category_id) {
    query = query.eq('category_id', filters.category_id);
  }

  if (filters.location_id) {
    // Check if this is a city (has district children); if so, include all districts
    const { data: children } = await supabase
      .from('locations')
      .select('id')
      .eq('parent_id', filters.location_id);

    if (children && children.length > 0) {
      query = query.in('location_id', [
        filters.location_id,
        ...children.map((c) => c.id),
      ]);
    } else {
      query = query.eq('location_id', filters.location_id);
    }
  }

  if (filters.listing_type) {
    query = query.eq('listing_type', filters.listing_type);
  }

  if (filters.min_price !== undefined) {
    query = query.gte('price', filters.min_price);
  }

  if (filters.max_price !== undefined) {
    query = query.lte('price', filters.max_price);
  }

  if (filters.min_area !== undefined) {
    query = query.gte('area', filters.min_area);
  }

  if (filters.max_area !== undefined) {
    query = query.lte('area', filters.max_area);
  }

  if (filters.bedrooms !== undefined) {
    query = query.gte('bedrooms', filters.bedrooms);
  }

  if (filters.bathrooms !== undefined) {
    query = query.gte('bathrooms', filters.bathrooms);
  }

  if (filters.is_featured === true) {
    query = query.eq('is_featured', true);
  }

  if (filters.search) {
    query = query.or(
      `title_ar.ilike.%${filters.search}%,title_en.ilike.%${filters.search}%,address_ar.ilike.%${filters.search}%,description_ar.ilike.%${filters.search}%`
    );
  }

  // Sorting
  const sortConfig: Record<string, { column: string; ascending: boolean }> = {
    price_asc: { column: 'price', ascending: true },
    price_desc: { column: 'price', ascending: false },
    newest: { column: 'created_at', ascending: false },
    oldest: { column: 'created_at', ascending: true },
    views: { column: 'view_count', ascending: false },
  };

  const sort = sortConfig[filters.sort_by ?? 'newest'];
  query = query.order(sort.column, { ascending: sort.ascending });

  // Featured properties first (secondary sort)
  if (!filters.sort_by || filters.sort_by === 'newest') {
    query = query.order('is_featured', { ascending: false });
  }

  // Pagination
  const page = filters.page ?? 1;
  const perPage = filters.per_page ?? 12;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  query = query.range(from, to);

  return query;
}

export function buildPropertyBySlugQuery(supabase: TypedSupabaseClient, slug: string) {
  return supabase
    .from('properties')
    .select(PROPERTY_SELECT)
    .eq('slug', slug)
    .single();
}

export function buildFeaturedPropertiesQuery(supabase: TypedSupabaseClient, limit = 8) {
  return supabase
    .from('properties')
    .select(PROPERTY_SELECT)
    .eq('is_featured', true)
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(limit);
}

export function buildLatestPropertiesQuery(supabase: TypedSupabaseClient, limit = 8) {
  return supabase
    .from('properties')
    .select(PROPERTY_SELECT)
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(limit);
}
