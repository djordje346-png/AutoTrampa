'use client';

import { useCallback, useEffect, useState } from 'react';
import { MyGarageCar } from '@/types';
import { createPersistentStore, usePersistentStore } from '@/lib/persistent-store';
import type { StorageFailure } from '@/lib/storage';
import { getSupabase } from '@/lib/supabase';
import { storedCarImagePaths, uploadCarImages } from '@/lib/car-images';
import { CAR_PRIVATE_DETAIL_COLUMNS, PUBLIC_CAR_ROW_COLUMNS, rowToGarageCar, type CarRow } from '@/lib/car-row';
import { useAuth } from '@/hooks/use-auth';
import { shortName, userStore } from '@/hooks/use-user';

export const GARAGE_LIMIT = 3;

const selectedStore = createPersistentStore<string>(
  'autotrampa_selected_car',
  // Empty means "nothing selected yet"; the hook resolves the first real car.
  '',
  (raw) => (typeof raw === 'string' && raw ? raw : null),
);

export type GarageError =
  | 'limit'
  | 'duplicate'
  | 'permission'
  | 'invalid-data'
  | 'image-too-large'
  | 'storage'
  | 'network'
  | 'not-found'
  | 'unauthorized'
  | 'unknown';
export type GarageOperation = 'add' | 'update' | 'remove';
export type GarageResult =
  | { ok: true; id?: string }
  | { ok: false; error: GarageError }
  | { ok: false; error: 'storage'; storage: { ok: false; reason: StorageFailure } };

type ErrorDetails = {
  code?: string;
  message?: string;
  name?: string;
  status?: number;
  statusCode?: number;
};

function errorDetails(error: unknown): ErrorDetails {
  if (!error || typeof error !== 'object') {
    return { message: typeof error === 'string' ? error : undefined };
  }

  const value = error as Record<string, unknown>;
  return {
    code: typeof value.code === 'string' ? value.code : undefined,
    message: typeof value.message === 'string' ? value.message : undefined,
    name: typeof value.name === 'string' ? value.name : undefined,
    status: typeof value.status === 'number' ? value.status : undefined,
    statusCode: typeof value.statusCode === 'number' ? value.statusCode : undefined,
  };
}

/** Keep diagnostics useful without logging vehicle data, user IDs, or raw server messages. */
function reportGarageFailure(operation: string, error: unknown) {
  const details = errorDetails(error);
  console.error('Supabase operacija nad garažom nije uspela.', {
    operation,
    code: details.code,
    status: details.status ?? details.statusCode,
    errorType: details.name,
  });
}

function classifyGarageError(error: unknown, fallback: GarageError = 'unknown'): GarageError {
  const { code, message, name, status, statusCode } = errorDetails(error);
  const combinedMessage = `${message ?? ''} ${typeof error === 'string' ? error : ''}`.toLowerCase();
  const httpStatus = status ?? statusCode;

  if (combinedMessage.includes('garage_limit_reached')) return 'limit';
  if (httpStatus === 413 || /payload too large|maximum size|file size limit/.test(combinedMessage)) {
    return 'image-too-large';
  }
  if (httpStatus === 401) return 'unauthorized';
  if (httpStatus === 403 || code === '42501' || code === 'PGRST301') return 'permission';
  if (code === '23505') return 'duplicate';
  if (['22001', '22P02', '23502', '23503', '23514'].includes(code ?? '')) return 'invalid-data';
  if (name?.toLowerCase().includes('storage') || statusCode !== undefined) return 'storage';
  if (httpStatus !== undefined && httpStatus >= 500) return 'network';
  if (/failed to fetch|fetch failed|network|load failed|connection/.test(combinedMessage)) return 'network';

  return fallback;
}

