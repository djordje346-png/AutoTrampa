'use client';

import { useCallback } from 'react';
import { createPersistentStore, usePersistentStore } from '@/lib/persistent-store';
import type { BodyType } from '@/types';

export type SortKey = 'trade' | 'price-asc' | 'price-desc' | 'year-desc';

export interface SearchPrefs {
  bodyType: BodyType | null;
  sortBy: SortKey;
}

/**
 * Body type and sort survive navigation and reloads; the free-text query
 * deliberately does not — a stale search term reappearing days later is worse
 * than retyping it.
 */
const DEFAULT_SEARCH_PREFS: SearchPrefs = { bodyType: null, sortBy: 'trade' };

const searchPrefsStore = createPersistentStore<SearchPrefs>(
  'autotrampa_search_prefs',
  DEFAULT_SEARCH_PREFS,
  (raw) =>
    raw && typeof raw === 'object'
      ? { ...DEFAULT_SEARCH_PREFS, ...(raw as Partial<SearchPrefs>) }
      : null,
);

export function useSearchPrefs() {
  const [prefs, mounted] = usePersistentStore(searchPrefsStore);

  const update = useCallback((patch: Partial<SearchPrefs>) => {
    searchPrefsStore.set((prev) => ({ ...prev, ...patch }));
  }, []);

  return { prefs, update, mounted };
}
