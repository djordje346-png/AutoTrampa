'use client';

import { useCallback, useEffect, useState } from 'react';
import { createMemoryStore, usePersistentStore } from '@/lib/persistent-store';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  city: string;
  phone: string;
  trades: number;
  rating: number;
  verified: boolean;
}

const EMPTY_USER: UserProfile = {
  id: '', name: '', email: '', city: '', phone: '', trades: 0, rating: 5, verified: false,
};

/** In-memory only: profile and contact details must never leak between accounts. */
export const userStore = createMemoryStore<UserProfile>(EMPTY_USER);

function profileFromAuth(user: NonNullable<ReturnType<typeof useAuth>['user']>): UserProfile {
  return {
    ...EMPTY_USER,
    id: user.id,
    name: typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : '',
    email: user.email ?? '',
    phone: typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone : '',
  };
}

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
  const { user: authUser, mounted: authReady } = useAuth();
  const [user, storeReady] = usePersistentStore(userStore);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!authReady) {
      setProfileReady(false);
      return;
    }
    if (!authUser) {
      userStore.set(EMPTY_USER);
      setProfileReady(true);
      return;
    }

    setProfileReady(false);
    const activeUser = authUser;
    const fallback = profileFromAuth(activeUser);
    userStore.set(fallback);

    async function loadProfile() {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('profiles')
          .select('name,city,phone,rating,trade_count,verified')
          .eq('id', activeUser.id)
          .maybeSingle();
        if (error) throw error;

        if (data) {
          if (!data.phone && fallback.phone) {
            const { error: profileUpdateError } = await supabase.from('profiles').upsert({
              id: activeUser.id,
              name: data.name ?? fallback.name,
              city: data.city ?? '',
              phone: fallback.phone,
            });
            if (profileUpdateError) throw profileUpdateError;
          }
          if (!cancelled) {
            userStore.set({
              ...fallback,
              name: data.name ?? fallback.name,
              city: data.city ?? '',
              phone: data.phone || fallback.phone,
              rating: Number(data.rating ?? 5),
              trades: Number(data.trade_count ?? 0),
              verified: Boolean(data.verified),
            });
          }
          return;
        }

        // Email-confirmed signups cannot write a profile until the first sign-in.
        const { error: insertError } = await supabase.from('profiles').upsert({
          id: activeUser.id,
          name: fallback.name,
          city: '',
          phone: fallback.phone,
        });
        if (insertError) throw insertError;
        if (!cancelled) userStore.set(fallback);
      } catch {
        // Keep the Auth metadata fallback visible; writes still report errors.
      }
    }

    void loadProfile().finally(() => {
      if (!cancelled) setProfileReady(true);
    });
    return () => { cancelled = true; };
  }, [authReady, authUser]);

  const updateUser = useCallback(async (patch: Partial<UserProfile>) => {
    const current = userStore.get();
    if (!current.id) return { ok: false as const };

    const next = { ...current, ...patch };
    try {
      const { error } = await getSupabase().from('profiles').upsert({
        id: current.id,
        name: next.name,
        city: next.city,
        phone: next.phone,
      });
      if (error) return { ok: false as const };
      userStore.set(next);
      return { ok: true as const };
    } catch {
      return { ok: false as const };
    }
  }, []);

  return { user, updateUser, mounted: storeReady && authReady, profileReady };
}
