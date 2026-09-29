'use client';

import { useEffect, useState } from 'react';
import { Car, CarSpec } from '@/types';
import { MARKETPLACE_CARS } from '@/lib/cars';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

const EMPTY_SPECS: CarSpec = {
  engine: '-', displacement: '-', cylinders: 0, power: '-', torque: '-',
  fuelType: 'Diesel', transmission: 'Manual', drivetrain: '-', topSpeed: '-', acceleration: '-',
};

function listValue(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value !== 'string' || !value) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    // Earlier cars stored free text here.
  }
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function mapListing(row: Record<string, unknown>): Car {
  const specs = row.specs && typeof row.specs === 'object' ? row.specs as Partial<CarSpec> : {};
  const image = typeof row.image === 'string' ? row.image : '';
  const images = Array.isArray(row.images)
    ? row.images.filter((item): item is string => typeof item === 'string')
    : [];
  return {
    id: String(row.id),
    ownerId: String(row.user_id ?? ''),
    brand: String(row.brand ?? ''),
    model: String(row.model ?? ''),
    generation: String(row.generation ?? '-'),
    year: Number(row.year ?? 0),
    bodyType: (row.body_type ?? 'Sedan') as Car['bodyType'],
    color: String(row.color ?? '-'),
    mileage: Number(row.mileage ?? 0),
    price: Number(row.price ?? 0),
    city: String(row.city ?? '-'),
    country: String(row.country ?? 'Serbia'),
    image,
    images: images.length ? images : image ? [image] : undefined,
    specs: { ...EMPTY_SPECS, ...specs },
    owner: {
      name: String(row.owner_name ?? 'Korisnik'),
      phone: '',
      city: String(row.owner_city ?? row.city ?? '-'),
      rating: Number(row.owner_rating ?? 5),
    },
    description: String(row.description ?? ''),
    modifications: listValue(row.modifications),
    equipment: Array.isArray(row.equipment)
      ? row.equipment.filter((item): item is string => typeof item === 'string')
      : undefined,
  };
}

export function useMarketplace() {
  const { userId } = useAuth();
  const [liveCars, setLiveCars] = useState<Car[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let query = getSupabase()
          .from('cars')
          .select('id,user_id,brand,model,generation,year,body_type,color,mileage,price,city,country,image,images,specs,equipment,modifications,description,estimated_value,owner_name,owner_city,owner_rating,created_at')
          .order('created_at', { ascending: false });
        if (userId) query = query.neq('user_id', userId);
        const { data, error } = await query;
        if (error) throw error;
        if (!cancelled) setLiveCars((data ?? []).map((row) => mapListing(row as Record<string, unknown>)));
      } catch {
        if (!cancelled) setLiveCars([]);
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    setReady(false);
    void load();
    return () => { cancelled = true; };
  }, [userId]);

  return { cars: [...liveCars, ...MARKETPLACE_CARS], ready };
}
