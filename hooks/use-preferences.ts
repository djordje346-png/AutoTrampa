'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUser } from '@/hooks/use-user';
import { useActiveGarageCarId } from '@/hooks/use-garage';
import { getSupabase } from '@/lib/supabase';

export interface Preferences {
  radius: number;
  bodyPrefs: string[];
  favoriteModels: string[];
  prioritizeFavoriteModels: boolean;
  tradePreference: 'all' | 'similar' | 'cheaper' | 'expensive';
  minReceived: number;
  phoneAfterMatch: boolean;
  budget: number | null;
  noTopUp: boolean;
}
export type PreferencePatch = Partial<Preferences>;

export const DEFAULT_PREFERENCES: Preferences = {
  radius: 50,
  bodyPrefs: [],
  favoriteModels: [],
  prioritizeFavoriteModels: true,
  tradePreference: 'all',
  minReceived: 0,
  phoneAfterMatch: true,
  budget: null,
  noTopUp: false,
};

type SwapRow = {
  car_id: string;
  favorite_models: string[];
  trade_direction: Preferences['tradePreference'];
  max_top_up: number | string | null;
  no_top_up: boolean;
  min_received: number | string;
  radius_km: number;
  body_types: string[];
};

function parseRow(row: SwapRow, phoneAfterMatch: boolean): Preferences {
  return {
    ...DEFAULT_PREFERENCES,
    phoneAfterMatch,
    favoriteModels: Array.isArray(row.favorite_models) ? row.favorite_models : [],
    tradePreference: row.trade_direction,
    budget: row.max_top_up == null ? null : Number(row.max_top_up),
    noTopUp: Boolean(row.no_top_up),
    minReceived: Number(row.min_received ?? 0),
    radius: Number(row.radius_km ?? 50),
    bodyPrefs: Array.isArray(row.body_types) ? row.body_types : [],
  };
}

function serializePatch(patch: PreferencePatch) {
  const data: Record<string, unknown> = {};
  if (patch.favoriteModels !== undefined) data.favorite_models = patch.favoriteModels.slice(0, 5);
  if (patch.tradePreference !== undefined) data.trade_direction = patch.tradePreference;
  if (patch.budget !== undefined) data.max_top_up = patch.budget;
  if (patch.noTopUp !== undefined) data.no_top_up = patch.noTopUp;
  if (patch.minReceived !== undefined) data.min_received = patch.minReceived;
  if (patch.radius !== undefined) data.radius_km = patch.radius;
  if (patch.bodyPrefs !== undefined) data.body_types = patch.bodyPrefs;
  return data;
}

const CAR_FIELDS = 'car_id,favorite_models,trade_direction,max_top_up,no_top_up,min_received,radius_km,body_types';

export function usePreferences(explicitCarId?: string | null) {
  const { userId, mounted: authReady } = useAuth();
  const { user, profileReady, updateProfilePreferences } = useUser();
  const selectedId = useActiveGarageCarId();
  const carId = explicitCarId === undefined ? selectedId : explicitCarId;
  const profileMatches = Boolean(userId && profileReady && user.id === userId);
  const [snapshot, setSnapshot] = useState<{ key: string; value: Preferences; exists: boolean }>({
    key: '', value: DEFAULT_PREFERENCES, exists: false,
  });
  const [revision, setRevision] = useState(0);
  const key = userId && carId ? `${userId}:${carId}` : '';

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const changed = (event as CustomEvent<{ key: string }>).detail?.key;
      if (changed === key) setRevision(x => x + 1);
    };
    window.addEventListener('autotrampa:car-preferences', onUpdate);
    return () => window.removeEventListener('autotrampa:car-preferences', onUpdate);
  }, [key]);

  useEffect(() => {
    if (!key) {
      setSnapshot({ key: '', value: DEFAULT_PREFERENCES, exists: false });
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await getSupabase()
        .from('car_swap_preferences').select(CAR_FIELDS)
        .eq('car_id', carId!).eq('owner_id', userId!).maybeSingle();
      if (cancelled) return;
      if (error) {
        // A failed read must not be mistaken for a blank preference record.
        setSnapshot({ key: 'error', value: DEFAULT_PREFERENCES, exists: false });
        return;
      }
      setSnapshot({
        key, value: data ? parseRow(data as SwapRow, true) : DEFAULT_PREFERENCES,
        exists: Boolean(data),
      });
    })();
    return () => { cancelled = true; };
  }, [key, revision, carId, userId]);

  const loaded = !key || snapshot.key === key;
  const preferences: Preferences = {
    ...(key && loaded ? snapshot.value : DEFAULT_PREFERENCES),
    phoneAfterMatch: profileMatches ? user.phoneAfterMatch : true,
  };

  const update = useCallback(async (patch: PreferencePatch) => {
    if (!authReady || !profileMatches || !userId) {
      return { ok: false as const, message: 'Prijavi se i sačekaj učitavanje profila.' };
    }
    if ('phoneAfterMatch' in patch && patch.phoneAfterMatch !== undefined) {
      const result = await updateProfilePreferences({ phoneAfterMatch: patch.phoneAfterMatch });
      if (!result.ok) return result;
    }

    const fields = serializePatch(patch);
    if (Object.keys(fields).length === 0) return { ok: true as const };
    if (!carId) return { ok: false as const, message: 'Izaberi automobil za koji podešavaš preferencije.' };
    if (!loaded) return { ok: false as const, message: 'Preferencije se još učitavaju.' };

    const supabase = getSupabase();
    // Create a default row for legacy cars without overwriting an existing
    // row. The unique car_id constraint guards concurrent initializations.
    if (!snapshot.exists) {
      const { error: insertError } = await supabase.from('car_swap_preferences').upsert({
        car_id: carId, owner_id: userId,
      }, { onConflict: 'car_id', ignoreDuplicates: true });
      if (insertError) return { ok: false as const, message: 'Ne mogu da pripremim preferencije ovog auta.' };
    }
    const { data, error } = await supabase.from('car_swap_preferences')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('car_id', carId).eq('owner_id', userId).select('car_id').maybeSingle();
    if (error || !data) return { ok: false as const, message: 'Preferencije nisu sačuvane. Pokušaj ponovo.' };
    setSnapshot(previous => previous.key === key
      ? { key, exists: true, value: { ...previous.value, ...patch } }
      : previous);
    window.dispatchEvent(new CustomEvent('autotrampa:car-preferences', { detail: { key } }));
    return { ok: true as const };
  }, [authReady, profileMatches, userId, carId, loaded, snapshot.exists, key, updateProfilePreferences]);

  const toggleBodyPref = useCallback((type: string) => {
    const bodyPrefs = preferences.bodyPrefs.includes(type)
      ? preferences.bodyPrefs.filter(item => item !== type)
      : [...preferences.bodyPrefs, type];
    void update({ bodyPrefs });
  }, [preferences.bodyPrefs, update]);

  return {
    preferences,
    update,
    toggleBodyPref,
    carId,
    mounted: authReady && profileMatches && loaded,
  };
}
