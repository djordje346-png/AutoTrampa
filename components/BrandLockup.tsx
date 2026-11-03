import Image from 'next/image';

type BrandLockupProps = {
  header?: boolean;
  /** Use auto on surfaces that follow the application's light/dark theme. */
  variant?: 'dark' | 'light' | 'auto';
};

/** Approved vector logo shared by the headers, footers and sign-in screen. */
export default function BrandLockup({ header = false, variant = 'dark' }: BrandLockupProps) {
  const size = header
    ? 'h-8 w-[135px] min-[375px]:h-9 min-[375px]:w-[152px] sm:h-11 sm:w-[185px] lg:h-12 lg:w-[202px]'
    : 'h-[52px] w-[219px]';

  function logo(surface: 'dark' | 'light', visibility = '') {
    return (
      <Image
        src={`/brand/autotrampa-${surface}.svg`}
        alt="AutoTrampa.rs"
        width={1235}
        height={293}
        priority={header}
        unoptimized
        draggable={false}
        className={`h-full w-full object-contain ${visibility}`}
      />
    );
  }

  return (
    <span className={`inline-flex shrink-0 items-center ${size}`} translate="no">
      {variant === 'auto' ? (
        <>
          {logo('light', 'block dark:hidden')}
          {logo('dark', 'hidden dark:block')}
        </>
      ) : logo(variant)}
    </span>
  );
}
