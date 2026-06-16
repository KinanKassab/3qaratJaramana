import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@shared/types/app.types';

interface AuthState {
  user: User | null;
  session: any | null;
  initialize: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,

  initialize() {
    const db = supabase as any;
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: any } }) => {
      if (session?.user) {
        const { data } = await db.from('users').select('*').eq('id', session.user.id).single();
        set({ session, user: (data as unknown as User) ?? null });
      }
    });

    supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (session?.user) {
        const { data } = await db.from('users').select('*').eq('id', session.user.id).single();
        set({ session, user: (data as unknown as User) ?? null });
      } else {
        set({ session: null, user: null });
      }
    });
  },

  async logout() {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
}));
