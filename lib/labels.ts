import type { BodyType, FuelType, Transmission, VehicleCondition } from '@/types';

/**
 * The data model keeps English keys (they are stable identifiers used in
 * filters and storage); everything the user reads goes through these maps.
 */

export const FUEL_LABELS: Record<FuelType, string> = {
  Diesel: 'Dizel',
  Petrol: 'Benzin',
  Hybrid: 'Hibrid',
  Electric: 'Električni',
  LPG: 'TNG / LPG',
  CNG: 'CNG',
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

export const VEHICLE_CONDITION_LABELS: Record<VehicleCondition, string> = {
  good: 'Bez većih ulaganja',
  minor_work: 'Potrebna manja ulaganja',
  major_work: 'Potrebna veća ulaganja',
  not_running: 'Neispravan / za popravku',
};

export function fuelLabel(fuel: FuelType | null): string {
  return fuel ? FUEL_LABELS[fuel] ?? fuel : 'Nije navedeno';
}

export function transmissionLabel(transmission: Transmission | null): string {
  return transmission ? TRANSMISSION_LABELS[transmission] ?? transmission : 'Nije navedeno';
}

export function bodyLabel(body: BodyType | null): string {
  return body ? BODY_LABELS[body] ?? body : 'Nije navedeno';
}

export function vehicleConditionLabel(condition: VehicleCondition | null | undefined): string | null {
  return condition ? VEHICLE_CONDITION_LABELS[condition] ?? null : null;
}
