import type { BodyType } from '@/types';

/** Canonical values used by listings, preferences, and search filters. */
export const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: 'Sedan', label: 'Limuzina' },
  { value: 'Hatchback', label: 'Hečbek' },
  { value: 'Caravan', label: 'Karavan' },
  { value: 'SUV', label: 'SUV / Terenac' },
  { value: 'Coupe', label: 'Kupe' },
  { value: 'Convertible', label: 'Kabriolet' },
  { value: 'MPV', label: 'Monovolumen (MPV)' },
  { value: 'Pickup', label: 'Pickup' },
  { value: 'Van', label: 'Kombi / Dostavno' },
];

export const BODY_TYPE_LABELS: Record<BodyType, string> = Object.fromEntries(
  BODY_TYPES.map(({ value, label }) => [value, label]),
) as Record<BodyType, string>;
