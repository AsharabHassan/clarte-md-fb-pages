'use client';

import { Banknote, Truck, RotateCcw, ShieldCheck, MessageCircle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustSignal {
  icon: React.ReactNode;
  label: string;
  body: string;
}

const SIGNALS: TrustSignal[] = [
  {
    icon: <Banknote className="h-4 w-4" strokeWidth={1.5} />,
    label: 'Cash on delivery',
    body: 'Pay the courier in cash when your parcel arrives.',
  },
  {
    icon: <Truck className="h-4 w-4" strokeWidth={1.5} />,
    label: 'Nationwide shipping',
    body: 'Flat Rs. 250 across Pakistan. Dispatched within 24 hours.',
  },
  {
    icon: <RotateCcw className="h-4 w-4" strokeWidth={1.5} />,
    label: '30-day returns',
    body: 'Opened bottles included. No restocking fee.',
  },
  {
    icon: <MapPin className="h-4 w-4" strokeWidth={1.5} />,
    label: 'Made in Pakistan',
    body: 'Formulated by a team of doctors in London and Lahore.',
  },
  {
    icon: <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />,
    label: 'Authenticity guarantee',
    body: 'QR-verifiable batch on every bottle. Twofold refund on any counterfeit.',
  },
  {
    icon: <MessageCircle className="h-4 w-4" strokeWidth={1.5} />,
    label: 'WhatsApp support',
    body: 'A real person replies in about two hours, Mon–Sat.',
  },
];

interface TrustStripProps {
  /** 'light' for white/cream backgrounds, 'dark' for navy backgrounds. */
  tone?: 'light' | 'dark';
  /** How many signals to surface — defaults to 4 (mobile-friendly). */
  limit?: number;
  /** Compact = single-line chips; full = card grid with body copy. */
  variant?: 'chips' | 'cards';
  className?: string;
}

/**
 * Horizontal row of trust signals shown on cart, checkout, and post-purchase
 * pages. Chip variant is single-line and tight (use above CTAs or as a
 * micro-trust band). Card variant is a 2-up / 3-up grid with body copy
 * (use as a dedicated section).
 */
export function TrustStrip({
  tone = 'light',
  limit = 4,
  variant = 'chips',
  className,
}: TrustStripProps) {
  const signals = SIGNALS.slice(0, limit);
  const isDark = tone === 'dark';

  if (variant === 'chips') {
    return (
      <ul
        className={cn(
          'flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.18em]',
          isDark ? 'text-white/70' : 'text-ink-mute',
          className,
        )}
        aria-label="Service guarantees"
      >
        {signals.map((s) => (
          <li key={s.label} className="inline-flex items-center gap-1.5">
            <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded-full', isDark ? 'bg-white/10 text-cobalt-glow' : 'bg-cobalt/10 text-cobalt')}>
              {s.icon}
            </span>
            <span>{s.label}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul
      className={cn(
        'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3',
        className,
      )}
      aria-label="Service guarantees"
    >
      {signals.map((s) => (
        <li
          key={s.label}
          className={cn(
            'flex flex-col gap-1.5 rounded-xl border p-4',
            isDark
              ? 'border-white/10 bg-white/5 text-white/85 backdrop-blur'
              : 'border-rule bg-canvas-soft text-ink-2',
          )}
        >
          <span
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-full',
              isDark ? 'bg-cobalt/30 text-cobalt-glow' : 'bg-cobalt/10 text-cobalt',
            )}
          >
            {s.icon}
          </span>
          <span
            className={cn(
              'font-mono text-[10.5px] uppercase tracking-[0.18em]',
              isDark ? 'text-cobalt-glow' : 'text-cobalt',
            )}
          >
            {s.label}
          </span>
          <p className={cn('font-body text-[12.5px] leading-snug', isDark ? 'text-white/75' : 'text-ink-mute')}>
            {s.body}
          </p>
        </li>
      ))}
    </ul>
  );
}
