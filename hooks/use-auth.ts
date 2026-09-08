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

/**
 * Why the sign-in overlay was opened, shown as context above the form
 * ("Prijavi se da pošalješ ponudu"). null means the overlay is closed.
 */
const promptStore = createMemoryStore<string | null>(null);

export function openAuthPrompt(reason?: string) {
  promptStore.set(reason ?? '');
}

export function closeAuthPrompt() {
  promptStore.set(null);
}

export function useAuth() {
  const [isLoggedIn, mounted] = usePersistentStore(authStore);
  const [promptReason] = usePersistentStore(promptStore);

  const login = useCallback((profile?: Partial<UserProfile>) => {
    if (profile) {
      userStore.set((prev) => ({ ...prev, ...profile }));
    }
    authStore.set(true);
    promptStore.set(null);
  }, []);

  const logout = useCallback(() => {
    authStore.set(false);
  }, []);

  /**
   * Gate an action behind sign-in. Returns true when the caller may proceed;
   * otherwise opens the overlay and returns false.
   */
  const requireAuth = useCallback(
    (reason?: string) => {
      if (isLoggedIn) return true;
      openAuthPrompt(reason);
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
    promptReason,
    promptOpen: promptReason !== null,
    closePrompt: closeAuthPrompt,
  };
}
