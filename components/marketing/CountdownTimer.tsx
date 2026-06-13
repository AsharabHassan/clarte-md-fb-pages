'use client';

import { motion } from 'motion/react';
import { useSaleCountdown } from '@/lib/marketing/use-sale-countdown';
import { useReducedMotion } from '@/lib/anim/hooks';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  /** Cadence label shown next to the timer (e.g. 'Offer ends in'). */
  label?: string;
  /** Visual variant. */
  variant?: 'inline' | 'pill' | 'bar';
  /** Hours, defaults to 6. Ignored when windowMinutes is set. */
  windowHours?: number;
  /** When set, overrides windowHours for short (sub-hour) timers. */
  windowMinutes?: number;
  /** localStorage key so multiple timers don't collide. */
  storageKey?: string;
  className?: string;
}

/**
 * Renders a hours:minutes:seconds countdown driven by useSaleCountdown.
 * "inline" is for promo bars, "pill" for buy boxes, "bar" for full-width
 * urgency strips.
 */
export function CountdownTimer({
  label = 'Offer ends in',
  variant = 'inline',
  windowHours = 6,
  windowMinutes,
  storageKey,
  className,
}: CountdownTimerProps) {
  const windowMs =
    windowMinutes != null ? windowMinutes * 60 * 1000 : windowHours * 60 * 60 * 1000;
  const { hours, minutes, seconds } = useSaleCountdown(windowMs, storageKey);
  const reduced = useReducedMotion();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const clock =
    hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;

  if (variant === 'pill') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-rust/40 bg-rust/5 px-3 py-1.5',
          className,
        )}
      >
        <motion.span
          aria-hidden="true"
          animate={reduced ? undefined : { scale: [1, 1.25, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block h-1.5 w-1.5 rounded-full bg-rust"
        />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-mute">
          {label}
        </span>
        <span className="font-mono text-[12px] font-semibold tabular-nums text-rust">
          {clock}
        </span>
      </div>
    );
  }

  if (variant === 'bar') {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-3 border-y border-rust/30 bg-rust/8 px-4 py-2',
          className,
        )}
      >
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-rust">
          {label}
        </span>
        <span className="font-mono text-[14px] font-semibold tabular-nums text-rust">
          {clock}
        </span>
      </div>
    );
  }

  // inline (default)
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <motion.span
        aria-hidden="true"
        animate={reduced ? undefined : { opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        className="inline-block h-1.5 w-1.5 rounded-full bg-rust"
      />
      <span className="font-mono text-[10.5px] uppercase tracking-[0.18em]">
        {label}
      </span>
      <span className="font-mono text-[11px] font-semibold tabular-nums text-rust">
        {clock}
      </span>
    </span>
  );
}
