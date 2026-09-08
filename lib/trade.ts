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
      tone: 'they-add',
      diff,
      label: `Vlasnik doplaćuje ${formatEuro(diff)}`,
      short: `+${formatEuro(diff)}`,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/30',
    };
  }

  return {
    tone: 'you-add',
    diff,
    label: `Tvoja doplata ${formatEuro(Math.abs(diff))}`,
    short: `−${formatEuro(Math.abs(diff))}`,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/30',
  };
}
