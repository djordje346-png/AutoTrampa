'use client';

import { useCallback } from 'react';
import { createPersistentStore, usePersistentStore } from '@/lib/persistent-store';

/**
 * Saved listing ids. Shared store rather than per-page state so the heart on
 * the feed, the detail page and the Saved tab never disagree.
 */
const savedStore = createPersistentStore<string[]>('autotrampa_saved', [], (raw) =>
  Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : null,
);

export function useSaved() {
  const [saved, mounted] = usePersistentStore(savedStore);

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  const toggleSave = useCallback((id: string) => {
    let nowSaved = false;
    savedStore.set((prev) => {
      nowSaved = !prev.includes(id);
      return nowSaved ? [...prev, id] : prev.filter((x) => x !== id);
    });
    return nowSaved;
  }, []);

  const save = useCallback((id: string) => {
    savedStore.set((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const remove = useCallback((id: string) => {
    savedStore.set((prev) => prev.filter((x) => x !== id));
  }, []);

  const clear = useCallback(() => {
    savedStore.set([]);
  }, []);

  return { saved, count: saved.length, isSaved, toggleSave, save, remove, clear, mounted };
}
