'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type {
  BodyType,
  CarForm as CarFormType,
  FuelType,
  MyGarageCar,
  Transmission,
} from '@/types';
import { getCarImages } from '@/types';
import { CAR_BRANDS, BRAND_NAMES } from '@/lib/car-brands';
import { userStore, shortName } from '@/hooks/use-user';
import { EQUIPMENT_CATEGORIES } from '@/lib/equipment';
import { ImageUpload } from '@/components/image-upload';

const BODY_TYPES: BodyType[] = [
  'Sedan',
  'Caravan',
  'Hatchback',
  'SUV',
  'Coupe',
  'Convertible',
];

const FUEL_TYPES: FuelType[] = [
  'Diesel',
  'Petrol',
  'Hybrid',
  'Electric',
];

const TRANSMISSIONS: Transmission[] = [
  'Manual',
  'Automatic',
  'Semi-Auto',
];

const EMPTY_FORM: CarFormType = {
  brand: '',
  model: '',
  generation: '',
  year: '',
  bodyType: 'Sedan',
  color: '',
  mileage: '',
  price: '',
  city: '',
  image: '',
  engine: '',
  displacement: '',
  power: '',
  torque: '',
  fuelType: 'Diesel',
  transmission: 'Manual',
  equipment: [],
  description: '',
};

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1950;

const DEFAULT_IMAGE =
  'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

function carToForm(car: MyGarageCar): CarFormType {
  return {
    brand: car.brand,
    model: car.model,
    generation: car.generation === '-' ? '' : car.generation,
    year: String(car.year),
    bodyType: car.bodyType,
    color: car.color === '-' ? '' : car.color,
    mileage: String(car.mileage),
    price: String(car.price),
    city: car.city === '-' ? '' : car.city,
    image: car.image,
    engine: car.specs.engine === '-' ? '' : car.specs.engine,
    displacement:
      car.specs.displacement === '-'
        ? ''
        : car.specs.displacement,
    power:
      car.specs.power === '-' ? '' : car.specs.power,
    torque:
      car.specs.torque === '-' ? '' : car.specs.torque,
    fuelType: car.specs.fuelType,
    transmission: car.specs.transmission,
    equipment: car.equipment || [],
    description: car.description || '',
  };
}

function autoDescription(form: CarFormType): string {
  const bits = [
    [form.brand, form.model, form.generation].filter(Boolean).join(' '),
    form.year && `godište ${form.year}`,
    form.color && form.color.toLowerCase(),
    form.mileage && `${Number(form.mileage).toLocaleString('sr-RS')} km`,
    [form.power, form.fuelType].filter(Boolean).join(' '),
  ].filter(Boolean);
  return `${bits.join(' · ')}.`;
}

export function validateCarForm(form: CarFormType): Partial<Record<keyof CarFormType, string>> {
  const errors: Partial<Record<keyof CarFormType, string>> = {};
  if (!form.brand.trim()) errors.brand = 'Izaberi marku vozila.';
  if (!form.model.trim()) errors.model = 'Izaberi model.';

  const price = parseInt(form.price, 10);
  if (!form.price.trim()) errors.price = 'Unesi cenu.';
  else if (!Number.isFinite(price) || price <= 0) errors.price = 'Cena mora biti veća od nule.';
  else if (price > 1_000_000) errors.price = 'Cena deluje nerealno.';

  if (form.year.trim()) {
    const year = parseInt(form.year, 10);
    if (!Number.isFinite(year) || year < MIN_YEAR || year > CURRENT_YEAR + 1) {
      errors.year = `Godište mora biti između ${MIN_YEAR} i ${CURRENT_YEAR + 1}.`;
    }
  }

  if (form.mileage.trim() && parseInt(form.mileage, 10) > 2_000_000) {
    errors.mileage = 'Kilometraža deluje nerealno.';
  }

  return errors;
}

