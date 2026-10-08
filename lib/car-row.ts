import type { BodyType, Car, CarSpec, MyGarageCar } from '@/types';

/**
 * One place that turns a `public.cars` row into an app object.
 *
 * Both the garage and the marketplace used to carry their own copy of this
 * mapping, so every new column had to be added twice and the two could drift
 * apart. Anything a screen needs that is not in the row (the signed-in user's
 * own phone number, for instance) is layered on by the hook that called this.
 */

/** Column list a caller needs so that every mapped field is actually present. */
export const CAR_ROW_COLUMNS = [
  'id',
  'user_id',
  'brand',
  'model',
  'generation',
  'year',
  'body_type',
  'color',
  'mileage',
  'price',
  'city',
  'country',
  'image',
  'images',
  'specs',
  'features',
  'equipment',
  'modifications',
  'description',
  'estimated_value',
  'security_features',
  'build_notes',
  'owner_name',
  'owner_city',
  'owner_rating',
  'created_at',
].join(',');

export interface CarRow {
  id: string;
  user_id: string;
  brand: string | null;
  model: string | null;
  generation: string | null;
  year: number | null;
  body_type: string | null;
  color: string | null;
  mileage: number | null;
  price: number | string | null;
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

const EMPTY_SPECS: CarSpec = {
  engine: '-',
  displacement: '-',
  cylinders: 0,
  power: '-',
  torque: '-',
  fuelType: 'Diesel',
  transmission: 'Manual',
  drivetrain: '-',
  topSpeed: '-',
  acceleration: '-',
};

/**
 * Reads a list column that has been through two generations of storage: newer
 * rows hold a jsonb array (or a JSON string), older ones free text with one
 * item per line.
 */
export function rowList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'number') return [];
  if (typeof value !== 'string' || !value.trim()) return [];

  if (value.trim().startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      // Not JSON after all — fall through to the free-text format.
    }
  }

  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function fromFeatures(row: CarRow, key: string): string[] {
  const features = row.features;
  if (!features || typeof features !== 'object') return [];
  return stringArray((features as Record<string, unknown>)[key]);
}

function toNumber(value: number | string | null | undefined, fallback = 0): number {
  const parsed = typeof value === 'string' ? Number(value) : (value ?? NaN);
  return Number.isFinite(parsed) ? Number(parsed) : fallback;
}

function imagesOf(row: CarRow): string[] | undefined {
  const images = Array.isArray(row.images)
    ? row.images.filter((item): item is string => typeof item === 'string' && Boolean(item))
    : [];
  if (images.length) return images;
  return row.image ? [row.image] : undefined;
}

/** Shared projection: everything except the fields only the owner may see. */
function baseFields(row: CarRow) {
  const images = imagesOf(row);
  return {
    id: String(row.id),
    ownerId: String(row.user_id ?? ''),
    brand: row.brand ?? '',
    model: row.model ?? '',
    generation: row.generation ?? '-',
    year: toNumber(row.year),
    bodyType: (row.body_type ?? 'Sedan') as BodyType,
    color: row.color ?? '-',
    mileage: toNumber(row.mileage),
    price: toNumber(row.price),
    city: row.city ?? '-',
    country: row.country ?? 'Serbia',
    image: row.image ?? '',
    images,
    specs: { ...EMPTY_SPECS, ...((row.specs ?? {}) as Partial<CarSpec>) },
    owner: {
      name: row.owner_name || 'Korisnik',
      // Never carried on a listing: the phone lives in the private profile row.
      phone: '',
      city: row.owner_city ?? row.city ?? '-',
      rating: toNumber(row.owner_rating, 5),
    },
    description: row.description ?? '',
    modifications: rowList(row.modifications),
    equipment: row.equipment ? stringArray(row.equipment) : undefined,
  };
}

/** A public listing. */
export function rowToCar(row: CarRow): Car {
  return baseFields(row);
}

/** The signed-in user's own car: same shape plus the private garage fields. */
export function rowToGarageCar(row: CarRow): MyGarageCar {
  return {
    ...baseFields(row),
    securityFeatures: row.security_features ?? fromFeatures(row, 'securityFeatures'),
    buildNotes: row.build_notes ?? fromFeatures(row, 'buildNotes'),
    estimatedValue: toNumber(row.estimated_value),
  };
}
