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
import { CAR_BRANDS, BRAND_NAMES } from '@/lib/car-brands';
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
};

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
  };
}

export function formToMyGarageCar(
  form: CarFormType,
  id: string,
  imagesList?: string[],
): MyGarageCar {
  const mainImage =
    imagesList && imagesList.length > 0
      ? imagesList[0]
      : form.image || DEFAULT_IMAGE;

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
    country: 'Serbia',
    image: mainImage,

    specs: {
      engine: form.engine || '-',
      displacement: form.displacement || '-',
      cylinders: 0,
      power: form.power || '-',
      torque: form.torque || '-',
      fuelType: form.fuelType,
      transmission: form.transmission,
      drivetrain: 'RWD',
      topSpeed: '-',
      acceleration: '-',
    },

    owner: {
      name: 'Nikola V.',
      phone: '+381 64 123 4567',
      city: form.city || '-',
      rating: 4.9,
    },

    description: `${form.brand} ${form.model} ${form.generation} — ${form.color}, ${form.year}. ${form.power} ${form.fuelType}.`,

    modifications: [],
    securityFeatures: [],
    buildNotes: [],
    estimatedValue: parseInt(form.price, 10) || 0,
  };
}

interface CarFormFieldsProps {
  form: CarFormType;
  setForm: (form: CarFormType) => void;
  images: string[];
  setImages: (images: string[]) => void;
}

function CarFormFields({
  form,
  setForm,
  images,
  setImages,
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

  const inputClass =
    'h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600 hover:border-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10';

  const selectClass =
    'h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 text-sm text-zinc-100 outline-none transition-all hover:border-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-50';

  const labelClass =
    'mb-2 block text-xs font-medium text-zinc-400';

  return (
    <div className="space-y-8">

      {/* OSNOVNI PODACI */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-white">
            Osnovni podaci
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
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
              className={selectClass}
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
              className={selectClass}
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
              className={inputClass}
            />
          </div>

        </div>
      </section>

      {/* CENA I LOKACIJA */}
      <section className="border-t border-zinc-800 pt-8">

        <div className="mb-4">
          <h2 className="text-base font-semibold text-white">
            Cena i lokacija
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
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
                className={`${inputClass} pr-14`}
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                EUR
              </span>
            </div>
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
                className={`${inputClass} pr-14`}
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                KM
              </span>
            </div>
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
      <section className="border-t border-zinc-800 pt-8">

        <div className="mb-4">
          <h2 className="text-base font-semibold text-white">
            Tip karoserije
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
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
                      ? 'border-orange-500 bg-orange-500 text-zinc-950'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white'
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
      <section className="border-t border-zinc-800 pt-8">

        <div className="mb-4">
          <h2 className="text-base font-semibold text-white">
            Specifikacije motora
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
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

      {/* FOTOGRAFIJE */}
      <section className="border-t border-zinc-800 pt-8">

        <div className="mb-4">
          <h2 className="text-base font-semibold text-white">
            Fotografije
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            Dodajte do 5 fotografija.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <ImageUpload
            images={images}
            onChange={setImages}
            maxImages={5}
          />
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editingCar) {
      setForm(carToForm(editingCar));

      setImages(
        editingCar.image &&
          editingCar.image !== DEFAULT_IMAGE
          ? [editingCar.image]
          : [],
      );
    } else {
      setForm(EMPTY_FORM);
      setImages([]);
    }
  }, [editingCar]);

  function handleSave() {
    if (
      !form.brand.trim() ||
      !form.model.trim() ||
      !form.price.trim()
    ) {
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
      ),
    );
  }

  const isValid =
    Boolean(form.brand.trim()) &&
    Boolean(form.model.trim()) &&
    Boolean(form.price.trim());

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 flex h-[100dvh] w-screen flex-col overflow-hidden bg-zinc-950"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 2147483647,
      }}
    >

      {/* HEADER */}
      <header className="shrink-0 border-b border-zinc-800 bg-zinc-950">

        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6">

          <div>
            <h1 className="text-base font-bold text-white sm:text-lg">
              {editingCar
                ? 'Izmeni automobil'
                : 'Dodaj oglas'}
            </h1>

            <p className="hidden text-xs text-zinc-500 sm:block">
              Unesite podatke o vozilu
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Zatvori"
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-xl
              border border-zinc-700
              bg-zinc-900
              text-zinc-400
              transition-all
              hover:border-zinc-600
              hover:bg-zinc-800
              hover:text-white
            "
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

      {/* SCROLLABLE CONTENT */}
      <main className="min-h-0 flex-1 overflow-y-auto">

        <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

          <div className="mb-7">

            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              {editingCar
                ? 'Izmeni detalje vozila'
                : 'Dodaj svoj automobil'}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Popunite informacije o automobilu kako bi
              vaš oglas bio što potpuniji.
            </p>

          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6 lg:p-8">

            <CarFormFields
              form={form}
              setForm={setForm}
              images={images}
              setImages={setImages}
            />

          </div>

          <div className="h-8" />

        </div>
      </main>

      {/* ACTIONS */}
      <div
        className="shrink-0 border-t border-zinc-800 bg-zinc-950"
        style={{
          position: 'relative',
          zIndex: 2147483647,
        }}
      >

        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-end gap-3 px-4 py-3 sm:px-6 lg:px-8">

          <button
            type="button"
            onClick={onCancel}
            className="
              h-11
              rounded-xl
              border border-zinc-700
              bg-zinc-900
              px-6
              text-sm
              font-semibold
              text-zinc-300
              transition-all
              hover:border-zinc-600
              hover:bg-zinc-800
              hover:text-white
              active:scale-[0.98]
            "
          >
            Otkaži
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className={`
              h-11
              rounded-xl
              px-6
              text-sm
              font-bold
              transition-all
              active:scale-[0.98]
              ${
                isValid
                  ? 'bg-orange-500 text-zinc-950 shadow-lg shadow-orange-500/10 hover:bg-orange-400'
                  : 'cursor-not-allowed bg-zinc-800 text-zinc-600'
              }
            `}
          >
            {editingCar
              ? 'Sačuvaj izmene'
              : 'Dodaj oglas'}
          </button>

        </div>
      </div>

    </div>,
    document.body,
  );
}