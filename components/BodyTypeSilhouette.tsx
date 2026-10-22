import type { BodyType } from '@/types';

interface BodyTypeSilhouetteProps {
  type: BodyType;
  className?: string;
}

// Low, side-on outlines share the same wheelbase, baseline and line weight.
// Open wheel centres inherit the selected card's background in either theme.
const PROFILES: Record<BodyType, { body: string; windows?: string; details?: string }> = {
  Sedan: {
    body: 'M24 48H14q-4 0-4-4l-1-6q1-5 9-7l31-6q14-11 29-12h20q14 1 29 12l19 4 1 5 4 1v9q-1 4-11 4M118 48H46',
    windows: 'M55 25l12-7q5-2 12-2h18q10 1 21 9ZM85 16v9m17-8 5 8',
    details: 'M10 38h7m128-4h5',
  },
  Caravan: {
    body: 'M24 48H14q-4 0-4-4l-1-6q1-5 9-7l31-6 14-12q5-3 13-3h49q4 0 7 4l12 15 5 3 2 12q-1 4-11 4M118 48H46',
    windows: 'M55 25l12-10q4-2 10-2h46l12 13ZM85 13v13m27-13v13',
    details: 'M10 38h7m128-8-2 6',
  },
  SUV: {
    body: 'M24 48H14q-5 0-5-5v-9q1-5 10-7l27-4 15-12q3-3 11-3h52q5 0 7 5l8 14 8 4 3 7v7q-2 3-10 3M118 48H46',
    windows: 'M52 24l13-11q3-2 8-2h49l9 15-79-2ZM85 11v15m26-15v15',
    details: 'M9 36h8m129-5-1 7M69 7h49',
  },
  Coupe: {
    body: 'M24 48H14q-4 0-4-4l-1-6q1-5 9-7l31-5q17-13 34-13h11q15 1 33 14l19 4 2 5 3 1v7q-1 4-11 4M118 48H46',
    windows: 'M56 26q15-10 28-10h9q13 1 27 10ZM88 16l-2 10',
    details: 'M10 38h7m129-3h4',
  },
  Convertible: {
    body: 'M24 48H14q-4 0-4-4l-1-6q1-5 9-7l30-3 24-14 3 3-18 12h59l11-3 19 5 2 5 3 1v7q-1 4-11 4M118 48H46',
    details: 'M91 29l1-6q2-3 5 0l1 6m18-2 1-5q2-3 5 0l1 4M10 38h7m129-3h4',
  },
  Hatchback: {
    body: 'M24 48H14q-4 0-4-4l-1-6q1-5 9-7l31-6 14-12q5-3 13-3h37q10 0 15 5l12 14 6 5 3 10q-1 4-9 4M118 48H46',
    windows: 'M55 25l12-10q4-2 10-2h35q7 0 11 5l6 8-74-1ZM85 13v13m24-13 4 13',
    details: 'M10 38h7m122-9-2 6',
  },
  MPV: {
    body: 'M24 48H14q-5 0-5-5v-8q1-5 10-7l22-3L59 8q3-3 11-3h47q7 0 10 7l12 18 9 4 3 10q-1 4-11 4M118 48H46',
    windows: 'M47 26L63 11q2-2 8-2h44q5 0 7 5l8 14-83-2ZM83 9v18m25-18v19',
    details: 'M10 37h7m128-3-1 5',
  },
  Pickup: {
    body: 'M24 48H14q-5 0-5-5v-8q1-5 10-7l26-3 14-13q3-3 10-3h25q6 0 8 7l4 13h43v15q-1 4-9 4M118 48H46',
    windows: 'M51 26l13-12q2-2 6-2h22q4 0 5 5l3 12-49-3ZM81 12v16',
    details: 'M105 30v13m2-19h42M9 37h8m129-7v7',
  },
  Van: {
    body: 'M24 48H14q-5 0-5-5v-8l10-7L38 8q3-3 10-3h92q6 0 7 7l4 31q0 5-11 5M118 48H46',
    windows: 'M25 28l17-17q2-2 7-2h16v20l-40-1Z',
    details: 'M74 10v32m64-32 4 27M10 37h7',
  },
};

export function BodyTypeSilhouette({ type, className = '' }: BodyTypeSilhouetteProps) {
  const profile = PROFILES[type];

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 168 64"
      width="168"
      height="64"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={profile.body} />
      {profile.windows && <path d={profile.windows} />}
      {profile.details && <path d={profile.details} />}
      <circle cx="35" cy="48" r="11" />
      <circle cx="129" cy="48" r="11" />
    </svg>
  );
}
