import type { BodyType } from '@/types';

interface BodyTypeSilhouetteProps {
  type: BodyType;
  className?: string;
}

/** Original, shared-stroke side profiles sized for the body-type selector. */
export function BodyTypeSilhouette({ type, className = '' }: BodyTypeSilhouetteProps) {
  const bodyPaths: Record<BodyType, string> = {
    Sedan: 'M8 34l3-8 13-3 11-11c3-3 7-5 12-5h19c6 0 10 2 14 6l8 10 12 3 3 8v7H8z',
    Caravan: 'M8 34l3-8 13-3 11-11c3-3 7-5 12-5h31l12 15 10 3 3 8v7H8z',
    SUV: 'M8 34l3-10 13-3 8-13c2-4 6-6 12-6h27c6 0 10 2 14 7l8 12 9 3 3 10v7H8z',
    Coupe: 'M8 34l3-8 13-3 14-13c4-4 9-6 15-6h11c8 0 13 3 18 9l7 10 9 3 3 8v7H8z',
    Convertible: 'M8 34l3-8 13-3 11-5 7-10h6l-3 10h29l13 5 9 3 3 8v7H8z',
    Hatchback: 'M8 34l3-8 13-3 10-12c3-3 7-5 12-5h19c6 0 10 2 14 6l8 11 9 3 3 8v7H8z',
    MPV: 'M8 34l3-8 12-3 6-16c1-4 5-6 10-6h36c6 0 9 2 11 7l6 15 9 3 3 8v7H8z',
    Pickup: 'M8 34l3-8 13-3 9-14c2-4 6-6 11-6h15v26h6V12h20v12l11 3 3 7v7H8z',
    Van: 'M8 34l3-8 12-3 4-17c1-4 4-6 9-6h42c5 0 8 2 10 7l6 16 7 3 3 8v7H8z',
  };

  const windowPaths: Record<BodyType, string> = {
    Sedan: 'M28 23l9-10c2-2 5-4 9-4h10v14zm32 0V9h7c4 0 7 2 10 5l6 9z',
    Caravan: 'M28 23l9-10c2-2 5-4 9-4h10v14zm32 0V9h11c4 0 7 2 10 5l7 9z',
    SUV: 'M28 23l8-13c2-3 5-4 9-4h11v17zm33 0V6h8c4 0 7 2 10 6l7 11z',
    Coupe: 'M29 23l12-11c3-3 7-5 12-5h8v16zm36 0V7c6 1 10 4 14 9l5 7z',
    Convertible: 'M30 23l10-4 7-9h4l-3 9h26l8 4z',
    Hatchback: 'M28 23l9-11c2-3 6-4 10-4h10v15zm33 0V8h7c4 0 7 2 10 5l7 10z',
    MPV: 'M27 23l5-14c1-3 4-5 8-5h13v19zm32 0V4h11c4 0 6 2 8 6l6 13z',
    Pickup: 'M29 23l7-12c2-4 5-5 10-5h10v17zm34 0V14h12v9z',
    Van: 'M27 23l4-15c1-3 3-4 7-4h12v19zm31 0V4h10c4 0 6 2 7 5l5 14z',
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 112 52"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={bodyPaths[type]} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d={windowPaths[type]} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 34h96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="27" cy="40" r="7" fill="currentColor" />
      <circle cx="27" cy="40" r="3.2" fill="hsl(var(--surface-card))" />
      <circle cx="86" cy="40" r="7" fill="currentColor" />
      <circle cx="86" cy="40" r="3.2" fill="hsl(var(--surface-card))" />
    </svg>
  );
}
