import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react';
import type { TradeLabel } from '@/lib/trade';

const TONE_STYLES = {
  'they-add': {
    Icon: ArrowDownLeft,
    className: 'border-trade-owner bg-trade-owner text-trade-owner',
  },
  'you-add': {
    Icon: ArrowUpRight,
    className: 'border-trade-you bg-trade-you text-trade-you',
  },
  even: {
    Icon: ArrowLeftRight,
    className: 'border-trade-even bg-trade-even text-trade-even',
  },
} as const;

interface TradeBadgeProps {
  trade: TradeLabel;
  compact?: boolean;
  variant?: 'default' | 'photo';
  className?: string;
}

/** Shared, active-car-relative trade state badge for feed, search and offers. */
export default function TradeBadge({ trade, compact = false, variant = 'default', className = '' }: TradeBadgeProps) {
  const { Icon, className: toneClass } = TONE_STYLES[trade.tone];

  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border font-semibold leading-none ${
        variant === 'photo' ? 'h-7 px-2.5 py-0 text-[11px]' : compact ? 'px-1.5 py-1 text-[9px]' : 'px-2.5 py-1.5 text-[11px]'
      } ${toneClass} ${className}`}
      aria-label={trade.label}
      title={trade.label}
    >
      <Icon size={compact ? 11 : 13} className="shrink-0" aria-hidden="true" />
      <span className="min-w-0 truncate">{compact ? trade.short : trade.label}</span>
    </span>
  );
}
