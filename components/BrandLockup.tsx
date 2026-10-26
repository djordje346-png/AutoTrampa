import Image from 'next/image';

type BrandLockupProps = {
  header?: boolean;
  /** Both navigation headers and the desktop footer use graphite surfaces. */
  variant?: 'dark' | 'light';
};

export default function BrandLockup({ header = false, variant = 'dark' }: BrandLockupProps) {
  return (
    <Image
      src={variant === 'dark' ? '/brand/autotrampa-dark.svg' : '/brand/autotrampa-light.svg'}
      alt=""
      aria-hidden="true"
      width={423}
      height={175}
      priority={header}
      className={header
        ? 'block h-[61px] w-auto shrink-0 sm:h-[65px] lg:h-[69px]'
        : 'block h-[70px] w-auto shrink-0'}
    />
  );
}
