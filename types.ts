export type BodyType = 'Sedan' | 'Caravan' | 'Hatchback' | 'SUV' | 'Coupe' | 'Convertible';
export type FuelType = 'Diesel' | 'Petrol' | 'Hybrid' | 'Electric';
export type Transmission = 'Manual' | 'Automatic' | 'Semi-Auto';

export interface CarSpec {
  engine: string;
  displacement: string;
  cylinders: number;
  power: string;
  torque: string;
  fuelType: FuelType;
  transmission: Transmission;
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
  brand: string;
  model: string;
  generation: string;
  year: number;
  bodyType: BodyType;
  color: string;
  mileage: number;
  price: number;
  city: string;
  country: string;
  image: string;
  images?: string[];
  specs: CarSpec;
  owner: Owner;
  description: string;
  modifications?: string[];
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
  bodyType: BodyType;
  color: string;
  mileage: string;
  price: string;
  city: string;
  image: string;
  engine: string;
  displacement: string;
  power: string;
  torque: string;
  fuelType: FuelType;
  transmission: Transmission;
}
