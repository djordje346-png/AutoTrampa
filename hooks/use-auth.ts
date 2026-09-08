'use client';

import { useCallback } from 'react';
import { createPersistentStore, usePersistentStore } from '@/lib/persistent-store';
import { userStore, type UserProfile } from '@/hooks/use-user';

/**
 * Local-only session flag. There is no server yet — this gates the app shell
 * between AuthScreen and the real UI, and survives a reload.
 */
const authStore = createPersistentStore<boolean>('autotrampa_auth', false, (raw) =>
  typeof raw === 'boolean' ? raw : raw === 'true',
);

export function useAuth() {
  const [isLoggedIn, mounted] = usePersistentStore(authStore);

  const login = useCallback((profile?: Partial<UserProfile>) => {
    if (profile) {
      userStore.set((prev) => ({ ...prev, ...profile }));
    }
    authStore.set(true);
  }, []);

  const logout = useCallback(() => {
    authStore.set(false);
  }, []);

  return { isLoggedIn, mounted, login, logout };
}
