"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, CheckCircle, CarFront } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import { useGarage } from "@/hooks/use-garage";
import { sendTradeOffer } from "@/lib/trade-offers";
import { toast } from "sonner";
import type { Car, MyGarageCar } from "@/types";

interface TradeOfferSheetProps {
  car: Car | null;
  myCar: MyGarageCar | null;
  onClose: () => void;
}

export function TradeOfferSheet({ car, myCar, onClose }: TradeOfferSheetProps) {
  const { cars } = useGarage();
  const [chosenId, setChosenId] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{
    id: string;
    alreadyExists: boolean;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const listing = useRef(car?.id);
  listing.current = car?.id;
  useEffect(() => {
    setChosenId(myCar?.id ?? "");
    setMessage("");
    setResult(null);
    setPending(false);
  }, [car?.id, myCar?.id]);
  const offered = cars.find((item) => item.id === chosenId) ?? myCar;
  if (!car || !offered) return null;

  async function send() {
    if (!car || !offered || busy.current) return;
    const targetId = car.id;
    busy.current = true;
    setPending(true);
    const response = await sendTradeOffer(targetId, offered.id, message);
    busy.current = false;
    if (listing.current !== targetId) return;
    setPending(false);
    if (!response.ok) {
      toast.error(response.message);
      return;
    }
    setResult(response);
  }
  return (
    <BottomSheet
      open
      onClose={onClose}
      title={result ? "Ponuda za zamenu" : "Ponudi zamenu"}
      className="sm:!max-w-xl"
    >
      {result ? (
        <div className="flex flex-col items-center py-3 text-center">
          <CheckCircle size={42} className="mb-4 text-tone-positive" />
          <h3 className="text-xl font-bold text-app-primary">
            {result.alreadyExists ? "Ponuda već postoji" : "Ponuda je poslata"}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-app-secondary">
            {result.alreadyExists
              ? "Za ova dva automobila već postoji aktivna ponuda. Možeš je pogledati i nastaviti dogovor."
              : `${car.owner.name || "Vlasnik"} će tvoju ponudu videti u pregledu ponuda. Doplatu dogovarate u porukama.`}
          </p>
          <Link
            href={`/messages?tab=offers&offer=${result.id}`}
            onClick={onClose}
            className="btn-primary mt-6 w-full text-sm"
          >
            Pogledaj ponudu
          </Link>
          <button
            onClick={onClose}
            className="mt-3 px-4 py-2 text-sm font-semibold text-app-secondary"
          >
            Zatvori
          </button>
        </div>
      ) : (
        <>
          <p className="mb-5 text-sm leading-relaxed text-app-secondary">
            Izaberi svoj automobil. Doplatu i ostale uslove dogovarate u
            porukama.
          </p>
          <label
            htmlFor="offer-car"
            className="mb-2 block text-sm font-semibold text-app-primary"
          >
            Tvoj automobil
          </label>
          <select
            id="offer-car"
            value={offered.id}
            onChange={(e) => setChosenId(e.target.value)}
            disabled={pending}
            className="mb-4 w-full rounded-xl border border-surface bg-elevated px-3 py-3 text-sm text-app-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {(cars.length ? cars : [offered]).map((item) => (
              <option key={item.id} value={item.id}>
                {item.brand} {item.model} · {item.year}
              </option>
            ))}
          </select>
          <div className="mb-5 grid grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] items-center gap-3">
            {[offered, car].map((item, index) => (
              <div
                key={item.id}
                className={
                  index === 1
                    ? "col-start-3 row-start-1 min-w-0"
                    : "col-start-1 row-start-1 min-w-0"
                }
              >
                <p className="mb-2 text-xs text-app-muted">
                  {index === 0 ? "Ti nudiš" : "Za automobil vlasnika"}
                </p>
                <div className="aspect-[16/10] overflow-hidden rounded-xl bg-elevated">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={`${item.brand} ${item.model}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <CarFront className="m-auto h-full text-app-muted" />
                  )}
                </div>
                <p className="mt-2 break-words text-sm font-semibold text-app-primary">
                  {item.brand} {item.model}
                </p>
                <p className="text-xs text-app-muted">{item.year}</p>
              </div>
            ))}
            <ArrowLeftRight
              size={22}
              className="col-start-2 row-start-1 text-app-muted"
              aria-hidden="true"
            />
          </div>
          <div className="mb-5 rounded-xl bg-brand-500/10 px-4 py-3">
            <p className="text-sm font-semibold text-app-primary">
              Doplata po dogovoru
            </p>
            <p className="mt-1 text-xs leading-relaxed text-app-secondary">
              Ponuda pokazuje koji automobil nudiš. Iznos dogovarate direktno sa
              vlasnikom.
            </p>
          </div>
          <label
            htmlFor="offer-note"
            className="mb-2 block text-sm font-semibold text-app-primary"
          >
            Napomena{" "}
            <span className="font-normal text-app-muted">(opciono)</span>
          </label>
          <textarea
            id="offer-note"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            disabled={pending}
            placeholder="Na primer: Zainteresovan sam za zamenu. Kada možemo da pogledamo automobile?"
            className="h-24 w-full resize-none rounded-xl border border-surface bg-elevated px-4 py-3 text-sm text-app-primary placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="mt-1 text-right text-xs text-app-muted">
            {message.length}/500
          </p>
          <button
            onClick={() => void send()}
            disabled={pending}
            className="btn-primary mt-4 w-full text-sm disabled:opacity-60"
          >
            {pending ? "Šaljem…" : "Pošalji ponudu"}
          </button>
          <p className="mt-3 text-center text-xs leading-relaxed text-app-muted">
            Ponudu možeš da povučeš iz pregleda poslatih ponuda.
          </p>
        </>
      )}
    </BottomSheet>
  );
}
