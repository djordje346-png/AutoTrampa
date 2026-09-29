'use client';

import { useCallback, useEffect, useState } from 'react';
import { MyGarageCar } from '@/types';
import { DEFAULT_GARAGE_CARS } from '@/lib/cars';
import { createPersistentStore, usePersistentStore } from '@/lib/persistent-store';
import type { StorageFailure } from '@/lib/storage';
import { getSupabase } from '@/lib/supabase';
import { storedCarImagePaths, uploadCarImages } from '@/lib/car-images';
import { useAuth } from '@/hooks/use-auth';
import { shortName, userStore } from '@/hooks/use-user';

export const GARAGE_LIMIT = 3;

const selectedStore = createPersistentStore<string>(
  'autotrampa_selected_car',
  DEFAULT_GARAGE_CARS[0].id,
  (raw) => (typeof raw === 'string' && raw ? raw : null),
);

export type GarageError = 'limit' | 'last-car' | 'duplicate' | 'network';
export type GarageResult =
  | { ok: true; id?: string }
  | { ok: false; error: GarageError }
  | { ok: false; error: 'storage'; storage: { ok: false; reason: StorageFailure } };

interface CarRow {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  generation: string | null;
  year: number;
  body_type: string;
  color: string | null;
  mileage: number;
  price: number | string;
  city: string | null;
  country: string | null;
  image: string | null;
  images: string[] | null;
  specs: Record<string, unknown> | null;
  features: Record<string, unknown> | null;
  equipment: string[] | null;
  modifications: string | null;
  description: string | null;
  estimated_value: number | string | null;
  security_features: string[] | null;
  build_notes: string[] | null;
  owner_name: string | null;
  owner_city: string | null;
  owner_rating: number | string | null;
}

function parseList(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    // Older rows used free text, one item per line.
  }
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function rowToCar(row: CarRow): MyGarageCar {
  const profile = userStore.get();
  const features = row.features ?? {};
  const strings = (key: string) => {
    const value = features[key];
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  };
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    generation: row.generation ?? '-',
    year: row.year,
    bodyType: row.body_type as MyGarageCar['bodyType'],
    color: row.color ?? '-',
    mileage: row.mileage,
    price: Number(row.price ?? 0),
    city: row.city ?? '-',
    country: row.country ?? 'Serbia',
    image: row.image ?? '',
    images: row.images ?? undefined,
    specs: (row.specs ?? {}) as unknown as MyGarageCar['specs'],
    owner: {
      name: row.owner_name ?? profile.name,
      // The profiles table is private; only put the current user's number in their own garage.
      phone: profile.id === row.user_id ? profile.phone : '',
      city: row.owner_city ?? row.city ?? profile.city,
      rating: Number(row.owner_rating ?? 5),
    },
    description: row.description ?? '',
    modifications: parseList(row.modifications),
    equipment: row.equipment ?? undefined,
    securityFeatures: row.security_features ?? strings('securityFeatures'),
    buildNotes: row.build_notes ?? strings('buildNotes'),
    estimatedValue: Number(row.estimated_value ?? 0),
  };
}

function carToRow(car: MyGarageCar, userId: string) {
  return {
    user_id: userId,
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
    features: {},
    equipment: car.equipment ?? [],
    modifications: JSON.stringify(car.modifications ?? []),
    description: car.description,
    estimated_value: car.estimatedValue,
    security_features: car.securityFeatures ?? [],
    build_notes: car.buildNotes ?? [],
    owner_name: car.owner.name || shortName(userStore.get().name),
    owner_city: car.owner.city || userStore.get().city,
    owner_rating: car.owner.rating || userStore.get().rating,
  };
}

async function prepareCar(car: MyGarageCar, userId: string) {
  const { images, uploaded } = await uploadCarImages(userId, car.images ?? [car.image]);
  const savedCar = { ...car, image: images[0] ?? car.image, images };
  return { row: carToRow(savedCar, userId), car: savedCar, images, uploaded };
}

