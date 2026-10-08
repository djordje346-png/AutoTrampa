'use client';

import { useMemo } from 'react';
import type { Car } from '@/types';
import { sortByBudget, TRADE_TOLERANCE } from '@/lib/trade';
import type { SearchFilters } from '@/hooks/use-search-prefs';

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
): Car[] {
  const q = filters.query.trim().toLowerCase();

  const matched = cars.filter((car) => {
    if (filters.brand && car.brand !== filters.brand) return false;
    if (filters.bodyType && car.bodyType !== filters.bodyType) return false;
    if (filters.fuelType && car.specs.fuelType !== filters.fuelType) return false;
    if (filters.priceMin != null && car.price < filters.priceMin) return false;
    if (filters.priceMax != null && car.price > filters.priceMax) return false;
    if (filters.yearMin != null && car.year < filters.yearMin) return false;
    if (filters.yearMax != null && car.year > filters.yearMax) return false;
    if (filters.kmMin != null && car.mileage < filters.kmMin) return false;
    if (filters.kmMax != null && car.mileage > filters.kmMax) return false;

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
      sorted.sort((a, b) => b.year - a.year);
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
  return budgetAware ? sortByBudget(sorted, myCar, budget, noTopUp) : sorted;
}

export function useFilteredCars(
  cars: Car[],
  filters: SearchFilters,
  myCar: Pick<Car, 'price'> | null,
  budget: number | null,
  noTopUp: boolean,
): Car[] {
  return useMemo(
    () => filterCars(cars, filters, myCar, budget, noTopUp),
    [cars, filters, myCar, budget, noTopUp],
  );
}
