import { CarFront } from 'lucide-react';

export default function BrandLockup() {
  return (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-black">
        <CarFront size={20} strokeWidth={2.2} />
      </span>
      <span className="text-base font-bold tracking-tight">AutoTrampa</span>
    </>
  );
}
