'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeartHandshake, ArrowLeftRight, Phone, MapPin, Gauge, Fuel, Settings2, Star, Calendar, Zap, Share2, Check, Plus, Info, Pencil, CarFront, ChevronLeft, ChevronRight, Maximize2, ImageOff, Palette } from 'lucide-react';
import { carTitle, formatEuro, formatKm, formatYear } from '@/lib/cars';
import { getTradeLabel } from '@/lib/trade';
import TradeBadge from '@/components/TradeBadge';
import { bodyLabel, fuelLabel, transmissionLabel, vehicleConditionLabel } from '@/lib/labels';
import { carSubtitle, displayValue } from '@/lib/car-row';
import { getCarImages, type Car, type MyGarageCar } from '@/types';
import { EQUIPMENT_CATEGORIES } from '@/lib/equipment';
import { garageErrorMessage, useGarage } from '@/hooks/use-garage';
import { useSaved } from '@/hooks/use-saved';
import { useAuth } from '@/hooks/use-auth';
import { useContactPhone } from '@/hooks/use-contact-phone';
import { contactPhoneMessage } from '@/lib/contact-phone';
import { useSwipes } from '@/hooks/use-swipes';
import { useMatchLike } from '@/hooks/use-match-like';
import { ImageLightbox } from '@/components/ImageLightbox';
import { TradeOfferSheet } from '@/components/TradeOfferSheet';
import { toast } from 'sonner';
import { requestPhoneAction } from '@/hooks/use-phone-gate';
import CarForm from '@/components/CarForm';

/** Shared card chrome, so every block on the page has the same padding. */
const CARD = 'rounded-2xl border border-surface bg-card-surface p-5 shadow-sm dark:border-surface dark:bg-card-surface sm:p-6';
/** Action chip used for the secondary buttons (save, call). */
const CHIP = 'flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-surface bg-elevated text-sm font-semibold text-app-secondary transition-colors hover:bg-hover-surface dark:border-surface';

function knownValue(value: string | null | undefined) {
  const text = displayValue(value);
  return /^(nije navedeno|nije navedena|nepoznato|unknown|n\/a)$/i.test(text) ? '' : text;
}

/**
 * The listing view. The listing itself is resolved on the server (see
 * `page.tsx`), so this component always receives a car and never has to show a
 * client-side "loading" or "not found" state.
 */
