'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Heart, ArrowLeftRight, Phone, MapPin, Gauge, Fuel, Settings2, Star, Calendar, Eye, Zap, CircleCheck as CheckCircle, X, Share2 } from 'lucide-react';
import { MARKETPLACE_CARS, formatEuro } from '@/lib/cars';
import { Car, MyGarageCar } from '@/types';
import { useGarage } from '@/hooks/use-garage';
import { useMessages } from '@/hooks/use-messages';

function getTradeLabel(myCar: MyGarageCar, other: Car) {
  const diff = other.price - myCar.price;
  if (Math.abs(diff) < 200) return { label: 'Ravna zamena', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
  if (diff > 0) return { label: `Vlasnik doplaćuje ${formatEuro(diff)}`, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' };
  return { label: `Tvoja doplata ${formatEuro(Math.abs(diff))}`, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' };
}

type ModalState = 'closed' | 'offer' | 'success';

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const carId = params.id as string;
  const { selectedCar, mounted: garageMounted } = useGarage();
  const { createConversation } = useMessages();
  const [saved, setSaved] = useState<string[]>([]);
  const [modal, setModal] = useState<ModalState>('closed');
  const [message, setMessage] = useState('');

  const car = MARKETPLACE_CARS.find(c => c.id === carId);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('autotrampa_saved');
      if (stored) setSaved(JSON.parse(stored));
    } catch {}
  }, []);

  if (!car) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <p className="text-app-secondary font-semibold mb-2">Vozilo nije pronađeno</p>
        <Link href="/" className="text-orange-400 text-sm font-semibold">Nazad na Početnu</Link>
      </div>
    );
  }

  const tl = getTradeLabel(selectedCar, car);
  const isSaved = saved.includes(car.id);

  function toggleSave() {
    setSaved(prev => {
      const next = prev.includes(car!.id) ? prev.filter(x => x !== car!.id) : [...prev, car!.id];
      localStorage.setItem('autotrampa_saved', JSON.stringify(next));
      return next;
    });
  }

  function openOffer() {
    setMessage('');
    setModal('offer');
  }

  function sendOffer() {
    if (car) {
      createConversation({
        id: `conv-${car.id}-${Date.now()}`,
        carId: car.id,
        carTitle: `${car.year} ${car.brand} ${car.model} ${car.generation}`,
        carImage: car.image,
        ownerName: car.owner.name,
        tradeSummary: tl.label,
      });
    }
    setModal('success');
  }

  const specs = [
    { icon: Gauge, label: 'Kilometraža', value: `${car.mileage.toLocaleString()} km` },
    { icon: Fuel, label: 'Gorivo', value: car.specs.fuelType },
    { icon: Settings2, label: 'Menjač', value: car.specs.transmission },
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
        <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40" />

        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 z-10 safe-top">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors">
              <Share2 size={16} />
            </button>
            <button
              onClick={toggleSave}
              className={`w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-200 ${
                isSaved ? 'bg-rose-500 text-white' : 'bg-black/70 text-white hover:bg-black/80'
              }`}
            >
              <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <div className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-full border text-xs font-bold ${tl.bg} ${tl.color}`}>
          {tl.label}
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10 space-y-4 pb-4">
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

      <div className="sticky bottom-0 bg-app/95 backdrop-blur-md border-t border-surface px-4 py-3 flex gap-2 safe-bottom">
        <button
          onClick={openOffer}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold rounded-xl py-3 transition-all duration-200 active:scale-95"
        >
          <ArrowLeftRight size={16} />
          Pošalji ponudu za zamenu
        </button>
        <a
          href={`tel:${car.owner.phone}`}
          className="w-12 flex items-center justify-center bg-elevated hover:bg-hover-surface text-app-secondary rounded-xl transition-all duration-200"
        >
          <Phone size={17} />
        </a>
      </div>

      {modal !== 'closed' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModal('closed')} />
          <div className="relative w-full max-w-md bg-card-surface rounded-t-3xl border-t border-surface p-6 safe-bottom">
            {modal === 'offer' ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-app-primary">Ponuda za trampu</h3>
                  <button onClick={() => setModal('closed')} className="w-8 h-8 flex items-center justify-center rounded-full bg-elevated text-app-secondary hover:text-app-primary transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 rounded-xl bg-elevated p-3 text-center">
                    <p className="text-xs text-app-muted mb-1">Tvoj auto</p>
                    <p className="text-sm font-semibold text-app-primary truncate">{selectedCar.brand} {selectedCar.model}</p>
                    <p className="text-orange-400 font-bold text-sm">{formatEuro(selectedCar.price)}</p>
                  </div>
                  <ArrowLeftRight size={20} className="text-app-muted flex-shrink-0" />
                  <div className="flex-1 rounded-xl bg-elevated p-3 text-center">
                    <p className="text-xs text-app-muted mb-1">Njegov auto</p>
                    <p className="text-sm font-semibold text-app-primary truncate">{car.brand} {car.model}</p>
                    <p className="text-orange-400 font-bold text-sm">{formatEuro(car.price)}</p>
                  </div>
                </div>
                <div className={`rounded-xl border px-4 py-2.5 text-center text-sm font-semibold mb-5 ${tl.bg} ${tl.color}`}>
                  {tl.label}
                </div>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Dodaj poruku uz ponudu... (opciono)"
                  className="w-full h-24 bg-elevated border border-surface rounded-xl px-4 py-3 text-sm text-app-primary placeholder:text-app-muted resize-none focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  onClick={sendOffer}
                  className="w-full mt-4 bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl text-sm transition-all duration-200 active:scale-95"
                >
                  Pošalji ponudu
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
                  <CheckCircle size={36} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-app-primary mb-2">Ponuda poslata!</h3>
                <p className="text-sm text-app-secondary text-center mb-1">
                  Tvoja ponuda za <span className="text-app-primary font-medium">{car.brand} {car.model}</span> je poslata korisniku {car.owner.name}.
                </p>
                <p className="text-xs text-app-muted mb-6">Otvori Poruke da nastaviš razgovor.</p>
                <button onClick={() => setModal('closed')} className="w-full bg-elevated hover:bg-hover-surface text-app-primary font-semibold py-3 rounded-xl text-sm transition-colors">
                  Zatvori
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
