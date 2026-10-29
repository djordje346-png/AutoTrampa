import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react';
import { formatEuro } from '@/lib/cars';
import type { TradeLabel } from '@/lib/trade';

const TONE_STYLES = {
  'they-add': {
    Icon: ArrowDownLeft,
    arrowClass: 'text-[#5CE9AC]',
  },
  'you-add': {
    Icon: ArrowUpRight,
    arrowClass: 'text-[#FAEB00]',
  },
  even: {
    Icon: ArrowLeftRight,
    arrowClass: 'text-[#78B7FF]',
  },
} as const;

interface TradeBadgeProps {
  trade: TradeLabel;
  compact?: boolean;
  variant?: 'default' | 'photo' | 'card';
  className?: string;
}

/** Shared, active-car-relative trade state badge for feed, search and offers. */
export default function TradeBadge({ trade, compact = false, variant = 'default', className = '' }: TradeBadgeProps) {
  const { Icon, arrowClass } = TONE_STYLES[trade.tone];
  const isPhotoBadge = variant === 'card' || variant === 'photo';
  const label = compact ? trade.short : isPhotoBadge && trade.tone !== 'even'
    ? `${trade.tone === 'you-add' ? 'Doplata' : 'Dobijaš'} ${formatEuro(Math.abs(trade.diff))}`
    : trade.label;

  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-white/25 leading-none backdrop-blur-md ${
        isPhotoBadge ? 'min-h-[32px] bg-black/75 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-sm' : `bg-brand-dark text-brand-dark-primary font-semibold ${compact ? 'px-1.5 py-1 text-[9px]' : 'px-2.5 py-1.5 text-[11px]'}`
      } ${className}`}
      aria-label={trade.label}
      title={trade.label}
    >
      <Icon size={isPhotoBadge ? 14 : compact ? 11 : 13} strokeWidth={2.8} className={`shrink-0 ${arrowClass}`} aria-hidden="true" />
      <span className="min-w-0 truncate leading-snug">{label}</span>
    </span>
  );
}
