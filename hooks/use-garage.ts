'use client';

import { useCallback, useEffect, useState } from 'react';
import { MyGarageCar } from '@/types';
import { DEFAULT_GARAGE_CARS } from '@/lib/cars';
import { createPersistentStore, usePersistentStore } from '@/lib/persistent-store';
import type { StorageResult, StorageFailure } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

/** Free-tier cap. Enforced here, not just in the profile UI. */
export const GARAGE_LIMIT = 3;

/**
 * Invariant: the garage is never empty. Every screen compares listings against
 * `selectedCar`, so removing the last car is rejected rather than leaving the
 * app without a reference vehicle.
 */
const selectedStore = createPersistentStore<string>(
  'autotrampa_selected_car',
  DEFAULT_GARAGE_CARS[0].id,
  (raw) => (typeof raw === 'string' && raw ? raw : null),
);

export type GarageError = 'limit' | 'last-car' | 'duplicate' | 'network';

export type GarageResult =
  | { ok: true }
  | { ok: false; error: GarageError }
  | { ok: false; error: 'storage'; storage: { ok: false; reason: StorageFailure } };

function wrap(result: StorageResult): GarageResult {
  return result.ok ? { ok: true } : { ok: false, error: 'storage', storage: result };
}

/** Row shape in the Supabase `cars` table. */
interface CarRow {
  id: string;
  brand: string;
  model: string;
  generation: string | null;
  year: number;
  body_type: string;
  color: string | null;
  mileage: number;
  price: number;
  city: string | null;
  country: string | null;
  image: string | null;
  images: string[] | null;
  specs: Record<string, unknown> | null;
  owner: Record<string, unknown> | null;
  description: string | null;
  modifications: string[] | null;
  equipment: string[] | null;
  security_features: string[] | null;
  build_notes: string[] | null;
  estimated_value: number;
}

function rowToCar(row: CarRow): MyGarageCar {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    generation: row.generation ?? '-',
    year: row.year,
    bodyType: row.body_type as MyGarageCar['bodyType'],
    color: row.color ?? '-',
    mileage: row.mileage,
    price: row.price,
    city: row.city ?? '-',
    country: row.country ?? 'Serbia',
    image: row.image ?? '',
    images: row.images ?? undefined,
    specs: (row.specs ?? {}) as MyGarageCar['specs'],
    owner: (row.owner ?? {}) as MyGarageCar['owner'],
    description: row.description ?? '',
    modifications: row.modifications ?? undefined,
    equipment: row.equipment ?? undefined,
    securityFeatures: row.security_features ?? undefined,
    buildNotes: row.build_notes ?? undefined,
    estimatedValue: row.estimated_value,
  };
}

function carToRow(car: MyGarageCar): Omit<CarRow, 'created_at'> {
  return {
    id: car.id,
    brand: car.brand,
    model: car.model,
    generation: car.generation,
    year: car.year,
    body_type: car.bodyType,
    color: car.color,
    mileage: car.mileage,
    price: car.price,
    city: car.city,
    country: car.country,
    image: car.image,
    images: car.images ?? [car.image],
    specs: car.specs as unknown as Record<string, unknown>,
    owner: car.owner as unknown as Record<string, unknown>,
    description: car.description,
    modifications: car.modifications ?? [],
    equipment: car.equipment ?? [],
    security_features: car.securityFeatures ?? [],
    build_notes: car.buildNotes ?? [],
    estimated_value: car.estimatedValue,
  };
}

export function useGarage() {
  const [cars, setCars] = useState<MyGarageCar[]>(DEFAULT_GARAGE_CARS);
  const [loading, setLoading] = useState(true);
  const [selectedId, selectedReady] = usePersistentStore(selectedStore);

  // Fetch all garage cars from Supabase on mount.
  useEffect(() => {
    let cancelled = false;

    async function fetchCars() {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (error) {
        // Keep the default seed cars so the app stays usable offline.
        setLoading(false);
        return;
      }

      const rows = data as CarRow[];
      if (rows && rows.length > 0) {
        setCars(rows.map(rowToCar));
        // If the selected car no longer exists, fall back to the first one.
        const ids = rows.map((r) => r.id);
        if (!ids.includes(selectedStore.get())) {
          selectedStore.set(ids[0]);
        }
      }
      // If the table is empty, seed it with the default garage cars so the
      // trade feature has a reference vehicle to compare against.
      else if (rows && rows.length === 0) {
        await seedDefaults();
      }
      setLoading(false);
    }

    async function seedDefaults() {
      const inserts = DEFAULT_GARAGE_CARS.map(carToRow);
      const { error } = await supabase.from('cars').insert(inserts);
      if (!error && !cancelled) {
        setCars(DEFAULT_GARAGE_CARS);
      }
    }

    fetchCars();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectCar = useCallback((id: string) => {
    selectedStore.set(id);
  }, []);

  const addCar = useCallback(async (car: MyGarageCar): Promise<GarageResult> => {
    const current = cars;
    if (current.length >= GARAGE_LIMIT) return { ok: false, error: 'limit' };
    if (current.some((c) => c.id === car.id)) return { ok: false, error: 'duplicate' };

    const { error } = await supabase.from('cars').insert(carToRow(car));
    if (error) return { ok: false, error: 'network' };

    setCars((prev) => [...prev, car]);
    return { ok: true };
  }, [cars]);

  const updateCar = useCallback(async (car: MyGarageCar): Promise<GarageResult> => {
    const { error } = await supabase
      .from('cars')
      .update(carToRow(car))
      .eq('id', car.id);
    if (error) return { ok: false, error: 'network' };

    setCars((prev) => prev.map((c) => (c.id === car.id ? car : c)));
    return { ok: true };
  }, []);

  const removeCar = useCallback(async (id: string): Promise<GarageResult> => {
    const current = cars;
    if (current.length <= 1) return { ok: false, error: 'last-car' };

    const { error } = await supabase.from('cars').delete().eq('id', id);
    if (error) return { ok: false, error: 'network' };

    const next = current.filter((c) => c.id !== id);
    setCars(next);

    if (selectedStore.get() === id) {
      selectedStore.set(next[0].id);
    }
    return { ok: true };
  }, [cars]);

  const mounted = !loading && selectedReady;

  // cars is never empty (fallback to defaults while loading, removeCar keeps one)
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
