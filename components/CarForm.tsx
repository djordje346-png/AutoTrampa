'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type {
  BodyType,
  CarForm as CarFormType,
  FuelType,
  MyGarageCar,
  Transmission,
  VehicleCondition,
} from '@/types';
import { getCarImages } from '@/types';
import { CAR_MAKES, getCarModels, isCataloguedModel } from '@/lib/car-catalog';
import { bodyLabel, fuelLabel, transmissionLabel } from '@/lib/labels';
import { userStore, shortName } from '@/hooks/use-user';
import { EQUIPMENT_CATEGORIES } from '@/lib/equipment';
import { ImageUpload } from '@/components/image-upload';
import { CitySelect } from '@/components/CitySelect';
import { getSerbianPlace } from '@/lib/city-coordinates';
import { VehicleCombobox } from '@/components/VehicleCombobox';

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
  'LPG',
  'CNG',
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
  bodyType: '',
  color: '',
  mileage: '',
  mileageUnknown: false,
  price: '',
  city: '',
  image: '',
  engine: '',
  displacement: '',
  power: '',
  torque: '',
  fuelType: '',
  transmission: '',
  condition: '',
  equipment: [],
  description: '',
};

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1886;
type FormStep = 1 | 2 | 3;

const LEGACY_DEFAULT_IMAGE =
  'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

