'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Heart, ArrowLeftRight, Phone, MapPin, Gauge, Fuel, Settings2, Star, Calendar, Eye, Zap, CheckCircle, X, Share2 } from 'lucide-react';
import { MARKETPLACE_CARS, formatEuro } from '@/lib/cars';
import { Car, MyGarageCar } from '@/types';
import { useGarage } from '@/hooks/use-garage';
import { useMessages } from '@/hooks/use-messages';

function getTradeLabel(myCar: MyGarageCar, other: Car) {
  const diff = other.price - myCar.price;
  if (Math.abs(diff) < 200) return { label: 'Straight Swap', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
  if (diff > 0) return { label: `They add ${formatEuro(diff)}`, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' };
  return { label: `You add ${formatEuro(Math.abs(diff))}`, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
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
        <p className="text-slate-400 font-semibold mb-2">Car not found</p>
        <Link href="/" className="text-amber-400 text-sm font-semibold">Back to Feed</Link>
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
    { icon: Gauge, label: 'Mileage', value: `${car.mileage.toLocaleString()} km` },
    { icon: Fuel, label: 'Fuel', value: car.specs.fuelType },
    { icon: Settings2, label: 'Transmission', value: car.specs.transmission },
    { icon: Calendar, label: 'Year', value: String(car.year) },
    { icon: Zap, label: 'Power', value: car.specs.power },
    { icon: Eye, label: 'Drivetrain', value: car.specs.drivetrain },
  ];

  const engineDetails = [
    { label: 'Engine', value: car.specs.engine },
    { label: 'Displacement', value: car.specs.displacement },
    { label: 'Cylinders', value: String(car.specs.cylinders) },
    { label: 'Torque', value: car.specs.torque },
    { label: 'Top Speed', value: car.specs.topSpeed },
    { label: '0–100 km/h', value: car.specs.acceleration },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero image with back button */}
      <div className="relative h-72">
        <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/40" />

        {/* Top controls */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 z-10">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-slate-900/70 backdrop-blur-sm flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-full bg-slate-900/70 backdrop-blur-sm flex items-center justify-center text-white hover:bg-slate-800 transition-colors">
              <Share2 size={16} />
            </button>
            <button
              onClick={toggleSave}
              className={`w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-200 ${
                isSaved ? 'bg-rose-500 text-white' : 'bg-slate-900/70 text-white hover:bg-slate-800'
              }`}
            >
              <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Trade badge */}
        <div className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-full border text-xs font-bold ${tl.bg} ${tl.color}`}>
          {tl.label}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-4 relative z-10 space-y-4 pb-4">
        {/* Title card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">
                {car.year} {car.brand} {car.model}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">{car.generation} · {car.color}</p>
            </div>
            <p className="text-amber-400 font-black text-2xl">{formatEuro(car.price)}</p>
          </div>

          {/* Owner */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-800">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-black text-slate-950">{car.owner.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{car.owner.name}</p>
              <div className="flex items-center gap-1">
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <span className="text-xs text-slate-500">{car.owner.rating} · {car.owner.city}</span>
              </div>
            </div>
            <a
              href={`tel:${car.owner.phone}`}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-amber-400 transition-colors"
            >
              <Phone size={15} />
            </a>
          </div>
        </div>

        {/* Specs grid */}
        <div className="grid grid-cols-3 gap-2">
          {specs.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-slate-900 rounded-xl border border-slate-800 p-3 text-center">
              <Icon size={16} className="text-amber-400 mx-auto mb-1.5" />
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-xs font-bold text-white leading-tight">{value}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</p>
          <p className="text-sm text-slate-300 leading-relaxed">{car.description}</p>
        </div>

        {/* Engine details */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Engine & Performance</p>
          </div>
          <div className="divide-y divide-slate-800">
            {engineDetails.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-slate-500">{label}</span>
                <span className="text-xs font-semibold text-slate-200">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modifications */}
        {car.modifications && car.modifications.length > 0 && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Modifications</p>
            <div className="space-y-2">
              {car.modifications.map(mod => (
                <div key={mod} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <p className="text-xs text-slate-300">{mod}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trade comparison */}
        {garageMounted && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Trade Comparison</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-xl bg-slate-800 p-3 text-center">
                <p className="text-[10px] text-slate-500 mb-1">Your car</p>
                <p className="text-sm font-semibold text-white truncate">{selectedCar.brand} {selectedCar.model}</p>
                <p className="text-amber-400 font-bold text-sm">{formatEuro(selectedCar.price)}</p>
              </div>
              <ArrowLeftRight size={18} className="text-slate-500 flex-shrink-0" />
              <div className="flex-1 rounded-xl bg-slate-800 p-3 text-center">
                <p className="text-[10px] text-slate-500 mb-1">This car</p>
                <p className="text-sm font-semibold text-white truncate">{car.brand} {car.model}</p>
                <p className="text-amber-400 font-bold text-sm">{formatEuro(car.price)}</p>
              </div>
            </div>
            <div className={`rounded-xl border px-4 py-2 text-center text-sm font-semibold mt-3 ${tl.bg} ${tl.color}`}>
              {tl.label}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA bar */}
      <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 py-3 flex gap-2">
        <button
          onClick={openOffer}
          className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold rounded-xl py-3 transition-all duration-200 active:scale-95"
        >
          <ArrowLeftRight size={16} />
          Trade Offer
        </button>
        <a
          href={`tel:${car.owner.phone}`}
          className="w-12 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all duration-200"
        >
          <Phone size={17} />
        </a>
      </div>

      {/* Trade Offer Modal */}
      {modal !== 'closed' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal('closed')} />
          <div className="relative w-full max-w-md bg-slate-900 rounded-t-3xl border-t border-slate-700 p-6">
            {modal === 'offer' ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-white">Trade Offer</h3>
                  <button onClick={() => setModal('closed')} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 rounded-xl bg-slate-800 p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Your car</p>
                    <p className="text-sm font-semibold text-white truncate">{selectedCar.brand} {selectedCar.model}</p>
                    <p className="text-amber-400 font-bold text-sm">{formatEuro(selectedCar.price)}</p>
                  </div>
                  <ArrowLeftRight size={20} className="text-slate-500 flex-shrink-0" />
                  <div className="flex-1 rounded-xl bg-slate-800 p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Their car</p>
                    <p className="text-sm font-semibold text-white truncate">{car.brand} {car.model}</p>
                    <p className="text-amber-400 font-bold text-sm">{formatEuro(car.price)}</p>
                  </div>
                </div>
                <div className={`rounded-xl border px-4 py-2.5 text-center text-sm font-semibold mb-5 ${tl.bg} ${tl.color}`}>
                  {tl.label}
                </div>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Add a note to your offer... (optional)"
                  className="w-full h-24 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 resize-none focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  onClick={sendOffer}
                  className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-sm transition-all duration-200 active:scale-95"
                >
                  Send Trade Offer
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
                  <CheckCircle size={36} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Offer Sent!</h3>
                <p className="text-sm text-slate-400 text-center mb-1">
                  Your trade offer for the <span className="text-white font-medium">{car.brand} {car.model}</span> has been sent to {car.owner.name}.
                </p>
                <p className="text-xs text-slate-500 mb-6">Check Poruke to continue the conversation.</p>
                <button onClick={() => setModal('closed')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
