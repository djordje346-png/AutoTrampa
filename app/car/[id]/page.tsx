import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MARKETPLACE_CARS, formatEuro, formatKm } from '@/lib/cars';
import { fetchListing, listingTitle } from '@/lib/listings';
import type { Car } from '@/types';
import CarDetail from './CarDetail';

/**
 * Server shell for a listing.
 *
 * There are two kinds of listing and the route has to serve both:
 *  - demo cars from `lib/cars.ts`, enumerated at build time;
 *  - real cars in Supabase, which cannot be enumerated because users add them
 *    at any moment.
 *
 * So `dynamicParams` stays true, and the 404 is decided by the lookup instead
 * of by the router: a listing that resolves is rendered (and gets its own
 * metadata), one that does not calls `notFound()`. That is what makes a shared
 * link to a user's own car work while a garbage id still answers a real 404.
 *
 * `cache` deduplicates the lookup, because `generateMetadata` and the page
 * render both need the same listing within one request.
 */
export function generateStaticParams() {
  return MARKETPLACE_CARS.map((car) => ({ id: car.id }));
}

/** One minute: a fresh listing becomes shareable quickly without a rebuild. */
export const revalidate = 60;

/** Next 13.5 requires the prop to be declared when it is destructured. */
interface PageProps {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}

const getCar = cache(async (id: string): Promise<Car | null> => {
  const demo = MARKETPLACE_CARS.find((car) => car.id === id);
  if (demo) return demo;
  // Everything else has to come from the database; a slug that is not in the
  // seed can never exist there, and the lookup returns null without a request.
  return fetchListing(id);
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const car = await getCar(params.id);
  if (!car) return { title: 'Oglas nije pronađen' };

  const title = listingTitle(car);
  const description = `${title} · ${formatEuro(car.price)} · ${formatKm(car.mileage)} · ${car.specs.fuelType} · ${car.city}. Ponudi zamenu na AutoTrampi.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: car.image ? [{ url: car.image, alt: title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: car.image ? [car.image] : undefined,
    },
  };
}

export default async function CarPage({ params }: PageProps) {
  const car = await getCar(params.id);
  if (!car) notFound();
  return <CarDetail car={car} />;
}
