import { createSupabaseClient } from '@shared/supabase/client';

// Cast to any: TS 5.9.3 + Supabase typed client causes .update()/.insert()/.rpc()
// parameter types to collapse to `never` across the codebase.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = createSupabaseClient(
  (import.meta as any).env.VITE_SUPABASE_URL,
  (import.meta as any).env.VITE_SUPABASE_ANON_KEY,
);
