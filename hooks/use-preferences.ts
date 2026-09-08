'use client';

import { useCallback } from 'react';
import { createPersistentStore, usePersistentStore } from '@/lib/persistent-store';

export interface Preferences {
  /** Search radius in km. */
  radius: number;
  /** Preferred body types, in Serbian as shown in Profil. */
  bodyPrefs: string[];
  /** Hide phone number until both sides accept a swap. */
  phoneAfterMatch: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  radius: 50,
  bodyPrefs: ['Limuzina', 'Karavan'],
  phoneAfterMatch: true,
};

const preferencesStore = createPersistentStore<Preferences>(
  'autotrampa_preferences',
  DEFAULT_PREFERENCES,
  (raw) =>
    raw && typeof raw === 'object'
      ? { ...DEFAULT_PREFERENCES, ...(raw as Partial<Preferences>) }
      : null,
);

export function usePreferences() {
  const [preferences, mounted] = usePersistentStore(preferencesStore);

  const update = useCallback((patch: Partial<Preferences>) => {
    preferencesStore.set((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleBodyPref = useCallback((type: string) => {
    preferencesStore.set((prev) => ({
      ...prev,
      bodyPrefs: prev.bodyPrefs.includes(type)
        ? prev.bodyPrefs.filter((t) => t !== type)
        : [...prev.bodyPrefs, type],
    }));
  }, []);

  return { preferences, update, toggleBodyPref, mounted };
}
