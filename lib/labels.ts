import type { BodyType, FuelType, Transmission } from '@/types';

/**
 * The data model keeps English keys (they are stable identifiers used in
 * filters and storage); everything the user reads goes through these maps.
 */

export const FUEL_LABELS: Record<FuelType, string> = {
  Diesel: 'Dizel',
  Petrol: 'Benzin',
  Hybrid: 'Hibrid',
  Electric: 'Električni',
};

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  Manual: 'Manuelni',
  Automatic: 'Automatik',
  'Semi-Auto': 'Poluautomatik',
};

export const BODY_LABELS: Record<BodyType, string> = {
  Sedan: 'Limuzina',
  Caravan: 'Karavan',
  Hatchback: 'Hečbek',
  SUV: 'SUV',
  Coupe: 'Kupe',
  Convertible: 'Kabriolet',
};

export function fuelLabel(fuel: FuelType): string {
  return FUEL_LABELS[fuel] ?? fuel;
}

export function transmissionLabel(transmission: Transmission): string {
  return TRANSMISSION_LABELS[transmission] ?? transmission;
}

export function bodyLabel(body: BodyType): string {
  return BODY_LABELS[body] ?? body;
}
