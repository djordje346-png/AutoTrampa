import Image from 'next/image';

type BrandLockupProps = {
  header?: boolean;
  /** Header and footer sit on dark graphite surfaces in both app themes. */
  variant?: 'dark' | 'light';
};

export default function BrandLockup({ header = false, variant = 'dark' }: BrandLockupProps) {
  return (
    <Image
      src={variant === 'dark' ? '/brand/autotrampa-dark.svg' : '/brand/autotrampa-light.svg'}
      alt=""
      aria-hidden="true"
      width={680}
      height={295}
      priority={header}
      className={
        header
          ? 'block h-[55px] w-auto shrink-0 sm:h-[64px] lg:h-[68px]'
          : 'block h-[72px] w-auto shrink-0'
      }
    />
  );
}
