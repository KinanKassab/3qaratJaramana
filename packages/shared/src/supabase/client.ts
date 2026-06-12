import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

export type TypedSupabaseClient = SupabaseClient<Database>;

export function createSupabaseClient(url: string, anonKey: string, overrides?: Record<string, unknown>): TypedSupabaseClient {
  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'x-app-name': '3qarat-jaramana',
      },
    },
    ...overrides,
  });
}

export function createSupabaseAdminClient(url: string, serviceRoleKey: string): TypedSupabaseClient {
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