export function formToMyGarageCar(
  form: CarFormType,
  id: string,
  imagesList?: string[],
  /** Existing car when editing — fields the form does not expose are kept. */
  base?: MyGarageCar | null,
): MyGarageCar {
  const mainImage =
    imagesList && imagesList.length > 0
      ? imagesList[0]
      : form.image || DEFAULT_IMAGE;

  const user = userStore.get();

  return {
    id,
    brand: form.brand,
    model: form.model,
    generation: form.generation || '-',
    year: parseInt(form.year, 10) || 2000,
    bodyType: form.bodyType,
    color: form.color || '-',
    mileage: parseInt(form.mileage, 10) || 0,
    price: parseInt(form.price, 10) || 0,
    city: form.city || '-',
    country: base?.country ?? 'Serbia',
    image: mainImage,
    images: imagesList && imagesList.length > 0 ? imagesList : [mainImage],

    specs: {
      engine: form.engine || '-',
      displacement: form.displacement || '-',
      cylinders: base?.specs.cylinders ?? 0,
      power: form.power || '-',
      torque: form.torque || '-',
      fuelType: form.fuelType,
      transmission: form.transmission,
      drivetrain: base?.specs.drivetrain ?? 'RWD',
      topSpeed: base?.specs.topSpeed ?? '-',
      acceleration: base?.specs.acceleration ?? '-',
    },

    owner: {
      name: shortName(user.name),
      phone: user.phone,
      city: form.city || user.city || '-',
      rating: user.rating,
    },

    description: form.description.trim() || autoDescription(form),

    modifications: base?.modifications ?? [],
    securityFeatures: base?.securityFeatures ?? [],
    buildNotes: base?.buildNotes ?? [],
    estimatedValue: parseInt(form.price, 10) || 0,
    equipment: form.equipment,
  };
}

interface CarFormFieldsProps {
  form: CarFormType;
  setForm: (form: CarFormType) => void;
  images: string[];
  setImages: (images: string[]) => void;
  errors: Partial<Record<keyof CarFormType, string>>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-rose-400">
      {message}
    </p>
  );
}

