'use client';

import { useState, useEffect } from 'react';
import { MapPin, Shield, Plus, LogOut, Car, ChevronRight, Lock, TriangleAlert as AlertTriangle, SlidersHorizontal, CircleHelp as HelpCircle, FileText, ShieldAlert, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useGarage } from '@/hooks/use-garage';
import { formatEuro } from '@/lib/cars';

const BODY_TYPE_PREFS = ['Limuzina', 'SUV', 'Karavan', 'Coupe'];

export default function ProfilePage() {
  const { logout } = useAuth();
  const { cars, mounted } = useGarage();
  const [radius, setRadius] = useState(50);
  const [bodyPrefs, setBodyPrefs] = useState<string[]>(['Limuzina', 'Karavan']);
  const [phoneAfterMatch, setPhoneAfterMatch] = useState(true);
  const [activeModal, setActiveModal] = useState<'faq' | 'terms' | 'privacy' | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('autotrampa_theme') as 'dark' | 'light' | null;
      if (stored === 'light') {
        setTheme('light');
      }
    } catch {}
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('autotrampa_theme', next);
    } catch {}
    if (next === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }

  const garageLimit = 3;
  const garageFull = cars.length >= garageLimit;
  const activeCar = cars[0];

  if (!mounted) {
    return (
      <div className="flex flex-col">
        <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight text-white">Profil</h1>
        </header>
        <div className="px-4 pt-6 space-y-3">
          <div className="h-32 bg-zinc-900 rounded-2xl animate-pulse" />
          <div className="h-24 bg-zinc-900 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-6">
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-4 py-4 safe-top">
        <h1 className="text-xl font-bold tracking-tight text-white">Profil</h1>
      </header>

      <div className="px-4 pt-5 pb-4">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
              <span className="text-2xl font-black text-black">N</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white">Nikola Vukovic</h2>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="text-zinc-500" />
                <span className="text-xs text-zinc-500">Kosovska Mitrovica</span>
              </div>
              <div className="inline-flex items-center gap-1.5 mt-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1">
                <Shield size={11} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Verifikovan vozač</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-800">
            <div className="flex-1 text-center">
              <p className="text-base font-bold text-white">12</p>
              <p className="text-[10px] text-zinc-500">Trampi</p>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div className="flex-1 text-center">
              <p className="text-base font-bold text-white">{cars.length}</p>
              <p className="text-[10px] text-zinc-500">Vozila</p>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div className="flex-1 text-center">
              <p className="text-base font-bold text-white">4.9</p>
              <p className="text-[10px] text-zinc-500">Ocena</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Car size={16} className="text-orange-400" />
              <p className="text-sm font-bold text-white">Moja garaža</p>
            </div>
            <span className="text-xs font-semibold text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full">
              {cars.length}/{garageLimit} popunjeno
            </span>
          </div>

          {activeCar && (
            <div className="flex items-center gap-3 bg-zinc-800 rounded-xl p-3 mb-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-700">
                <img src={activeCar.image} alt={`${activeCar.brand} ${activeCar.model}`} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{activeCar.brand} {activeCar.model} {activeCar.generation}</p>
                <p className="text-xs text-zinc-500">{activeCar.year} · {activeCar.mileage.toLocaleString()} km</p>
                <p className="text-orange-400 text-xs font-bold mt-0.5">{formatEuro(activeCar.price)}</p>
              </div>
              <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/30 rounded-full px-2 py-0.5">
                <span className="text-[9px] font-bold text-orange-400 uppercase">Aktivno</span>
              </div>
            </div>
          )}

          {garageFull ? (
            <div className="flex items-center gap-2.5 bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
              <AlertTriangle size={15} className="text-orange-400 flex-shrink-0" />
              <p className="text-xs text-orange-400 font-medium">Dostignut besplatni limit od 3 vozila</p>
            </div>
          ) : (
            <button className="w-full flex items-center justify-center gap-2 border border-dashed border-zinc-700 hover:border-orange-500/50 hover:bg-orange-500/5 text-orange-400 text-sm font-semibold rounded-xl py-3 transition-all duration-200">
              <Plus size={16} strokeWidth={2.5} />
              Dodaj auto u garažu
            </button>
          )}
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal size={16} className="text-orange-400" />
            <p className="text-sm font-bold text-white">Preferencije zamene</p>
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-400">Radijus pretrage</label>
              <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">{radius} km</span>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              step={10}
              value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Tip karoserije</label>
            <div className="flex flex-wrap gap-2">
              {BODY_TYPE_PREFS.map(type => {
                const active = bodyPrefs.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => setBodyPrefs(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                      active ? 'bg-orange-500 border-orange-500 text-black' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock size={16} className="text-orange-400" />
            <p className="text-sm font-bold text-white">Privatnost</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Prikaži telefon samo nakon obostranog match-a</p>
              <p className="text-xs text-zinc-500 mt-0.5">Vaš broj je skriven dok ne prihvatite trampu</p>
            </div>
            <button
              onClick={() => setPhoneAfterMatch(!phoneAfterMatch)}
              className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200 ${
                phoneAfterMatch ? 'bg-orange-500' : 'bg-zinc-700'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                phoneAfterMatch ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle size={16} className="text-orange-400" />
            <p className="text-sm font-bold text-white">Podrška i dokumenti</p>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveModal('faq')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800/60 transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-orange-400 transition">
                  <HelpCircle size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Često postavljana pitanja (FAQ)</p>
                  <p className="text-[10px] text-zinc-500">Kako funkcioniše trampa i prenos?</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition" />
            </button>

            <button
              onClick={() => setActiveModal('terms')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800/60 transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-orange-400 transition">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Uslovi korišćenja</p>
                  <p className="text-[10px] text-zinc-500">Pravila platforme i odgovornost</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition" />
            </button>

            <button
              onClick={() => setActiveModal('privacy')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800/60 transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-orange-400 transition">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Politika privatnosti</p>
                  <p className="text-[10px] text-zinc-500">Zaštita podataka o ličnosti</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            {theme === 'dark' ? <Moon size={16} className="text-orange-400" /> : <Sun size={16} className="text-orange-400" />}
            <p className="text-sm font-bold text-white">Izgled</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Tamna tema</p>
              <p className="text-xs text-zinc-500 mt-0.5">Prebaci između tamne i svetle teme</p>
            </div>
            <button
              onClick={toggleTheme}
              className="relative w-12 h-6 rounded-full flex-shrink-0 transition-colors duration-200 bg-zinc-700"
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-200 ${theme === 'light' ? 'translate-x-6 bg-orange-500' : 'translate-x-0.5 bg-white'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 mb-6">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 font-semibold py-3.5 rounded-xl text-sm border border-rose-500/20 transition-all duration-200"
        >
          <LogOut size={16} />
          Odjavi se
        </button>
      </div>

      <p className="text-center text-[10px] text-zinc-700 pb-2">AutoTrampa v1.0</p>

      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl safe-bottom">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">
                {activeModal === 'faq' && 'Često postavljana pitanja'}
                {activeModal === 'terms' && 'Uslovi korišćenja'}
                {activeModal === 'privacy' && 'Politika privatnosti'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs text-zinc-300 leading-relaxed">
              {activeModal === 'faq' && (
                <>
                  <div className="space-y-1.5">
                    <p className="font-bold text-orange-400">1. Kako funkcioniše zamena automobila?</p>
                    <p className="text-zinc-400">Kada pronađete vozilo u feed-u i pošaljete zahtev, ukoliko i drugi vlasnik prihvati (match), otvara vam se direktan kontakt za dogovor o pregledu i razlici u ceni.</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-bold text-orange-400">2. Da li je AutoTrampa posrednik?</p>
                    <p className="text-zinc-400">Ne. AutoTrampa samo spaja vozače. Svi dogovori i overa ugovora vrše se lično između korisnika.</p>
                  </div>
                </>
              )}
              {activeModal === 'terms' && (
                <div className="space-y-1.5">
                  <p className="font-bold text-orange-400">Pravila platforme</p>
                  <p className="text-zinc-400">Svi oglasi moraju predstavljati realno stanje vozila u vašem vlasništvu. Zabranjeno je unošenje lažnih podataka.</p>
                </div>
              )}
              {activeModal === 'privacy' && (
                <div className="space-y-1.5">
                  <p className="font-bold text-orange-400">Zaštita podataka</p>
                  <p className="text-zinc-400">Vaš broj telefona je sakriven sve dok se ne ostvari obostrani match sa drugim vozačem.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2.5 rounded-xl text-xs transition"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
