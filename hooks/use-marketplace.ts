'use client';

import { useEffect, useState } from 'react';
import { Car } from '@/types';
import { MARKETPLACE_CARS } from '@/lib/cars';
import { getSupabase } from '@/lib/supabase';
import { PUBLIC_CAR_ROW_COLUMNS, rowToCar, type CarRow } from '@/lib/car-row';
import { useAuth } from '@/hooks/use-auth';

/** Live listings, newest first, mixed with the local demo seed. */
const LISTING_LIMIT = 300;

// Keep the most recently loaded public feed in memory between App Router
// navigations. The cache is separated by account because signed-in feeds omit
// the current user's own cars.
const marketplaceCache = new Map<string, Car[]>();

interface MarketplaceSnapshot {
  key: string;
  cars: Car[];
  ready: boolean;
}

export function useMarketplace(enabled = true) {
  const { userId } = useAuth();
  const cacheKey = userId ?? 'anonymous';
  const [snapshot, setSnapshot] = useState<MarketplaceSnapshot>(() => {
    const cachedCars = marketplaceCache.get(cacheKey);
    return { key: cacheKey, cars: cachedCars ?? [], ready: cachedCars !== undefined };
  });

  useEffect(() => {
    const cachedCars = marketplaceCache.get(cacheKey);
    setSnapshot({ key: cacheKey, cars: cachedCars ?? [], ready: cachedCars !== undefined });

    if (!enabled) {
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        let query = getSupabase()
          .from('cars')
          .select(PUBLIC_CAR_ROW_COLUMNS)
          .order('created_at', { ascending: false })
          .limit(LISTING_LIMIT);
        // A user's own cars belong in the garage, not in the swap feed.
        if (userId) query = query.neq('user_id', userId);
        const { data, error } = await query;
        if (error) throw error;
        if (!cancelled) {
          const cars = ((data ?? []) as unknown as CarRow[]).map(rowToCar);
          marketplaceCache.set(cacheKey, cars);
          setSnapshot({ key: cacheKey, cars, ready: true });
        }
      } catch {
        if (!cancelled) {
          // Keep any valid cached feed on a temporary network error. If no
          // cache exists, mark the seed feed ready instead of flashing the
          // same skeletons every time the route is revisited.
          const fallbackCars = marketplaceCache.get(cacheKey) ?? [];
          marketplaceCache.set(cacheKey, fallbackCars);
          setSnapshot({ key: cacheKey, cars: fallbackCars, ready: true });
        }
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [cacheKey, enabled, userId]);

  // Derive from the current account key during render so changing accounts
  // never briefly shows another account's cached feed.
  const visibleSnapshot = snapshot.key === cacheKey
    ? snapshot
    : {
        key: cacheKey,
        cars: marketplaceCache.get(cacheKey) ?? [],
        ready: marketplaceCache.has(cacheKey),
      };

  return { cars: [...visibleSnapshot.cars, ...MARKETPLACE_CARS], ready: visibleSnapshot.ready };
}
