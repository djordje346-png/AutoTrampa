"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowLeftRight,
  CarFront,
  Inbox,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import {
  offerActive,
  offerStatus,
  type OfferCar,
  type TradeOffer,
} from "@/lib/trade-offers";
import { fuelLabel, transmissionLabel } from "@/lib/labels";

export function OfferVehicle({
  car,
  id,
  label,
}: {
  car: OfferCar;
  id: string | null;
  label: string;
}) {
  const content = (
    <>
      <div className="aspect-[16/10] overflow-hidden rounded-xl bg-elevated">
        {car.image ? (
          <img
            src={car.image}
            alt={`${car.brand} ${car.model}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <CarFront className="m-auto h-full w-12 text-app-muted" />
        )}
      </div>
      <p className="mt-3 break-words text-base font-bold text-app-primary">
        {car.brand} {car.model}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-app-secondary">
        {[
          car.year,
          car.specs?.fuelType ? fuelLabel(car.specs.fuelType) : "",
          car.specs?.transmission
            ? transmissionLabel(car.specs.transmission)
            : "",
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {car.city && <p className="mt-1 text-xs text-app-muted">{car.city}</p>}
    </>
  );
  return (
    <div className="min-w-0">
      <p className="mb-2 text-xs font-semibold text-app-secondary">{label}</p>
      {id ? (
        <Link
          href={`/car/${id}`}
          aria-label={`Pogledaj ${car.brand} ${car.model}`}
          className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {content}
        </Link>
      ) : (
        <div>
          {content}
          <p className="mt-2 text-xs text-app-muted">
            Oglas više nije dostupan
          </p>
        </div>
      )}
    </div>
  );
}

interface Props {
  offers: TradeOffer[];
  userId: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAction: (
    offer: TradeOffer,
    action: "decline" | "withdraw",
  ) => Promise<void>;
  onMessage: (offer: TradeOffer) => Promise<void>;
  onRead: (id: string) => void;
  busy: boolean;
}
export function OffersInbox({
  offers,
  userId,
  selectedId,
  onSelect,
  onAction,
  onMessage,
  onRead,
  busy,
}: Props) {
  const [direction, setDirection] = useState<"received" | "sent">("received");
  const [desktop, setDesktop] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    offer: TradeOffer;
    action: "decline" | "withdraw";
  } | null>(null);
  const selected = offers.find((offer) => offer.id === selectedId);
  const selectedDirection = selected
    ? selected.sender_id === userId
      ? "sent"
      : "received"
    : null;
  useEffect(() => {
    if (selectedDirection) setDirection(selectedDirection);
  }, [selectedDirection]);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1200px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const filtered = offers.filter((offer) =>
    direction === "received"
      ? offer.recipient_id === userId
      : offer.sender_id === userId,
  );
  const active =
    selected && filtered.some((offer) => offer.id === selected.id)
      ? selected
      : desktop
        ? (filtered[0] ?? null)
        : null;
  const unreadId =
    active && active.recipient_id === userId && !active.recipient_read_at
      ? active.id
      : null;
  useEffect(() => {
    if (unreadId) onRead(unreadId);
  }, [unreadId, onRead]);
  const received = active?.recipient_id === userId;
  return (
    <>
      <div
        className="mb-4 flex flex-wrap items-center gap-2"
        aria-label="Vrsta ponuda"
      >
        {(["received", "sent"] as const).map((value) => (
          <button
            key={value}
            aria-pressed={direction === value}
            onClick={() => {
              setDirection(value);
              onSelect(null);
            }}
            className={`min-h-[44px] rounded-xl px-4 text-sm font-semibold transition-colors ${direction === value ? "bg-brand-500/15 text-app-primary" : "text-app-secondary hover:bg-hover-surface"}`}
          >
            {value === "received" ? "Primljene" : "Poslate"}{" "}
            <span className="ml-1 text-app-muted">
              {
                offers.filter((offer) =>
                  value === "received"
                    ? offer.recipient_id === userId
                    : offer.sender_id === userId,
                ).length
              }
            </span>
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-surface bg-card-surface desktop:grid desktop:min-h-[580px] desktop:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside
          aria-label={
            direction === "received" ? "Primljene ponude" : "Poslate ponude"
          }
          className={`${active ? "hidden desktop:block" : ""} border-surface desktop:border-r`}
        >
          {!filtered.length ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <Inbox size={30} className="mb-4 text-app-muted" />
              <h2 className="font-semibold text-app-primary">
                {direction === "received"
                  ? "Još nema primljenih ponuda"
                  : "Još nisi poslao ponudu"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-app-muted">
                {direction === "received"
                  ? "Kada neko ponudi svoj automobil za tvoj, ponuda će biti ovde."
                  : "Pronađi automobil i klikni na „Pošalji ponudu“."}
              </p>
              <Link
                href="/search"
                className="mt-5 text-sm font-semibold text-brand-text"
              >
                Pogledaj oglase
              </Link>
            </div>
          ) : (
            filtered.map((offer) => {
              const incoming = offer.recipient_id === userId;
              const car = incoming ? offer.offered_car : offer.target_car;
              const unread =
                incoming && !offer.recipient_read_at && offerActive(offer);
              return (
                <button
                  key={offer.id}
                  onClick={() => onSelect(offer.id)}
                  aria-pressed={active?.id === offer.id}
                  className={`flex w-full gap-3 border-b border-surface p-4 text-left transition-colors last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 ${active?.id === offer.id ? "bg-brand-500/10" : "hover:bg-hover-surface"}`}
                >
                  <div className="h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-elevated">
                    {car.image ? (
                      <img
                        src={car.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <CarFront className="m-auto h-full text-app-muted" />
                    )}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-app-primary">
                        {incoming ? offer.sender_name : offer.recipient_name}
                      </span>
                      {unread && (
                        <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-on-accent">
                          Nova
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block truncate text-xs text-app-secondary">
                      {car.brand} {car.model}
                    </span>
                    <span className="mt-1 block text-xs text-app-muted">
                      {offerStatus(offer)}
                    </span>
                    <time
                      dateTime={offer.created_at}
                      className="mt-1 block text-[11px] text-app-muted"
                    >
                      {new Date(offer.created_at).toLocaleDateString("sr-Latn-RS")}
                    </time>
                  </span>
                </button>
              );
            })
          )}
        </aside>
        {active ? (
          <section
            aria-label="Detalji ponude"
            className="min-w-0 p-4 sm:p-6 lg:p-7"
          >
            <button
              onClick={() => onSelect(null)}
              className="mb-4 flex min-h-[44px] items-center gap-2 text-sm font-semibold text-app-secondary desktop:hidden"
            >
              <ArrowLeft size={17} />
              Nazad na ponude
            </button>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl font-bold text-app-primary">
                  {received
                    ? `${active.sender_name} ti nudi zamenu`
                    : "Tvoja ponuda za zamenu"}
                </h2>
                <p className="mt-1 text-xs text-app-muted">
                  {new Date(active.created_at).toLocaleString("sr-Latn-RS", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span className="rounded-full bg-elevated px-3 py-1.5 text-xs font-semibold text-app-secondary">
                {offerStatus(active)}
              </span>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_20px_minmax(0,1fr)] gap-3 sm:gap-5">
              <OfferVehicle
                car={active.offered_car}
                id={active.offered_car_id}
                label={received ? `${active.sender_name} nudi` : "Ti nudiš"}
              />
              <ArrowLeftRight
                size={20}
                className="mt-16 text-app-muted sm:mt-24"
                aria-hidden="true"
              />
              <OfferVehicle
                car={active.target_car}
                id={active.target_car_id}
                label={received ? "Za tvoj automobil" : "Za automobil vlasnika"}
              />
            </div>
            <div className="mt-6 rounded-xl bg-brand-500/10 px-4 py-4">
              <p className="text-base font-bold text-app-primary">
                Doplata po dogovoru
              </p>
              <p className="mt-1 text-sm text-app-secondary">
                Iznos doplate i pregled vozila dogovarate u porukama.
              </p>
            </div>
            {active.note && (
              <div className="mt-5">
                <h3 className="text-xs font-semibold text-app-muted">
                  Napomena uz ponudu
                </h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-app-primary">
                  {active.note}
                </p>
              </div>
            )}
            {offerActive(active) ? (
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => void onMessage(active)}
                  disabled={busy}
                  className="btn-primary min-h-[46px] flex-1 text-sm disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <MessageCircle size={17} />
                  )}{" "}
                  {active.conversation_id
                    ? "Otvori razgovor"
                    : "Pošalji poruku"}
                </button>
                <button
                  onClick={() =>
                    setConfirmation({
                      offer: active,
                      action: received ? "decline" : "withdraw",
                    })
                  }
                  disabled={busy}
                  className="min-h-[46px] rounded-xl border border-surface px-4 text-sm font-semibold text-app-secondary hover:bg-hover-surface disabled:opacity-60"
                >
                  {received ? "Odbij ponudu" : "Povuci ponudu"}
                </button>
              </div>
            ) : (
              <p className="mt-6 text-sm text-app-muted">
                {active.status === "declined"
                  ? "Ponuda je odbijena."
                  : active.status === "withdrawn"
                    ? "Pošiljalac je povukao ovu ponudu."
                    : "Jedno od vozila više nije dostupno."}{" "}
                Postojeće poruke ostaju u Razgovorima.
              </p>
            )}
          </section>
        ) : (
          <div className="hidden min-h-[500px] flex-col items-center justify-center px-8 text-center desktop:flex">
            <ArrowLeftRight size={34} className="mb-4 text-app-muted" />
            <h2 className="text-lg font-semibold text-app-primary">
              Sve ponude za zamenu na jednom mestu
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-app-muted">
              Izaberi ponudu da pogledaš automobile i započneš dogovor sa
              vlasnikom.
            </p>
          </div>
        )}
      </div>
      <BottomSheet
        open={Boolean(confirmation)}
        onClose={() => {
          if (!busy) setConfirmation(null);
        }}
        title={
          confirmation?.action === "decline"
            ? "Odbiti ponudu?"
            : "Povući ponudu?"
        }
      >
        <p className="text-sm leading-relaxed text-app-secondary">
          {confirmation?.action === "decline"
            ? "Pošiljalac će videti da ti ova ponuda ne odgovara."
            : "Druga strana će videti da ponuda više nije aktivna."}{" "}
          Vaši razgovori ostaju sačuvani.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            className="min-h-[44px] flex-1 rounded-xl bg-elevated text-sm font-semibold text-app-primary"
            disabled={busy}
            onClick={() => setConfirmation(null)}
          >
            Odustani
          </button>
          <button
            disabled={busy}
            className="btn-primary flex-1 text-sm disabled:opacity-60"
            onClick={async () => {
              if (confirmation) {
                await onAction(confirmation.offer, confirmation.action);
                setConfirmation(null);
              }
            }}
          >
            {busy
              ? "Čuvam…"
              : confirmation?.action === "decline"
                ? "Odbij ponudu"
                : "Povuci ponudu"}
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
