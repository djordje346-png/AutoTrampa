import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MARKETPLACE_CARS, formatEuro } from '@/lib/cars';
import CarDetail from './CarDetail';

/**
 * Server shell for a listing. Pre-rendering every known id (and refusing the
 * rest) is what makes an unknown listing answer with a real 404 instead of a
 * 200 that merely looks like one, and lets each listing carry its own metadata.
 */
export function generateStaticParams() {
  return MARKETPLACE_CARS.map((car) => ({ id: car.id }));
}

export const dynamicParams = false;

interface PageProps {
  params: { id: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  const car = MARKETPLACE_CARS.find((c) => c.id === params.id);
  if (!car) return { title: 'Vozilo nije pronađeno' };

  const title = `${car.year} ${car.brand} ${car.model} ${car.generation}`;
  const description = `${title} · ${formatEuro(car.price)} · ${car.mileage.toLocaleString('sr-RS')} km · ${car.specs.fuelType} · ${car.city}. Ponudi zamenu na AutoTrampi.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: [{ url: car.image, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [car.image] },
  };
}

export default function CarPage({ params }: PageProps) {
  const car = MARKETPLACE_CARS.find((c) => c.id === params.id);
  if (!car) notFound();

  return <CarDetail car={car} />;
}
