import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react';
import type { TradeLabel } from '@/lib/trade';
import { formatEuro } from '@/lib/cars';

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

const PHOTO_TONE_STYLES = {
  'they-add': {
    label: 'Vlasnik doplaćuje',
    shell: 'border-emerald-400/40 bg-emerald-950/85',
    accent: 'text-emerald-300',
  },
  'you-add': {
    label: 'Tvoja doplata',
    shell: 'border-orange-400/40 bg-orange-950/85',
    accent: 'text-orange-300',
  },
  even: {
    label: 'Ravna zamena',
    shell: 'border-sky-400/40 bg-sky-950/85',
    accent: 'text-sky-300',
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

  if (variant === 'photo') {
    const photo = PHOTO_TONE_STYLES[trade.tone];
    const amount = trade.tone === 'even' ? 'Bez doplate' : '~ ' + formatEuro(Math.abs(trade.diff));

    return (
      <span
        className={['pointer-events-none inline-flex min-w-0 items-center gap-2 rounded-2xl border px-2.5 py-2 shadow-lg backdrop-blur-md sm:gap-2.5 sm:px-3', photo.shell, className].join(' ')}
        aria-label={trade.label}
        title={trade.label}
      >
        <span className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10', photo.accent].join(' ')}>
          <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className={['truncate text-[10px] font-semibold leading-none sm:text-[11px]', photo.accent].join(' ')}>{photo.label}</span>
          <span className="whitespace-nowrap text-sm font-bold leading-none tabular-nums text-white sm:text-base">{amount}</span>
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border font-semibold leading-none ${
        compact ? 'px-1.5 py-1 text-[9px]' : 'px-2.5 py-1.5 text-[11px]'
      } ${toneClass} ${className}`}
      aria-label={trade.label}
      title={trade.label}
    >
      <Icon size={compact ? 11 : 13} className="shrink-0" aria-hidden="true" />
      <span className="min-w-0 truncate">{compact ? trade.short : trade.label}</span>
    </span>
  );
}
