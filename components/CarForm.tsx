'use client';

import { useState, useEffect } from 'react';
import { BodyType, CarForm, FuelType, MyGarageCar, Transmission } from '@/types';
import { CAR_BRANDS, BRAND_NAMES } from '@/lib/car-brands';
import { ImageUpload } from '@/components/image-upload';

const BODY_TYPES: BodyType[] = ['Sedan', 'Caravan', 'Hatchback', 'SUV', 'Coupe', 'Convertible'];
const FUEL_TYPES: FuelType[] = ['Diesel', 'Petrol', 'Hybrid', 'Electric'];
const TRANSMISSIONS: Transmission[] = ['Manual', 'Automatic', 'Semi-Auto'];

const EMPTY_FORM: CarForm = {
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

function carToForm(car: MyGarageCar): CarForm {
  return {
    brand: car.brand,
    model: car.model,
    generation: car.generation,
    year: String(car.year),
    bodyType: car.bodyType,
    color: car.color,
    mileage: String(car.mileage),
    price: String(car.price),
    city: car.city,
    image: car.image,
    engine: car.specs.engine,
    displacement: car.specs.displacement,
    power: car.specs.power,
    torque: car.specs.torque,
    fuelType: car.specs.fuelType,
    transmission: car.specs.transmission,
  };
}

export function formToMyGarageCar(form: CarForm, id: string, imagesList?: string[]): MyGarageCar {
  const mainImage = imagesList && imagesList.length > 0 ? imagesList[0] : (form.image || DEFAULT_IMAGE);

  return {
    id,
    brand: form.brand,
    model: form.model,
    generation: form.generation || '-',
    year: parseInt(form.year) || 2000,
    bodyType: form.bodyType,
    color: form.color || '-',
    mileage: parseInt(form.mileage) || 0,
    price: parseInt(form.price) || 0,
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
    estimatedValue: parseInt(form.price) || 0,
  };
}

interface CarFormFieldsProps {
  form: CarForm;
  setForm: (f: CarForm) => void;
  images: string[];
  setImages: (imgs: string[]) => void;
}

function CarFormFields({ form, setForm, images, setImages }: CarFormFieldsProps) {
  function update<K extends keyof CarForm>(key: K, value: CarForm[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Marka</label>
          <select
            value={form.brand}
            onChange={e => {
              update('brand', e.target.value);
              update('model', '');
            }}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors"
          >
            <option value="">Izaberi marku...</option>
            {BRAND_NAMES.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Model</label>
          <select
            value={form.model}
            onChange={e => update('model', e.target.value)}
            disabled={!form.brand}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">{form.brand ? 'Izaberi model...' : 'Prvo izaberi marku'}</option>
            {form.brand && CAR_BRANDS[form.brand]?.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Generacija</label>
          <input
            value={form.generation}
            onChange={e => update('generation', e.target.value)}
            placeholder="E60"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Godina</label>
          <input
            value={form.year}
            onChange={e => update('year', e.target.value)}
            placeholder="2005"
            inputMode="numeric"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Cena (EUR)</label>
          <input
            value={form.price}
            onChange={e => update('price', e.target.value)}
            placeholder="6500"
            inputMode="numeric"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Kilometraža (km)</label>
          <input
            value={form.mileage}
            onChange={e => update('mileage', e.target.value)}
            placeholder="198000"
            inputMode="numeric"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Boja</label>
          <input
            value={form.color}
            onChange={e => update('color', e.target.value)}
            placeholder="Sapphire Black"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Grad</label>
          <input
            value={form.city}
            onChange={e => update('city', e.target.value)}
            placeholder="Kosovska Mitrovica"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Tip karoserije</label>
        <div className="flex flex-wrap gap-1.5">
          {BODY_TYPES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => update('bodyType', t)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                form.bodyType === t
                  ? 'bg-orange-500 border-orange-500 text-zinc-950'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-800">
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Specifikacije motora</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Motor</label>
          <input
            value={form.engine}
            onChange={e => update('engine', e.target.value)}
            placeholder="M57D25"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Zapremina</label>
          <input
            value={form.displacement}
            onChange={e => update('displacement', e.target.value)}
            placeholder="2.5L"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Snaga</label>
          <input
            value={form.power}
            onChange={e => update('power', e.target.value)}
            placeholder="197 hp"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Obrtni moment</label>
          <input
            value={form.torque}
            onChange={e => update('torque', e.target.value)}
            placeholder="410 Nm"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Gorivo</label>
          <select
            value={form.fuelType}
            onChange={e => update('fuelType', e.target.value as FuelType)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors"
          >
            {FUEL_TYPES.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Menjač</label>
          <select
            value={form.transmission}
            onChange={e => update('transmission', e.target.value as Transmission)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors"
          >
            {TRANSMISSIONS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-2">
        <ImageUpload images={images} onChange={setImages} maxImages={20} />
      </div>
    </div>
  );
}

interface AddCarFormProps {
  onSave: (car: MyGarageCar) => void;
  onCancel: () => void;
  editingCar?: MyGarageCar | null;
}

export default function CarFormComponent({ onSave, onCancel, editingCar }: AddCarFormProps) {
  const [form, setForm] = useState<CarForm>(EMPTY_FORM);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (editingCar) {
      setForm(carToForm(editingCar));
      if (editingCar.image) {
        setImages([editingCar.image]);
      }
    } else {
      setForm(EMPTY_FORM);
      setImages([]);
    }
  }, [editingCar]);

  function handleSave() {
    if (!form.brand.trim() || !form.model.trim() || !form.price.trim()) return;
    const id = editingCar?.id || `garage-${Date.now()}`;
    onSave(formToMyGarageCar(form, id, images));
  }

  const isValid = form.brand.trim() && form.model.trim() && form.price.trim();

  return (
    <div>
      <CarFormFields form={form} setForm={setForm} images={images} setImages={setImages} />
      <div className="flex gap-2 mt-5">
        <button
          onClick={onCancel}
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          Otkaži
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-bold py-3 rounded-xl text-sm transition-all duration-200 active:scale-95"
        >
          {editingCar ? 'Sačuvaj izmene' : 'Dodaj u garažu'}
        </button>
      </div>
    </div>
  );
}