export function useGarage() {
  const { userId } = useAuth();
  const [cars, setCars] = useState<MyGarageCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, selectedReady] = usePersistentStore(selectedStore);
  const [profile] = usePersistentStore(userStore);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setCars([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setCars([]);
    async function fetchCars() {
      try {
        const { data, error } = await getSupabase()
          .from('cars')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
        if (error) throw error;
        if (cancelled) return;
        const rows = (data ?? []) as CarRow[];
        const next = rows.map(rowToCar);
        setCars(next);
        if (next.length > 0 && !next.some((car) => car.id === selectedStore.get())) {
          selectedStore.set(next[0].id);
        }
      } catch {
        if (!cancelled) setCars([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchCars();
    return () => { cancelled = true; };
  }, [userId]);

  const selectCar = useCallback((id: string) => selectedStore.set(id), []);

  const addCar = useCallback(async (car: MyGarageCar): Promise<GarageResult> => {
    if (!userId) return { ok: false, error: 'network' };
    if (cars.length >= GARAGE_LIMIT) return { ok: false, error: 'limit' };
    let uploaded: string[] = [];
    try {
      const prepared = await prepareCar(car, userId);
      uploaded = prepared.uploaded;
      const { data, error } = await getSupabase()
        .from('cars')
        .insert(prepared.row)
        .select('*')
        .single();
      if (error || !data) {
        if (uploaded.length) await getSupabase().storage.from('car-images').remove(uploaded);
        uploaded = [];
        return { ok: false, error: 'network' };
      }
      uploaded = [];
      const saved = rowToCar(data as CarRow);
      setCars((previous) => [...previous, saved]);
      return { ok: true, id: saved.id };
    } catch {
      if (uploaded.length) await getSupabase().storage.from('car-images').remove(uploaded);
      return { ok: false, error: 'network' };
    }
  }, [cars.length, userId]);

  const updateCar = useCallback(async (car: MyGarageCar): Promise<GarageResult> => {
    if (!userId) return { ok: false, error: 'network' };
    let uploaded: string[] = [];
    try {
      const prepared = await prepareCar(car, userId);
      uploaded = prepared.uploaded;
      const { data, error } = await getSupabase()
        .from('cars')
        .update(prepared.row)
        .eq('id', car.id)
        .eq('user_id', userId)
        .select('id')
        .maybeSingle();
      if (error || !data) {
        if (uploaded.length) await getSupabase().storage.from('car-images').remove(uploaded);
        uploaded = [];
        return { ok: false, error: 'network' };
      }
      uploaded = [];
      const oldImages = cars.find((item) => item.id === car.id)?.images ?? [];
      const preserved = new Set(storedCarImagePaths(prepared.images));
      const stale = storedCarImagePaths(oldImages).filter((path) => !preserved.has(path));
      if (stale.length) void getSupabase().storage.from('car-images').remove(stale);
      setCars((previous) => previous.map((item) => (item.id === car.id ? prepared.car : item)));
      return { ok: true };
    } catch {
      if (uploaded.length) await getSupabase().storage.from('car-images').remove(uploaded);
      return { ok: false, error: 'network' };
    }
  }, [cars, userId]);

  const removeCar = useCallback(async (id: string): Promise<GarageResult> => {
    if (!userId) return { ok: false, error: 'network' };
    if (cars.length <= 1) return { ok: false, error: 'last-car' };
    try {
      const { data, error } = await getSupabase()
        .from('cars')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select('id')
        .maybeSingle();
      if (error || !data) return { ok: false, error: 'network' };
      const next = cars.filter((car) => car.id !== id);
      setCars(next);
      const removed = cars.find((car) => car.id === id)?.images ?? [];
      const paths = storedCarImagePaths(removed);
      if (paths.length) void getSupabase().storage.from('car-images').remove(paths);
      if (selectedStore.get() === id) selectedStore.set(next[0].id);
      return { ok: true };
    } catch {
      return { ok: false, error: 'network' };
    }
  }, [cars, userId]);

  const mounted = !loading && selectedReady;
  const visibleCars = cars.map((car) => ({
    ...car,
    owner: {
      ...car.owner,
      phone: profile.id === userId ? profile.phone : '',
      city: profile.id === userId ? profile.city || car.owner.city : car.owner.city,
    },
  }));
  const selectedCar = visibleCars.find((car) => car.id === selectedId) ?? visibleCars[0] ?? DEFAULT_GARAGE_CARS[0];

  return {
    cars: visibleCars,
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
