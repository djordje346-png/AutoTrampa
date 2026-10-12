type Coordinates = readonly [latitude: number, longitude: number];

// City-centre coordinates keep distance recommendations useful without GPS,
// address collection, or a geocoding service.
const SERBIAN_CITIES: Record<string, Coordinates> = {
  beograd: [44.7866, 20.4489],
  belgrade: [44.7866, 20.4489],
  novi_beograd: [44.8167, 20.4167],
  novi_sad: [45.2671, 19.8335],
  nis: [43.3209, 21.8958],
  subotica: [46.1, 19.6656],
  kragujevac: [44.0128, 20.9114],
  kraljevo: [43.7234, 20.687],
  cacak: [43.8914, 20.3497],
  zrenjanin: [45.3836, 20.3819],
  smederevo: [44.6644, 20.9276],
  leskovac: [42.9981, 21.9461],
  pancevo: [44.8708, 20.6403],
  valjevo: [44.2751, 19.8982],
  uzice: [43.8554, 19.8425],
  novi_pazar: [43.1367, 20.5122],
  pozarevac: [44.6213, 21.1878],
  vranje: [42.5514, 21.9003],
  sabac: [44.7467, 19.69],
  krusevac: [43.58, 21.3339],
  sombor: [45.7742, 19.1122],
  jagodina: [43.9771, 21.2612],
  kikinda: [45.8297, 20.4653],
  mitrovica: [42.8914, 20.866],
  kosovska_mitrovica: [42.8914, 20.866],
  loznica: [44.5333, 19.2258],
  vrbas: [45.5714, 19.6408],
  backa_palanka: [45.25, 19.3919],
  indjija: [45.0482, 20.0816],
  stara_pazova: [44.985, 20.1608],
  ruma: [45.0081, 19.8222],
  arandjelovac: [44.3069, 20.56],
  paracin: [43.8608, 21.4078],
  aleksinac: [43.5417, 21.7078],
  prokuplje: [43.2342, 21.5881],
  bor: [44.0747, 22.0959],
  zajecar: [43.9036, 22.2641],
  pirot: [43.1557, 22.5857],
  kruševac: [43.58, 21.3339],
};

function normalizeCity(city: string): string {
  return city.split(',')[0]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('sr-Latn')
    .replace(/đ/g, 'dj')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function coordinatesFor(city: string): Coordinates | null {
  const key = normalizeCity(city);
  return SERBIAN_CITIES[key] ?? null;
}

export function hasCityCoordinates(city: string): boolean {
  return Boolean(city.trim() && coordinatesFor(city));
}

function distanceKm(from: Coordinates, to: Coordinates): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const [lat1, lon1] = from.map(radians);
  const [lat2, lon2] = to.map(radians);
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function distanceBetweenCitiesKm(fromCity: string, toCity: string): number | null {
  const from = coordinatesFor(fromCity);
  const to = coordinatesFor(toCity);
  return from && to ? distanceKm(from, to) : null;
}


