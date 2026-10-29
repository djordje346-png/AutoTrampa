'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { CalendarDays, Car as CarIcon, Gauge, Heart, MapPin, Settings2 } from 'lucide-react';
import { carTitle, formatEuro, formatKm, formatYear } from '@/lib/cars';
import { carSubtitle } from '@/lib/car-row';
import { bodyLabel, transmissionLabel } from '@/lib/labels';
import type { TradeLabel } from '@/lib/trade';
import type { Car } from '@/types';
import { FeedCardPhoto } from '@/components/FeedCardPhoto';
import TradeBadge from '@/components/TradeBadge';

type Props = {
  car: Car;
  trade?: TradeLabel | null;
  onLike?: (car: Car) => void;
  liking?: boolean;
  onOffer?: (car: Car) => void;
  photoActions?: ReactNode;
};

export default function MarketplaceV13Card({ car, trade, onLike, liking = false, onOffer, photoActions }: Props) {
  const specs = [
    { Icon: CalendarDays, text: formatYear(car.year), label: 'Godište' },
    { Icon: Gauge, text: formatKm(car.mileage), label: 'Kilometraža' },
    { Icon: Settings2, text: transmissionLabel(car.specs.transmission), label: 'Menjač' },
    { Icon: CarIcon, text: bodyLabel(car.bodyType), label: 'Karoserija' },
  ];

  return (
    <article className={`group/card relative isolate min-w-0 overflow-hidden rounded-[12px] border border-surface bg-card-surface text-app-primary shadow-[0_4px_16px_rgba(0,0,0,.06)] transition-[transform,box-shadow] duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,.10)] dark:shadow-[0_4px_16px_rgba(0,0,0,.18)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,.24)] motion-safe:desktop:hover:-translate-y-0.5 sm:aspect-auto sm:flex sm:h-full sm:flex-col ${onOffer ? 'flex flex-col' : 'grid aspect-square grid-rows-[minmax(0,1fr)_auto]'}`}>
      <Link href={`/car/${car.id}`} aria-label={`Otvori oglas: ${carTitle(car)}`} className="absolute inset-0 z-10 rounded-[12px] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand-500" />
      <div className={`relative overflow-hidden bg-elevated sm:aspect-auto sm:h-[237px] sm:flex-none ${onOffer ? 'aspect-[16/10] flex-none' : 'min-h-0'}`}>
        <div className="absolute inset-0 [&>div]:!aspect-auto [&>div]:!h-full">
          <FeedCardPhoto car={car} showDemoBadge={false} />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/25 via-transparent to-black/50" />
        <div className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-2">
          {onLike && (
            <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onLike(car); }} disabled={liking}
              aria-label={`Lajkuj i sačuvaj ${car.brand} ${car.model}`}
              className="pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/70 text-white transition-colors hover:border-brand-500 hover:text-brand-500 disabled:opacity-50"
              title="Lajkuj i sačuvaj za match">
              <Heart size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
          )}
          {photoActions}
        </div>
        {trade && <TradeBadge trade={trade} variant="photo" className={`pointer-events-none absolute right-3 top-3 z-20 ${photoActions ? '!max-w-[calc(100%-112px)]' : '!max-w-[calc(100%-72px)]'}`} />}
        {!car.ownerId && <span className="pointer-events-none absolute bottom-2 left-3 z-20 rounded-full bg-black/65 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white">Demo</span>}
      </div>

      <div className="relative flex min-w-0 flex-col bg-card-surface px-[13px] pb-3 pt-3 sm:flex-1 sm:px-[18px] sm:pb-[18px]">
        <h3 title={carTitle(car)} className="truncate font-heading text-[clamp(17px,5vw,21px)] font-bold leading-[1.2] tracking-tight text-app-primary sm:text-[22px]">{carTitle(car)}</h3>
        <p className="mt-1 min-h-[16px] truncate text-[11px] leading-4 text-app-secondary sm:text-xs">{carSubtitle(car) || '\u00a0'}</p>
        <div className="listing-card-specs mt-2 text-[clamp(8px,2.4vw,10px)] leading-tight text-app-secondary sm:text-[11px]">
          {specs.map(({ Icon, text, label }, index) => (
            <span key={label} className="contents">
              {index > 0 && <span aria-hidden="true" className="h-[3px] w-[3px] justify-self-center self-center rounded-full listing-spec-dot" />}
              <span title={`${label}: ${text}`} className="flex min-w-0 items-center gap-[3px]">
                <Icon size={11} className="shrink-0 text-app-muted" strokeWidth={1.7} aria-hidden="true" />
                <span className="min-w-0 truncate tabular-nums">{text}</span>
              </span>
            </span>
          ))}
        </div>
        <div className="mt-3 flex min-h-[40px] flex-wrap items-center justify-between gap-x-2 gap-y-2 border-t border-surface pt-2.5">
          <strong className="min-w-0 shrink-0 whitespace-nowrap font-sans text-[clamp(20px,5.7vw,24px)] font-bold leading-none tracking-tight tabular-nums text-app-primary sm:text-[27px]">{formatEuro(car.price)}</strong>
          <span title={`Lokacija oglasa: ${car.city || 'Nije navedeno'}`} className="ml-auto flex min-w-0 max-w-[48%] items-center justify-end gap-1 text-xs font-semibold text-app-secondary">
            <MapPin size={14} className="shrink-0 text-app-muted" aria-hidden="true" />
            <span className="truncate">{car.city || 'Nije navedeno'}</span>
          </span>
        </div>
        {onOffer && <button type="button" onClick={() => onOffer(car)} className="relative z-20 mt-2 w-full rounded-lg bg-brand-500 px-3 py-2 text-[11px] font-semibold text-on-accent transition-colors hover:bg-brand-400">Pošalji ponudu</button>}
      </div>
    </article>
  );
}
