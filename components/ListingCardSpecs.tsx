import { CalendarDays, CarFront, Gauge, Settings2 } from 'lucide-react';
import type { Car } from '@/types';
import { formatKm, formatYear } from '@/lib/cars';
import { bodyLabel, transmissionLabel } from '@/lib/labels';

/** Four vehicle facts on a single responsive line across all listing cards. */
export default function ListingCardSpecs({ car }: { car: Car }) {
  const body = bodyLabel(car.bodyType);
  const compactBody = car.bodyType === 'SUV' ? 'SUV'
    : car.bodyType === 'MPV' ? 'MPV'
      : car.bodyType === 'Van' ? 'Kombi'
        : body;
  const transmission = transmissionLabel(car.specs.transmission);
  const compactTransmission = car.specs.transmission === 'Semi-Auto' ? 'Poluauto.' : transmission;

  const specs = [
    { key: 'year', Icon: CalendarDays, label: 'Godište', full: formatYear(car.year), short: formatYear(car.year) },
    { key: 'mileage', Icon: Gauge, label: 'Kilometraža', full: formatKm(car.mileage), short: formatKm(car.mileage) },
    { key: 'transmission', Icon: Settings2, label: 'Menjač', full: transmission, short: compactTransmission },
    { key: 'body', Icon: CarFront, label: 'Karoserija', full: body, short: compactBody },
  ];

  return (
    <div
      className="mt-3 grid min-w-0 grid-cols-2 gap-x-4 gap-y-1.5 text-xs leading-5 text-app-secondary sm:text-[13px]"
      aria-label="Osnovni podaci o vozilu"
    >
      {specs.map(({ key, Icon, label, full, short }) => (
        <span
          key={key}
          className="flex min-w-0 items-center gap-1.5"
          title={label + ': ' + full}
          aria-label={label + ': ' + full}
        >
          <Icon size={15} className="shrink-0 text-app-muted" aria-hidden="true" />
          <span className="min-w-0 truncate">{short}</span>
        </span>
      ))}
    </div>
  );
}
