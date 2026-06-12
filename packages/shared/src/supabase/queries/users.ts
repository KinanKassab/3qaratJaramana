import type { TypedSupabaseClient } from '../client';

export function buildUserProfileQuery(supabase: TypedSupabaseClient, userId: string) {
  return supabase.from('users').select('*').eq('id', userId).single();
}

export function buildUserFavoritesQuery(supabase: TypedSupabaseClient, userId: string) {
  return supabase
    .from('favorites')
    .select(
      `
      *,
      property:properties(
        *,
        category:categories(*),
        location:locations(*),
        images:property_images(id, url, is_cover, sort_order),
        agent:users!properties_agent_id_fkey(id, full_name, phone)
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

export function buildUserAppointmentsQuery(supabase: TypedSupabaseClient, userId: string) {
  return supabase
    .from('appointments')
    .select(
      `
      *,
      property:properties(id, title_ar, title_en, slug, price, listing_type,
        images:property_images(url, is_cover)),
      agent:users!appointments_agent_id_fkey(id, full_name, phone, avatar_url)
    `
    )
    .eq('user_id', userId)
    .order('scheduled_at', { ascending: true });
}

export function buildUserNotificationsQuery(supabase: TypedSupabaseClient, userId: string) {
  return supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

export function buildSavedSearchesQuery(supabase: TypedSupabaseClient, userId: string) {
  return supabase
    .from('saved_searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}
