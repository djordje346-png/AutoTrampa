import { CarFront } from 'lucide-react';

export default function BrandLockup({ header = false }: { header?: boolean }) {
  return (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-on-accent">
        <CarFront size={20} strokeWidth={2.2} />
      </span>
      <span className={header ? 'font-heading text-[19px] font-bold leading-none tracking-tight sm:text-xl' : 'text-base font-bold tracking-tight'}>AutoTrampa</span>
    </>
  );
}
