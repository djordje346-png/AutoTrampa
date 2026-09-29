'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPersistentStore, usePersistentStore } from '@/lib/persistent-store';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

/**
 * Saved listing ids. Shared store rather than per-page state so the heart on
 * the feed, the detail page and the Saved tab never disagree.
 */
const savedStore = createPersistentStore<string[]>('autotrampa_saved', [], (raw) =>
  Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : null,
);

export function useSaved() {
  const [localSaved, localMounted] = usePersistentStore(savedStore);
  const { userId } = useAuth();
  const [remoteSaved, setRemoteSaved] = useState<string[]>([]);
  const [remoteReady, setRemoteReady] = useState(false);
  const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

  useEffect(() => {
    let cancelled = false;
    setRemoteSaved([]);
    if (!userId) {
      setRemoteReady(true);
      return;
    }
    setRemoteReady(false);
    void (async () => {
      try {
        const supabase = getSupabase();
        const guestIds = localSaved.filter(isUuid);
        if (guestIds.length) {
          const { error: migrateError } = await supabase.from('saved_cars').upsert(
            guestIds.map((car_id) => ({ user_id: userId, car_id })),
            { onConflict: 'user_id,car_id', ignoreDuplicates: true },
          );
          if (migrateError) throw migrateError;
          savedStore.set((previous) => previous.filter((id) => !isUuid(id)));
        }
        const { data, error } = await supabase.from('saved_cars').select('car_id').eq('user_id', userId);
        if (cancelled) return;
        setRemoteSaved(error ? [] : (data ?? []).map((row) => row.car_id));
        setRemoteReady(true);
      } catch {
        if (!cancelled) setRemoteReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [localSaved, userId]);

  const saved = Array.from(new Set([...(userId ? localSaved.filter((id) => !isUuid(id)) : localSaved), ...remoteSaved]));

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  const toggleSave = useCallback(async (id: string) => {
    let nowSaved = false;
    if (!isUuid(id)) {
      savedStore.set((prev) => {
        nowSaved = !prev.includes(id);
        return nowSaved ? [...prev, id] : prev.filter((x) => x !== id);
      });
      return nowSaved;
    }
    if (!userId) {
      savedStore.set((prev) => Array.from(new Set([...prev, id])));
      return true;
    }
    nowSaved = !remoteSaved.includes(id);
    const result = nowSaved
      ? await getSupabase().from('saved_cars').insert({ user_id: userId, car_id: id })
      : await getSupabase().from('saved_cars').delete().eq('user_id', userId).eq('car_id', id);
    if (result.error) return false;
    setRemoteSaved((prev) => nowSaved ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id));
    return nowSaved;
  }, [remoteSaved, userId]);

  const save = useCallback((id: string) => {
    if (!isUuid(id) || !userId) savedStore.set((prev) => (prev.includes(id) ? prev : [...prev, id]));
    else if (!remoteSaved.includes(id)) void getSupabase().from('saved_cars').insert({ user_id: userId, car_id: id }).then(({ error }) => { if (!error) setRemoteSaved((prev) => Array.from(new Set([...prev, id]))); });
  }, [remoteSaved, userId]);

  const remove = useCallback((id: string) => {
    if (!isUuid(id) || !userId) savedStore.set((prev) => prev.filter((x) => x !== id));
    else if (userId) void getSupabase().from('saved_cars').delete().eq('user_id', userId).eq('car_id', id).then(({ error }) => { if (!error) setRemoteSaved((prev) => prev.filter((x) => x !== id)); });
  }, [userId]);

  const clear = useCallback(() => {
    savedStore.set([]);
    if (userId) void getSupabase().from('saved_cars').delete().eq('user_id', userId).then(({ error }) => { if (!error) setRemoteSaved([]); });
    else setRemoteSaved([]);
  }, [userId]);

  return { saved, count: saved.length, isSaved, toggleSave, save, remove, clear, mounted: localMounted && remoteReady };
}
