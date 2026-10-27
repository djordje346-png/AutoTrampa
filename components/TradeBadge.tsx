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
  variant?: 'default' | 'photo' | 'card';
  className?: string;
}

/** Shared, active-car-relative trade state badge for feed, search and offers. */
export default function TradeBadge({ trade, compact = false, variant = 'default', className = '' }: TradeBadgeProps) {
  const { Icon, className: toneClass } = TONE_STYLES[trade.tone];
  // First PNG mockup: soft blue/orange/mint badge fills, dark text and vivid arrows.
  const mockupColor = {
    'they-add': 'text-[#00B97A]',
    'you-add': 'text-[#F59A00]',
    even: 'text-[#2878D5]',
  }[trade.tone];
  const mockupBackground = {
    'they-add': 'bg-[#E3F7EE]',
    'you-add': 'bg-[#FFF1E3]',
    even: 'bg-[#E7F0FD]',
  }[trade.tone];
  const isMockupBadge = variant === 'card' || variant === 'photo';

  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full leading-none ${variant === 'card' ? 'border-0 font-medium' : 'border font-semibold'} ${
        variant === 'card' ? 'min-h-[28px] px-2.5 py-1.5 text-[11px]' : variant === 'photo' ? 'h-7 px-2.5 py-0 text-[11px]' : compact ? 'px-1.5 py-1 text-[9px]' : 'px-2.5 py-1.5 text-[11px]'
      } ${isMockupBadge ? `border-transparent text-[#16191D] ${mockupBackground}` : toneClass} ${className}`}
      aria-label={trade.label}
      title={trade.label}
    >
      <Icon size={variant === 'card' ? 15 : compact ? 11 : 13} strokeWidth={isMockupBadge ? 3 : 2} className={`shrink-0 ${isMockupBadge ? mockupColor : ''} `} aria-hidden="true" />
      <span className={variant === 'card' ? 'min-w-0 break-words leading-snug text-[#16191D]' : 'min-w-0 truncate'}>{compact ? trade.short : trade.label}</span>
    </span>
  );
}
