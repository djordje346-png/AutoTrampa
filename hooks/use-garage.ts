'use client';

import { useCallback, useEffect, useState } from 'react';
import { MyGarageCar } from '@/types';
import { createPersistentStore, usePersistentStore } from '@/lib/persistent-store';
import type { StorageFailure } from '@/lib/storage';
import { getSupabase } from '@/lib/supabase';
import { storedCarImagePaths, uploadCarImages } from '@/lib/car-images';
import { CAR_ROW_COLUMNS, rowToGarageCar, type CarRow } from '@/lib/car-row';
import { useAuth } from '@/hooks/use-auth';
import { shortName, userStore } from '@/hooks/use-user';

export const GARAGE_LIMIT = 3;

const selectedStore = createPersistentStore<string>(
  'autotrampa_selected_car',
  // Empty means "nothing selected yet"; the hook resolves the first real car.
  '',
  (raw) => (typeof raw === 'string' && raw ? raw : null),
);

export type GarageError = 'limit' | 'duplicate' | 'network';
export type GarageResult =
  | { ok: true; id?: string }
  | { ok: false; error: GarageError }
  | { ok: false; error: 'storage'; storage: { ok: false; reason: StorageFailure } };

/**
 * Adds the private owner details the row cannot carry: only the signed-in user
 * may see their own phone number, and their profile is the source of truth for
 * their display name and city.
 */
function withOwnerProfile(car: MyGarageCar, userId: string | null): MyGarageCar {
  const profile = userStore.get();
  const mine = Boolean(userId) && profile.id === car.ownerId;
  if (!mine) return car;
  return {
    ...car,
    owner: {
      ...car.owner,
      name: car.owner.name || shortName(profile.name),
      phone: profile.phone,
      city: profile.city || car.owner.city,
    },
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
  // Subscribing to the profile store is what re-renders the garage once the
  // current user's name and phone arrive.
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
          .select(CAR_ROW_COLUMNS)
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
        if (error) throw error;
        if (cancelled) return;
        const rows = (data ?? []) as unknown as CarRow[];
        const next = rows.map(rowToGarageCar);
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
        .select(CAR_ROW_COLUMNS)
        .single();
      if (error || !data) {
        if (uploaded.length) await getSupabase().storage.from('car-images').remove(uploaded);
        uploaded = [];
        return { ok: false, error: 'network' };
      }
      uploaded = [];
      const saved = rowToGarageCar(data as unknown as CarRow);
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
      if (selectedStore.get() === id) selectedStore.set(next[0]?.id ?? '');
      return { ok: true };
    } catch {
      return { ok: false, error: 'network' };
    }
  }, [cars, userId]);

  const mounted = !loading && selectedReady;
  const visibleCars = cars.map((car) => withOwnerProfile(car, userId));
  /**
   * Null when the garage is empty. It must NOT fall back to a demo car: the
   * trade maths (`other.price - myCar.price`) would then be computed against a
   * car the user does not own, and the listing pages would show a confident
   * "Tvoja doplata 2.000 €" derived from nothing. Every consumer has to say
   * "add your car" instead.
   */
  const selectedCar = visibleCars.find((car) => car.id === selectedId) ?? visibleCars[0] ?? null;

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
    /**
     * The account's own phone. Listings carry no phone (it lives in `profiles`),
     * so this is what tells an owner their listing currently has no way for a
     * buyer to call them.
     */
    ownerPhone: profile.phone,
  };
}
