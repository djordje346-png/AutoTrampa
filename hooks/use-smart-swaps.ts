'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { getSerbianPlace } from '@/lib/city-coordinates';
import type { Car } from '@/types';
import type { Preferences } from '@/hooks/use-preferences';

type Candidate = { car_id: string; match_score: number };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Keep the active garage car's trade preferences on the server and retrieve
 * reciprocal candidates. The RPC checks both owners' model and money rules.
 * It is a recommendation only; a real Match still requires two likes.
 */
export function useSmartSwaps(
  myCar: Car | null,
  preferences: Preferences,
  userId: string | null,
  ready: boolean,
) {
  const [snapshot, setSnapshot] = useState<{ key: string; candidates: Candidate[] }>({ key: '', candidates: [] });
  const favoriteKey = JSON.stringify(preferences.favoriteModels);
  const bodiesKey = JSON.stringify(preferences.bodyPrefs);
  const key = [
    userId, myCar?.id, favoriteKey, bodiesKey, preferences.tradePreference,
    preferences.budget, preferences.noTopUp, preferences.radius, preferences.minReceived,
  ].join('|');

  useEffect(() => {
    if (!ready || !userId || !myCar || !UUID.test(myCar.id)) {
      setSnapshot({ key: '', candidates: [] });
      return;
    }
    let disposed = false;
    async function load() {
      const supabase = getSupabase();
      const city = getSerbianPlace(myCar!.city);
      // Only update city coordinates. Preferences belong to the selected car
      // and are saved by usePreferences; this hook must never overwrite them.
      if (preferences.favoriteModels.length === 0) {
        if (!disposed) setSnapshot({ key, candidates: [] });
        return;
      }
      await supabase.from('car_swap_preferences')
        .update({ city_lat: city?.latitude ?? null, city_lon: city?.longitude ?? null })
        .eq('car_id', myCar!.id).eq('owner_id', userId);
      const { data, error: searchError } = await supabase.rpc('find_smart_swaps', {
        p_my_car_id: myCar!.id, p_limit: 30,
      });
      if (!disposed) setSnapshot({
        key,
        candidates: searchError ? [] : ((data ?? []) as Candidate[]),
      });
    }
    void load();
    return () => { disposed = true; };
    // Keys are primitives to avoid rerunning because the preference object is recreated during render.
  }, [key, ready, userId, myCar?.id, favoriteKey, bodiesKey, preferences.tradePreference, preferences.budget, preferences.noTopUp, preferences.radius, preferences.minReceived]);

  const candidates = snapshot.key === key ? snapshot.candidates : [];
  const scoreById = useMemo(
    () => new Map(candidates.map(candidate => [candidate.car_id, candidate.match_score])),
    [candidates],
  );
  return { scoreById, count: candidates.length };
}
