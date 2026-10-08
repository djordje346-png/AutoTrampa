'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, ArrowLeftRight, Phone, MapPin, Gauge, Fuel, Settings2, Star, Calendar, Eye, Zap, Share2, Check } from 'lucide-react';
import { formatEuro, formatKm } from '@/lib/cars';
import { getTradeLabel } from '@/lib/trade';
import { fuelLabel, transmissionLabel } from '@/lib/labels';
import { getCarImages, type Car } from '@/types';
import { EQUIPMENT_CATEGORIES } from '@/lib/equipment';
import { useGarage } from '@/hooks/use-garage';
import { useSaved } from '@/hooks/use-saved';
import { useAuth } from '@/hooks/use-auth';
import { ImageLightbox } from '@/components/ImageLightbox';
import { TradeOfferSheet } from '@/components/TradeOfferSheet';
import { toast } from 'sonner';

/**
 * The listing view. The listing itself is resolved on the server (see
 * `page.tsx`), so this component always receives a car and never has to show a
 * client-side "loading" or "not found" state.
 */
export default function CarDetail({ car }: { car: Car }) {
  const router = useRouter();
  const { selectedCar, mounted: garageMounted } = useGarage();
  const { isSaved: isCarSaved, toggleSave } = useSaved();
  const { isLoggedIn, mounted: authReady, requireAuth } = useAuth();
  const showTrade = authReady && isLoggedIn;
  const [offerOpen, setOfferOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const currentCar = car;

  async function shareCar() {
    const title = `${currentCar.year} ${currentCar.brand} ${currentCar.model} — ${formatEuro(currentCar.price)}`;
    const url = typeof window !== 'undefined' ? window.location.href : '';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: `${title} · ${currentCar.city}`, url });
        return;
      } catch {
        // user dismissed the share sheet — fall through to copying
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link kopiran.');
    } catch {
      toast.error('Deljenje nije podržano na ovom uređaju.');
    }
  }

  const tl = getTradeLabel(selectedCar, car);
  const isSaved = isCarSaved(car.id);
  const carImages = getCarImages(car);

  const specs = [
    { icon: Gauge, label: 'Kilometraža', value: formatKm(car.mileage) },
    { icon: Fuel, label: 'Gorivo', value: fuelLabel(car.specs.fuelType) },
    { icon: Settings2, label: 'Menjač', value: transmissionLabel(car.specs.transmission) },
    { icon: Calendar, label: 'Godina', value: String(car.year) },
    { icon: Zap, label: 'Snaga', value: car.specs.power },
    { icon: Eye, label: 'Pogon', value: car.specs.drivetrain },
  ];

  const engineDetails = [
    { label: 'Motor', value: car.specs.engine },
    { label: 'Zapremina', value: car.specs.displacement },
    { label: 'Cilindri', value: String(car.specs.cylinders) },
    { label: 'Obrtni moment', value: car.specs.torque },
    { label: 'Maks. brzina', value: car.specs.topSpeed },
    { label: '0–100 km/h', value: car.specs.acceleration },
  ];

  function handleOfferClick() {
    if (!requireAuth('Prijavi se da pošalješ ponudu za zamenu', () => setOfferOpen(true))) return;
    setOfferOpen(true);
  }

  return (
    <div className="min-h-screen pb-32 md:pb-10">
      <section id="oglas" className="mx-auto w-full max-w-7xl px-4 pb-10 pt-5 sm:px-6 sm:pb-12 sm:pt-7 lg:px-8 lg:pt-8">
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)] lg:items-stretch lg:gap-8 xl:gap-10">
          <section className="min-w-0">
            <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-surface bg-black shadow-sm dark:border-zinc-800 sm:aspect-[16/10] sm:rounded-3xl lg:aspect-square xl:aspect-[4/3]">
              <div
                className="flex h-full cursor-zoom-in transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${activeImage * 100}%)` }}
                onClick={() => setLightboxOpen(true)}
              >
                {carImages.map((img, i) => (
                  <img key={i} src={img} alt={`${car.brand} ${car.model} - slika ${i + 1}`} className="h-full w-full flex-shrink-0 object-cover" />
                ))}
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

              <div className="safe-top absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3 sm:p-4">
                <button
                  onClick={() => router.back()}
                  aria-label="Nazad"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/75"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={shareCar}
                    aria-label="Podeli oglas"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/75"
                  >
                    <Share2 size={16} />
                  </button>
                  {carImages.length > 1 && (
                    <span className="flex items-center rounded-full bg-black/60 px-3 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
                      {activeImage + 1} / {carImages.length}
                    </span>
                  )}
                </div>
              </div>

              {carImages.length > 1 && (
                <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center gap-1.5 p-4" onClick={(e) => e.stopPropagation()}>
                  {carImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      aria-label={`Prikaži sliku ${i + 1}`}
                      aria-current={i === activeImage}
                      className={`h-1.5 rounded-full transition-all ${i === activeImage ? 'w-6 bg-brand-500' : 'w-1.5 bg-white/70 hover:bg-white'}`}
                    />
                  ))}
                </div>
              )}
            </div>

          </section>

          <aside className="flex min-w-0 flex-col rounded-2xl border border-surface bg-card-surface p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-3xl sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-text">
                Oglas za zamenu
              </span>
              {showTrade && (
                <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${tl.bg} ${tl.color}`}>
                  {tl.label}
                </span>
              )}
              {!car.ownerId && (
                <span className="rounded-full border border-surface bg-elevated px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-app-muted">
                  Demo oglas
                </span>
              )}
            </div>

            <div className="mt-3 min-w-0 sm:mt-4">
              <h1 className="break-words text-[1.65rem] font-black leading-[1.08] tracking-tight text-app-primary dark:text-zinc-100 sm:text-2xl lg:text-3xl">
                {car.year} {car.brand} {car.model}
              </h1>
              <p className="mt-1 text-sm text-app-muted">{car.generation} · {car.color}</p>
              <p className="mt-2 inline-flex items-center gap-2 text-sm text-app-secondary dark:text-zinc-400">
                <MapPin size={15} className="shrink-0 text-app-muted" />
                {car.city}, {car.country}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 border-y border-surface py-3 dark:border-zinc-800 sm:grid-cols-3 sm:gap-2 sm:py-3">
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className="min-w-0 rounded-xl bg-elevated/70 p-2 sm:p-2.5">
                  <div className="flex min-w-0 items-center gap-1">
                    <Icon size={13} className="shrink-0 text-brand-text" />
                    <p className="truncate text-[8px] font-semibold uppercase leading-tight tracking-wider text-app-muted sm:text-[9px]">{label}</p>
                  </div>
                  <p className="mt-1 truncate pl-4 text-[10px] font-bold leading-tight text-app-primary dark:text-zinc-100 sm:text-[11px]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-2xl bg-elevated/70 px-4 py-3 sm:px-4 sm:py-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-app-muted">Cena vozila</p>
              <p className="mt-0.5 tabular-nums text-3xl font-black tracking-tight text-app-primary dark:text-zinc-100 sm:text-3xl">{formatEuro(car.price)}</p>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <button onClick={handleOfferClick} className="btn-primary hidden min-h-11 w-full text-sm md:flex">
                <ArrowLeftRight size={17} className="shrink-0" />
                Pošalji ponudu
              </button>
              <div className={car.owner.phone ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1'}>
                <button
                  onClick={() => toggleSave(car.id)}
                  aria-pressed={isSaved}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all duration-200 ${isSaved ? 'border-brand-500/40 bg-brand-500/10 text-brand-text' : 'border-surface bg-elevated text-app-secondary hover:bg-hover-surface dark:border-zinc-800'}`}
                >
                  <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
                  {isSaved ? 'Sačuvano' : 'Sačuvaj'}
                </button>
                {car.owner.phone && (
                  <a href={`tel:${car.owner.phone}`} aria-label={`Pozovi ${car.owner.name}`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-surface bg-elevated px-4 text-sm font-semibold text-app-secondary transition-all duration-200 hover:bg-hover-surface hover:text-brand-text dark:border-zinc-800">
                    <Phone size={17} />
                    <span>Pozovi</span>
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6 grid min-w-0 grid-cols-1 items-start gap-5 sm:mt-7 sm:gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)] lg:gap-7">
          <div className="min-w-0 space-y-5 sm:space-y-6">
            <section className="rounded-2xl border border-brand-500/25 bg-brand-500/5 p-5 sm:rounded-3xl sm:p-7">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-text">
                  <ArrowLeftRight size={19} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-brand-text">Dogovor o zameni</p>
                  <h2 className="mt-1 text-lg font-bold text-app-primary dark:text-zinc-100 sm:text-xl">Šta vlasnik traži?</h2>
                  <p className="mt-2 text-sm leading-relaxed text-app-secondary dark:text-zinc-400">
                    Vlasnik prima ponude za zamenu. Predstavi automobil koji nudiš, a detalje dogovorite direktno kroz ponudu.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-surface bg-card-surface p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-3xl sm:p-7">
              <p className="text-[11px] font-bold uppercase tracking-widest text-app-muted">Opis oglasa</p>
              <h2 className="mt-1 text-lg font-bold text-app-primary dark:text-zinc-100">O automobilu</h2>
              <p className="mt-4 whitespace-pre-line break-words text-sm leading-7 text-app-secondary dark:text-zinc-400 sm:mt-5 sm:text-base">{car.description}</p>
            </section>

            <section className="overflow-hidden rounded-3xl border border-surface bg-card-surface shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-surface px-5 py-5 dark:border-zinc-800 sm:px-7 sm:py-6">
                <p className="text-[11px] font-bold uppercase tracking-widest text-app-muted">Tehnički podaci</p>
                <h2 className="mt-1 text-lg font-bold text-app-primary dark:text-zinc-100">Motor i performanse</h2>
              </div>
              <div className="divide-y divide-surface dark:divide-zinc-800">
                {engineDetails.map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-7">
                    <span className="text-sm text-app-muted">{label}</span>
                    <span className="text-right text-sm font-semibold text-app-secondary dark:text-zinc-400">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            {car.equipment && car.equipment.length > 0 && (
              <section className="rounded-3xl border border-surface bg-card-surface p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                <p className="text-[11px] font-bold uppercase tracking-widest text-app-muted">Komfor i bezbednost</p>
                <h2 className="mt-1 text-lg font-bold text-app-primary dark:text-zinc-100">Oprema vozila</h2>
                <div className="mt-5 space-y-5">
                  {EQUIPMENT_CATEGORIES.map((category) => {
                    const items = category.items.filter((item) => car.equipment!.includes(item.id));
                    if (items.length === 0) return null;
                    const CatIcon = category.icon;
                    return (
                      <div key={category.id}>
                        <div className="mb-2 flex items-center gap-2">
                          <CatIcon size={14} className="text-brand-text" />
                          <p className="text-[11px] font-bold uppercase tracking-wider text-app-secondary dark:text-zinc-400">{category.label}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {items.map((item) => (
                            <span key={item.id} className="inline-flex items-center gap-1.5 rounded-xl border border-surface bg-elevated px-3 py-2 text-xs font-medium text-app-secondary dark:border-zinc-800 dark:text-zinc-400">
                              <Check size={12} className="text-brand-text" />
                              {item.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {car.modifications && car.modifications.length > 0 && (
              <section className="rounded-3xl border border-surface bg-card-surface p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                <p className="text-[11px] font-bold uppercase tracking-widest text-app-muted">Dodatno</p>
                <h2 className="mt-1 text-lg font-bold text-app-primary dark:text-zinc-100">Modifikacije</h2>
                <ul className="mt-4 space-y-3">
                  {car.modifications.map((mod) => (
                    <li key={mod} className="flex items-start gap-2.5 text-sm leading-relaxed text-app-secondary dark:text-zinc-400">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                      {mod}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {garageMounted && showTrade && (
              <section className="rounded-3xl border border-surface bg-card-surface p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                <p className="text-[11px] font-bold uppercase tracking-widest text-app-muted">Za prijavljene korisnike</p>
                <h2 className="mt-1 text-lg font-bold text-app-primary dark:text-zinc-100">Poređenje zamene</h2>
                <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
                  <div className="min-w-0 rounded-2xl bg-elevated p-3 text-center sm:p-4">
                    <p className="text-[10px] text-app-muted">Tvoj auto</p>
                    <p className="mt-1 truncate text-sm font-semibold text-app-primary dark:text-zinc-100">{selectedCar.brand} {selectedCar.model}</p>
                    <p className="mt-1 text-sm font-bold text-app-primary dark:text-zinc-100">{formatEuro(selectedCar.price)}</p>
                  </div>
                  <ArrowLeftRight size={18} className="text-app-muted" />
                  <div className="min-w-0 rounded-2xl bg-elevated p-3 text-center sm:p-4">
                    <p className="text-[10px] text-app-muted">Ovaj auto</p>
                    <p className="mt-1 truncate text-sm font-semibold text-app-primary dark:text-zinc-100">{car.brand} {car.model}</p>
                    <p className="mt-1 text-sm font-bold text-app-primary dark:text-zinc-100">{formatEuro(car.price)}</p>
                  </div>
                </div>
                <div className={`mt-3 rounded-xl border px-4 py-2.5 text-center text-sm font-semibold ${tl.bg} ${tl.color}`}>
                  {tl.label}
                </div>
              </section>
            )}
          </div>

          <aside className="min-w-0 space-y-5 sm:space-y-6 lg:sticky lg:top-6">
            <section className="rounded-3xl border border-surface bg-card-surface p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-app-muted">Prodavac</p>
              <h2 className="mt-1 text-lg font-bold text-app-primary dark:text-zinc-100">O vlasniku</h2>
              <div className="mt-4 flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-zinc-950">
                  <span className="text-base font-black">{car.owner.name[0]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-app-primary dark:text-zinc-100">{car.owner.name}</p>
                  <p className="mt-0.5 text-xs text-app-muted">Član AutoTrampe</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-full bg-elevated px-2.5 py-1.5">
                  <Star size={13} className="fill-brand-500 text-brand-500" />
                  <span className="text-xs font-bold text-app-primary dark:text-zinc-100">{car.owner.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-surface pt-4 dark:border-zinc-800">
                <span className="text-sm text-app-muted">Ocena vlasnika</span>
                <span className="text-sm font-semibold text-app-secondary dark:text-zinc-400">{car.owner.rating.toFixed(1)} / 5</span>
              </div>
              {car.owner.phone && (
                <a href={`tel:${car.owner.phone}`} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-surface bg-elevated text-sm font-semibold text-app-secondary transition-colors hover:bg-hover-surface hover:text-brand-text dark:border-zinc-800">
                  <Phone size={16} />
                  Pozovi vlasnika
                </a>
              )}
            </section>

            <section className="rounded-3xl border border-surface bg-card-surface p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-app-muted">Preuzimanje vozila</p>
              <h2 className="mt-1 text-lg font-bold text-app-primary dark:text-zinc-100">Lokacija</h2>
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-elevated p-4">
                <MapPin size={18} className="mt-0.5 shrink-0 text-brand-text" />
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-app-primary dark:text-zinc-100">{car.city}</p>
                  <p className="mt-0.5 text-xs text-app-muted">{car.country}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-t border-surface bg-app/95 px-4 py-3 shadow-lg backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex w-full max-w-md gap-2">
          <button onClick={handleOfferClick} className="btn-primary min-h-12 min-w-0 flex-1 text-sm">
            <ArrowLeftRight size={16} className="shrink-0" />
            <span className="truncate">Pošalji ponudu</span>
          </button>
          {car.owner.phone && (
            <a href={`tel:${car.owner.phone}`} aria-label={`Pozovi ${car.owner.name}`} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-surface bg-elevated text-app-secondary hover:text-brand-text dark:border-zinc-800">
              <Phone size={17} />
            </a>
          )}
        </div>
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={carImages}
          index={activeImage}
          onIndexChange={setActiveImage}
          onClose={() => setLightboxOpen(false)}
          altPrefix={`${car.brand} ${car.model}`}
        />
      )}

      <TradeOfferSheet
        car={offerOpen ? car : null}
        myCar={selectedCar}
        onClose={() => setOfferOpen(false)}
      />
    </div>
  );
}

