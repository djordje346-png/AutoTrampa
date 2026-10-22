'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Shield, Plus, LogOut, Car, ChevronRight, ChevronDown, Lock, TriangleAlert as AlertTriangle, SlidersHorizontal, CircleHelp as HelpCircle, FileText, ShieldAlert, Sun, Moon, Database, Pencil, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { SignedOutPage } from '@/components/SignedOut';
import { garageErrorMessage, useGarage } from '@/hooks/use-garage';
import { useTheme } from '@/hooks/use-theme';
import { useUser, initials } from '@/hooks/use-user';
import { requestPhoneAction } from '@/hooks/use-phone-gate';
import { usePreferences } from '@/hooks/use-preferences';
import { formatEuro, formatKm, formatYear } from '@/lib/cars';
import { estimateUsageBytes } from '@/lib/storage';
import { MyGarageCar } from '@/types';
import { bodyLabel } from '@/lib/labels';
import { BODY_TYPES } from '@/lib/body-types';
import CarForm from '@/components/CarForm';
import { BottomSheet } from '@/components/BottomSheet';
import { ProfileEditSheet } from '@/components/ProfileEditSheet';

const BODY_TYPE_PREFS = BODY_TYPES.map(({ value }) => value);

/** Browsers give roughly 5 MB per origin to localStorage. */
const STORAGE_BUDGET_BYTES = 5 * 1024 * 1024;

