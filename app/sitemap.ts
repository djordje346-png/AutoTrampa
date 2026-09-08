import type { MetadataRoute } from 'next';
import { MARKETPLACE_CARS } from '@/lib/cars';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://autotrampa.netlify.app';

/** Only the publicly browsable surface — the personal screens are noindex. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: siteUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    ...MARKETPLACE_CARS.map((car) => ({
      url: `${siteUrl}/car/${car.id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
