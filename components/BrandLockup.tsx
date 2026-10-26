import Image from 'next/image';

export default function BrandLockup({ header = false }: { header?: boolean }) {
  return (
    <>
      <Image
        src="/brand/roofline-swap.svg"
        alt=""
        width={40}
        height={40}
        className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
      />
      <span className={header ? 'font-heading text-[19px] font-bold leading-none tracking-tight sm:text-xl' : 'font-heading text-base font-bold tracking-tight'}>
        Auto<span className="text-brand-500">Trampa</span>
      </span>
    </>
  );
}
