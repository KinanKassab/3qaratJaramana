import { create } from 'zustand';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { User } from '@shared/types/app.types';

interface AuthState {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;

  setSession: (session: Session | null) => void;
  loadProfile: (userId: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    preferred_language?: 'ar' | 'en';
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  supabaseUser: null,
  session: null,
  loading: false,
  initialized: false,

  setSession: (session) => {
    set({ session, supabaseUser: session?.user ?? null });
  },

  loadProfile: async (userId: string) => {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    if (data) set({ user: data as User });
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } finally {
      set({ loading: false });
    }
  },

  register: async ({ email, password, full_name, phone, preferred_language = 'ar' }) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name, phone, preferred_language },
        },
      });
      if (error) throw error;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, supabaseUser: null, session: null });
  },

  updateProfile: async (data) => {
    const { user } = get();
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) throw error;
    set({ user: { ...user, ...data } });
  },

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();

    set({
      session,
      supabaseUser: session?.user ?? null,
      initialized: true,
    });

    if (session?.user) {
      await get().loadProfile(session.user.id);
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session, supabaseUser: session?.user ?? null });

      if (event === 'SIGNED_IN' && session?.user) {
        await get().loadProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        set({ user: null });
      }
    });
  },
}));
