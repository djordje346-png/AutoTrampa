import type { Metadata } from 'next';
import MessagesClient from './MessagesClient';

export const metadata: Metadata = {
  title: 'Poruke',
  description: 'Razgovori o zameni.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MessagesClient />;
}
