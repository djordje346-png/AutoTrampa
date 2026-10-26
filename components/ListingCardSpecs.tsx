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
      className="mt-3 grid min-w-0 grid-cols-[0.7fr_1.25fr_1.1fr_1fr] items-center gap-x-1 whitespace-nowrap text-[9px] leading-5 text-app-secondary min-[360px]:text-[10px] sm:text-[11px] desktop:gap-x-2 desktop:text-xs"
      aria-label="Osnovni podaci o vozilu"
    >
      {specs.map(({ key, Icon, label, full, short }) => (
        <span
          key={key}
          className="flex min-w-0 items-center gap-1 border-l border-surface pl-1 first:border-l-0 first:pl-0 desktop:gap-1.5 desktop:pl-2"
          title={label + ': ' + full}
          aria-label={label + ': ' + full}
        >
          <Icon size={12} className="shrink-0 text-app-muted desktop:h-[14px] desktop:w-[14px]" aria-hidden="true" />
          <span className="min-w-0 truncate desktop:hidden">{short}</span>
          <span className="hidden min-w-0 truncate desktop:inline">{full}</span>
        </span>
      ))}
    </div>
  );
}
