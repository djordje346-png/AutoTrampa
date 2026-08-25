'use client';

import { useState } from 'react';
import { Wrench, Zap, Shield, TrendingUp, ChevronDown, ChevronUp, Settings, Gauge, Activity, Award, Plus, CreditCard as Edit3, Trash2, X, Check } from 'lucide-react';
import { formatEuro } from '@/lib/cars';
import { MyGarageCar } from '@/types';
import { useGarage } from '@/hooks/use-garage';
import CarForm from '@/components/CarForm';

export default function GaragePage() {
  const { cars, selectedId, selectCar, addCar, updateCar, removeCar, mounted } = useGarage();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCar, setEditingCar] = useState<MyGarageCar | null>(null);

  function openAddForm() {
    setEditingCar(null);
    setShowForm(true);
  }

  function openEditForm(car: MyGarageCar) {
    setEditingCar(car);
    setShowForm(true);
  }

  function handleSave(car: MyGarageCar) {
    if (editingCar) {
      updateCar(car);
    } else {
      addCar(car);
      selectCar(car.id);
    }
    setShowForm(false);
    setEditingCar(null);
  }

  function handleRemove(car: MyGarageCar) {
    if (cars.length <= 1) return;
    removeCar(car.id);
    setExpandedId(null);
  }

  function toggleExpand(id: string) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  if (!mounted) {
    return (
      <div className="flex flex-col">
        <header className="sticky top-0 z-40 bg-app border-b border-surface px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight text-app-primary">Garaža</h1>
          <p className="text-xs text-app-muted mt-0.5">Tvoja kolekcija vozila</p>
        </header>
        <div className="px-4 pt-6 space-y-3">
          <div className="h-48 bg-card-surface rounded-2xl animate-pulse" />
          <div className="h-48 bg-card-surface rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 bg-app border-b border-surface px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-app-primary">Garaža</h1>
            <p className="text-xs text-app-muted mt-0.5">{cars.length} vozila u kolekciji</p>
          </div>
          <button
            onClick={openAddForm}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold rounded-full px-3 py-2 transition-all duration-200 active:scale-95"
          >
            <Plus size={14} strokeWidth={2.5} />
            Dodaj auto
          </button>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4 pb-4">
        {cars.map(car => {
          const isExpanded = expandedId === car.id;
          const isSelected = car.id === selectedId;

          const engineSpecs = [
            { label: 'Motor', value: car.specs.engine },
            { label: 'Zapremina', value: car.specs.displacement },
            { label: 'Snaga', value: car.specs.power },
            { label: 'Obrtni moment', value: car.specs.torque },
            { label: 'Gorivo', value: car.specs.fuelType },
            { label: 'Menjač', value: car.specs.transmission },
            { label: 'Pogon', value: car.specs.drivetrain },
            { label: 'Maks. brzina', value: car.specs.topSpeed },
            { label: '0–100 km/h', value: car.specs.acceleration },
          ];

          return (
            <div key={car.id} className="bg-card-surface rounded-2xl overflow-hidden border border-surface">
              <div className="relative h-44">
                <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-orange-500 rounded-full px-2.5 py-1">
                    <Check size={11} className="text-white" strokeWidth={3} />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Aktivno</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-orange-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                    {car.year} · {car.bodyType}
                  </p>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    {car.brand} {car.model} {car.generation}
                  </h2>
                  <p className="text-white/80 text-xs">{car.color} · {car.city}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-3 border-b border-surface">
                <p className="text-orange-400 font-bold text-lg mr-auto">{formatEuro(car.price)}</p>
                {!isSelected && (
                  <button
                    onClick={() => selectCar(car.id)}
                    className="flex items-center gap-1.5 bg-elevated hover:bg-hover-surface text-orange-400 text-xs font-semibold rounded-lg px-2.5 py-1.5 transition-all"
                  >
                    <Check size={13} />
                    Izaberi
                  </button>
                )}
                <button
                  onClick={() => openEditForm(car)}
                  className="flex items-center gap-1.5 bg-elevated hover:bg-hover-surface text-app-secondary text-xs font-semibold rounded-lg px-2.5 py-1.5 transition-all"
                >
                  <Edit3 size={13} />
                  Uredi
                </button>
                {cars.length > 1 && (
                  <button
                    onClick={() => handleRemove(car)}
                    className="flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg px-2.5 py-1.5 transition-all"
                    aria-label="Ukloni auto"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-px bg-surface">
                <div className="bg-card-surface p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp size={13} className="text-orange-400" />
                    <p className="text-[10px] text-app-muted font-medium">Procenjena vrednost</p>
                  </div>
                  <p className="text-sm font-black text-orange-400">{formatEuro(car.estimatedValue)}</p>
                </div>
                <div className="bg-card-surface p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Activity size={13} className="text-sky-400" />
                    <p className="text-[10px] text-app-muted font-medium">Kilometraža</p>
                  </div>
                  <p className="text-sm font-black text-app-primary">{car.mileage.toLocaleString()} km</p>
                </div>
                <div className="bg-card-surface p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap size={13} className="text-violet-400" />
                    <p className="text-[10px] text-app-muted font-medium">Snaga</p>
                  </div>
                  <p className="text-sm font-black text-app-primary">{car.specs.power}</p>
                </div>
                <div className="bg-card-surface p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Gauge size={13} className="text-rose-400" />
                    <p className="text-[10px] text-app-muted font-medium">Obrtni moment</p>
                  </div>
                  <p className="text-sm font-black text-app-primary">{car.specs.torque}</p>
                </div>
              </div>

              <button
                onClick={() => toggleExpand(car.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <Settings size={14} className="text-orange-400" />
                  <span className="text-xs font-bold text-app-primary">Specifikacije i detalji</span>
                </div>
                {isExpanded ? (
                  <ChevronUp size={16} className="text-app-muted" />
                ) : (
                  <ChevronDown size={16} className="text-app-muted" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-surface">
                  <div className="divide-y divide-surface">
                    {engineSpecs
                      .filter(s => s.value && s.value !== '-' && s.value !== '0')
                      .map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between px-4 py-2">
                          <span className="text-[11px] text-app-muted">{label}</span>
                          <span className="text-[11px] font-semibold text-app-secondary text-right">{value}</span>
                        </div>
                      ))}
                  </div>

                  {car.modifications && car.modifications.length > 0 && (
                    <div className="px-4 py-3 border-t border-surface">
                      <div className="flex items-center gap-2 mb-2">
                        <Wrench size={13} className="text-violet-400" />
                        <p className="text-[11px] font-bold text-app-primary">Modifikacije</p>
                      </div>
                      <div className="space-y-1.5">
                        {car.modifications.map(mod => (
                          <div key={mod} className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-orange-400 flex-shrink-0" />
                            <p className="text-[11px] text-app-secondary">{mod}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {car.buildNotes && car.buildNotes.length > 0 && (
                    <div className="px-4 py-3 border-t border-surface">
                      <div className="flex items-center gap-2 mb-2">
                        <Award size={13} className="text-emerald-400" />
                        <p className="text-[11px] font-bold text-app-primary">Istorija servisa</p>
                      </div>
                      <div className="space-y-1.5">
                        {car.buildNotes.map(note => (
                          <div key={note} className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />
                            <p className="text-[11px] text-app-secondary leading-relaxed">{note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {car.securityFeatures && car.securityFeatures.length > 0 && (
                    <div className="px-4 py-3 border-t border-surface">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield size={13} className="text-sky-400" />
                        <p className="text-[11px] font-bold text-app-primary">Sigurnost</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {car.securityFeatures.map(feat => (
                          <span key={feat} className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-[10px] font-medium text-sky-300">
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="px-4 py-3 text-[11px] text-app-muted leading-relaxed border-t border-surface">
                    {car.description}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setShowForm(false); setEditingCar(null); }} />
          <div className="relative w-full max-w-md bg-card-surface rounded-t-3xl border-t border-surface p-6 max-h-[85vh] overflow-y-auto safe-bottom">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-app-primary">
                {editingCar ? 'Uredi auto' : 'Dodaj novo vozilo'}
              </h3>
              <button
                onClick={() => { setShowForm(false); setEditingCar(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-elevated text-app-secondary hover:text-app-primary transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <CarForm onSave={handleSave} onCancel={() => { setShowForm(false); setEditingCar(null); }} editingCar={editingCar} />
          </div>
        </div>
      )}
    </div>
  );
}
