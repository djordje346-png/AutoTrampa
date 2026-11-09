import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react';
import { formatEuro } from '@/lib/cars';
import type { TradeLabel } from '@/lib/trade';

const TONE_STYLES = {
  'they-add': {
    Icon: ArrowDownLeft,
    backgroundClass: 'bg-[#16A34A]/90',
  },
  'you-add': {
    Icon: ArrowUpRight,
    backgroundClass: 'bg-[#F97316]/90',
  },
  even: {
    Icon: ArrowLeftRight,
    backgroundClass: 'bg-[#2563EB]/90',
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
  const { Icon, backgroundClass } = TONE_STYLES[trade.tone];
  const isPhotoBadge = variant === 'card' || variant === 'photo';
  const label = compact ? trade.short : isPhotoBadge && trade.tone !== 'even'
    ? `${trade.tone === 'you-add' ? 'Doplata' : 'Dobijaš'} ${formatEuro(Math.abs(trade.diff))}`
    : trade.label;

  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border border-white/20 leading-none text-white backdrop-blur-[3px] shadow-[0_2px_8px_rgba(0,0,0,0.18)] ${backgroundClass} ${
        isPhotoBadge ? 'min-h-[26px] px-2 py-1 text-[10px] font-semibold sm:min-h-[27px] sm:px-2 sm:py-1 sm:text-[10px]' : `font-semibold ${compact ? 'px-1.5 py-1 text-[9px]' : 'px-2.5 py-1.5 text-[11px]'}`
      } ${className}`}
      aria-label={trade.label}
      title={trade.label}
    >
      <Icon size={isPhotoBadge ? 12 : compact ? 11 : 13} strokeWidth={2.8} className={`shrink-0 text-white ${isPhotoBadge ? 'h-3 w-3' : ''}`} aria-hidden="true" />
      <span className="min-w-0 truncate leading-snug">{label}</span>
    </span>
  );
}
