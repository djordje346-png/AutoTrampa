'use client';

import { useCallback, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { createMemoryStore, usePersistentStore } from '@/lib/persistent-store';
import { getSupabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  ready: boolean;
  error: string | null;
}

interface AuthPrompt {
  reason: string;
  resume?: () => void;
}

export type AuthResult =
  | { ok: true; needsEmailConfirmation?: boolean }
  | { ok: false; message: string };

const authStore = createMemoryStore<AuthState>({ user: null, ready: false, error: null });
const promptStore = createMemoryStore<AuthPrompt | null>(null);
let authSubscriptionStarted = false;

export function openAuthPrompt(reason?: string, resume?: () => void) {
  promptStore.set({ reason: reason ?? '', resume });
}

export function closeAuthPrompt() {
  promptStore.set(null);
}

function initializeAuth() {
  if (authSubscriptionStarted) return;
  authSubscriptionStarted = true;

  try {
    const supabase = getSupabase();
    supabase.auth.onAuthStateChange((_event, session) => {
      authStore.set({ user: session?.user ?? null, ready: true, error: null });
      if (!session) return;
      const pending = promptStore.get();
      promptStore.set(null);
      pending?.resume?.();
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      authStore.set({ user: data.session?.user ?? null, ready: true, error: error?.message ?? null });
    }).catch((error: unknown) => {
      authStore.set({
        user: null,
        ready: true,
        error: error instanceof Error ? error.message : 'Sesija nije mogla da se proveri.',
      });
    });
  } catch (error) {
    authStore.set({
      user: null,
      ready: true,
      error: error instanceof Error ? error.message : 'Supabase nije podešen.',
    });
  }
}

export function useAuth() {
  const [auth, authStoreReady] = usePersistentStore(authStore);
  const [prompt] = usePersistentStore(promptStore);

  useEffect(() => {
    initializeAuth();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      return error ? { ok: false, message: error.message } : { ok: true };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Prijava nije uspela.' };
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return error ? { ok: false, message: error.message } : { ok: true };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Google prijava nije uspela.' };
    }
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    name: string,
    phone: string,
  ): Promise<AuthResult> => {
    try {
      const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
        options: { data: { name, phone } },
      });
      if (error) return { ok: false, message: error.message };
      return { ok: true, needsEmailConfirmation: !data.session };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Registracija nije uspela.' };
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: typeof window === 'undefined' ? undefined : `${window.location.origin}/auth/update-password`,
      });
      return error ? { ok: false, message: error.message } : { ok: true };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Slanje linka nije uspelo.' };
    }
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    try {
      const { error } = await getSupabase().auth.updateUser({ password });
      return error ? { ok: false, message: error.message } : { ok: true };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Promena lozinke nije uspela.' };
    }
  }, []);

  const logout = useCallback(async (): Promise<AuthResult> => {
    try {
      const { error } = await getSupabase().auth.signOut();
      return error ? { ok: false, message: error.message } : { ok: true };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Odjava nije uspela.' };
    }
  }, []);

  const requireAuth = useCallback(
    (reason?: string, resume?: () => void) => {
      if (auth.user) return true;
      openAuthPrompt(reason, resume);
      return false;
    },
    [auth.user],
  );

  return {
    user: auth.user,
    userId: auth.user?.id ?? null,
    isLoggedIn: Boolean(auth.user),
    mounted: authStoreReady && auth.ready,
    error: auth.error,
    signIn,
    signInWithGoogle,
    signUp,
    resetPassword,
    updatePassword,
    logout,
    requireAuth,
    promptReason: prompt?.reason ?? null,
    promptOpen: prompt !== null,
    closePrompt: closeAuthPrompt,
  };
}