export default function ProfileClient() {
  const router = useRouter();
  const { logout, isLoggedIn, userId, mounted: authReady } = useAuth();
  const { cars, selectedCar, addCar, selectCar, canAddCar, limit: garageLimit, mounted } = useGarage();
  const { theme, toggleTheme } = useTheme();
  const { user, profileReady } = useUser();
  const { preferences, update: updatePreferences, toggleBodyPref, mounted: preferencesReady } = usePreferences();
  const [activeModal, setActiveModal] = useState<'faq' | 'terms' | 'privacy' | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const { radius, bodyPrefs, phoneAfterMatch, budget, noTopUp } = preferences;
  const [radiusDraft, setRadiusDraft] = useState(radius);
  const [budgetDraft, setBudgetDraft] = useState(budget == null ? '' : String(budget));
  const noTopUpButtonRef = useRef<HTMLButtonElement>(null);
  const garageFull = !canAddCar;
  const activeCar = cars.length > 0 ? selectedCar : null;
  const usedBytes = mounted ? estimateUsageBytes() : 0;
  const usedPercent = Math.min(100, Math.round((usedBytes / STORAGE_BUDGET_BYTES) * 100));

  useEffect(() => setRadiusDraft(radius), [radius]);
  useEffect(() => setBudgetDraft(budget == null ? '' : String(budget)), [budget]);

  async function savePreference(patch: Parameters<typeof updatePreferences>[0]) {
    const result = await updatePreferences(patch);
    if (!result.ok) toast.error(result.message || 'Preference nisu sačuvane. Pokušaj ponovo.');
  }

  async function handleLogout() {
    const result = await logout();
    if (!result.ok) {
      toast.error(result.message || 'Odjava nije uspela. Pokušaj ponovo.');
      return;
    }
    router.replace('/');
  }

  function commitBudgetDraft() {
    if (noTopUp) return;
    const value = budgetDraft.trim();
    const next = value === '' ? null : Math.max(0, Number(value));
    if (next == null || (Number.isFinite(next) && next <= 100000)) void savePreference({ budget: next });
  }

  async function handleAddCar(car: MyGarageCar) {
    const result = await addCar(car);
    if (!result.ok) {
      toast.error(garageErrorMessage(result.error, 'add', garageLimit));
      return;
    }
    selectCar(result.id ?? car.id);
    setShowAddForm(false);
    toast.success('Vozilo dodato u garažu.');
  }

  function openAddCarForm() {
    requestPhoneAction(() => setShowAddForm(true), profileReady && user.id === userId ? user.phone : null);
  }

  if (authReady && !isLoggedIn) {
    return (
      <SignedOutPage
        heading="Profil"
        title="Nemaš aktivan nalog"
        description="Prijavi se da podesiš profil, preferencije zamene i privatnost."
        reason="Prijavi se da otvoriš profil"
      />
    );
  }

  if (!mounted || !authReady) {
    return (
      <div className="flex flex-col">
        <header className="app-page-header safe-top">
          <div className="app-container py-4">
            <h1 className="text-xl font-bold tracking-tight text-app-primary dark:text-app-primary">Profil</h1>
            <p className="mt-1 text-xs text-app-muted">Nalog, vozila i podešavanja zamene</p>
          </div>
        </header>
        <div className="app-container pt-6 space-y-3">
          <div className="h-32 bg-card-surface dark:bg-card-surface rounded-2xl animate-pulse" />
          <div className="h-24 bg-card-surface dark:bg-card-surface rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-6">
      <header className="app-page-header safe-top">
        <div className="app-container py-4">
          <h1 className="text-xl font-bold tracking-tight text-app-primary dark:text-app-primary">Profil</h1>
          <p className="mt-1 text-xs text-app-muted">Nalog, vozila i podešavanja zamene</p>
        </div>
      </header>

      <div className="app-container pt-5 pb-4">
        <div className="bg-card-surface dark:bg-card-surface rounded-2xl border border-surface dark:border-surface p-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/20">
              <span className="text-2xl font-black text-on-accent">{initials(user.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-app-primary dark:text-app-primary truncate">{user.name}</h2>
              <p className="text-xs text-app-muted truncate">{user.email || user.phone}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="text-app-muted" />
                <span className="text-xs text-app-muted">{user.city}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[11px] text-app-muted">
                  {user.phone ? 'Broj dodat' : 'Broj nije dodat'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowEditProfile(true)}
                  className="text-[11px] font-semibold text-brand-text hover:underline"
                >
                  {user.phone ? 'Promeni broj' : 'Dodaj broj'}
                </button>
              </div>
              {user.verified && (
                <div className="inline-flex items-center gap-1.5 mt-2 bg-tone-positive-surface border border-tone-positive-surface rounded-full px-2.5 py-1">
                  <Shield size={11} className="text-tone-positive" />
                  <span className="text-[10px] font-bold text-tone-positive uppercase tracking-wider">Verifikovan vozač</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowEditProfile(true)}
              aria-label="Uredi profil"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-elevated text-app-secondary dark:text-app-secondary transition-colors hover:bg-hover-surface hover:text-brand-text"
            >
              <Pencil size={15} />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-surface dark:border-surface">
            <div className="flex-1 text-center">
              <p className="text-base font-bold text-app-primary dark:text-app-primary">{user.trades}</p>
              <p className="text-[10px] text-app-muted">Trampi</p>
            </div>
            <div className="w-px h-8 bg-surface dark:bg-elevated" />
            <div className="flex-1 text-center">
              <p className="text-base font-bold text-app-primary dark:text-app-primary">{cars.length}</p>
              <p className="text-[10px] text-app-muted">Vozila</p>
            </div>
            <div className="w-px h-8 bg-surface dark:bg-elevated" />
            <div className="flex-1 text-center">
              <p className="text-base font-bold text-app-primary dark:text-app-primary">{user.rating}</p>
              <p className="text-[10px] text-app-muted">Ocena</p>
            </div>
          </div>
        </div>
      </div>

      <div className="app-container mb-4">
        <div className="bg-card-surface dark:bg-card-surface rounded-2xl border border-surface dark:border-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Car size={16} className="text-brand-text" />
              <p className="text-sm font-bold text-app-primary dark:text-app-primary">Moja garaža</p>
            </div>
            <span className="text-xs font-semibold text-app-secondary dark:text-app-secondary bg-elevated px-2.5 py-1 rounded-full">
              {cars.length}/{garageLimit} popunjeno
            </span>
          </div>

          {activeCar && (
            <div className="flex items-center gap-3 bg-elevated rounded-xl p-3 mb-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-hover-surface">
                <img src={activeCar.image} alt={`${activeCar.brand} ${activeCar.model}`} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-app-primary dark:text-app-primary truncate">{activeCar.brand} {activeCar.model} {activeCar.generation}</p>
                <p className="text-xs text-app-muted">{formatYear(activeCar.year)} · {formatKm(activeCar.mileage)}</p>
                <p className="text-brand-text text-xs font-bold mt-0.5 dark:text-app-secondary">{formatEuro(activeCar.price)}</p>
              </div>
              <div className="flex items-center gap-1 bg-brand-500/10 border border-brand-500/30 rounded-full px-2 py-0.5">
                <span className="text-[9px] font-bold text-brand-text uppercase">Aktivno</span>
              </div>
            </div>
          )}

          {garageFull ? (
            <div className="flex items-center gap-2.5 bg-brand-500/5 border border-brand-500/20 rounded-xl p-3">
              <AlertTriangle size={15} className="text-brand-text flex-shrink-0" />
              <p className="text-xs text-brand-text font-medium">Dostignut besplatni limit od 3 vozila</p>
            </div>
          ) : (
            <button
              onClick={openAddCarForm}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-surface dark:border-surface hover:border-brand-500/50 hover:bg-brand-500/5 text-brand-text text-sm font-semibold rounded-xl py-3 transition-all duration-200"
            >
              <Plus size={16} strokeWidth={2.5} />
              Dodaj auto u garažu
            </button>
          )}
        </div>
      </div>

      <div className="app-container mb-4">
        <div className="bg-card-surface dark:bg-card-surface rounded-2xl border border-surface dark:border-surface p-4">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal size={16} className="text-brand-text" />
            <p className="text-sm font-bold text-app-primary dark:text-app-primary">Preferencije zamene</p>
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-app-secondary dark:text-app-secondary">Radijus pretrage</label>
              <span className="text-xs font-bold text-brand-text bg-brand-500/10 px-2 py-0.5 rounded-full">{preferencesReady ? `${radiusDraft >= 200 ? "200+" : radiusDraft} km` : 'Učitavanje…'}</span>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              step={10}
              value={radiusDraft}
              disabled={!preferencesReady}
              onChange={e => setRadiusDraft(Number(e.target.value))}
              onPointerUp={() => void savePreference({ radius: radiusDraft })}
              onBlur={() => void savePreference({ radius: radiusDraft })}
              className="w-full h-2 bg-elevated rounded-full appearance-none cursor-pointer accent-brand-500"
            />
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-app-secondary dark:text-app-secondary">Budžet za doplatu</label>
              <span className="text-xs font-bold text-brand-text bg-brand-500/10 px-2 py-0.5 rounded-full">
                {!preferencesReady ? 'Učitavanje…' : noTopUp ? 'Bez doplate' : budget != null ? formatEuro(budget) : 'Nije postavljen'}
              </span>
            </div>
            <input
              type="number"
              min={0}
              max={100000}
              step={100}
              value={budgetDraft}
              disabled={!preferencesReady || noTopUp}
              placeholder="npr. 3000"
              onChange={e => setBudgetDraft(e.target.value)}
              onBlur={(e) => {
                if (e.relatedTarget === noTopUpButtonRef.current) return;
                commitBudgetDraft();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              className={`w-full rounded-xl border border-surface dark:border-surface bg-elevated px-3 py-2.5 text-sm text-app-primary dark:text-app-primary placeholder:text-app-muted outline-none transition-colors focus:border-brand-500/50 ${
                noTopUp ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-app-muted">
              Budžet služi da ti bolje predložimo oglase. Ne filtrira — sva vozila ostaju vidljiva, samo redosled se menja.
            </p>
            <button
              ref={noTopUpButtonRef}
              disabled={!preferencesReady}
              onClick={() => void savePreference({ noTopUp: !noTopUp, ...(noTopUp ? {} : { budget: null }) })}
              className="mt-2.5 flex items-center gap-2.5 w-full text-left"
            >
              <span className={`relative w-12 h-7 rounded-full flex-shrink-0 transition-colors duration-200 ${
                noTopUp ? 'bg-brand-500' : 'bg-elevated border border-surface dark:border-surface'
              }`}>
                <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-card-surface shadow-sm transition-transform duration-200 ${
                  noTopUp ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </span>
              <span className="text-xs font-medium text-app-secondary dark:text-app-secondary">Ne želim da doplaćujem</span>
            </button>
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              {BODY_TYPE_PREFS.map(type => {
                const active = bodyPrefs.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleBodyPref(type)}
                    disabled={!preferencesReady}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                      active ? 'bg-brand-500 border-brand-500 text-on-accent' : 'bg-elevated border-surface dark:border-surface text-app-secondary dark:text-app-secondary hover:border-brand-500/40'
                    }`}
                  >
                    {bodyLabel(type)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <section className="app-container mb-4" aria-labelledby="privacy-appearance-heading">
        <div className="mb-2 px-1">
          <h2 id="privacy-appearance-heading" className="text-sm font-bold text-app-primary dark:text-app-primary">
            Privatnost i izgled
          </h2>
          <p className="mt-0.5 text-xs text-app-muted">Podesi kako se prikazuju tvoji podaci i aplikacija.</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="bg-card-surface dark:bg-card-surface rounded-2xl border border-surface dark:border-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              {theme === 'dark' ? <Moon size={16} className="text-brand-text" /> : <Sun size={16} className="text-brand-text" />}
              <p className="text-sm font-bold text-app-primary dark:text-app-primary">Izgled</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-app-primary dark:text-app-primary">Tamna tema</p>
                <p className="text-xs text-app-muted mt-0.5">Prebaci između tamne i svetle teme</p>
              </div>
              <button
                onClick={toggleTheme}
                className="relative w-12 h-7 rounded-full flex-shrink-0 transition-colors duration-200 bg-elevated border border-surface dark:border-surface"
                aria-label="Promeni temu"
              >
                <span className={`absolute top-1 left-1 w-5 h-5 rounded-full transition-transform duration-200 flex items-center justify-center ${
                  theme === 'dark' ? 'translate-x-5 bg-brand-500' : 'translate-x-0 bg-card-surface'
                }`}>
                  {theme === 'dark' ? (
                    <Moon size={10} className="text-white" />
                  ) : (
                    <Sun size={10} className="text-brand-text" />
                  )}
                </span>
              </button>
            </div>
          </div>
          <div className="bg-card-surface dark:bg-card-surface rounded-2xl border border-surface dark:border-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lock size={16} className="text-brand-text" />
              <p className="text-sm font-bold text-app-primary dark:text-app-primary">Privatnost</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-app-secondary">Prikaži telefon samo posle dogovorene zamene</p>
                <p className="text-xs text-app-muted mt-0.5">Broj ostaje skriven na oglasu dok se ne dogovorite</p>
              </div>
              <button
                onClick={() => void updatePreferences({ phoneAfterMatch: !phoneAfterMatch })}
                disabled={!preferencesReady}
                aria-pressed={phoneAfterMatch}
                aria-label="Prikaži telefon samo posle dogovorene zamene"
                className={`relative w-12 h-7 rounded-full flex-shrink-0 transition-colors duration-200 ${
                  phoneAfterMatch ? 'bg-brand-500' : 'bg-elevated'
                }`}
              >
                <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-card-surface shadow-sm transition-transform duration-200 ${
                  phoneAfterMatch ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="app-container mb-4">
        <div className="bg-card-surface dark:bg-card-surface rounded-2xl border border-surface dark:border-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle size={16} className="text-brand-text" />
            <p className="text-sm font-bold text-app-primary dark:text-app-primary">Podrška i dokumenti</p>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveModal('faq')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-hover-surface transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-elevated flex items-center justify-center text-app-secondary dark:text-app-secondary group-hover:text-brand-text transition">
                  <HelpCircle size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-app-primary dark:text-app-primary">Često postavljana pitanja (FAQ)</p>
                  <p className="text-[10px] text-app-muted">Kako funkcioniše trampa i prenos?</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-app-muted group-hover:text-app-secondary dark:text-app-secondary transition" />
            </button>

            <button
              onClick={() => setActiveModal('terms')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-hover-surface transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-elevated flex items-center justify-center text-app-secondary dark:text-app-secondary group-hover:text-brand-text transition">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-app-primary dark:text-app-primary">Uslovi korišćenja</p>
                  <p className="text-[10px] text-app-muted">Pravila platforme i odgovornost</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-app-muted group-hover:text-app-secondary dark:text-app-secondary transition" />
            </button>

            <button
              onClick={() => setActiveModal('privacy')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-hover-surface transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-elevated flex items-center justify-center text-app-secondary dark:text-app-secondary group-hover:text-brand-text transition">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-app-primary dark:text-app-primary">Politika privatnosti</p>
                  <p className="text-[10px] text-app-muted">Zaštita podataka o ličnosti</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-app-muted group-hover:text-app-secondary dark:text-app-secondary transition" />
            </button>
          </div>
        </div>
      </div>

      <div className="app-container mb-4">
        <details className="group overflow-hidden rounded-2xl border border-surface bg-card-surface dark:border-surface dark:bg-card-surface">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-hover-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 [&::-webkit-details-marker]:hidden">
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-elevated text-app-secondary dark:text-app-secondary">
                <Database size={16} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-app-primary dark:text-app-primary">Lokalni podaci</span>
                <span className="mt-0.5 block text-xs text-app-muted">Napredno podešavanje pregledača</span>
              </span>
            </span>
            <span className="flex flex-shrink-0 items-center gap-2 text-xs font-semibold text-app-secondary dark:text-app-secondary">
              {(usedBytes / 1024 / 1024).toFixed(2)} MB / 5 MB
              <ChevronDown size={16} />
            </span>
          </summary>
          <div className="border-t border-surface px-4 pb-4 pt-3 dark:border-surface">
            <div className="h-2 w-full overflow-hidden rounded-full bg-elevated">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usedPercent > 85 ? 'bg-tone-negative' : usedPercent > 60 ? 'bg-tone-warn' : 'bg-tone-positive'
                }`}
                style={{ width: `${Math.max(2, usedPercent)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-app-muted">
              Ovde su lokalna podešavanja i privremeni podaci aplikacije. Vozila i fotografije iz naloga
              čuvaju se odvojeno od memorije pregledača.
            </p>
          </div>
        </details>
      </div>

      <div className="app-container mb-6">
        <button
          onClick={() => void handleLogout()}
          className="w-full flex items-center justify-center gap-2 bg-tone-negative-surface hover:bg-tone-negative-surface text-tone-negative font-semibold py-3.5 rounded-xl text-sm border border-tone-negative-surface transition-all duration-200"
        >
          <LogOut size={16} />
          Odjavi se
        </button>
      </div>

      <p className="text-center text-[10px] text-app-muted opacity-50 pb-2">AutoTrampa v1.0</p>

      {showAddForm && (
        <CarForm onSave={handleAddCar} onCancel={() => setShowAddForm(false)} />
      )}

      <ProfileEditSheet open={showEditProfile} onClose={() => setShowEditProfile(false)} />

      <BottomSheet
        open={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={
          activeModal === 'faq'
            ? 'Često postavljana pitanja'
            : activeModal === 'terms'
              ? 'Uslovi korišćenja'
              : 'Politika privatnosti'
        }
        className="sm:max-w-lg"
      >
        <div className="space-y-4 text-xs leading-relaxed text-app-secondary dark:text-app-secondary">
          {activeModal === 'faq' && (
            <>
              <div className="space-y-1.5">
                <p className="font-bold text-brand-text">1. Kako funkcioniše zamena automobila?</p>
                <p className="text-app-muted">
                  Kada pronađete vozilo u feed-u i pošaljete ponudu, otvara se razgovor sa
                  vlasnikom u kome se dogovarate o pregledu i razlici u ceni. Cena i doplata se
                  prikazuju unapred, na osnovu vrednosti tvog i njegovog vozila.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="font-bold text-brand-text">2. Da li je AutoTrampa posrednik?</p>
                <p className="text-app-muted">
                  Ne. AutoTrampa samo spaja vozače. Svi dogovori i overa ugovora vrše se lično
                  između korisnika.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="font-bold text-brand-text">3. Gde se čuvaju moji podaci?</p>
                <p className="text-app-muted">
                  Nalog, garaža, sačuvani oglasi, razgovori i fotografije vezani su za tvoj nalog.
                  Budžet, radijus pretrage i podešavanje doplate čuvaju se uz tvoj profil. Tema se
                  pamti u ovom pregledaču, a izbor tipova karoserije i privatnosti za prijavljeni
                  nalog čuva se odvojeno za taj nalog.
                </p>
              </div>
            </>
          )}
          {activeModal === 'terms' && (
            <div className="space-y-1.5">
              <p className="font-bold text-brand-text">Pravila platforme</p>
              <p className="text-app-muted">
                Svi oglasi moraju predstavljati realno stanje vozila u vašem vlasništvu. Zabranjeno
                je unošenje lažnih podataka.
              </p>
            </div>
          )}
          {activeModal === 'privacy' && (
            <div className="space-y-1.5">
              <p className="font-bold text-brand-text">Zaštita podataka</p>
              <p className="text-app-muted">
                Broj telefona se čuva u privatnoj tabeli profila i nikada se ne prikazuje na
                javnom oglasu. Ostali korisnici vide samo tvoje ime, grad i ocenu.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => setActiveModal(null)}
          className="mt-6 w-full rounded-xl bg-elevated py-3 text-sm font-semibold text-app-primary dark:text-app-primary transition-colors hover:bg-hover-surface"
        >
          Zatvori
        </button>
      </BottomSheet>
    </div>
  );
}
