import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://autotrampa.netlify.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/garage', '/messages', '/profile', '/saved'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
