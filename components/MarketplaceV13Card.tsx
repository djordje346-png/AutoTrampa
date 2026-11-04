'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { CalendarDays, Car as CarIcon, ChevronRight, Gauge, Heart, MapPin, MessageCircle, Settings2 } from 'lucide-react';
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
  liked?: boolean;
  onOffer?: (car: Car) => void;
  offerId?: string;
  onMessage?: (car: Car) => void;
  messaging?: boolean;
  photoActions?: ReactNode;
  /** Minimalist home-feed card, preserving the legacy card elsewhere. */
  minimalHome?: boolean;
};

export default function MarketplaceV13Card({ car, trade, onLike, liking = false, liked = false, onOffer, offerId, onMessage, messaging = false, photoActions, minimalHome = false }: Props) {
  const hasOfferAction = Boolean(onOffer || offerId);
  const specs = [
    { Icon: CalendarDays, text: formatYear(car.year), label: 'Godište' },
    { Icon: Gauge, text: formatKm(car.mileage), label: 'Kilometraža' },
    { Icon: Settings2, text: transmissionLabel(car.specs.transmission), label: 'Menjač' },
    hasOfferAction
      ? { Icon: MapPin, text: car.city || 'Nije navedeno', label: 'Lokacija' }
      : { Icon: CarIcon, text: bodyLabel(car.bodyType), label: 'Karoserija' },
  ];

  if (minimalHome) {
    const homeSpecs = [
      { Icon: CalendarDays, text: formatYear(car.year), label: 'Godište' },
      { Icon: Gauge, text: formatKm(car.mileage), label: 'Kilometraža' },
      { Icon: Settings2, text: transmissionLabel(car.specs.transmission), label: 'Menjač' },
      { Icon: MapPin, text: car.city || 'Nije navedeno', label: 'Lokacija' },
    ];

    return (
      <article className="listing-card listing-card-minimal group/card relative isolate flex h-full min-w-0 flex-col overflow-hidden rounded-[14px] border border-surface bg-card-surface text-app-primary shadow-[0_4px_16px_rgba(0,0,0,.08)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,.14)] dark:shadow-[0_4px_16px_rgba(0,0,0,.20)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,.28)]">
        <Link href={`/car/${car.id}`} aria-label={`Pogledaj oglas: ${carTitle(car)}`} className="absolute inset-0 z-10 rounded-[14px] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand-500" />

        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-elevated">
          <div className="absolute inset-0 [&>div]:!aspect-auto [&>div]:!h-full">
            <FeedCardPhoto car={car} showDemoBadge={false} />
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35" />
          <div className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-2">
            {photoActions}
            {onLike && (
              <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onLike(car); }} disabled={liking}
                aria-label={`${liked ? 'Sačuvano:' : 'Lajkuj i sačuvaj'} ${car.brand} ${car.model}`}
                aria-pressed={liked}
                className={`pointer-events-auto relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/70 ${liked ? 'text-brand-500 !border-brand-500' : 'text-white'} transition-colors hover:border-brand-500 hover:text-brand-500 disabled:opacity-50`}
                title={liked ? 'Oglas je sačuvan' : 'Lajkuj i sačuvaj za match'}>
                <Heart size={18} fill={liked ? 'currentColor' : 'none'} strokeWidth={1.8} aria-hidden="true" />
              </button>
            )}
          </div>
          {trade && <TradeBadge trade={trade} variant="photo" className={`pointer-events-none absolute left-3 top-3 z-20 ${photoActions ? '!max-w-[calc(100%-112px)]' : '!max-w-[calc(100%-72px)]'}`}/>}
          {!car.ownerId && <span className="pointer-events-none absolute bottom-3 left-3 z-20 text-[10px] font-bold uppercase tracking-wide text-white drop-shadow">Demo</span>}
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col px-4 pb-4 pt-3.5 sm:px-[18px] sm:pb-[18px]">
          <h3 title={carTitle(car)} className="truncate font-heading text-[19px] font-bold leading-[1.3] tracking-[-0.025em] text-app-primary sm:text-[20px]">{carTitle(car)}</h3>
          <p className="mt-1 truncate text-[12px] leading-[1.5] text-app-secondary">{carSubtitle(car) || '\u00a0'}</p>
          <div className="mt-3 grid min-w-0 grid-cols-[0.76fr_1.26fr_1.08fr_1.17fr] items-center text-[11px] leading-[1.5] text-app-secondary sm:text-[11px]">
            {homeSpecs.map(({ Icon, text, label }, index) => (
              <span
                key={label}
                title={`${label}: ${text}`}
                className={`flex min-w-0 items-center justify-start gap-1 px-1.5 first:pl-0 last:pr-0 ${index > 0 ? 'border-l border-surface' : ''}`}
              >
                <Icon size={12} className="shrink-0 text-app-muted" strokeWidth={1.7} aria-hidden="true" />
                <span className="min-w-0 truncate tabular-nums">{text}</span>
              </span>
            ))}
          </div>
          <div className="mt-4 flex min-h-[42px] items-center justify-between gap-3 border-t border-surface pt-3.5 sm:mt-auto sm:pt-4">
            <strong className="min-w-0 shrink-0 whitespace-nowrap font-sans text-[22px] font-bold leading-none tracking-tight tabular-nums text-app-primary sm:text-[24px]">{formatEuro(car.price)}</strong>
            <span aria-hidden="true" className="inline-flex shrink-0 items-center gap-[3px] whitespace-nowrap text-[12px] font-medium leading-[18px] text-[#B45309] transition-colors dark:text-[#F58A38] sm:text-[13px]">
              <span className="leading-[18px]">Pogledaj oglas</span><ChevronRight size={14} className="block shrink-0 self-center" aria-hidden="true" />
            </span>
          </div>
          {(hasOfferAction || onMessage) && (
            <div className="relative z-20 mt-3 flex min-w-0 items-center gap-2 border-t border-surface pt-3">
              {offerId ? (
                <Link href={`/messages?tab=offers&offer=${offerId}`} aria-label={`Pogledaj ponudu za ${carTitle(car)}`}
                  className="inline-flex min-h-10 flex-1 items-center justify-center rounded-[10px] border border-brand-500/40 bg-brand-500/10 px-3 text-[12px] font-semibold text-brand-text transition-colors hover:bg-brand-500/20 dark:text-brand-500">
                  Pogledaj ponudu
                </Link>
              ) : onOffer ? (
                <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onOffer(car); }}
                  aria-label={`Ponudi zamenu za ${carTitle(car)}`}
                  className="inline-flex min-h-10 flex-1 items-center justify-center rounded-[10px] bg-brand-500 px-3 text-[12px] font-semibold text-on-accent transition-colors hover:bg-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500">
                  Ponudi zamenu
                </button>
              ) : null}
              {onMessage && (
                <button type="button" disabled={messaging} aria-label={`Pošalji poruku za ${carTitle(car)}`} title="Pošalji poruku vlasniku"
                  onClick={(event) => { event.preventDefault(); event.stopPropagation(); onMessage(car); }}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-surface text-app-secondary transition-colors hover:bg-hover-surface hover:text-app-primary disabled:opacity-50"
                  aria-busy={messaging}>
                  <MessageCircle size={18} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className={`listing-card group/card relative isolate min-w-0 overflow-hidden rounded-[14px] border border-surface bg-card-surface text-app-primary shadow-[0_4px_16px_rgba(0,0,0,.06)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,.10)] dark:shadow-[0_4px_16px_rgba(0,0,0,.18)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,.24)] sm:aspect-auto sm:flex sm:h-full sm:flex-col ${hasOfferAction ? 'flex flex-col' : 'grid aspect-square grid-rows-[minmax(0,1fr)_auto]'}`}>
      <Link href={`/car/${car.id}`} aria-label={`Otvori oglas: ${carTitle(car)}`} className="absolute inset-0 z-10 rounded-[14px] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand-500" />
      <div className={`relative overflow-hidden rounded-t-[13px] bg-elevated sm:aspect-auto sm:h-[237px] sm:flex-none ${hasOfferAction ? 'aspect-[16/10] flex-none' : 'min-h-0'}`}>
        <div className="absolute inset-0 [&>div]:!aspect-auto [&>div]:!h-full">
          <FeedCardPhoto car={car} showDemoBadge={false} />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/25 via-transparent to-black/50" />
        <div className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-2">
          {photoActions}
          {onLike && (
            <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onLike(car); }} disabled={liking}
              aria-label={`${liked ? 'Sačuvano:' : 'Lajkuj i sačuvaj'} ${car.brand} ${car.model}`}
              aria-pressed={liked}
              className={`pointer-events-auto relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/70 ${liked ? 'text-brand-500 !border-brand-500' : 'text-white'} transition-colors after:absolute after:-inset-1.5 after:rounded-full hover:border-brand-500 hover:text-brand-500 disabled:opacity-50 sm:h-9 sm:w-9 sm:after:hidden`}
              title={liked ? 'Oglas je sačuvan' : 'Lajkuj i sačuvaj za match'}>
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} strokeWidth={1.8} className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
            </button>
          )}
        </div>
        {trade && <TradeBadge trade={trade} variant="photo" className={`pointer-events-none absolute left-3 top-3 z-20 ${photoActions ? '!max-w-[calc(100%-112px)]' : '!max-w-[calc(100%-72px)]'}`} />}
        {!car.ownerId && <span className="pointer-events-none absolute bottom-2 left-3 z-20 rounded-full bg-black/65 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white">Demo</span>}
      </div>

      <div className="relative flex min-w-0 flex-col bg-card-surface px-4 pb-4 pt-3.5 sm:flex-1 sm:px-[18px] sm:pb-[18px]">
        <h3 title={carTitle(car)} className="truncate font-heading text-[clamp(18px,4.5vw,21px)] font-extrabold leading-[1.25] tracking-[-0.025em] text-app-primary sm:text-[22px]">{carTitle(car)}</h3>
        <p className="mt-1 min-h-[17px] truncate text-xs leading-[1.45] text-app-secondary sm:text-xs">{carSubtitle(car) || '\u00a0'}</p>
        <div className="listing-card-specs mt-2.5 text-[10px] leading-[1.35] text-app-secondary sm:text-[11px]">
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
        <div className="mt-3.5 flex min-h-[42px] flex-wrap items-center justify-between gap-x-2 gap-y-2 border-t border-surface pt-3">
          <strong className="min-w-0 shrink-0 whitespace-nowrap font-sans text-[clamp(21px,5.7vw,24px)] font-extrabold leading-none tracking-tight tabular-nums text-app-primary sm:text-[27px]">{formatEuro(car.price)}</strong>
          {hasOfferAction ? <div className="relative z-20 ml-auto flex shrink-0 items-center gap-1.5">
          {offerId ? (
            <Link href={`/messages?tab=offers&offer=${offerId}`} aria-label={`Pogledaj ponudu za ${carTitle(car)}`}
              className="relative z-20 ml-auto inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-lg border border-surface px-3.5 py-2 text-[11px] font-semibold text-app-secondary transition-colors hover:bg-hover-surface hover:text-app-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-xs">
              Pogledaj ponudu
            </Link>
          ) : onOffer ? (
            <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onOffer(car); }}
              aria-label={`Ponudi zamenu za ${carTitle(car)}`}
              className="relative z-20 ml-auto inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-lg bg-brand-500 px-3.5 py-2 text-[11px] font-semibold text-on-accent transition-colors hover:bg-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:text-xs">
              Ponudi zamenu
            </button>
          ) : null}
          {onMessage && <button type="button" disabled={messaging} aria-label={`Pošalji poruku za ${carTitle(car)}`} title="Pošalji poruku vlasniku"
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); onMessage(car); }}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-surface text-app-secondary transition-colors hover:bg-hover-surface hover:text-app-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50" aria-busy={messaging}>
            <MessageCircle size={18} aria-hidden="true" />
          </button>}
          </div> : (
          <span title={`Lokacija oglasa: ${car.city || 'Nije navedeno'}`} className="ml-auto flex min-w-0 max-w-[48%] items-center justify-end gap-1 text-xs font-semibold text-app-secondary">
            <MapPin size={14} className="shrink-0 text-app-muted" aria-hidden="true" />
            <span className="truncate">{car.city || 'Nije navedeno'}</span>
          </span>
          )}
        </div>
      </div>
    </article>
  );
}
