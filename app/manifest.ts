import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AutoTrampa — Platforma za zamenu automobila',
    short_name: 'AutoTrampa',
    description:
      'Trampi svoj auto. Pronađi zamenu, vidi doplatu i dogovori se direktno sa vlasnikom.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#FAEB00',
    lang: 'sr-Latn-RS',
    categories: ['shopping', 'lifestyle', 'travel'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
