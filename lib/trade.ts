import { formatEuro } from '@/lib/cars';

/** Price gap below which a swap counts as even money. */
export const TRADE_TOLERANCE = 200;

export type TradeTone = 'even' | 'they-add' | 'you-add';

export interface TradeLabel {
  tone: TradeTone;
  /** other.price - myCar.price */
  diff: number;
  /** Full sentence for badges, e.g. "Doplata tebi 700 €". */
  label: string;
  /** Compact form for tight spots, with the active-car perspective included. */
  short: string;
}

interface Priced {
  price: number;
}

/**
 * Budget is a ranking preference, not a hard filter.
 * Zero/unset means "budget doesn't matter". A positive budget prioritizes
 * eligible top-ups closest to that maximum (e.g. 19k before 15k for a 20k cap).
 * Cars exceeding the maximum remain visible after eligible cars.
 * "No top-up" overrides any stored budget without deleting it.
 */
export function sortByBudget<T extends Priced>(
  cars: T[],
  myCar: Priced,
  budget: number | null,
  noTopUp: boolean,
): T[] {
  if (!noTopUp && (budget == null || budget <= 0)) return cars;

  const diff = (car: Priced) => car.price - myCar.price;
  return [...cars].sort((a, b) => {
    const da = diff(a);
    const db = diff(b);

    if (noTopUp) {
      const aNeedsTopUp = da > TRADE_TOLERANCE;
      const bNeedsTopUp = db > TRADE_TOLERANCE;
      // Preserve the selected ordering within each group.
      return aNeedsTopUp === bNeedsTopUp ? 0 : aNeedsTopUp ? 1 : -1;
    }

    const limit = budget!;
    const aEligible = da <= limit;
    const bEligible = db <= limit;
    if (aEligible !== bEligible) return aEligible ? -1 : 1;

    if (aEligible) {
      // Eligible positive top-ups precede even swaps and received top-ups.
      const aPositive = da >= 0;
      const bPositive = db >= 0;
      if (aPositive !== bPositive) return aPositive ? -1 : 1;
      // Closest to the ceiling first; negative values naturally follow.
      return db - da;
    }

    // Above limit: least additional money required comes first.
    return da - db;
  });
}

/** Returns true if a car's top-up falls within the user's budget. */
export function isWithinBudget(car: Priced, myCar: Priced, budget: number | null): boolean {
  if (budget == null) return false;
  return car.price - myCar.price <= budget;
}

/**
 * The core of the product: what the swap costs either side.
 * Single source of truth — feed, search and detail all render this.
 */
export function getTradeLabel(myCar: Priced, other: Priced): TradeLabel {
  const diff = other.price - myCar.price;

  if (Math.abs(diff) < TRADE_TOLERANCE) {
    return {
      tone: 'even',
      diff,
      label: 'Ravna zamena',
      short: 'Ravna zamena',
    };
  }

  if (diff > 0) {
    return {
      tone: 'you-add',
      diff,
      label: `Tvoja doplata ${formatEuro(diff)}`,
      short: `Ti +${formatEuro(diff)}`,
    };
  }

  return {
    tone: 'they-add',
    diff,
    label: `Doplata tebi ${formatEuro(Math.abs(diff))}`,
    short: `Tebi +${formatEuro(Math.abs(diff))}`,
  };
}
