'use client';

import { useCallback } from 'react';
import { createPersistentStore, usePersistentStore } from '@/lib/persistent-store';

export interface UserProfile {
  name: string;
  email: string;
  city: string;
  phone: string;
  /** Swaps completed — demo counter until there is a backend. */
  trades: number;
  rating: number;
  verified: boolean;
}

/** Seeded identity so the demo garage and its listings stay consistent. */
export const DEFAULT_USER: UserProfile = {
  name: 'Nikola Vukovic',
  email: 'nikola@example.com',
  city: 'Kosovska Mitrovica',
  phone: '+381 64 123 4567',
  trades: 12,
  rating: 4.9,
  verified: true,
};

export const userStore = createPersistentStore<UserProfile>(
  'autotrampa_user',
  DEFAULT_USER,
  (raw) =>
    raw && typeof raw === 'object'
      ? { ...DEFAULT_USER, ...(raw as Partial<UserProfile>) }
      : null,
);

/** "Nikola Vukovic" → "Nikola V." — how owners are shown on listings. */
export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Korisnik';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

export function useUser() {
  const [user, mounted] = usePersistentStore(userStore);

  const updateUser = useCallback((patch: Partial<UserProfile>) => {
    return userStore.set((prev) => ({ ...prev, ...patch }));
  }, []);

  return { user, updateUser, mounted };
}
