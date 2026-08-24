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
    <html lang="sr" className="dark">
      <body className={`${inter.variable} font-sans bg-slate-950 text-slate-100 min-h-screen`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
