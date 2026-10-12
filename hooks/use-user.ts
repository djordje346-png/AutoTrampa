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
const loadedProfiles = new Set<string>();
const profileRequests = new Map<string, Promise<void>>();

function profileFromAuth(user: NonNullable<ReturnType<typeof useAuth>['user']>): UserProfile {
  return {
    ...EMPTY_USER,
    id: user.id,
    name: typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : '',
    email: user.email ?? '',
    phone: '',
  };
}

/** Load each account profile once per browser session and share in-flight work. */
function ensureProfileLoaded(
  activeUser: NonNullable<ReturnType<typeof useAuth>['user']>,
): Promise<void> {
  const cached = userStore.get();
  if (loadedProfiles.has(activeUser.id) && cached.id === activeUser.id) return Promise.resolve();

  const inFlight = profileRequests.get(activeUser.id);
  if (inFlight) return inFlight;

  const fallback = profileFromAuth(activeUser);
  if (cached.id !== activeUser.id) userStore.set(fallback);

  const request = (async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('name,city,phone,rating,trade_count,verified')
      .eq('id', activeUser.id)
      .maybeSingle();
    if (error) throw error;

    if (data) {
      userStore.set({
        ...fallback,
        name: data.name ?? fallback.name,
        city: data.city ?? '',
        phone: data.phone ?? '',
        rating: Number(data.rating ?? 5),
        trades: Number(data.trade_count ?? 0),
        verified: Boolean(data.verified),
      });
      return;
    }

    // Email-confirmed signups may not have a profile row until their first sign-in.
    const { error: insertError } = await supabase.from('profiles').insert({
      id: activeUser.id,
      name: fallback.name,
      city: '',
      phone: fallback.phone,
    });
    if (insertError) throw insertError;
    userStore.set(fallback);
  })();

  profileRequests.set(activeUser.id, request);
  return request.then(
    () => { loadedProfiles.add(activeUser.id); },
    (error: unknown) => {
      throw error;
    },
  ).finally(() => {
    profileRequests.delete(activeUser.id);
  });
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
  const [profileError, setProfileError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!authReady) {
      setProfileReady(false);
      return;
    }
    if (!authUser) {
      userStore.set(EMPTY_USER);
      setProfileError('');
      setProfileReady(true);
      return;
    }

    const activeUser = authUser;
    if (loadedProfiles.has(activeUser.id) && userStore.get().id === activeUser.id) {
      setProfileError('');
      setProfileReady(true);
      return;
    }

    setProfileReady(false);
    setProfileError('');
    void ensureProfileLoaded(activeUser).then(() => {
      if (!cancelled) setProfileReady(true);
    }).catch((error: unknown) => {
      if (!cancelled) {
        const message = error instanceof Error ? error.message : 'Profil nije mogao da se učita.';
        setProfileError(message);
      }
    });
    return () => { cancelled = true; };
  }, [authReady, authUser, reloadKey]);

  const reloadProfile = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const updateUser = useCallback(async (patch: Partial<UserProfile>) => {
    const current = userStore.get();
    if (!current.id) return { ok: false as const, message: 'Profil još nije učitan. Pokušaj ponovo.' };

    const next = { ...current, ...patch };
    try {
      const { data, error } = await getSupabase().from('profiles').update({
        name: next.name,
        city: next.city,
        phone: next.phone,
      }).eq('id', current.id).select('id,phone').single();
      if (error) {
        console.error('Profil nije sačuvan u Supabase-u.', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return { ok: false as const, message: error.message || 'Supabase nije prihvatio izmene.' };
      }
      if (!data || data.id !== current.id || data.phone !== next.phone) {
        return { ok: false as const, message: 'Baza nije potvrdila sačuvan broj telefona.' };
      }
      userStore.set(next);
      return { ok: true as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Došlo je do greške pri čuvanju.';
      console.error('Profil nije sačuvan.', { message });
      return { ok: false as const, message };
    }
  }, []);

  return { user, updateUser, mounted: storeReady && authReady, profileReady, profileError, reloadProfile };
}
