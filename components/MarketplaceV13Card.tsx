'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CalendarDays, Gauge, Heart, MapPin, Settings2 } from 'lucide-react';
import { carTitle, formatEuro, formatKm, formatYear } from '@/lib/cars';
import { carSubtitle } from '@/lib/car-row';
import { transmissionLabel } from '@/lib/labels';
import type { TradeLabel } from '@/lib/trade';
import type { Car } from '@/types';
import { FeedCardPhoto } from '@/components/FeedCardPhoto';

type Props = {
  car: Car;
  trade?: TradeLabel | null;
  onLike?: (car: Car) => void;
  liking?: boolean;
};

export default function MarketplaceV13Card({ car, trade, onLike, liking = false }: Props) {
  const specs = [
    { Icon: CalendarDays, text: formatYear(car.year), label: 'Godište' },
    { Icon: Gauge, text: formatKm(car.mileage), label: 'Kilometraža' },
    { Icon: Settings2, text: transmissionLabel(car.specs.transmission), label: 'Menjač' },
    { Icon: MapPin, text: car.city || 'Nije navedeno', label: 'Grad' },
  ];

  return (
    <article className="group/card relative isolate grid aspect-square min-w-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-[22px] border border-white/10 bg-[#111a1e] text-white shadow-[0_14px_30px_rgba(17,26,30,.14)] transition-shadow hover:shadow-xl sm:aspect-auto sm:flex sm:h-full sm:flex-col">
      <div className="relative min-h-0 overflow-hidden bg-[#1b282e] sm:h-[237px] sm:flex-none">
        <div className="absolute inset-0 [&>div]:!aspect-auto [&>div]:!h-full">
          <FeedCardPhoto car={car} />
        </div>
        <Link href={`/car/${car.id}`} aria-label={`Otvori oglas: ${carTitle(car)}`} className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#faeb00]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/25 via-transparent to-[#19252b]/50" />
        <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-start justify-between gap-2">
          {trade ? (
            <span className="flex min-h-[30px] max-w-[calc(100%-48px)] items-center gap-1.5 overflow-hidden rounded-full border border-white/25 bg-[#081014]/85 px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-md backdrop-blur-md sm:text-xs">
              <ArrowUpRight size={14} className="shrink-0 text-[#faeb00]" />
              <span className="truncate">{trade.label}</span>
            </span>
          ) : <span />}
          {onLike && (
            <button type="button" onClick={() => onLike(car)} disabled={liking}
              aria-label={`Lajkuj i sačuvaj ${car.brand} ${car.model}`}
              className="pointer-events-auto flex h-[35px] w-[35px] shrink-0 items-center justify-center rounded-full border border-white/40 bg-[#091116]/75 text-white backdrop-blur-md transition-colors hover:border-[#faeb00] hover:text-[#faeb00] disabled:opacity-50"
              title="Lajkuj i sačuvaj za match">
              <Heart size={18} strokeWidth={1.8} />
            </button>
          )}
        </div>
        {!car.ownerId && <span className="pointer-events-none absolute bottom-2 left-3 z-20 rounded-full bg-black/65 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white">Demo</span>}
      </div>

      <div className="relative flex min-w-0 flex-col bg-gradient-to-br from-[#1b272c] via-[#111a1e] to-[#0d1418] px-[13px] pb-3 pt-2.5 sm:flex-1 sm:px-[19px] sm:pb-[19px]">
        <h3 className="truncate font-heading text-[clamp(17px,5vw,21px)] font-extrabold leading-[1.13] tracking-tight text-white sm:text-[22px]">{carTitle(car)}</h3>
        <p className="mt-1 truncate text-[11px] leading-[1.2] text-[#b4c0c6] sm:text-xs">{carSubtitle(car) || ' '}</p>
        <div className="mt-2 grid min-w-0 grid-cols-[.80fr_1.36fr_1.14fr_1.07fr] items-center gap-x-2 text-[clamp(8px,2.4vw,10px)] leading-tight text-[#b9c5ca] min-[390px]:gap-x-4 sm:gap-x-2 sm:text-[11px]">
          {specs.map(({ Icon, text, label }, index) => (
            <span key={label} title={`${label}: ${text}`} className={`relative flex min-w-0 items-center gap-[3px] ${index ? "before:absolute before:-left-[5px] before:top-1/2 before:h-[3px] before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-[#71858d] min-[390px]:before:-left-[9px]" : ''}`}>
              <Icon size={11} className="shrink-0 text-[#adbbc1]" strokeWidth={1.7} aria-hidden="true" />
              <span className="min-w-0 truncate tabular-nums">{text}</span>
            </span>
          ))}
        </div>
        <div className="mt-2.5 flex min-h-[36px] items-center justify-between gap-2 border-t border-white/[.13] pt-2">
          <strong className="min-w-0 shrink-0 whitespace-nowrap font-sans text-[clamp(20px,5.7vw,24px)] font-extrabold leading-none tracking-tight tabular-nums text-white sm:text-[27px]">{formatEuro(car.price)}</strong>
          <Link href={`/car/${car.id}`} className="relative z-20 inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[10.5px] font-medium tracking-normal text-[#faeb00] hover:underline hover:underline-offset-4 sm:text-[11.5px]">
            Pogledaj oglas <ArrowRight size={10} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
