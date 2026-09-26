import { formatEuro } from '@/lib/cars';

/** Price gap below which a swap counts as even money. */
export const TRADE_TOLERANCE = 200;

export type TradeTone = 'even' | 'they-add' | 'you-add';

export interface TradeLabel {
  tone: TradeTone;
  /** other.price - myCar.price */
  diff: number;
  /** Full sentence for badges, e.g. "Vlasnik doplaćuje 700 €". */
  label: string;
  /** Compact form for tight spots, e.g. "+700 €". */
  short: string;
  color: string;
  bg: string;
}

interface Priced {
  price: number;
}

/**
 * Sort cars by budget awareness — does NOT filter, only reorders.
 * Cars within budget float to the top; the rest stays below, still visible.
 * When noTopUp is true, cars where the user would add cash sink to the bottom.
 */
export function sortByBudget<T extends Priced>(
  cars: T[],
  myCar: Priced,
  budget: number | null,
  noTopUp: boolean,
): T[] {
  if (!budget && !noTopUp) return cars;

  const diff = (c: Priced) => c.price - myCar.price;

  return [...cars].sort((a, b) => {
    const da = diff(a);
    const db = diff(b);

    if (noTopUp) {
      const aTopUp = da > TRADE_TOLERANCE;
      const bTopUp = db > TRADE_TOLERANCE;
      if (aTopUp !== bTopUp) return aTopUp ? 1 : -1;
    }

    if (budget != null) {
      const aInBudget = da <= budget;
      const bInBudget = db <= budget;
      if (aInBudget !== bInBudget) return aInBudget ? -1 : 1;
      return Math.abs(da) - Math.abs(db);
    }

    return 0;
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
      short: 'Ravno',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
    };
  }

  if (diff > 0) {
    return {
      tone: 'you-add',
      diff,
      label: `Tvoja doplata ${formatEuro(diff)}`,
      short: `+${formatEuro(diff)}`,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/30',
    };
  }

  return {
    tone: 'they-add',
    diff,
    label: `Vlasnik doplaćuje ${formatEuro(Math.abs(diff))}`,
    short: `−${formatEuro(Math.abs(diff))}`,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/30',
  };
}
