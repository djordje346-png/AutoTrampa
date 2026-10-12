'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUser } from '@/hooks/use-user';
import { createPersistentStore, usePersistentStore, type PersistentStore } from '@/lib/persistent-store';

export interface Preferences {
  /** Search radius in km. */
  radius: number;
  /** Preferred body types, stored as BodyType keys and displayed via labels. */
  bodyPrefs: string[];
  /** Hide phone number until both sides accept a swap. */
  phoneAfterMatch: boolean;
  /** Budget for top-up in EUR. null = not set. */
  budget: number | null;
  /** If true, user does not want to pay extra — hide cars where they'd add cash. */
  noTopUp: boolean;
}

type AccountLocalPreferences = Pick<Preferences, 'bodyPrefs' | 'phoneAfterMatch'>;
type PreferencePatch = Partial<Preferences>;

export const DEFAULT_PREFERENCES: Preferences = {
  radius: 50,
  bodyPrefs: ['Sedan', 'Caravan'],
  phoneAfterMatch: true,
  budget: null,
  noTopUp: false,
};

const DEFAULT_ACCOUNT_LOCAL: AccountLocalPreferences = {
  bodyPrefs: DEFAULT_PREFERENCES.bodyPrefs,
  phoneAfterMatch: DEFAULT_PREFERENCES.phoneAfterMatch,
};

/** Guest-only legacy store. Signed-in accounts never read or write this key. */
const guestPreferencesStore = createPersistentStore<Preferences>(
  'autotrampa_preferences',
  DEFAULT_PREFERENCES,
  (raw) =>
    raw && typeof raw === 'object'
      ? { ...DEFAULT_PREFERENCES, ...(raw as Partial<Preferences>) }
      : null,
);

const accountLocalStores = new Map<string, PersistentStore<AccountLocalPreferences>>();

function getAccountLocalStore(userId: string): PersistentStore<AccountLocalPreferences> {
  const existing = accountLocalStores.get(userId);
  if (existing) return existing;

  const store = createPersistentStore<AccountLocalPreferences>(
    `autotrampa_preferences_user_${userId}`,
    DEFAULT_ACCOUNT_LOCAL,
    (raw) =>
      raw && typeof raw === 'object'
        ? { ...DEFAULT_ACCOUNT_LOCAL, ...(raw as Partial<AccountLocalPreferences>) }
        : null,
  );
  accountLocalStores.set(userId, store);
  return store;
}

export function usePreferences() {
  const { userId, mounted: authReady } = useAuth();
  const { user, profileReady, updateProfilePreferences } = useUser();
  const [guestPreferences, guestReady] = usePersistentStore(guestPreferencesStore);
  const accountStore = userId ? getAccountLocalStore(userId) : null;
  const [accountSnapshot, setAccountSnapshot] = useState<{
    userId: string | null;
    value: AccountLocalPreferences;
  }>({ userId: null, value: DEFAULT_ACCOUNT_LOCAL });

  useEffect(() => {
    if (!userId || !accountStore) {
      setAccountSnapshot({ userId: null, value: DEFAULT_ACCOUNT_LOCAL });
      return;
    }

    const publish = (value: AccountLocalPreferences) => setAccountSnapshot({ userId, value });
    const unsubscribe = accountStore.subscribe(publish);
    accountStore.hydrate();
    publish(accountStore.get());
    return unsubscribe;
  }, [userId, accountStore]);

  const profileMatches = Boolean(userId && profileReady && user.id === userId);
  const accountLocal = userId && accountSnapshot.userId === userId
    ? accountSnapshot.value
    : DEFAULT_ACCOUNT_LOCAL;
  const preferences: Preferences = !authReady
    ? DEFAULT_PREFERENCES
    : !userId
      ? guestPreferences
      : profileMatches
        ? {
            ...DEFAULT_PREFERENCES,
            ...accountLocal,
            budget: user.budget,
            radius: user.searchRadius,
            noTopUp: user.noTopUp,
          }
        : DEFAULT_PREFERENCES;

  const update = useCallback(async (patch: PreferencePatch) => {
    if (!authReady) return { ok: false as const, message: 'Sačekaj da se prijava proveri.' };

    if (!userId) {
      const result = guestPreferencesStore.set((previous) => ({ ...previous, ...patch }));
      return result.ok
        ? { ok: true as const }
        : { ok: false as const, message: 'Preference nisu sačuvane u pregledaču.' };
    }

    if (!profileMatches || !accountStore) {
      return { ok: false as const, message: 'Profil još nije učitan. Pokušaj ponovo.' };
    }

    const localPatch: Partial<AccountLocalPreferences> = {};
    if ('bodyPrefs' in patch) localPatch.bodyPrefs = patch.bodyPrefs;
    if ('phoneAfterMatch' in patch) localPatch.phoneAfterMatch = patch.phoneAfterMatch;
    if (Object.keys(localPatch).length > 0) accountStore.set((previous) => ({ ...previous, ...localPatch }));

    const profilePatch: { budget?: number | null; searchRadius?: number; noTopUp?: boolean } = {};
    if ('budget' in patch) profilePatch.budget = patch.budget;
    if ('radius' in patch) profilePatch.searchRadius = patch.radius;
    if ('noTopUp' in patch) profilePatch.noTopUp = patch.noTopUp;

    if (Object.keys(profilePatch).length === 0) return { ok: true as const };
    return updateProfilePreferences(profilePatch);
  }, [accountStore, authReady, profileMatches, updateProfilePreferences, userId]);

  const toggleBodyPref = useCallback((type: string) => {
    if (userId) {
      getAccountLocalStore(userId).set((previous: AccountLocalPreferences) => {
        const bodyPrefs = previous.bodyPrefs;
        return {
          ...previous,
          bodyPrefs: bodyPrefs.includes(type)
            ? bodyPrefs.filter((item) => item !== type)
            : [...bodyPrefs, type],
        };
      });
      return;
    }

    guestPreferencesStore.set((previous: Preferences) => {
      const bodyPrefs = previous.bodyPrefs;
      return {
        ...previous,
        bodyPrefs: bodyPrefs.includes(type)
          ? bodyPrefs.filter((item) => item !== type)
          : [...bodyPrefs, type],
      };
    });
  }, [userId]);

  return {
    preferences,
    update,
    toggleBodyPref,
    mounted: authReady && (userId ? profileMatches : guestReady),
  };
}
