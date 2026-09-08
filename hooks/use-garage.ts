'use client';

import { useCallback } from 'react';
import { MyGarageCar } from '@/types';
import { DEFAULT_GARAGE_CARS } from '@/lib/cars';
import { createPersistentStore, usePersistentStore } from '@/lib/persistent-store';
import type { StorageResult, StorageFailure } from '@/lib/storage';

/** Free-tier cap. Enforced here, not just in the profile UI. */
export const GARAGE_LIMIT = 3;

/**
 * Invariant: the garage is never empty. Every screen compares listings against
 * `selectedCar`, so removing the last car is rejected rather than leaving the
 * app without a reference vehicle.
 */
const garageStore = createPersistentStore<MyGarageCar[]>(
  'autotrampa_garage',
  DEFAULT_GARAGE_CARS,
  (raw) =>
    Array.isArray(raw) && raw.length > 0 ? (raw as MyGarageCar[]) : null,
);

const selectedStore = createPersistentStore<string>(
  'autotrampa_selected_car',
  DEFAULT_GARAGE_CARS[0].id,
  (raw) => (typeof raw === 'string' && raw ? raw : null),
);

export type GarageError = 'limit' | 'last-car' | 'duplicate';

export type GarageResult =
  | { ok: true }
  | { ok: false; error: GarageError }
  | { ok: false; error: 'storage'; storage: { ok: false; reason: StorageFailure } };

function wrap(result: StorageResult): GarageResult {
  return result.ok ? { ok: true } : { ok: false, error: 'storage', storage: result };
}

export function useGarage() {
  const [cars, carsReady] = usePersistentStore(garageStore);
  const [selectedId, selectedReady] = usePersistentStore(selectedStore);

  const selectCar = useCallback((id: string) => {
    selectedStore.set(id);
  }, []);

  const addCar = useCallback((car: MyGarageCar): GarageResult => {
    const current = garageStore.get();
    if (current.length >= GARAGE_LIMIT) return { ok: false, error: 'limit' };
    if (current.some((c) => c.id === car.id)) return { ok: false, error: 'duplicate' };
    return wrap(garageStore.set([...current, car]));
  }, []);

  const updateCar = useCallback((car: MyGarageCar): GarageResult => {
    return wrap(
      garageStore.set((prev) => prev.map((c) => (c.id === car.id ? car : c))),
    );
  }, []);

  const removeCar = useCallback((id: string): GarageResult => {
    const current = garageStore.get();
    if (current.length <= 1) return { ok: false, error: 'last-car' };

    const next = current.filter((c) => c.id !== id);
    const result = garageStore.set(next);

    if (selectedStore.get() === id) {
      selectedStore.set(next[0].id);
    }
    return wrap(result);
  }, []);

  const mounted = carsReady && selectedReady;

  // cars is never empty (store revive rejects empty arrays, removeCar keeps one)
  const selectedCar =
    cars.find((c) => c.id === selectedId) ?? cars[0] ?? DEFAULT_GARAGE_CARS[0];

  return {
    cars,
    selectedCar,
    selectedId,
    selectCar,
    addCar,
    updateCar,
    removeCar,
    canAddCar: cars.length < GARAGE_LIMIT,
    remainingSlots: Math.max(0, GARAGE_LIMIT - cars.length),
    limit: GARAGE_LIMIT,
    mounted,
  };
}
