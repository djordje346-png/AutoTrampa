import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AppShell from '@/components/AppShell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AutoTrampa — Platforma za zamenu automobila',
  description: 'Pronađi sledeću zamenu. Trampi, pronađi i prati svoj idealan evropski auto.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('autotrampa_theme');
              if (t === 'light') {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
              }
            } catch(e) {}
        `}} />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
