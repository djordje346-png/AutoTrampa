'use client';

import { useCallback } from 'react';
import { createPersistentStore, usePersistentStore } from '@/lib/persistent-store';
import type { BodyType, FuelType } from '@/types';

export type SortKey = 'trade' | 'price-asc' | 'price-desc' | 'year-desc';
export type TradeFilter = 'all' | 'similar' | 'cheaper' | 'expensive';

export interface SearchFilters {
  query: string;
  brand: string | null;
  bodyType: BodyType | null;
  fuelType: FuelType | null;
  /** Euros, inclusive. null = no lower bound. */
  priceMin: number | null;
  priceMax: number | null;
  yearMin: number | null;
  yearMax: number | null;
  /** Kilometres, inclusive. */
  kmMin: number | null;
  kmMax: number | null;
  /** Trade filter; only meaningful with a garage car. */
  trade: TradeFilter;
  sortBy: SortKey;
}

export const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  brand: null,
  bodyType: null,
  fuelType: null,
  priceMin: null,
  priceMax: null,
  yearMin: null,
  yearMax: null,
  kmMin: null,
  kmMax: null,
  trade: 'all',
  sortBy: 'trade',
};

/** Filters that are "on", for the active-filter count and the reset button. */
export function countActiveFilters(filters: SearchFilters, includeQuery = false): number {
  let count = 0;
  if (filters.brand) count += 1;
  if (filters.bodyType) count += 1;
  if (filters.fuelType) count += 1;
  if (filters.priceMin != null || filters.priceMax != null) count += 1;
  if (filters.yearMin != null || filters.yearMax != null) count += 1;
  if (filters.kmMin != null || filters.kmMax != null) count += 1;
  if (filters.trade !== 'all') count += 1;
  if (includeQuery && filters.query.trim()) count += 1;
  return count;
}

interface Prefs {
  filters: SearchFilters;
  /** Panels remember being open, so a reload does not silently drop a filter. */
  filtersOpen: boolean;
}

const DEFAULT_PREFS: Prefs = { filters: DEFAULT_FILTERS, filtersOpen: false };

const prefsStore = createPersistentStore<Prefs>('autotrampa_search_prefs', DEFAULT_PREFS, (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const stored = raw as { filters?: unknown; filtersOpen?: unknown; bodyType?: unknown; sortBy?: unknown };
  // The store used to hold flat `bodyType`/`sortBy` keys; fold them into the
  // filter object so nobody loses their choice on the first load after this.
  const legacy = stored.filters === undefined;
  const filters: SearchFilters = {
    ...DEFAULT_FILTERS,
    ...(typeof stored.filters === 'object' && stored.filters ? stored.filters : {}),
    ...(legacy && stored.bodyType ? { bodyType: stored.bodyType as BodyType } : {}),
    ...(legacy && typeof stored.sortBy === 'string' ? { sortBy: stored.sortBy as SortKey } : {}),
  };
  return { filters, filtersOpen: Boolean(stored.filtersOpen) };
});

export function useSearchPrefs() {
  const [prefs, mounted] = usePersistentStore(prefsStore);

  const update = useCallback((patch: Partial<SearchFilters>) => {
    prefsStore.set((prev) => ({ ...prev, filters: { ...prev.filters, ...patch } }));
  }, []);

  const reset = useCallback(() => {
    // Keep the chosen ordering: it is a view preference, not a filter.
    prefsStore.set((prev) => ({
      ...prev,
      filters: { ...DEFAULT_FILTERS, sortBy: prev.filters.sortBy },
    }));
  }, []);

  const setFiltersOpen = useCallback((open: boolean) => {
    prefsStore.set((prev) => ({ ...prev, filtersOpen: open }));
  }, []);

  return {
    filters: prefs.filters,
    filtersOpen: prefs.filtersOpen,
    setFiltersOpen,
    update,
    reset,
    mounted,
  };
}
