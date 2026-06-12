import type { TypedSupabaseClient } from '../client';

export function buildAdminPropertiesQuery(supabase: TypedSupabaseClient) {
  return supabase
    .from('properties')
    .select(
      `
      *,
      category:categories(id, name_ar, name_en, slug),
      location:locations(id, name_ar, name_en, slug),
      images:property_images(id, url, is_cover),
      agent:users!properties_agent_id_fkey(id, full_name, phone)
    `
    )
    .order('created_at', { ascending: false });
}

export function buildAdminUsersQuery(supabase: TypedSupabaseClient) {
  return supabase.from('users').select('*').order('created_at', { ascending: false });
}

export function buildAdminAppointmentsQuery(supabase: TypedSupabaseClient) {
  return supabase
    .from('appointments')
    .select(
      `
      *,
      property:properties(id, title_ar, title_en, slug),
      user:users!appointments_user_id_fkey(id, full_name, phone),
      agent:users!appointments_agent_id_fkey(id, full_name, phone)
    `
    )
    .order('scheduled_at', { ascending: false });
}

export async function getDashboardStats(supabase: TypedSupabaseClient) {
  const { data } = await supabase.rpc('get_dashboard_stats');
  return data;
}
