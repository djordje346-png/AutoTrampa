'use client';

import { useEffect, useState } from 'react';
import { readJSON, writeJSON, type StorageResult } from '@/lib/storage';

/**
 * A module-level store backed by localStorage, shared by every component that
 * subscribes to it. Replaces the copy-pasted "global variable + Set of
 * listeners" blocks the hooks used to carry each on their own.
 *
 * Hydration rule: `get()` returns the SSR-safe initial value until some mounted
 * component calls `hydrate()` from an effect, so the first client render always
 * matches the server.
 */
export interface PersistentStore<T> {
  readonly key: string;
  get(): T;
  set(next: T | ((prev: T) => T)): StorageResult;
  subscribe(listener: (value: T) => void): () => void;
  hydrate(): void;
  /** Test/reset helper — drops hydration state without touching storage. */
  reset(): void;
}

export function createPersistentStore<T>(
  key: string,
  initial: T,
  /** Validate/repair whatever was in storage; return null to keep `initial`. */
  revive?: (raw: unknown) => T | null,
): PersistentStore<T> {
  let value = initial;
  let hydrated = false;
  const listeners = new Set<(value: T) => void>();

  function emit() {
    listeners.forEach((listener) => listener(value));
  }

  return {
    key,

    get: () => value,

    set(next) {
      const resolved =
        typeof next === 'function'
          ? (next as (prev: T) => T)(value)
          : next;
      if (Object.is(resolved, value)) return { ok: true };
      value = resolved;
      emit();
      return writeJSON(key, value);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    hydrate() {
      if (hydrated || typeof window === 'undefined') return;
      hydrated = true;
      const raw = readJSON<unknown>(key, undefined);
      if (raw === undefined) return;
      const next = revive ? revive(raw) : (raw as T);
      if (next === null || next === undefined) return;
      value = next;
      emit();
    },

    reset() {
      hydrated = false;
      value = initial;
      emit();
    },
  };
}

/**
 * Subscribe a component to a store.
 * `ready` is false during the first render pass so callers can hold back
 * localStorage-dependent UI until hydration finishes.
 */
export function usePersistentStore<T>(
  store: PersistentStore<T>,
): readonly [T, boolean] {
  const [value, setValue] = useState<T>(() => store.get());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = store.subscribe(setValue);
    store.hydrate();
    setValue(store.get());
    setReady(true);
    return unsubscribe;
  }, [store]);

  return [value, ready] as const;
}
