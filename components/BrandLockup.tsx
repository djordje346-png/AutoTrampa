type BrandLockupProps = {
  header?: boolean;
  /** Preserve text contrast when the wordmark is placed on light surfaces. */
  variant?: 'dark' | 'light';
};

/** Text-only wordmark shared by the public header, app header and desktop footer. */
export default function BrandLockup({ header = false, variant = 'dark' }: BrandLockupProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-baseline whitespace-nowrap font-heading font-extrabold leading-none tracking-[-0.045em] ${header ? 'text-[25px] sm:text-[28px] lg:text-[30px]' : 'text-[27px]'}`}
    >
      <span className={variant === 'dark' ? 'text-brand-dark-primary' : 'text-app-primary'}>Auto</span>
      <span className={variant === 'dark' ? 'text-brand-500' : 'text-brand-text'}>Trampa</span>
    </span>
  );
}
