'use client';

import { useEffect, useState } from 'react';
import { Car } from '@/types';
import { MARKETPLACE_CARS } from '@/lib/cars';
import { getSupabase } from '@/lib/supabase';
import { PUBLIC_CAR_ROW_COLUMNS, rowToCar, type CarRow } from '@/lib/car-row';
import { useAuth } from '@/hooks/use-auth';

/** Live listings, newest first, mixed with the local demo seed. */
const LISTING_LIMIT = 300;

export function useMarketplace() {
  const { userId } = useAuth();
  const [liveCars, setLiveCars] = useState<Car[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
        if (!cancelled) setLiveCars(((data ?? []) as unknown as CarRow[]).map(rowToCar));
      } catch {
        if (!cancelled) setLiveCars([]);
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    setReady(false);
    void load();
    return () => { cancelled = true; };
  }, [userId]);

  return { cars: [...liveCars, ...MARKETPLACE_CARS], ready };
}