function carToForm(car: MyGarageCar): CarFormType {
  return {
    brand: car.brand,
    model: car.model,
    generation: car.generation === '-' ? '' : car.generation,
    year: car.year == null ? '' : String(car.year),
    bodyType: car.bodyType ?? '',
    color: car.color === '-' ? '' : car.color,
    mileage: car.mileage == null ? '' : String(car.mileage),
    mileageUnknown: car.mileage == null,
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
    fuelType: car.specs.fuelType ?? '',
    transmission: car.specs.transmission ?? '',
    condition: car.condition ?? '',
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

export function validateCarFormStep(
  form: CarFormType,
  step: FormStep,
): Partial<Record<keyof CarFormType, string>> {
  const errors = validateCarForm(form);
  const keys: (keyof CarFormType)[] = step === 1
    ? ['brand', 'model', 'year', 'bodyType', 'fuelType', 'transmission']
    : step === 2
      ? ['price', 'mileage', 'city']
      : [];
  return Object.fromEntries(keys.filter((key) => errors[key]).map((key) => [key, errors[key]])) as Partial<Record<keyof CarFormType, string>>;
}

export function validateCarForm(form: CarFormType): Partial<Record<keyof CarFormType, string>> {
  const errors: Partial<Record<keyof CarFormType, string>> = {};
  if (!form.brand.trim()) errors.brand = 'Izaberi marku vozila.';
  if (!form.model.trim()) errors.model = 'Izaberi model.';
  if (!getSerbianPlace(form.city)) errors.city = 'Izaberi grad ili naselje iz liste.';

  const price = parseInt(form.price, 10);
  if (!form.price.trim()) errors.price = 'Unesi cenu.';
  else if (!Number.isFinite(price) || price <= 0) errors.price = 'Cena mora biti veća od nule.';
  else if (price > 1_000_000) errors.price = 'Cena deluje nerealno.';

  if (!form.year.trim()) {
    errors.year = 'Unesi godište vozila.';
  } else {
    const year = parseInt(form.year, 10);
    if (!Number.isFinite(year) || year < MIN_YEAR || year > CURRENT_YEAR + 1) {
      errors.year = `Godište mora biti između ${MIN_YEAR} i ${CURRENT_YEAR + 1}.`;
    }
  }

  if (!form.bodyType) errors.bodyType = 'Izaberi tip karoserije.';
  if (!form.fuelType) errors.fuelType = 'Izaberi gorivo.';
  if (!form.transmission) errors.transmission = 'Izaberi menjač.';

  if (!form.mileageUnknown) {
    if (!form.mileage.trim()) errors.mileage = 'Unesi kilometražu ili označi da nije poznata.';
    else {
      const mileage = parseInt(form.mileage, 10);
      if (!Number.isFinite(mileage) || mileage < 0 || mileage > 2_000_000) {
        errors.mileage = 'Unesi kilometražu do 2.000.000 km ili označi da nije poznata.';
      }
    }
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
  const carImages = (imagesList?.length ? imagesList : form.image ? [form.image] : [])
    .filter((image) => image && image !== LEGACY_DEFAULT_IMAGE);
  const mainImage = carImages[0] ?? '';

  const user = userStore.get();

  return {
    id,
    brand: form.brand,
    model: form.model,
    generation: form.generation || '-',
    year: parseInt(form.year, 10) || null,
    bodyType: form.bodyType as BodyType,
    color: form.color || '-',
    mileage: form.mileageUnknown ? null : parseInt(form.mileage, 10),
    price: parseInt(form.price, 10) || 0,
    city: form.city || '-',
    country: base?.country ?? 'Serbia',
    image: mainImage,
    images: carImages,

    specs: {
      engine: form.engine || '-',
      displacement: form.displacement || '-',
      cylinders: base?.specs.cylinders ?? 0,
      power: form.power || '-',
      torque: form.torque || '-',
      fuelType: form.fuelType as FuelType,
      transmission: form.transmission as Transmission,
      drivetrain: base?.specs.drivetrain ?? '-',
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
    condition: form.condition ? form.condition as VehicleCondition : null,
  };
}

interface CarFormFieldsProps {
  form: CarFormType;
  setForm: (form: CarFormType) => void;
  images: string[];
  setImages: (images: string[]) => void;
  errors: Partial<Record<keyof CarFormType, string>>;
  step: FormStep;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-tone-negative">
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
  step,
}: CarFormFieldsProps) {
  const [manualModelSelected, setManualModelSelected] = useState(false);
  const [openEquipmentGroups, setOpenEquipmentGroups] = useState<Set<string>>(() => new Set(['safety']));

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
    setManualModelSelected(false);
  }

  function toggleEquipment(id: string) {
    const next = form.equipment.includes(id)
      ? form.equipment.filter((e) => e !== id)
      : [...form.equipment, id];
    update('equipment', next);
  }

  function toggleEquipmentGroup(id: string) {
    setOpenEquipmentGroups((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const inputClass =
    'h-11 w-full rounded-xl border border-surface dark:border-surface bg-elevated px-3.5 text-sm text-app-primary dark:text-app-primary outline-none transition-all placeholder:text-app-muted hover:border-brand-500/40 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 lg:h-10';

  const selectClass =
    'h-11 w-full rounded-xl border border-surface dark:border-surface bg-elevated px-3.5 text-sm text-app-primary dark:text-app-primary outline-none transition-all hover:border-brand-500/40 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-50 lg:h-10';

  const errorRing = 'border-tone-negative focus:border-tone-negative focus:ring-ring/15';

  const labelClass =
    'mb-2 block text-xs font-medium text-app-muted lg:mb-1.5';
  const modelOptions = getCarModels(form.brand);
  const hasEngineDetails = Boolean(form.engine || form.displacement || form.power || form.torque);
  const showManualModel = manualModelSelected || Boolean(
    form.model.trim() && !isCataloguedModel(form.brand, form.model),
  );

  return (
    <div className="space-y-5 lg:space-y-3.5">

      {step === 1 && (
        <>
          <section>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 desktop:grid-cols-3 lg:gap-3">
              <div>
                <VehicleCombobox
                  id="car-brand"
                  label="Marka *"
                  value={form.brand}
                  options={CAR_MAKES}
                  placeholder="Pretraži marku"
                  invalid={Boolean(errors.brand)}
                  className={inputClass}
                  onChange={updateBrand}
                />
                <FieldError message={errors.brand} />
              </div>
              <div>
                {showManualModel ? (
                  <>
                    <label htmlFor="car-model-manual" className={labelClass}>Model *</label>
                    <input
                      id="car-model-manual"
                      value={form.model}
                      onChange={(event) => update('model', event.target.value)}
                      placeholder="Unesi naziv modela"
                      aria-invalid={Boolean(errors.model)}
                      className={`${inputClass} ${errors.model ? errorRing : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setManualModelSelected(false);
                        update('model', '');
                      }}
                      className="mt-1.5 text-left text-[11px] font-medium text-brand-text hover:underline"
                    >
                      Izaberi model iz kataloga
                    </button>
                  </>
                ) : (
                  <VehicleCombobox
                    id="car-model"
                    label="Model *"
                    value={form.model}
                    options={modelOptions}
                    placeholder="Pretraži model"
                    disabled={!form.brand}
                    invalid={Boolean(errors.model)}
                    className={inputClass}
                    onChange={(model) => update('model', model)}
                    onChooseOther={(searchText) => {
                      setManualModelSelected(true);
                      update('model', searchText);
                    }}
                  />
                )}
                <FieldError message={errors.model} />
              </div>
              <div>
                <label htmlFor="car-year" className={labelClass}>Godište *</label>
                <input
                  id="car-year"
                  required
                  value={form.year}
                  onChange={(event) => update('year', event.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="npr. 2005"
                  inputMode="numeric"
                  aria-invalid={Boolean(errors.year)}
                  className={`${inputClass} ${errors.year ? errorRing : ''}`}
                />
                <FieldError message={errors.year} />
              </div>
              <div>
                <label htmlFor="car-fuel" className={labelClass}>Gorivo *</label>
                <select
                  id="car-fuel"
                  required
                  value={form.fuelType}
                  onChange={(event) => update('fuelType', event.target.value as FuelType | '')}
                  aria-invalid={Boolean(errors.fuelType)}
                  className={`${selectClass} ${errors.fuelType ? errorRing : ''}`}
                >
                  <option value="">Izaberi gorivo</option>
                  {FUEL_TYPES.map((fuel) => <option key={fuel} value={fuel}>{fuelLabel(fuel)}</option>)}
                </select>
                <FieldError message={errors.fuelType} />
              </div>
              <div>
                <label htmlFor="car-transmission" className={labelClass}>Menjač *</label>
                <select
                  id="car-transmission"
                  required
                  value={form.transmission}
                  onChange={(event) => update('transmission', event.target.value as Transmission | '')}
                  aria-invalid={Boolean(errors.transmission)}
                  className={`${selectClass} ${errors.transmission ? errorRing : ''}`}
                >
                  <option value="">Izaberi menjač</option>
                  {TRANSMISSIONS.map((transmission) => <option key={transmission} value={transmission}>{transmissionLabel(transmission)}</option>)}
                </select>
                <FieldError message={errors.transmission} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-1 text-[10px] text-app-muted">
              <span>Podaci o vozilima:</span>
              <a href="https://vehiclesdb.com" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2 hover:text-brand-text">VehiclesDB</a>
              <span aria-hidden="true">·</span>
              <a href="/attribution/vehiclesdb-2026.10.3.md" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-brand-text">Licenca i izvori</a>
            </div>
          </section>
        </>
      )}

      {step === 2 && (
      <>
      {/* CENA I LOKACIJA */}
      <section className="border-t border-surface pt-4 dark:border-surface lg:pt-3">

        <div className="mb-3 lg:mb-2">
          <h2 className="text-base font-semibold text-app-primary dark:text-app-primary">
            Cena i lokacija
          </h2>

          <p className="mt-1 text-xs text-app-muted">
            Informacije koje kupac prvo vidi.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 desktop:grid-cols-3 lg:gap-3">

          <div>
            <label htmlFor="car-price" className={labelClass}>
              Cena vozila (EUR) *
            </label>

            <div className="relative">
              <input
                id="car-price"
                required
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
            <p className="mt-1 text-[10px] leading-relaxed text-app-muted">Okvirna vrednost oglasa za poređenje i obračun doplate.</p>
          </div>

          <div>
            <label htmlFor="car-mileage" className={labelClass}>
              Kilometraža {form.mileageUnknown ? '(nepoznata)' : '*'}
            </label>

            <div className="relative">
              <input
                id="car-mileage"
                required={!form.mileageUnknown}
                value={form.mileage}
                disabled={form.mileageUnknown}
                onChange={(e) =>
                  update(
                    'mileage',
                    e.target.value.replace(/\D/g, ''),
                  )
                }
                placeholder={form.mileageUnknown ? 'Nije navedena' : 'npr. 198000'}
                inputMode="numeric"
                aria-invalid={Boolean(errors.mileage)}
                className={`${inputClass} pr-14 disabled:cursor-not-allowed disabled:opacity-60 ${errors.mileage ? errorRing : ''}`}
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-app-muted">
                KM
              </span>
            </div>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-[11px] text-app-muted">
              <input
                type="checkbox"
                checked={form.mileageUnknown}
                onChange={(event) => setForm({ ...form, mileageUnknown: event.target.checked, mileage: event.target.checked ? '' : form.mileage })}
                className="h-4 w-4 rounded border-surface accent-brand-500"
              />
              Ne znam tačnu kilometražu
            </label>
            <FieldError message={errors.mileage} />
          </div>

          <div>
            <label htmlFor="car-color" className={labelClass}>
              Boja
            </label>

            <input
              id="car-color"
              value={form.color}
              onChange={(e) =>
                update('color', e.target.value)
              }
              placeholder="Sapphire Black"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="car-city" className={labelClass}>
              Grad oglasa *
            </label>

            <CitySelect
              id="car-city"
              value={form.city}
              onChange={(city) => update('city', city)}
              className={`${inputClass} ${errors.city ? errorRing : ''}`}
              invalid={Boolean(errors.city)}
              required
            />
            <FieldError message={errors.city} />
          </div>

          <div>
            <label htmlFor="car-condition" className={labelClass}>Stanje vozila <span className="font-normal">(opciono)</span></label>
            <select
              id="car-condition"
              value={form.condition}
              onChange={(event) => update('condition', event.target.value as VehicleCondition | '')}
              className={selectClass}
            >
              <option value="">Nije navedeno</option>
              <option value="good">Bez većih ulaganja</option>
              <option value="minor_work">Potrebna manja ulaganja</option>
              <option value="major_work">Potrebna veća ulaganja</option>
              <option value="not_running">Neispravan / za popravku</option>
            </select>
          </div>

        </div>
      </section>

      </>
      )}

      {step === 1 && (
      <>
      {/* KAROSERIJA */}
      <section className="border-t border-surface pt-4 dark:border-surface lg:pt-3">

        <div className="mb-4">
          <h2 className="text-base font-semibold text-app-primary dark:text-app-primary">
            Tip karoserije *
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
                aria-pressed={active}
                onClick={() =>
                  update('bodyType', type)
                }
                className={`
                  min-h-10 rounded-xl border px-3 py-2
                  text-xs font-medium transition-all
                  ${
                    active
                      ? 'border-brand-500 bg-brand-500 text-app-primary'
                      : 'border-surface dark:border-surface bg-elevated text-app-secondary hover:border-brand-500/40 hover:bg-hover-surface hover:text-app-primary'
                  }
                `}
              >
                {bodyLabel(type)}
              </button>
            );
          })}

        </div>
        <FieldError message={errors.bodyType} />
      </section>

      {/* MOTOR */}
      <section className="border-t border-surface pt-4 dark:border-surface lg:pt-3">
        <details>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-app-secondary marker:hidden dark:text-app-secondary">
            <span>Dodatne specifikacije motora <span className="font-normal text-app-muted">(opciono{hasEngineDetails ? ' · podaci uneti' : ''})</span></span>
            <ChevronDown size={16} className="shrink-0 text-app-muted" />
          </summary>
          <p className="mb-3 mt-1 text-xs text-app-muted">Unesi snagu i zapreminu ako ih znaš.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

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
              placeholder="177 KS"
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

        </div>
        </details>
      </section>

      </>
      )}

      {step === 2 && (
      <>
      {/* OPIS */}
      <section className="border-t border-surface pt-4 dark:border-surface lg:pt-3">

        <div className="mb-3 lg:mb-2">
          <h2 className="text-base font-semibold text-app-primary dark:text-app-primary">
            Opis
          </h2>

          <p className="mt-1 text-xs text-app-muted">
            Opišite servisnu istoriju, poznate nedostatke ili ulaganja. Ako ostavite prazno, prikazaće se sažetak podataka o vozilu.
          </p>
        </div>

        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value.slice(0, 600))}
          rows={3}
          placeholder="Npr. redovno održavan; potrebno je ulaganje u gume; posedujem servisne račune..."
          className="w-full resize-y rounded-xl border border-surface dark:border-surface bg-elevated px-3.5 py-3 text-sm leading-relaxed text-app-primary dark:text-app-primary outline-none transition-all placeholder:text-app-muted hover:border-brand-500/40 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
        />
        <p className="mt-1.5 text-right text-[11px] text-app-muted">
          {form.description.length}/600
        </p>

      </section>

      </>
      )}

      {step === 3 && (
      <>
      {/* FOTOGRAFIJE */}
      <section className="border-t border-surface pt-4 dark:border-surface lg:pt-3">

        <div className="mb-3 lg:mb-2">
          <h2 className="text-base font-semibold text-app-primary dark:text-app-primary">
            Fotografije
          </h2>

          <p className="mt-1 text-xs text-app-muted">
            Obavezna je najmanje jedna fotografija. Preporuka za dobar oglas: 4–6 fotografija.
          </p>
        </div>

        <div className="rounded-2xl border border-surface dark:border-surface bg-app dark:bg-app p-3 lg:p-3">
          <ImageUpload
            images={images}
            onChange={setImages}
            maxImages={20}
          />
        </div>

      </section>

      {/* OPREMA */}
      <section className="border-t border-surface pt-4 dark:border-surface lg:pt-3">
        <details>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-app-secondary dark:text-app-secondary">
            <span>Oprema vozila <span className="font-normal text-app-muted">(opciono{form.equipment.length ? ` · ${form.equipment.length} izabrano` : ''})</span></span>
            <ChevronDown size={16} className="shrink-0 text-app-muted" />
          </summary>
          <p className="mb-3 mt-1 text-xs text-app-muted">Označi samo opremu koju vozilo zaista poseduje.</p>
        <div className="space-y-2">
          {EQUIPMENT_CATEGORIES.map((category) => {
            const CatIcon = category.icon;
            const isOpen = openEquipmentGroups.has(category.id);
            const selectedCount = category.items.filter((item) => form.equipment.includes(item.id)).length;
            return (
              <section key={category.id} className="overflow-hidden rounded-xl border border-surface dark:border-surface">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleEquipmentGroup(category.id)}
                  className="flex min-h-12 w-full items-center gap-2.5 px-3 text-left transition-colors hover:bg-elevated"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10 text-brand-text">
                    <CatIcon size={14} />
                  </span>
                  <span className="min-w-0 flex-1 text-xs font-semibold text-app-primary dark:text-app-primary">{category.label}</span>
                  {selectedCount > 0 && <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-semibold text-brand-text">{selectedCount} izabrano</span>}
                  <ChevronDown size={15} className={`shrink-0 text-app-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="flex flex-wrap gap-2 border-t border-surface p-3 dark:border-surface">
                    {category.items.map((item) => {
                      const active = form.equipment.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleEquipment(item.id)}
                          className={`flex min-h-9 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                            active
                              ? 'border-brand-500 bg-brand-500 text-app-primary'
                              : 'border-surface bg-elevated text-app-secondary hover:border-brand-500/40 hover:bg-hover-surface hover:text-app-primary dark:border-surface'
                          }`}
                        >
                          {active && <Check size={12} strokeWidth={3} />}
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
        </details>
      </section>
      </>
      )}

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

  const [photoError, setPhotoError] = useState('');

  const [mounted, setMounted] =
    useState(false);

  const [step, setStep] = useState<FormStep>(1);
  const [validatedStep, setValidatedStep] = useState<FormStep | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setStep(1);
    setValidatedStep(null);
    if (editingCar) {
      setForm(carToForm(editingCar));
      // Keep every photo on the car, not just the cover.
      const existing = getCarImages(editingCar).filter(
        (img) => img && img !== LEGACY_DEFAULT_IMAGE,
      );
      setImages(existing);
    } else {
      setForm(EMPTY_FORM);
      setImages([]);
    }
    setPhotoError('');
  }, [editingCar]);

  const visibleErrors = validatedStep === step
    ? validateCarFormStep(form, step)
    : {};

  useEffect(() => {
    if (focusRequest === 0) return;
    const frame = requestAnimationFrame(() => {
      const firstInvalid = contentRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstInvalid?.focus();
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => cancelAnimationFrame(frame);
  }, [focusRequest]);

  function scrollToTop() {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function continueStep() {
    const stepErrors = validateCarFormStep(form, step);
    setValidatedStep(step);
    if (Object.keys(stepErrors).length > 0) {
      setFocusRequest((current) => current + 1);
      return;
    }
    setValidatedStep(null);
    setStep((current) => Math.min(current + 1, 3) as FormStep);
    scrollToTop();
  }

  function previousStep() {
    setValidatedStep(null);
    setStep((current) => Math.max(current - 1, 1) as FormStep);
    scrollToTop();
  }

  function handleSave() {
    const errors = validateCarForm(form);
    if (Object.keys(errors).length > 0) {
      const targetStep: FormStep = errors.brand || errors.model || errors.year || errors.bodyType || errors.fuelType || errors.transmission
        ? 1
        : 2;
      setStep(targetStep);
      setValidatedStep(targetStep);
      setFocusRequest((current) => current + 1);
      return;
    }

    if (images.length === 0) {
      setPhotoError('Dodaj bar jednu stvarnu fotografiju svog vozila pre objave.');
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setPhotoError('');

    const id =
      editingCar?.id ||
      `garage-${Date.now()}`;

    const car = formToMyGarageCar(form, id, images, editingCar);
    if (editingCar) {
      onSave(car);
      return;
    }
    onSave(car);
  }

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="car-form-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !event.defaultPrevented) onCancel();
      }}
      className="fixed inset-0 z-[2147483647] flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-black/55 p-0 backdrop-blur-[2px] sm:p-4"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 2147483647,
      }}
    >
      <div className="flex h-full w-full flex-col overflow-hidden bg-app dark:bg-app sm:h-[94dvh] sm:max-h-[800px] sm:max-w-[960px] sm:rounded-2xl sm:border sm:border-surface sm:shadow-2xl dark:sm:border-surface">
        <header className="safe-top shrink-0 border-b border-surface bg-app dark:border-surface dark:bg-app">
          <div className="mx-auto w-full max-w-[880px] px-4 pb-3 pt-3 sm:px-6 sm:pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 id="car-form-title" className="truncate text-base font-bold text-app-primary dark:text-app-primary sm:text-lg">
                  {editingCar ? 'Izmeni automobil' : 'Dodaj oglas'}
                </h1>
                <p className="mt-0.5 text-xs text-app-muted">Korak {step} od 3</p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                aria-label="Zatvori"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface bg-elevated text-app-secondary transition-all hover:border-brand-500/40 hover:bg-hover-surface hover:text-app-primary dark:border-surface"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <ol aria-label="Napredak forme" className="mt-3 grid grid-cols-3 gap-2">
              {([
                [1, 'Vozilo'],
                [2, 'Oglas'],
                [3, 'Fotografije'],
              ] as const).map(([stepNumber, label]) => {
                const active = step === stepNumber;
                const complete = step > stepNumber;
                return (
                  <li key={stepNumber} aria-current={active ? 'step' : undefined} className="min-w-0">
                    <div className={`h-1 rounded-full ${active || complete ? 'bg-brand-500' : 'bg-hover-surface dark:bg-elevated'}`} />
                    <div className={`mt-1.5 flex items-center gap-1.5 truncate text-[11px] font-semibold sm:text-xs ${active ? 'text-app-primary dark:text-app-primary' : 'text-app-muted'}`}>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${active || complete ? 'bg-brand-500 text-app-primary' : 'bg-hover-surface text-app-muted dark:bg-elevated'}`}>
                        {complete ? <Check size={12} strokeWidth={3} /> : stepNumber}
                      </span>
                      <span className="truncate">{label}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </header>

        <main ref={contentRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-[880px] px-4 py-3 sm:px-6 sm:py-4 lg:py-3">
            <div className="mb-3 lg:mb-2">
              <h2 className="text-lg font-bold tracking-tight text-app-primary dark:text-app-primary sm:text-xl">
                {step === 1 ? 'Podaci o vozilu' : step === 2 ? 'Detalji oglasa' : 'Fotografije i oprema'}
              </h2>
              <p className="mt-1 text-sm text-app-muted">
                {step === 1
                  ? 'Izaberite vozilo i unesite njegove osnovne karakteristike.'
                  : step === 2
                    ? 'Dodajte cenu, lokaciju i informacije za vaš oglas.'
                    : 'Dodajte fotografije i označite opremu koju vozilo poseduje.'}
              </p>
            </div>

            <div className="rounded-2xl border border-surface bg-card-surface p-3.5 dark:border-surface dark:bg-card-surface sm:p-4">
              <CarFormFields
                key={editingCar?.id ?? 'new-car-form'}
                form={form}
                setForm={setForm}
                images={images}
                setImages={(nextImages) => {
                  setImages(nextImages);
                  if (nextImages.length > 0) setPhotoError('');
                }}
                errors={visibleErrors}
                step={step}
              />
              {step === 3 && photoError && <p role="alert" className="mt-3 text-xs font-semibold text-tone-negative">{photoError}</p>}
            </div>
          </div>
        </main>

        <footer className="safe-bottom shrink-0 border-t border-surface bg-app dark:border-surface dark:bg-app">
          <div className="mx-auto flex w-full max-w-[880px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={onCancel}
                  className="h-11 flex-1 rounded-xl border border-surface bg-elevated px-4 text-sm font-semibold text-app-secondary transition-all hover:border-brand-500/40 hover:bg-hover-surface hover:text-app-primary active:scale-[0.98] dark:border-surface sm:flex-none sm:min-w-36"
                >
                  Otkaži
                </button>
                <button type="button" onClick={continueStep} className="btn-primary flex h-11 flex-1 items-center justify-center gap-2 text-sm sm:flex-none sm:min-w-40">
                  Nastavi <ChevronRight size={16} aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={previousStep}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-surface bg-elevated px-4 text-sm font-semibold text-app-secondary transition-all hover:border-brand-500/40 hover:bg-hover-surface hover:text-app-primary active:scale-[0.98] dark:border-surface sm:flex-none sm:min-w-36"
                >
                  <ChevronLeft size={16} aria-hidden="true" /> Nazad
                </button>
                {step === 2 ? (
                  <button type="button" onClick={continueStep} className="btn-primary flex h-11 flex-1 items-center justify-center gap-2 text-sm sm:flex-none sm:min-w-40">
                    Nastavi <ChevronRight size={16} aria-hidden="true" />
                  </button>
                ) : (
                  <button type="button" onClick={handleSave} className="btn-primary flex h-11 flex-1 items-center justify-center gap-2 text-sm sm:flex-none sm:min-w-44">
                    {editingCar ? 'Sačuvaj izmene' : 'Objavi oglas'}
                  </button>
                )}
              </>
            )}
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
