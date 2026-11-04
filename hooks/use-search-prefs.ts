'use client';

import { useCallback, useState } from 'react';
import { createPersistentStore, usePersistentStore } from '@/lib/persistent-store';
import type { BodyType, FuelType } from '@/types';

export type SortKey = 'trade' | 'price-asc' | 'price-desc' | 'year-desc';
export type TradeFilter = 'all' | 'similar' | 'cheaper' | 'expensive';

export interface SearchFilters {
  query: string;
  brand: string | null;
  model: string | null;
  bodyType: BodyType | null;
  fuelType: FuelType | null;
  /** Euros, inclusive. null = no lower bound. */
  priceMin: number | null;
  priceMax: number | null;
  yearMin: number | null;
  yearMax: number | null;
  /** Engine displacement in cubic centimetres (cm³), inclusive. */
  displacementMin: number | null;
  displacementMax: number | null;
  /** Legacy mileage settings retained only for compatibility with other consumers. */
  kmMin: number | null;
  kmMax: number | null;
  /** Trade filter; only meaningful with a garage car. */
  trade: TradeFilter;
  sortBy: SortKey;
}

export const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  brand: null,
  model: null,
  bodyType: null,
  fuelType: null,
  priceMin: null,
  priceMax: null,
  yearMin: null,
  yearMax: null,
  kmMin: null,
  kmMax: null,
  displacementMin: null,
  displacementMax: null,
  trade: 'all',
  sortBy: 'trade',
};

/** Filters that are "on", for the active-filter count and the reset button. */
export function countActiveFilters(filters: SearchFilters, includeQuery = false): number {
  let count = 0;
  if (filters.brand) count += 1;
  if (filters.model) count += 1;
  if (filters.bodyType) count += 1;
  if (filters.fuelType) count += 1;
  if (filters.priceMin != null || filters.priceMax != null) count += 1;
  if (filters.yearMin != null || filters.yearMax != null) count += 1;
  if (filters.displacementMin != null || filters.displacementMax != null) count += 1;
  if (filters.trade !== 'all') count += 1;
  if (includeQuery && filters.query.trim()) count += 1;
  return count;
}

interface Prefs {
  filters: SearchFilters;
}

const DEFAULT_PREFS: Prefs = { filters: DEFAULT_FILTERS };

const prefsStore = createPersistentStore<Prefs>('autotrampa_search_prefs', DEFAULT_PREFS, (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const stored = raw as { filters?: unknown; bodyType?: unknown; sortBy?: unknown };
  // The store used to hold flat `bodyType`/`sortBy` keys; fold them into the
  // filter object so nobody loses their choice on the first load after this.
  const legacy = stored.filters === undefined;
  const filters: SearchFilters = {
    ...DEFAULT_FILTERS,
    ...(typeof stored.filters === 'object' && stored.filters ? stored.filters : {}),
    ...(legacy && stored.bodyType ? { bodyType: stored.bodyType as BodyType } : {}),
    ...(legacy && typeof stored.sortBy === 'string' ? { sortBy: stored.sortBy as SortKey } : {}),
  };
  if (!filters.brand) filters.model = null;
  // Retire previously saved mileage criteria: they no longer belong to search.
  filters.kmMin = null;
  filters.kmMax = null;
  return { filters };
});

export function useSearchPrefs() {
  const [prefs, mounted] = usePersistentStore(prefsStore);
  // Modal visibility is transient UI state; never restore it after a page reload.
  const [filtersOpen, setFiltersOpen] = useState(false);

  const update = useCallback((patch: Partial<SearchFilters>) => {
    prefsStore.set((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        ...patch,
        ...('brand' in patch && patch.brand !== prev.filters.brand ? { model: null } : {}),
      },
    }));
  }, []);

  const reset = useCallback(() => {
    // Keep the chosen ordering: it is a view preference, not a filter.
    prefsStore.set((prev) => ({
      ...prev,
      filters: { ...DEFAULT_FILTERS, sortBy: prev.filters.sortBy },
    }));
  }, []);

  return {
    filters: prefs.filters,
    filtersOpen,
    setFiltersOpen,
    update,
    reset,
    mounted,
  };
}
