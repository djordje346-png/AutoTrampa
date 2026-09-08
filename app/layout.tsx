import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AppShell from '@/components/AppShell';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const title = 'AutoTrampa — Platforma za zamenu automobila';
const description =
  'Trampi svoj auto. Pronađi zamenu, vidi koliko je doplata i dogovori se direktno sa vlasnikom.';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://autotrampa.netlify.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: '%s · AutoTrampa',
  },
  description,
  applicationName: 'AutoTrampa',
  manifest: '/manifest.webmanifest',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f97316' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    title: 'AutoTrampa',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: true },
  openGraph: {
    type: 'website',
    locale: 'sr_RS',
    siteName: 'AutoTrampa',
    title,
    description,
  },
  twitter: { card: 'summary_large_image', title, description },
  robots: { index: true, follow: true },
};

/**
 * Applies the stored theme before first paint so the app never flashes the
 * wrong background. Kept inline and dependency-free on purpose.
 */
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('autotrampa_theme');
    var theme = stored || 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} font-sans bg-background text-foreground min-h-screen antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
