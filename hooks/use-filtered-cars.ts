'use client';

import { useMemo } from 'react';
import type { Car } from '@/types';
import { sortByBudget, TRADE_TOLERANCE } from '@/lib/trade';
import { distanceBetweenCitiesKm } from '@/lib/city-coordinates';
import type { SearchFilters } from '@/hooks/use-search-prefs';

/**
 * Convert stored displacement values to cm³.
 * Handles "2.0L", "1,9 l", "1995 cm3", and "1.998 cm³".
 */
function displacementCm3(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase().replace(/\s+/g, '');
  const match = value.match(/\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const token = match[0];
  const inLitres = /(?:l|litara|liter)/.test(value);
  if (inLitres) {
    const litres = Number(token.replace(',', '.'));
    return litres > 0 && litres < 25 ? Math.round(litres * 1000) : null;
  }
  const numeric = Number(token.replace(/[.,]/g, token.includes('.') && token.split('.')[1]?.length === 3 ? '' : '.'));
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  // Older listings can store just "1.9" instead of "1.9L".
  return numeric < 25 ? Math.round(numeric * 1000) : Math.round(numeric);
}

/**
 * The single place that turns a list of listings plus the chosen filters into
 * what the screen shows. Feed and Pretraga both use it, so a filter can never
 * mean one thing on one screen and something else on the other.
 *
 * `myCar` is null when the garage is empty: the trade filter and the
 * "best trade" ordering are then skipped rather than computed against a car the
 * user does not own.
 */
export function filterCars(
  cars: Car[],
  filters: SearchFilters,
  myCar: Pick<Car, 'price'> | null,
  budget: number | null,
  noTopUp: boolean,
  originCity = '',
  radiusKm = 0,
): Car[] {
  const q = filters.query.trim().toLowerCase();

  const matched = cars.filter((car) => {
    if (filters.brand && car.brand !== filters.brand) return false;
    if (filters.model && car.model.toLocaleLowerCase().trim() !== filters.model.toLocaleLowerCase().trim()) return false;
    if (filters.bodyType && car.bodyType !== filters.bodyType) return false;
    if (filters.fuelType && car.specs.fuelType !== filters.fuelType) return false;
    if (filters.priceMin != null && car.price < filters.priceMin) return false;
    if (filters.priceMax != null && car.price > filters.priceMax) return false;
    if (filters.yearMin != null && (car.year == null || car.year < filters.yearMin)) return false;
    if (filters.yearMax != null && (car.year == null || car.year > filters.yearMax)) return false;
    if (filters.displacementMin != null || filters.displacementMax != null) {
      const cm3 = displacementCm3(car.specs.displacement);
      if (cm3 == null) return false;
      if (filters.displacementMin != null && cm3 < filters.displacementMin) return false;
      if (filters.displacementMax != null && cm3 > filters.displacementMax) return false;
    }

    if (q) {
      const haystack = `${car.brand} ${car.model} ${car.generation} ${car.city}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (myCar && filters.trade !== 'all') {
      const diff = car.price - myCar.price;
      if (filters.trade === 'similar' && Math.abs(diff) >= TRADE_TOLERANCE) return false;
      if (filters.trade === 'cheaper' && diff >= -TRADE_TOLERANCE) return false;
      if (filters.trade === 'expensive' && diff <= TRADE_TOLERANCE) return false;
    }

    return true;
  });

  const sorted = [...matched];
  switch (filters.sortBy) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'year-desc':
      sorted.sort((a, b) => {
        if (a.year == null) return b.year == null ? 0 : 1;
        if (b.year == null) return -1;
        return b.year - a.year;
      });
      break;
    case 'trade':
      // "Best trade" needs both sides; without a car the order stays as-is.
      if (myCar) {
        sorted.sort(
          (a, b) => Math.abs(a.price - myCar.price) - Math.abs(b.price - myCar.price),
        );
      }
      break;
  }

  const budgetAware = myCar && (budget != null || noTopUp);
  const ranked = budgetAware ? sortByBudget(sorted, myCar, budget, noTopUp) : sorted;
  return applySoftRadius(ranked, originCity, radiusKm);
}

/** Soft radius ranks nearby cars first but never hides distant listings. */
function applySoftRadius(cars: Car[], originCity: string, radiusKm: number): Car[] {
  if (!originCity.trim() || !Number.isFinite(radiusKm) || radiusKm <= 0) return cars;

  const nearby: Car[] = [];
  const outside: { car: Car; distance: number | null; order: number }[] = [];
  cars.forEach((car, order) => {
    const distance = distanceBetweenCitiesKm(originCity, car.city);
    if (distance != null && distance <= radiusKm) nearby.push(car);
    else outside.push({ car, distance, order });
  });

  // No known city coordinates means we cannot estimate distance; preserve the
  // existing order rather than unexpectedly hiding the entire feed.
  if (nearby.length === 0 && outside.every(({ distance }) => distance == null)) return cars;

  outside.sort((a, b) => {
    if (a.distance == null) return b.distance == null ? a.order - b.order : 1;
    if (b.distance == null) return -1;
    return a.distance - b.distance || a.order - b.order;
  });
  return [...nearby, ...outside.map(({ car }) => car)];
}

export function useFilteredCars(
  cars: Car[],
  filters: SearchFilters,
  myCar: Pick<Car, 'price'> | null,
  budget: number | null,
  noTopUp: boolean,
  originCity = '',
  radiusKm = 0,
): Car[] {
  return useMemo(
    () => filterCars(cars, filters, myCar, budget, noTopUp, originCity, radiusKm),
    [cars, filters, myCar, budget, noTopUp, originCity, radiusKm],
  );
}
