import placesData from '@/lib/serbian-places.json';

export interface SerbianPlace {
  id: number;
  canonicalName: string;
  name: string;
  latitude: number;
  longitude: number;
  population: number;
  district: string;
  searchNames: string[];
}

/**
 * GeoNames `cities500` Serbia extract, downloaded 2026-10-12. The dataset lists
 * places with 500+ residents or administrative seats and WGS84 coordinates.
 * Source: https://download.geonames.org/export/dump/cities500.zip (CC BY 4.0).
 * Kosovska Mitrovica is included from GeoNames ID 789225 for legacy listings.
 */
export const SERBIAN_PLACES = placesData as SerbianPlace[];

export const POPULAR_SERBIAN_PLACES = [...SERBIAN_PLACES]
  .sort((a, b) => b.population - a.population || a.name.localeCompare(b.name, 'sr-Latn'))
  .slice(0, 12);

function normalizeCity(city: string): string {
  return city
    .split(',')[0]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('sr-Latn')
    .replace(/đ/g, 'dj')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

const placeByName = new Map<string, SerbianPlace>();

// Exact visible labels win; legacy city names resolve to the most populated
// matching place when GeoNames contains same-name localities.
for (const place of SERBIAN_PLACES) {
  placeByName.set(normalizeCity(place.name), place);
}
for (const place of [...SERBIAN_PLACES].sort((a, b) => b.population - a.population)) {
  for (const name of place.searchNames) {
    const key = normalizeCity(name);
    if (key && !placeByName.has(key)) placeByName.set(key, place);
  }
}

export function getSerbianPlace(city: string): SerbianPlace | null {
  return placeByName.get(normalizeCity(city)) ?? null;
}

export function hasCityCoordinates(city: string): boolean {
  return Boolean(city.trim() && getSerbianPlace(city));
}

function distanceKm(
  from: Pick<SerbianPlace, 'latitude' | 'longitude'>,
  to: Pick<SerbianPlace, 'latitude' | 'longitude'>,
): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const lat1 = radians(from.latitude);
  const lon1 = radians(from.longitude);
  const lat2 = radians(to.latitude);
  const lon2 = radians(to.longitude);
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function distanceBetweenCitiesKm(fromCity: string, toCity: string): number | null {
  const from = getSerbianPlace(fromCity);
  const to = getSerbianPlace(toCity);
  return from && to ? distanceKm(from, to) : null;
}
