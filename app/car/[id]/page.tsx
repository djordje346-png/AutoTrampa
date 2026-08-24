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
        <p className="text-zinc-400 font-semibold mb-2">Vozilo nije pronađeno</p>
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
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-zinc-950/40" />

        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 z-10 safe-top">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-full bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center text-white hover:bg-zinc-800 transition-colors">
              <Share2 size={16} />
            </button>
            <button
              onClick={toggleSave}
              className={`w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-200 ${
                isSaved ? 'bg-rose-500 text-white' : 'bg-zinc-900/70 text-white hover:bg-zinc-800'
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
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">
                {car.year} {car.brand} {car.model}
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">{car.generation} · {car.color}</p>
            </div>
            <p className="text-orange-400 font-black text-2xl">{formatEuro(car.price)}</p>
          </div>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-800">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-black text-zinc-950">{car.owner.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{car.owner.name}</p>
              <div className="flex items-center gap-1">
                <Star size={11} className="text-orange-400 fill-orange-400" />
                <span className="text-xs text-zinc-500">{car.owner.rating} · {car.owner.city}</span>
              </div>
            </div>
            <a
              href={`tel:${car.owner.phone}`}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 hover:text-orange-400 transition-colors"
            >
              <Phone size={15} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {specs.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-zinc-900 rounded-xl border border-zinc-800 p-3 text-center">
              <Icon size={16} className="text-orange-400 mx-auto mb-1.5" />
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-xs font-bold text-white leading-tight">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Opis</p>
          <p className="text-sm text-zinc-300 leading-relaxed">{car.description}</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Motor i performanse</p>
          </div>
          <div className="divide-y divide-zinc-800">
            {engineDetails.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-zinc-500">{label}</span>
                <span className="text-xs font-semibold text-zinc-200">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {car.modifications && car.modifications.length > 0 && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Modifikacije</p>
            <div className="space-y-2">
              {car.modifications.map(mod => (
                <div key={mod} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                  <p className="text-xs text-zinc-300">{mod}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {garageMounted && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Poređenje zamene</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-xl bg-zinc-800 p-3 text-center">
                <p className="text-[10px] text-zinc-500 mb-1">Tvoj auto</p>
                <p className="text-sm font-semibold text-white truncate">{selectedCar.brand} {selectedCar.model}</p>
                <p className="text-orange-400 font-bold text-sm">{formatEuro(selectedCar.price)}</p>
              </div>
              <ArrowLeftRight size={18} className="text-zinc-500 flex-shrink-0" />
              <div className="flex-1 rounded-xl bg-zinc-800 p-3 text-center">
                <p className="text-[10px] text-zinc-500 mb-1">Ovaj auto</p>
                <p className="text-sm font-semibold text-white truncate">{car.brand} {car.model}</p>
                <p className="text-orange-400 font-bold text-sm">{formatEuro(car.price)}</p>
              </div>
            </div>
            <div className={`rounded-xl border px-4 py-2 text-center text-sm font-semibold mt-3 ${tl.bg} ${tl.color}`}>
              {tl.label}
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 px-4 py-3 flex gap-2 safe-bottom">
        <button
          onClick={openOffer}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-zinc-950 text-sm font-bold rounded-xl py-3 transition-all duration-200 active:scale-95"
        >
          <ArrowLeftRight size={16} />
          Pošalji ponudu za zamenu
        </button>
        <a
          href={`tel:${car.owner.phone}`}
          className="w-12 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all duration-200"
        >
          <Phone size={17} />
        </a>
      </div>

      {modal !== 'closed' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setModal('closed')} />
          <div className="relative w-full max-w-md bg-zinc-900 rounded-t-3xl border-t border-zinc-700 p-6 safe-bottom">
            {modal === 'offer' ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-white">Ponuda za trampu</h3>
                  <button onClick={() => setModal('closed')} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 rounded-xl bg-zinc-800 p-3 text-center">
                    <p className="text-xs text-zinc-500 mb-1">Tvoj auto</p>
                    <p className="text-sm font-semibold text-white truncate">{selectedCar.brand} {selectedCar.model}</p>
                    <p className="text-orange-400 font-bold text-sm">{formatEuro(selectedCar.price)}</p>
                  </div>
                  <ArrowLeftRight size={20} className="text-zinc-500 flex-shrink-0" />
                  <div className="flex-1 rounded-xl bg-zinc-800 p-3 text-center">
                    <p className="text-xs text-zinc-500 mb-1">Njegov auto</p>
                    <p className="text-sm font-semibold text-white truncate">{car.brand} {car.model}</p>
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
                  className="w-full h-24 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  onClick={sendOffer}
                  className="w-full mt-4 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold py-3 rounded-xl text-sm transition-all duration-200 active:scale-95"
                >
                  Pošalji ponudu
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
                  <CheckCircle size={36} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Ponuda poslata!</h3>
                <p className="text-sm text-zinc-400 text-center mb-1">
                  Tvoja ponuda za <span className="text-white font-medium">{car.brand} {car.model}</span> je poslata korisniku {car.owner.name}.
                </p>
                <p className="text-xs text-zinc-500 mb-6">Otvori Poruke da nastaviš razgovor.</p>
                <button onClick={() => setModal('closed')} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
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
