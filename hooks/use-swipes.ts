'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

type SwipeResponse = {
  matched: boolean;
  new_match: boolean;
  conversation_id?: string;
};

export function useSwipes() {
  const { userId } = useAuth();
  const [reviewed, setReviewed] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setReviewed(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from('car_swipes')
        .select('target_car_id,liked')
        .eq('user_id', userId);

      if (!error) {
        setReviewed(new Map((data ?? []).map((row) => [row.target_car_id, row.liked])));
      }
    } catch {
      // Keep the current list when an offline refresh fails.
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const recordSwipe = useCallback(async (
    targetCarId: string,
    offeredCarId: string | null,
    liked: boolean,
  ): Promise<{ ok: true; result: SwipeResponse } | { ok: false; message: string }> => {
    if (!userId) return { ok: false, message: 'Prijavi se da sačuvaš svoj lajk.' };

    try {
      const { data, error } = await getSupabase().rpc('swipe_car', {
        p_target_car_id: targetCarId,
        p_offered_car_id: offeredCarId,
        p_liked: liked,
      });
      if (error) return { ok: false, message: error.message };

      const result = data as SwipeResponse;
      setReviewed((previous) => new Map(previous).set(targetCarId, liked));
      return { ok: true, result };
    } catch {
      return { ok: false, message: 'Supabase nije dostupan.' };
    }
  }, [userId]);

  const resetPasses = useCallback(async () => {
    if (!userId) return true;
    try {
      const { error } = await getSupabase()
        .from('car_swipes')
        .delete()
        .eq('user_id', userId)
        .eq('liked', false);
      if (error) return false;
      setReviewed((previous) => new Map(Array.from(previous.entries()).filter(([, liked]) => liked)));
      return true;
    } catch {
      return false;
    }
  }, [userId]);

  return {
    reviewedCarIds: new Set(reviewed.keys()),
    loading,
    recordSwipe,
    resetPasses,
    refresh,
  };
}

