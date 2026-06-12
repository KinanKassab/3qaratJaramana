import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@shared/types/app.types';

interface AuthState {
  user: User | null;
  session: any | null;
  initialized: boolean;
  initialize: () => void;
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  initialized: false,

  initialize() {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        set({ session, user: data as User ?? null, initialized: true });
      } else {
        set({ initialized: true });
      }
    });

    supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        set({ session, user: data as User ?? null });
      } else {
        set({ session: null, user: null });
      }
    });
  },

  async login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  },

  async register(email, password, fullName) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error };
  },

  async logout() {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
}));
