'use client';

import { useCallback } from 'react';
import {
  createMemoryStore,
  createPersistentStore,
  usePersistentStore,
} from '@/lib/persistent-store';
import { userStore, type UserProfile } from '@/hooks/use-user';

/**
 * Local-only session flag. Browsing is public; this only decides whether the
 * personal screens (garage, messages, profile) and the offer flow are usable.
 */
const authStore = createPersistentStore<boolean>('autotrampa_auth', false, (raw) =>
  typeof raw === 'boolean' ? raw : raw === 'true',
);

interface AuthPrompt {
  /** Context shown above the form ("Prijavi se da pošalješ ponudu"). */
  reason: string;
  /** The action that triggered the prompt, replayed once sign-in succeeds. */
  resume?: () => void;
}

/** null means the overlay is closed. */
const promptStore = createMemoryStore<AuthPrompt | null>(null);

export function openAuthPrompt(reason?: string, resume?: () => void) {
  promptStore.set({ reason: reason ?? '', resume });
}

export function closeAuthPrompt() {
  promptStore.set(null);
}

export function useAuth() {
  const [isLoggedIn, mounted] = usePersistentStore(authStore);
  const [prompt] = usePersistentStore(promptStore);

  const login = useCallback((profile?: Partial<UserProfile>) => {
    if (profile) {
      userStore.set((prev) => ({ ...prev, ...profile }));
    }
    authStore.set(true);

    // Carry out whatever the visitor was trying to do before we interrupted.
    const pending = promptStore.get();
    promptStore.set(null);
    pending?.resume?.();
  }, []);

  const logout = useCallback(() => {
    authStore.set(false);
  }, []);

  /**
   * Gate an action behind sign-in. Returns true when the caller may proceed;
   * otherwise opens the overlay and returns false. Pass `resume` and the action
   * runs by itself once the visitor signs in, so nothing is lost to the detour.
   */
  const requireAuth = useCallback(
    (reason?: string, resume?: () => void) => {
      if (isLoggedIn) return true;
      openAuthPrompt(reason, resume);
      return false;
    },
    [isLoggedIn],
  );

  return {
    isLoggedIn,
    mounted,
    login,
    logout,
    requireAuth,
    promptReason: prompt?.reason ?? null,
    promptOpen: prompt !== null,
    closePrompt: closeAuthPrompt,
  };
}