export default function CarDetail({ car: listing }: { car: Car }) {
  const router = useRouter();
  const [editedListing, setEditedListing] = useState<MyGarageCar | null>(null);
  const [ownEditOpen, setOwnEditOpen] = useState(false);
  const car = editedListing ?? listing;
  const { cars: garageCars, selectedCar, updateCar, mounted: garageMounted } = useGarage();
  const { save } = useSaved();
  const { isLoggedIn, userId, mounted: authReady, requireAuth } = useAuth();
  const { recordSwipe } = useSwipes();
  const { likeCar, isLiking } = useMatchLike(recordSwipe, save);
  const isOwner = Boolean(authReady && userId && car.ownerId && car.ownerId === userId);
  const ownerContact = useContactPhone(isOwner ? null : { carId: car.id });
  const ownerGarageCar = isOwner ? garageCars.find((garageCar) => garageCar.id === car.id) ?? null : null;
  const showTrade = authReady && isLoggedIn && !isOwner && selectedCar !== null;
  const location = [displayValue(car.city), displayValue(car.country)].filter(Boolean).join(', ');
  const [offerOpen, setOfferOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const [bottomNavHeight, setBottomNavHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!authReady || !isLoggedIn || typeof ResizeObserver === 'undefined') return;
    const navigation = document.querySelector<HTMLElement>('[data-app-bottom-nav]');
    if (!navigation) return;
    const measure = () => setBottomNavHeight(navigation.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(navigation);
    return () => observer.disconnect();
  }, [authReady, isLoggedIn]);

  const currentCar = car;

  async function shareCar() {
    const title = `${carTitle(currentCar)} — ${formatEuro(currentCar.price)}`;
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

  // Only meaningful with a car of your own to compare against.
  const tl = selectedCar && !isOwner ? getTradeLabel(selectedCar, car) : null;
  // Public listing rows contain no phone. Only the targeted server RPC may
  // authorize revealing the current owner's private contact details.
  const contactNote = isOwner || !authReady
    ? null
    : contactPhoneMessage(ownerContact.status);
  const carImages = getCarImages(car).filter(Boolean);
  const imageIndex = Math.min(activeImage, Math.max(0, carImages.length - 1));
  const photo = carImages[imageIndex];
  const changeImage = (direction: number) => {
    if (carImages.length > 1) setActiveImage((imageIndex + direction + carImages.length) % carImages.length);
  };
  // "E60 · Sapphire Black", or nothing when the form left both fields empty.
  const subtitle = carSubtitle(car);
  const condition = vehicleConditionLabel(car.condition);

  const specs = [
    { icon: Gauge, label: 'Kilometraža', value: car.mileage === null ? '' : formatKm(car.mileage) },
    { icon: Fuel, label: 'Gorivo', value: fuelLabel(car.specs.fuelType) },
    { icon: Settings2, label: 'Menjač', value: transmissionLabel(car.specs.transmission) },
    { icon: Calendar, label: 'Godište', value: car.year ? formatYear(car.year) : '' },
    { icon: Zap, label: 'Snaga', value: car.specs.power },
    { icon: Settings2, label: 'Pogon', value: car.specs.drivetrain },
    { icon: CarFront, label: 'Karoserija', value: bodyLabel(car.bodyType) },
    { icon: Palette, label: 'Boja', value: car.color },
  ].filter(({ value }) => knownValue(value));

  const engineDetails = [
    { label: 'Motor', value: car.specs.engine },
    { label: 'Zapremina', value: car.specs.displacement },
    { label: 'Cilindri', value: car.specs.cylinders > 0 ? String(car.specs.cylinders) : 'Nije navedeno' },
    { label: 'Obrtni moment', value: car.specs.torque },
    { label: 'Maks. brzina', value: car.specs.topSpeed },
    { label: '0–100 km/h', value: car.specs.acceleration },
  ].filter(({ value }) => knownValue(value));

  function handleOfferClick() {
    if (isOwner) return;
    const continueToOffer = () => requestPhoneAction(() => {
      if (!selectedCar) {
        toast.error('Prvo dodaj svoj auto u garažu.', {
          description: 'Ponuda za zamenu je razlika između tvog i ovog vozila.',
          action: { label: 'Garaža', onClick: () => router.push('/garage') },
        });
        return;
      }
      setOfferOpen(true);
    });
    if (!requireAuth('Prijavi se da pošalješ ponudu za zamenu', continueToOffer)) return;
    /*
     * Signed in but nothing in the garage: the offer sheet needs a car of your
     * own to state a difference, so it stays shut. Say why and point at the fix
     * instead of letting the button look dead.
     */
    if (!selectedCar) {
      toast.error('Prvo dodaj svoj auto u garažu.', {
        description: 'Ponuda za zamenu je razlika između tvog i ovog vozila.',
        action: { label: 'Garaža', onClick: () => router.push('/garage') },
      });
      return;
    }
    continueToOffer();
  }

  async function handleCall() {
    if (!requireAuth('Prijavi se da proveriš dostupnost broja vlasnika.')) return;
    const contact = await ownerContact.dial();
    const message = contactPhoneMessage(contact.status);
    if (message) toast.message(message);
  }

  function handleOwnListingEdit() {
    if (!garageMounted) return;
    if (!ownerGarageCar) {
      router.push('/garage');
      return;
    }
    setOwnEditOpen(true);
  }

  async function handleOwnListingSave(updatedCar: MyGarageCar) {
    const result = await updateCar(updatedCar);
    if (!result.ok) {
      toast.error(garageErrorMessage(result.error, 'update'));
      return;
    }
    setEditedListing(updatedCar);
    setActiveImage(0);
    setOwnEditOpen(false);
    toast.success('Oglas je ažuriran.');
  }

  const ownerActionLabel = !garageMounted
    ? 'Učitavanje…'
    : ownerGarageCar
      ? 'Uredi oglas'
      : 'Otvori garažu';

  return (
    <div className="pb-24 lg:pb-0">
      <section id="oglas" className="app-container py-4 sm:py-6">
        <nav aria-label="Putanja oglasa" className="mb-4 flex min-w-0 items-center gap-2 text-xs text-app-muted">
          <Link href="/search" className="shrink-0 transition-colors hover:text-app-primary">Oglasi</Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span className="truncate" aria-current="page">{car.brand} {car.model}</span>
        </nav>
        <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6">
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <div className="relative isolate aspect-[4/3] overflow-hidden rounded-2xl border border-surface bg-elevated sm:aspect-[16/10]">
              <button
                type="button"
                aria-label="Uvećaj fotografiju vozila"
                className="absolute inset-0 w-full touch-pan-y cursor-zoom-in"
                onTouchStart={(event) => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; swiped.current = false; }}
                onTouchEnd={(event) => {
                  if (!touchStart.current) return;
                  const dx = event.changedTouches[0].clientX - touchStart.current.x;
                  const dy = event.changedTouches[0].clientY - touchStart.current.y;
                  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { changeImage(dx < 0 ? 1 : -1); swiped.current = true; }
                  touchStart.current = null;
                }}
                onTouchCancel={() => { touchStart.current = null; }}
                onClick={() => { if (swiped.current) { swiped.current = false; return; } if (photo && !failedImages.has(photo)) setLightboxOpen(true); }}
              >
                {photo && !failedImages.has(photo) ? <img src={photo} alt={`${car.brand} ${car.model} — slika ${imageIndex + 1}`} width={1200} height={750} className="h-full w-full object-cover" draggable={false} onError={() => setFailedImages(previous => new Set(previous).add(photo))} /> : <span className="flex h-full flex-col items-center justify-center gap-3 text-app-muted"><ImageOff size={36} aria-hidden="true" /><span className="text-sm">Fotografija nije dostupna</span></span>}
              </button>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
              <span className="pointer-events-none absolute left-3 top-3 rounded-lg bg-black/65 px-3 py-2 text-xs font-semibold tabular-nums text-white" aria-live="polite">{carImages.length ? `${imageIndex + 1} / ${carImages.length}` : 'Bez fotografija'}</span>
              <div className="absolute right-3 top-3 flex gap-2">
                {authReady && !isOwner && <button type="button" onClick={() => void likeCar(car)} disabled={isLiking(car.id)} aria-label={`Lajkuj i sačuvaj ${car.brand} ${car.model}`} title="Lajkuj i sačuvaj za match" className="listing-photo-control disabled:opacity-60"><HeartHandshake size={19} aria-hidden="true" /></button>}
                <button type="button" onClick={shareCar} aria-label="Podeli oglas" className="listing-photo-control"><Share2 size={18} aria-hidden="true" /></button>
              </div>
              {carImages.length > 1 && <>
                <button type="button" onClick={() => changeImage(-1)} aria-label="Prethodna fotografija" className="listing-photo-control absolute left-3 top-1/2 -translate-y-1/2"><ChevronLeft size={23} aria-hidden="true" /></button>
                <button type="button" onClick={() => changeImage(1)} aria-label="Sledeća fotografija" className="listing-photo-control absolute right-3 top-1/2 -translate-y-1/2"><ChevronRight size={23} aria-hidden="true" /></button>
              </>}
              {photo && !failedImages.has(photo) && <span className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-black/65 p-2 text-white"><Maximize2 size={16} aria-hidden="true" /></span>}
            </div>
            {carImages.length > 1 && <div aria-label="Fotografije vozila" className="mt-2.5 flex gap-2 overflow-x-auto overscroll-x-contain pb-1">
              {carImages.map((image, index) => <button key={`${image}-${index}`} type="button" aria-label={`Prikaži fotografiju ${index + 1}`} aria-pressed={imageIndex === index} onClick={() => setActiveImage(index)} className={`relative aspect-[4/3] w-[calc((100%-1.5rem)/4)] max-w-[110px] shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${imageIndex === index ? 'border-brand-500' : 'border-surface hover:border-app-muted'}`}>
                {failedImages.has(image) ? <span className="flex h-full items-center justify-center bg-elevated text-app-muted"><ImageOff size={20} aria-hidden="true" /></span> : <img src={image} alt="" width={160} height={120} loading="lazy" className="h-full w-full object-cover" onError={() => setFailedImages(previous => new Set(previous).add(image))} />}
              </button>)}
            </div>}
          </div>

          <section aria-label="Vozilo i ponuda za zamenu" className={`${CARD} min-w-0 lg:sticky lg:top-[88px] lg:col-start-2 lg:row-start-1`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-app-secondary">{isOwner ? 'Tvoj oglas' : 'Oglas za zamenu'}</span>
              {!car.ownerId && <span className="text-xs text-app-muted">Demo oglas</span>}
            </div>
            <h1 className="mt-3 break-words font-heading text-3xl font-bold leading-tight tracking-tight text-app-primary xl:text-4xl">{car.brand} {car.model}</h1>
            <p className="mt-2 break-words text-sm leading-relaxed text-app-secondary">{[car.year ? formatYear(car.year) : '', knownValue(car.specs.power), car.specs.transmission ? transmissionLabel(car.specs.transmission) : '', car.bodyType ? bodyLabel(car.bodyType) : ''].filter(Boolean).join(' · ')}</p>
            {subtitle && <p className="mt-1 break-words text-xs text-app-muted">{subtitle}</p>}
            <div className="my-5 border-y border-surface py-4">
              <p className="text-xs font-medium text-app-muted">Vrednost vozila</p>
              <p className="mt-1 break-words font-heading text-[2rem] font-bold leading-tight tracking-tight tabular-nums text-app-primary sm:text-4xl">{formatEuro(car.price)}</p>
            </div>
            {!isOwner && <div className="mb-4 rounded-xl border border-surface bg-elevated p-3.5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-app-primary"><ArrowLeftRight size={18} className="shrink-0 text-brand-text" aria-hidden="true" />Poređenje zamene</h2>
              {!authReady || (isLoggedIn && !garageMounted) ? <p role="status" className="mt-2 text-xs text-app-muted">Učitavanje tvog vozila…</p> : showTrade && tl && selectedCar ? <>
                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                  <div className="min-w-0"><p className="text-[11px] text-app-muted">Tvoj auto</p><p className="mt-1 break-words text-sm font-semibold">{selectedCar.brand} {selectedCar.model}</p><p className="mt-1 text-xs tabular-nums text-app-secondary">{formatEuro(selectedCar.price)}</p></div>
                  <ArrowLeftRight size={16} className="text-app-muted" aria-hidden="true" />
                  <div className="min-w-0 text-right"><p className="text-[11px] text-app-muted">Ovaj auto</p><p className="mt-1 break-words text-sm font-semibold">{car.brand} {car.model}</p><p className="mt-1 text-xs tabular-nums text-app-secondary">{formatEuro(car.price)}</p></div>
                </div>
                <TradeBadge trade={tl} className="mt-3 w-full justify-center whitespace-normal rounded-lg px-3 py-2 text-xs" />
                <p className="mt-2 text-[11px] leading-relaxed text-app-muted">Orijentaciona razlika oglašenih vrednosti. Konačnu doplatu dogovarate direktno.</p>
              </> : <>
                <p className="mt-2 text-xs leading-relaxed text-app-secondary">Dodaj svoj auto da vidiš orijentacionu razliku u vrednosti.</p>
                {isLoggedIn ? <Link href="/garage" className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-secondary-accent"><Plus size={16} aria-hidden="true" />Dodaj auto u garažu</Link> : <button type="button" onClick={() => requireAuth('Prijavi se i dodaj svoj auto', undefined, '/?intent=add-car', 'register')} className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-secondary-accent"><Plus size={16} aria-hidden="true" />Dodaj svoj auto</button>}
              </>}
            </div>}
            {isOwner ? <button onClick={handleOwnListingEdit} disabled={!garageMounted} className="btn-primary min-h-[48px] w-full text-sm disabled:opacity-60"><Pencil size={17} aria-hidden="true" />{ownerActionLabel}</button> : authReady && <>
              <button onClick={handleOfferClick} className="btn-primary min-h-[48px] w-full text-sm"><ArrowLeftRight size={19} aria-hidden="true" />Pošalji ponudu</button>
              {ownerContact.href ? <a href={ownerContact.href} onClick={event => { event.preventDefault(); void handleCall(); }} aria-label={`Pozovi ${car.owner.name}`} className={`${CHIP} mt-2 w-full`}><Phone size={17} aria-hidden="true" />Pozovi vlasnika</a> : <button type="button" onClick={() => void handleCall()} title={contactNote ?? undefined} className={`${CHIP} mt-2 w-full`}><Phone size={17} aria-hidden="true" />Pozovi vlasnika</button>}
              {contactNote && <p role="status" className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-app-muted"><Info size={13} className="mt-0.5 shrink-0" aria-hidden="true" />{contactNote}</p>}
            </>}
            {location && <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-app-secondary"><MapPin size={15} className="shrink-0" aria-hidden="true" />{location}</p>}
          </section>

          <div className="min-w-0 space-y-5 lg:col-start-1 lg:row-start-2">
            {specs.length > 0 && <section className={CARD}>
              <h2 className="text-lg font-semibold text-app-primary">Osnovne informacije</h2>
              <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                {specs.map(({icon:Icon,label,value}) => <div key={label} className="min-w-0 rounded-xl bg-elevated p-3"><dt className="flex items-center gap-1.5 text-[11px] text-app-muted"><Icon size={15} className="shrink-0" aria-hidden="true" />{label}</dt><dd className="mt-1.5 break-words text-sm font-semibold leading-snug text-app-primary">{value}</dd></div>)}
              </dl>
              {condition && <p className="mt-4 text-sm text-app-secondary">Stanje: <span className="font-medium text-app-primary">{condition}</span></p>}
            </section>}
            {knownValue(car.description) && <section className={CARD}><h2 className="text-lg font-semibold text-app-primary">Opis vozila</h2><p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-app-secondary">{car.description}</p></section>}
            {engineDetails.length > 0 && <section className={CARD}><h2 className="text-lg font-semibold text-app-primary">Tehnički podaci</h2><dl className="mt-3 divide-y divide-surface">{engineDetails.map(({label,value}) => <div key={label} className="flex min-w-0 items-start justify-between gap-4 py-3 text-sm"><dt className="text-app-muted">{label}</dt><dd className="min-w-0 break-words text-right font-medium text-app-primary">{value}</dd></div>)}</dl></section>}
            {car.equipment && car.equipment.length > 0 && <section className={CARD}><h2 className="text-lg font-semibold text-app-primary">Oprema</h2><div className="mt-4 space-y-4">{EQUIPMENT_CATEGORIES.map(category => {
              const items = category.items.filter(item => car.equipment!.includes(item.id));
              if (!items.length) return null;
              return <div key={category.id}><h3 className="mb-2 text-xs font-semibold text-app-muted">{category.label}</h3><ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">{items.map(item => <li key={item.id} className="flex items-start gap-2 text-sm text-app-secondary"><Check size={15} className="mt-0.5 shrink-0 text-secondary-accent" aria-hidden="true" />{item.label}</li>)}</ul></div>;
            })}</div></section>}
            {car.modifications?.some(knownValue) && <section className={CARD}><h2 className="text-lg font-semibold text-app-primary">Modifikacije</h2><ul className="mt-3 space-y-2">{car.modifications.filter(knownValue).map((mod,index) => <li key={`${index}-${mod}`} className="flex gap-2 break-words text-sm leading-relaxed text-app-secondary"><Check size={15} className="mt-1 shrink-0 text-secondary-accent" aria-hidden="true" /><span className="min-w-0 break-words">{mod}</span></li>)}</ul></section>}
          </div>
          <aside className="min-w-0 lg:col-start-2 lg:row-start-2">
            <section className={CARD}>
              <h2 className="text-lg font-semibold text-app-primary">{isOwner ? 'Tvoj oglas' : 'O vlasniku'}</h2>
              <div className="mt-4 flex min-w-0 items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-elevated font-heading text-lg font-semibold text-app-primary" aria-hidden="true">{car.owner.name?.trim().charAt(0) || 'K'}</span>
                <div className="min-w-0"><p className="break-words font-semibold text-app-primary">{car.owner.name || 'Vlasnik vozila'}</p>{knownValue(car.owner.city) && <p className="mt-1 break-words text-xs text-app-muted">{car.owner.city}</p>}</div>
                {car.ownerId && Number.isFinite(car.owner.rating) && car.owner.rating > 0 && <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg bg-elevated px-2 py-1 text-xs font-semibold text-app-primary" aria-label={`Ocena vlasnika ${car.owner.rating.toFixed(1)} od 5`}><Star size={14} className="text-brand-text" aria-hidden="true" />{car.owner.rating.toFixed(1)}</span>}
              </div>
              {isOwner && <p className="mt-4 text-sm leading-relaxed text-app-secondary">Podatke i fotografije možeš da promeniš dugmetom „Uredi oglas”.</p>}
            </section>
          </aside>
        </div>
      </section>
      {authReady && !lightboxOpen && !offerOpen && !ownEditOpen && <div style={isLoggedIn && bottomNavHeight !== null ? { bottom: bottomNavHeight } : undefined} className={`fixed inset-x-0 z-40 border-t border-surface bg-card-surface px-4 py-3 lg:hidden ${isLoggedIn ? 'bottom-[calc(72px+env(safe-area-inset-bottom))]' : 'bottom-0 pb-[calc(12px+env(safe-area-inset-bottom))]'}`}>
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <p className="min-w-0 shrink-0 font-heading text-lg font-bold tabular-nums text-app-primary">{formatEuro(car.price)}</p>
          {isOwner ? <button onClick={handleOwnListingEdit} disabled={!garageMounted} className="btn-primary min-h-[48px] min-w-0 flex-1 px-3 text-sm disabled:opacity-60"><Pencil size={17} aria-hidden="true" /><span className="truncate">{ownerActionLabel}</span></button> : <button onClick={handleOfferClick} className="btn-primary min-h-[48px] min-w-0 flex-1 px-3 text-sm"><ArrowLeftRight size={18} className="shrink-0" aria-hidden="true" /><span className="truncate">Pošalji ponudu</span></button>}
        </div>
      </div>}
      {lightboxOpen && <ImageLightbox images={carImages} index={imageIndex} onIndexChange={setActiveImage} onClose={() => setLightboxOpen(false)} altPrefix={`${car.brand} ${car.model}`} />}
      {isOwner && ownEditOpen && ownerGarageCar && <CarForm editingCar={ownerGarageCar} onSave={handleOwnListingSave} onCancel={() => setOwnEditOpen(false)} />}
      <TradeOfferSheet car={offerOpen ? car : null} myCar={selectedCar} onClose={() => setOfferOpen(false)} />
    </div>
  );
}
