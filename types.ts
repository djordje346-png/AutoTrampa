export type BodyType = 'Sedan' | 'Caravan' | 'Hatchback' | 'SUV' | 'Coupe' | 'Convertible' | 'MPV' | 'Pickup' | 'Van';
export type FuelType = 'Diesel' | 'Petrol' | 'Hybrid' | 'Electric' | 'LPG' | 'CNG';
export type Transmission = 'Manual' | 'Automatic' | 'Semi-Auto';
export type VehicleCondition = 'good' | 'minor_work' | 'major_work' | 'not_running';

export interface CarSpec {
  engine: string;
  displacement: string;
  cylinders: number;
  power: string;
  torque: string;
  fuelType: FuelType | null;
  transmission: Transmission | null;
  drivetrain: string;
  topSpeed: string;
  acceleration: string;
}

export interface Owner {
  name: string;
  phone: string;
  city: string;
  rating: number;
}

export interface Car {
  id: string;
  /** Supabase Auth user id for database listings; absent on demo seed cars. */
  ownerId?: string;
  brand: string;
  model: string;
  generation: string;
  year: number | null;
  bodyType: BodyType | null;
  color: string;
  mileage: number | null;
  price: number;
  city: string;
  country: string;
  image: string;
  images?: string[];
  specs: CarSpec;
  owner: Owner;
  description: string;
  modifications?: string[];
  equipment?: string[];
  condition?: VehicleCondition | null;
}

export interface MyGarageCar extends Car {
  securityFeatures: string[];
  buildNotes: string[];
  estimatedValue: number;
}

export function getCarImages(car: Car): string[] {
  if (car.images && car.images.length > 0) return car.images;
  return [car.image];
}

export interface CarForm {
  brand: string;
  model: string;
  generation: string;
  year: string;
  bodyType: BodyType | '';
  color: string;
  mileage: string;
  mileageUnknown: boolean;
  price: string;
  city: string;
  image: string;
  engine: string;
  displacement: string;
  power: string;
  torque: string;
  fuelType: FuelType | '';
  transmission: Transmission | '';
  condition: VehicleCondition | '';
  equipment: string[];
  description: string;
}