export function garageErrorMessage(error: GarageError, operation: GarageOperation = 'add', limit = GARAGE_LIMIT) {
  const savedAction = operation === 'update' ? 'Izmene nisu sačuvane.' : 'Vozilo nije sačuvano.';

  switch (error) {
    case 'limit':
      return `Dostignut je limit od ${limit} vozila u garaži. Obriši vozilo da bi dodao novo.`;
    case 'duplicate':
      return 'Vozilo je već evidentirano. Osveži garažu i pokušaj ponovo.';
    case 'permission':
      return operation === 'remove'
        ? 'Nemaš dozvolu da obrišeš ovo vozilo. Osveži stranicu i pokušaj ponovo.'
        : `${savedAction} Nemaš dozvolu za ovu izmenu.`;
    case 'invalid-data':
      return `${savedAction} Proveri unete podatke o vozilu.`;
    case 'image-too-large':
      return 'Fotografija je prevelika. Izaberi manju fotografiju i pokušaj ponovo.';
    case 'storage':
      return 'Fotografija nije mogla da se sačuva. Proveri vezu i pokušaj ponovo.';
    case 'network':
      return `${operation === 'remove' ? 'Vozilo nije obrisano.' : savedAction} Proveri internet vezu i pokušaj ponovo.`;
    case 'not-found':
      return 'Vozilo više nije dostupno. Osveži garažu i pokušaj ponovo.';
    case 'unauthorized':
      return 'Sesija je istekla. Prijavi se ponovo pa pokušaj ponovo.';
    default:
      return operation === 'remove' ? 'Vozilo nije obrisano. Pokušaj ponovo.' : `${savedAction} Pokušaj ponovo.`;
  }
}

async function cleanupUploadedImages(paths: string[]) {
  if (paths.length === 0) return;
  try {
    const { error } = await getSupabase().storage.from('car-images').remove(paths);
    if (error) reportGarageFailure('cleanup uploaded images', error);
  } catch (error) {
    reportGarageFailure('cleanup uploaded images', error);
  }
}

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
    // `-` is the app's display placeholder, not a real vehicle generation.
    generation: car.generation === '-' ? null : car.generation,
    year: car.year,
    body_type: car.bodyType,
    condition: car.condition ?? null,
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
    owner_name: car.owner.name || shortName(userStore.get().name),
    owner_city: car.owner.city || userStore.get().city,
  };
}