function CarFormFields({
  form,
  setForm,
  images,
  setImages,
  errors,
}: CarFormFieldsProps) {
  function update<K extends keyof CarFormType>(
    key: K,
    value: CarFormType[K],
  ) {
    setForm({
      ...form,
      [key]: value,
    });
  }

  function updateBrand(brand: string) {
    setForm({
      ...form,
      brand,
      model: '',
    });
  }

  function toggleEquipment(id: string) {
    const next = form.equipment.includes(id)
      ? form.equipment.filter((e) => e !== id)
      : [...form.equipment, id];
    update('equipment', next);
  }

  const inputClass =
    'h-11 w-full rounded-xl border border-surface bg-elevated px-3.5 text-sm text-app-primary outline-none transition-all placeholder:text-app-muted hover:border-orange-500/40 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10';

  const selectClass =
    'h-11 w-full rounded-xl border border-surface bg-elevated px-3.5 text-sm text-app-primary outline-none transition-all hover:border-orange-500/40 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-50';

  const errorRing = 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/10';

  const labelClass =
    'mb-2 block text-xs font-medium text-app-muted';

  return (
    <div className="space-y-8">

      {/* OSNOVNI PODACI */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-app-primary">
            Osnovni podaci
          </h2>

          <p className="mt-1 text-xs text-app-muted">
            Unesite osnovne informacije o vozilu.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div>
            <label className={labelClass}>
              Marka *
            </label>

            <select
              value={form.brand}
              onChange={(e) =>
                updateBrand(e.target.value)
              }
              aria-invalid={Boolean(errors.brand)}
              className={`${selectClass} ${errors.brand ? errorRing : ''}`}
            >
              <option value="">
                Izaberi marku...
              </option>

              {BRAND_NAMES.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            <FieldError message={errors.brand} />
          </div>

          <div>
            <label className={labelClass}>
              Model *
            </label>

            <select
              value={form.model}
              onChange={(e) =>
                update('model', e.target.value)
              }
              disabled={!form.brand}
              aria-invalid={Boolean(errors.model)}
              className={`${selectClass} ${errors.model ? errorRing : ''}`}
            >
              <option value="">
                {form.brand
                  ? 'Izaberi model...'
                  : 'Prvo izaberi marku'}
              </option>

              {form.brand &&
                CAR_BRANDS[form.brand]?.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
            </select>
            <FieldError message={errors.model} />
          </div>

          <div>
            <label className={labelClass}>
              Generacija
            </label>

            <input
              value={form.generation}
              onChange={(e) =>
                update('generation', e.target.value)
              }
              placeholder="npr. E60"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Godina
            </label>

            <input
              value={form.year}
              onChange={(e) =>
                update(
                  'year',
                  e.target.value
                    .replace(/\D/g, '')
                    .slice(0, 4),
                )
              }
              placeholder="npr. 2005"
              inputMode="numeric"
              aria-invalid={Boolean(errors.year)}
              className={`${inputClass} ${errors.year ? errorRing : ''}`}
            />
            <FieldError message={errors.year} />
          </div>

        </div>
      </section>

      {/* CENA I LOKACIJA */}
      <section className="border-t border-surface pt-8">

        <div className="mb-4">
          <h2 className="text-base font-semibold text-app-primary">
            Cena i lokacija
          </h2>

          <p className="mt-1 text-xs text-app-muted">
            Informacije koje kupac prvo vidi.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div>
            <label className={labelClass}>
              Cena (EUR) *
            </label>

            <div className="relative">
              <input
                value={form.price}
                onChange={(e) =>
                  update(
                    'price',
                    e.target.value.replace(/\D/g, ''),
                  )
                }
                placeholder="6500"
                inputMode="numeric"
                aria-invalid={Boolean(errors.price)}
                className={`${inputClass} pr-14 ${errors.price ? errorRing : ''}`}
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-app-muted">
                EUR
              </span>
            </div>
            <FieldError message={errors.price} />
          </div>

          <div>
            <label className={labelClass}>
              Kilometraža
            </label>

            <div className="relative">
              <input
                value={form.mileage}
                onChange={(e) =>
                  update(
                    'mileage',
                    e.target.value.replace(/\D/g, ''),
                  )
                }
                placeholder="198000"
                inputMode="numeric"
                aria-invalid={Boolean(errors.mileage)}
                className={`${inputClass} pr-14 ${errors.mileage ? errorRing : ''}`}
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-app-muted">
                KM
              </span>
            </div>
            <FieldError message={errors.mileage} />
          </div>

          <div>
            <label className={labelClass}>
              Boja
            </label>

            <input
              value={form.color}
              onChange={(e) =>
                update('color', e.target.value)
              }
              placeholder="Sapphire Black"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Grad
            </label>

            <input
              value={form.city}
              onChange={(e) =>
                update('city', e.target.value)
              }
              placeholder="Kosovska Mitrovica"
              className={inputClass}
            />
          </div>

        </div>
      </section>

      {/* KAROSERIJA */}
      <section className="border-t border-surface pt-8">

        <div className="mb-4">
          <h2 className="text-base font-semibold text-app-primary">
            Tip karoserije
          </h2>

          <p className="mt-1 text-xs text-app-muted">
            Izaberite tip karoserije vozila.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">

          {BODY_TYPES.map((type) => {
            const active = form.bodyType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() =>
                  update('bodyType', type)
                }
                className={`
                  min-h-10 rounded-xl border px-3 py-2
                  text-xs font-medium transition-all
                  ${
                    active
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-surface bg-elevated text-app-secondary hover:border-orange-500/40 hover:bg-hover-surface hover:text-app-primary'
                  }
                `}
              >
                {type}
              </button>
            );
          })}

        </div>
      </section>

      {/* MOTOR */}
      <section className="border-t border-surface pt-8">

        <div className="mb-4">
          <h2 className="text-base font-semibold text-app-primary">
            Specifikacije motora
          </h2>

          <p className="mt-1 text-xs text-app-muted">
            Dodajte detalje motora i performansi.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div>
            <label className={labelClass}>
              Motor
            </label>

            <input
              value={form.engine}
              onChange={(e) =>
                update('engine', e.target.value)
              }
              placeholder="M57D25"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Zapremina
            </label>

            <input
              value={form.displacement}
              onChange={(e) =>
                update(
                  'displacement',
                  e.target.value,
                )
              }
              placeholder="2.5L"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Snaga
            </label>

            <input
              value={form.power}
              onChange={(e) =>
                update('power', e.target.value)
              }
              placeholder="177 HP"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Obrtni moment
            </label>

            <input
              value={form.torque}
              onChange={(e) =>
                update('torque', e.target.value)
              }
              placeholder="410 Nm"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Gorivo
            </label>

            <select
              value={form.fuelType}
              onChange={(e) =>
                update(
                  'fuelType',
                  e.target.value as FuelType,
                )
              }
              className={selectClass}
            >
              {FUEL_TYPES.map((fuel) => (
                <option key={fuel} value={fuel}>
                  {fuel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>
              Menjač
            </label>

            <select
              value={form.transmission}
              onChange={(e) =>
                update(
                  'transmission',
                  e.target.value as Transmission,
                )
              }
              className={selectClass}
            >
              {TRANSMISSIONS.map((transmission) => (
                <option
                  key={transmission}
                  value={transmission}
                >
                  {transmission}
                </option>
              ))}
            </select>
          </div>

        </div>
      </section>

      {/* OPIS */}
      <section className="border-t border-surface pt-8">

        <div className="mb-4">
          <h2 className="text-base font-semibold text-app-primary">
            Opis
          </h2>

          <p className="mt-1 text-xs text-app-muted">
            Opišite stanje vozila. Ako ostavite prazno, opis se generiše automatski.
          </p>
        </div>

        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value.slice(0, 600))}
          rows={4}
          placeholder="Redovno servisiran, bez ulaganja, prvi vlasnik..."
          className="w-full resize-y rounded-xl border border-surface bg-elevated px-3.5 py-3 text-sm leading-relaxed text-app-primary outline-none transition-all placeholder:text-app-muted hover:border-orange-500/40 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
        />
        <p className="mt-1.5 text-right text-[11px] text-app-muted">
          {form.description.length}/600
        </p>

      </section>

      {/* FOTOGRAFIJE */}
      <section className="border-t border-surface pt-8">

        <div className="mb-4">
          <h2 className="text-base font-semibold text-app-primary">
            Fotografije
          </h2>

          <p className="mt-1 text-xs text-app-muted">
            Dodajte do 20 fotografija.
          </p>
        </div>

        <div className="rounded-2xl border border-surface bg-app p-4">
          <ImageUpload
            images={images}
            onChange={setImages}
            maxImages={20}
          />
        </div>

      </section>

      {/* OPREMA */}
      <section className="border-t border-surface pt-8">

        <div className="mb-4">
          <h2 className="text-base font-semibold text-app-primary">
            Oprema vozila
          </h2>

          <p className="mt-1 text-xs text-app-muted">
            Štiklirajte opremu koju vaše vozilo poseduje.
          </p>
        </div>

        <div className="space-y-5">
          {EQUIPMENT_CATEGORIES.map((category) => {
            const CatIcon = category.icon;
            return (
              <div key={category.id}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <CatIcon size={14} className="text-orange-400" />
                  </div>
                  <p className="text-xs font-bold text-app-primary">{category.label}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {category.items.map((item) => {
                    const active = form.equipment.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleEquipment(item.id)}
                        className={`
                          flex items-center gap-1.5 rounded-xl border px-3 py-2
                          text-xs font-medium transition-all
                          ${
                            active
                              ? 'border-orange-500 bg-orange-500 text-white'
                              : 'border-surface bg-elevated text-app-secondary hover:border-orange-500/40 hover:bg-hover-surface hover:text-app-primary'
                          }
                        `}
                      >
                        {active && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}

interface AddCarFormProps {
  onSave: (car: MyGarageCar) => void;
  onCancel: () => void;
  editingCar?: MyGarageCar | null;
}

export default function CarFormComponent({
  onSave,
  onCancel,
  editingCar,
}: AddCarFormProps) {
  const [form, setForm] =
    useState<CarFormType>(EMPTY_FORM);

  const [images, setImages] =
    useState<string[]>([]);

  const [mounted, setMounted] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSubmitted(false);
    if (editingCar) {
      setForm(carToForm(editingCar));
      // Keep every photo on the car, not just the cover.
      const existing = getCarImages(editingCar).filter(
        (img) => img && img !== DEFAULT_IMAGE,
      );
      setImages(existing);
    } else {
      setForm(EMPTY_FORM);
      setImages([]);
    }
  }, [editingCar]);

  const errors = validateCarForm(form);
  const isValid = Object.keys(errors).length === 0;
  const visibleErrors = submitted ? errors : {};

  function handleSave() {
    setSubmitted(true);
    if (!isValid) {
      const firstInvalid = document.querySelector('[aria-invalid="true"]');
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const id =
      editingCar?.id ||
      `garage-${Date.now()}`;

    onSave(
      formToMyGarageCar(
        form,
        id,
        images,
        editingCar,
      ),
    );
  }

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 flex h-[100dvh] w-screen flex-col overflow-hidden bg-app"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 2147483647,
      }}
    >

      {/* HEADER */}
      <header className="shrink-0 border-b border-surface bg-app safe-top">

        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6">

          <div>
            <h1 className="text-base font-bold text-app-primary sm:text-lg">
              {editingCar
                ? 'Izmeni automobil'
                : 'Dodaj oglas'}
            </h1>

            <p className="hidden text-xs text-app-muted sm:block">
              Unesite podatke o vozilu
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Zatvori"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface bg-elevated text-app-secondary transition-all hover:border-orange-500/40 hover:bg-hover-surface hover:text-app-primary"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

        </div>
      </header>

      {/* CONTENT */}
      <main className="min-h-0 flex-1 overflow-y-auto">

        <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

          <div className="mb-7">

            <h2 className="text-xl font-bold tracking-tight text-app-primary sm:text-2xl">
              {editingCar
                ? 'Izmeni detalje vozila'
                : 'Dodaj svoj automobil'}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">
              Popunite informacije o automobilu kako bi
              vaš oglas bio što potpuniji.
            </p>

          </div>

          <div className="rounded-2xl border border-surface bg-card-surface p-4 sm:p-6 lg:p-8">

            <CarFormFields
              form={form}
              setForm={setForm}
              images={images}
              setImages={setImages}
              errors={visibleErrors}
            />

          </div>

          <div className="h-8" />

        </div>
      </main>

      {/* ACTION BUTTONS */}
      <div
        className="shrink-0 border-t border-surface bg-app safe-bottom"
        style={{
          position: 'relative',
          zIndex: 2147483647,
        }}
      >

        <div className="mx-auto flex w-full max-w-[420px] flex-col items-center gap-2.5 px-4 py-3 sm:px-6">

          {/* OTKAŽI */}
          <button
            type="button"
            onClick={onCancel}
            className="h-11 w-full rounded-xl border border-surface bg-elevated px-4 text-sm font-semibold text-app-secondary transition-all hover:border-orange-500/40 hover:bg-hover-surface hover:text-app-primary active:scale-[0.98]"
          >
            Otkaži
          </button>

          {/* OBJAVI OGLAS */}
          {submitted && !isValid && (
            <p role="alert" className="w-full text-center text-xs font-medium text-rose-400">
              Popuni obavezna polja označena crvenim.
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            aria-disabled={!isValid}
            className={`h-11 w-full rounded-xl px-4 text-sm font-bold text-white transition-all active:scale-[0.98] ${
              isValid
                ? 'bg-orange-500 hover:bg-orange-400'
                : 'bg-orange-500/50 hover:bg-orange-500/60'
            }`}
          >
            {editingCar
              ? 'Sačuvaj izmene'
              : 'Objavi oglas'}
          </button>

        </div>
      </div>

    </div>,
    document.body,
  );
}