'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, ArrowLeftRight, Phone, MapPin, Gauge, Fuel, Settings2, Star, Calendar, Eye, Zap, CircleCheck as CheckCircle, X, Share2, Check } from 'lucide-react';
import { formatEuro, formatKm } from '@/lib/cars';
import { getTradeLabel } from '@/lib/trade';
import { fuelLabel, transmissionLabel } from '@/lib/labels';
import { getCarImages, type Car } from '@/types';
import { EQUIPMENT_CATEGORIES } from '@/lib/equipment';
import { useGarage } from '@/hooks/use-garage';
import { useSaved } from '@/hooks/use-saved';
import { ImageLightbox } from '@/components/ImageLightbox';
import { TradeOfferSheet } from '@/components/TradeOfferSheet';
import { toast } from 'sonner';

export default function CarDetail({ car }: { car: Car }) {
  const router = useRouter();
  const { selectedCar, mounted: garageMounted } = useGarage();
  const { isSaved: isCarSaved, toggleSave } = useSaved();
  const [offerOpen, setOfferOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  async function shareCar() {
    const title = `${car.year} ${car.brand} ${car.model} — ${formatEuro(car.price)}`;
    const url = typeof window !== 'undefined' ? window.location.href : '';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: `${title} · ${car.city}`, url });
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

  return (
    <div className="flex flex-col min-h-screen">
      <div className="relative h-72">
        <div
          className="relative w-full h-full overflow-hidden cursor-pointer"
          onClick={() => setLightboxOpen(true)}
        >
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${activeImage * 100}%)` }}
          >
            {carImages.map((img, i) => (
              <img key={i} src={img} alt={`${car.brand} ${car.model} - slika ${i + 1}`} className="w-full h-full object-cover flex-shrink-0" />
            ))}
          </div>

          {carImages.length > 1 && (
            <>
              <div
                className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {carImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`h-1.5 rounded-full transition-all ${i === activeImage ? 'w-5 bg-orange-500' : 'w-1.5 bg-white/60'}`}
                  />
                ))}
              </div>
              <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 z-10">
                <span className="text-[10px] font-bold text-white">{activeImage + 1} / {carImages.length}</span>
              </div>
            </>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40 pointer-events-none" />

        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 z-10 safe-top">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={shareCar}
              aria-label="Podeli oglas"
              className="w-9 h-9 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            >
              <Share2 size={16} />
            </button>
            <button
              onClick={() => toggleSave(car.id)}
              className={`w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-200 ${
                isSaved ? 'bg-rose-500 text-white' : 'bg-black/70 text-white hover:bg-black/80'
              }`}
            >
              <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

      </div>

      <div className="px-4 -mt-4 relative z-10 space-y-4 pb-4">
        <div className="flex justify-center">
          <div className={`inline-flex items-center px-4 py-2 rounded-full border text-xs font-bold ${tl.bg} ${tl.color}`}>
            {tl.label}
          </div>
        </div>
        <div className="bg-card-surface rounded-2xl border border-surface p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-xl font-black text-app-primary tracking-tight">
                {car.year} {car.brand} {car.model}
              </h1>
              <p className="text-sm text-app-muted mt-0.5">{car.generation} · {car.color}</p>
            </div>
            <p className="text-orange-400 font-black text-2xl">{formatEuro(car.price)}</p>
          </div>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-surface">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-black text-white">{car.owner.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-app-primary">{car.owner.name}</p>
              <div className="flex items-center gap-1">
                <Star size={11} className="text-orange-400 fill-orange-400" />
                <span className="text-xs text-app-muted">{car.owner.rating} · {car.owner.city}</span>
              </div>
            </div>
            <a
              href={`tel:${car.owner.phone}`}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-elevated text-app-secondary hover:text-orange-400 transition-colors"
            >
              <Phone size={15} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {specs.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-card-surface rounded-xl border border-surface p-3 text-center">
              <Icon size={16} className="text-orange-400 mx-auto mb-1.5" />
              <p className="text-[10px] text-app-muted uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-xs font-bold text-app-primary leading-tight">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-card-surface rounded-2xl border border-surface p-4">
          <p className="text-xs font-bold text-app-muted uppercase tracking-widest mb-2">Opis</p>
          <p className="text-sm text-app-secondary leading-relaxed">{car.description}</p>
        </div>

        <div className="bg-card-surface rounded-2xl border border-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-surface">
            <p className="text-xs font-bold text-app-muted uppercase tracking-widest">Motor i performanse</p>
          </div>
          <div className="divide-y divide-surface">
            {engineDetails.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-app-muted">{label}</span>
                <span className="text-xs font-semibold text-app-secondary">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {car.equipment && car.equipment.length > 0 && (
          <div className="bg-card-surface rounded-2xl border border-surface p-4">
            <p className="text-xs font-bold text-app-muted uppercase tracking-widest mb-3">Oprema vozila</p>
            <div className="space-y-3">
              {EQUIPMENT_CATEGORIES.map((category) => {
                const items = category.items.filter((item) => car.equipment!.includes(item.id));
                if (items.length === 0) return null;
                const CatIcon = category.icon;
                return (
                  <div key={category.id}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <CatIcon size={12} className="text-orange-400" />
                      <p className="text-[10px] font-bold text-app-secondary uppercase tracking-wider">{category.label}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((item) => (
                        <span key={item.id} className="inline-flex items-center gap-1 bg-elevated border border-surface rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-app-secondary">
                          <Check size={11} className="text-emerald-400" />
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {car.modifications && car.modifications.length > 0 && (
          <div className="bg-card-surface rounded-2xl border border-surface p-4">
            <p className="text-xs font-bold text-app-muted uppercase tracking-widest mb-3">Modifikacije</p>
            <div className="space-y-2">
              {car.modifications.map(mod => (
                <div key={mod} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                  <p className="text-xs text-app-secondary">{mod}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {garageMounted && (
          <div className="bg-card-surface rounded-2xl border border-surface p-4">
            <p className="text-xs font-bold text-app-muted uppercase tracking-widest mb-3">Poređenje zamene</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-xl bg-elevated p-3 text-center">
                <p className="text-[10px] text-app-muted mb-1">Tvoj auto</p>
                <p className="text-sm font-semibold text-app-primary truncate">{selectedCar.brand} {selectedCar.model}</p>
                <p className="text-orange-400 font-bold text-sm">{formatEuro(selectedCar.price)}</p>
              </div>
              <ArrowLeftRight size={18} className="text-app-muted flex-shrink-0" />
              <div className="flex-1 rounded-xl bg-elevated p-3 text-center">
                <p className="text-[10px] text-app-muted mb-1">Ovaj auto</p>
                <p className="text-sm font-semibold text-app-primary truncate">{car.brand} {car.model}</p>
                <p className="text-orange-400 font-bold text-sm">{formatEuro(car.price)}</p>
              </div>
            </div>
            <div className={`rounded-xl border px-4 py-2 text-center text-sm font-semibold mt-3 ${tl.bg} ${tl.color}`}>
              {tl.label}
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-app border-t border-surface px-4 py-3 flex gap-2 safe-bottom">
        <button
          onClick={() => setOfferOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-xs sm:text-sm font-bold rounded-xl py-3 transition-all duration-200 active:scale-95"
        >
          <ArrowLeftRight size={16} className="flex-shrink-0" />
          <span className="truncate">Pošalji ponudu za zamenu</span>
        </button>
        <a
          href={`tel:${car.owner.phone}`}
          className="w-12 flex items-center justify-center bg-elevated hover:bg-hover-surface text-app-secondary rounded-xl transition-all duration-200 flex-shrink-0"
        >
          <Phone size={17} />
        </a>
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
