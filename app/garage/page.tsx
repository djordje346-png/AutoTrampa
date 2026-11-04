import type { Metadata } from 'next';
import { Suspense } from 'react';
import GarageClient from './GarageClient';

export const metadata: Metadata = {
  title: 'Garaža',
  description: 'Tvoja vozila na AutoTrampi.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Suspense fallback={<div className="app-container py-8" role="status">Učitavanje garaže…</div>}><GarageClient /></Suspense>;
}
