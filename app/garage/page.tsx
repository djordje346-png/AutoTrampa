import type { Metadata } from 'next';
import GarageClient from './GarageClient';

export const metadata: Metadata = {
  title: 'Garaža',
  description: 'Tvoja vozila na AutoTrampi.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <GarageClient />;
}