function privateDetailsToRow(car: MyGarageCar, userId: string) {
  return {
    car_id: car.id,
    user_id: userId,
    estimated_value: car.estimatedValue,
    security_features: car.securityFeatures ?? [],
    build_notes: car.buildNotes ?? [],
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
          .select(PUBLIC_CAR_ROW_COLUMNS)
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
        if (error) throw error;
        if (cancelled) return;
        const rows = (data ?? []) as unknown as CarRow[];
        const { data: details, error: detailsError } = rows.length
          ? await getSupabase()
              .from('car_private_details')
              .select(CAR_PRIVATE_DETAIL_COLUMNS)
              .in('car_id', rows.map((row) => row.id))
          : { data: [], error: null };
        if (detailsError) throw detailsError;
        const detailsByCar = new Map((details ?? []).map((item) => [item.car_id, item]));
        const next = rows.map((row) => rowToGarageCar(row, detailsByCar.get(row.id)));
        setCars(next);
        if (next.length > 0 && !next.some((car) => car.id === selectedStore.get())) {
          selectedStore.set(next[0].id);
        }
      } catch (error) {
        reportGarageFailure('load garage', error);
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
    if (!userId) return { ok: false, error: 'unauthorized' };
    if (cars.length >= GARAGE_LIMIT) return { ok: false, error: 'limit' };
    let uploaded: string[] = [];
    try {
      const prepared = await prepareCar(car, userId);
      uploaded = prepared.uploaded;
      const { data, error } = await getSupabase()
        .from('cars')
        .insert(prepared.row)
        .select(PUBLIC_CAR_ROW_COLUMNS)
        .single();
      if (error || !data) {
        if (error) reportGarageFailure('insert car', error);
        else reportGarageFailure('insert car', new Error('Insert returned no row'));
        await cleanupUploadedImages(uploaded);
        uploaded = [];
        return { ok: false, error: error ? classifyGarageError(error) : 'unknown' };
      }
      const insertedCar = data as unknown as CarRow;
      const { error: detailsError } = await getSupabase()
        .from('car_private_details')
        .insert(privateDetailsToRow({ ...prepared.car, id: insertedCar.id }, userId));
      if (detailsError) {
        reportGarageFailure('save private car details', detailsError);
        const { error: rollbackError } = await getSupabase().from('cars').delete().eq('id', insertedCar.id).eq('user_id', userId);
        if (rollbackError) reportGarageFailure('rollback car after private details failure', rollbackError);
        await cleanupUploadedImages(uploaded);
        uploaded = [];
        return { ok: false, error: classifyGarageError(detailsError) };
      }
      uploaded = [];
      const saved = rowToGarageCar(
        insertedCar,
        privateDetailsToRow({ ...prepared.car, id: insertedCar.id }, userId),
      );
      setCars((previous) => [...previous, saved]);
      return { ok: true, id: saved.id };
    } catch (error) {
      reportGarageFailure('add car', error);
      await cleanupUploadedImages(uploaded);
      return { ok: false, error: classifyGarageError(error) };
    }
  }, [cars.length, userId]);

  const updateCar = useCallback(async (car: MyGarageCar): Promise<GarageResult> => {
    if (!userId) return { ok: false, error: 'unauthorized' };
    let uploaded: string[] = [];
    try {
      const prepared = await prepareCar(car, userId);
      uploaded = prepared.uploaded;
      const { error: detailsError } = await getSupabase()
        .from('car_private_details')
        .upsert(privateDetailsToRow(car, userId), { onConflict: 'car_id' });
      if (detailsError) {
        reportGarageFailure('update private car details', detailsError);
        await cleanupUploadedImages(uploaded);
        uploaded = [];
        return { ok: false, error: classifyGarageError(detailsError) };
      }
      const { data, error } = await getSupabase()
        .from('cars')
        .update(prepared.row)
        .eq('id', car.id)
        .eq('user_id', userId)
        .select('id')
        .maybeSingle();
      if (error || !data) {
        if (error) reportGarageFailure('update car', error);
        else reportGarageFailure('update car', new Error('Update returned no row'));
        await cleanupUploadedImages(uploaded);
        uploaded = [];
        return { ok: false, error: error ? classifyGarageError(error) : 'not-found' };
      }
      uploaded = [];
      const oldImages = cars.find((item) => item.id === car.id)?.images ?? [];
      const preserved = new Set(storedCarImagePaths(prepared.images));
      const stale = storedCarImagePaths(oldImages).filter((path) => !preserved.has(path));
      if (stale.length) void getSupabase().storage.from('car-images').remove(stale);
      setCars((previous) => previous.map((item) => (item.id === car.id ? prepared.car : item)));
      return { ok: true };
    } catch (error) {
      reportGarageFailure('update car', error);
      await cleanupUploadedImages(uploaded);
      return { ok: false, error: classifyGarageError(error) };
    }
  }, [cars, userId]);

  const removeCar = useCallback(async (id: string): Promise<GarageResult> => {
    if (!userId) return { ok: false, error: 'unauthorized' };
    try {
      const { data, error } = await getSupabase()
        .from('cars')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select('id')
        .maybeSingle();
      if (error || !data) {
        if (error) reportGarageFailure('delete car', error);
        else reportGarageFailure('delete car', new Error('Delete returned no row'));
        return { ok: false, error: error ? classifyGarageError(error) : 'not-found' };
      }
      const next = cars.filter((car) => car.id !== id);
      setCars(next);
      const removed = cars.find((car) => car.id === id)?.images ?? [];
      const paths = storedCarImagePaths(removed);
      if (paths.length) void getSupabase().storage.from('car-images').remove(paths);
      if (selectedStore.get() === id) selectedStore.set(next[0]?.id ?? '');
      return { ok: true };
    } catch (error) {
      reportGarageFailure('delete car', error);
      return { ok: false, error: classifyGarageError(error) };
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
