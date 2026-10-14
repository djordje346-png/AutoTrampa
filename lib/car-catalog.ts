import catalog from '@/lib/car-catalog.json';

/**
 * Local, pinned subset of VehiclesDB 2026.10.3 (passenger-car makes/models).
 * Dataset: CC BY 4.0. Full dataset and upstream attribution notices are linked
 * from the listing form at /attribution/vehiclesdb-2026.10.3.md.
 */
const CAR_CATALOG = catalog as Record<string, string[]>;

export const CAR_MAKES = Object.keys(CAR_CATALOG).sort((a, b) =>
  a.localeCompare(b, 'sr-Latn'),
);

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('sr-Latn')
    .replace(/đ/g, 'dj')
    .replace(/[^a-z0-9]+/g, '');
}

const LEGACY_MAKE_ALIASES: Record<string, string> = {
  alfa: 'Alfa Romeo',
  land: 'Land Rover',
  mercedes: 'Mercedes-Benz',
};

export function getCarModels(make: string): string[] {
  const normalized = normalizeName(make);
  const canonical = LEGACY_MAKE_ALIASES[normalized] ?? make;
  const canonicalName = Object.keys(CAR_CATALOG).find(
    (name) => normalizeName(name) === normalizeName(canonical),
  );
  return canonicalName ? CAR_CATALOG[canonicalName] : [];
}

export function isCataloguedModel(make: string, model: string): boolean {
  const normalizedModel = normalizeName(model);
  return Boolean(normalizedModel) && getCarModels(make).some(
    (name) => normalizeName(name) === normalizedModel,
  );
}

export function normalizeVehicleName(value: string): string {
  return normalizeName(value);
}
