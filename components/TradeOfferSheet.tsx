'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftRight, CircleCheck as CheckCircle, MessageCircle } from 'lucide-react';
import { BottomSheet } from '@/components/BottomSheet';
import { formatEuro } from '@/lib/cars';
import { getTradeLabel } from '@/lib/trade';
import { useMessages } from '@/hooks/use-messages';
import type { Car, MyGarageCar } from '@/types';

interface TradeOfferSheetProps {
  /** The listing being offered against; null closes the sheet. */
  car: Car | null;
  myCar: MyGarageCar;
  onClose: () => void;
}

/**
 * The offer flow, shared by the feed, search and the listing page — they used
 * to carry three near-identical copies that drifted apart.
 */
export function TradeOfferSheet({ car, myCar, onClose }: TradeOfferSheetProps) {
  const { createConversation } = useMessages();
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (car) {
      setMessage('');
      setSent(false);
    }
  }, [car]);

  if (!car) return null;

  const trade = getTradeLabel(myCar, car);

  function send() {
    if (!car) return;
    createConversation(
      {
        id: `conv-${car.id}-${Date.now()}`,
        carId: car.id,
        carTitle: `${car.year} ${car.brand} ${car.model} ${car.generation}`,
        carImage: car.image,
        ownerName: car.owner.name,
        ownerPhone: car.owner.phone,
        tradeSummary: trade.label,
      },
      message,
    );
    setSent(true);
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={sent ? 'Ponuda poslata' : 'Ponuda za trampu'}
      bare={sent}
    >
      {sent ? (
        <div className="flex flex-col items-center py-4">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle size={36} className="text-emerald-400" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-app-primary">Ponuda poslata!</h3>
          <p className="mb-1 text-center text-sm text-app-secondary">
            Tvoja ponuda za{' '}
            <span className="font-medium text-app-primary">
              {car.brand} {car.model}
            </span>{' '}
            je poslata korisniku {car.owner.name}.
          </p>
          <p className="mb-6 text-xs text-app-muted">Razgovor je otvoren u Porukama.</p>
          <div className="flex w-full gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-elevated py-3 text-sm font-semibold text-app-primary transition-colors hover:bg-hover-surface"
            >
              Zatvori
            </button>
            <Link
              href="/messages"
              onClick={onClose}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-400"
            >
              <MessageCircle size={15} />
              Otvori poruke
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-5 flex items-center gap-3">
            <div className="min-w-0 flex-1 rounded-xl bg-elevated p-3 text-center">
              <p className="mb-1 text-xs text-app-muted">Tvoj auto</p>
              <p className="truncate text-sm font-semibold text-app-primary">
                {myCar.brand} {myCar.model}
              </p>
              <p className="text-sm font-bold text-orange-400">{formatEuro(myCar.price)}</p>
            </div>
            <ArrowLeftRight size={20} className="flex-shrink-0 text-app-muted" />
            <div className="min-w-0 flex-1 rounded-xl bg-elevated p-3 text-center">
              <p className="mb-1 text-xs text-app-muted">Njegov auto</p>
              <p className="truncate text-sm font-semibold text-app-primary">
                {car.brand} {car.model}
              </p>
              <p className="text-sm font-bold text-orange-400">{formatEuro(car.price)}</p>
            </div>
          </div>

          <div
            className={`mb-5 rounded-xl border px-4 py-2.5 text-center text-sm font-semibold ${trade.bg} ${trade.color}`}
          >
            {trade.label}
          </div>

          <label htmlFor="offer-message" className="sr-only">
            Poruka uz ponudu
          </label>
          <textarea
            id="offer-message"
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, 500))}
            placeholder="Dodaj poruku uz ponudu... (opciono)"
            className="h-24 w-full resize-none rounded-xl border border-surface bg-elevated px-4 py-3 text-sm text-app-primary transition-colors placeholder:text-app-muted focus:border-orange-500 focus:outline-none"
          />

          <button
            onClick={send}
            className="mt-4 w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-orange-400 active:scale-95"
          >
            Pošalji ponudu
          </button>
        </>
      )}
    </BottomSheet>
  );
}
