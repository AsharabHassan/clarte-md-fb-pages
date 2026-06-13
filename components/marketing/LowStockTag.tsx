'use client';

import { motion } from 'motion/react';
import { useFakeStock } from '@/lib/marketing/use-fake-stock';
import { useReducedMotion } from '@/lib/anim/hooks';
import { cn } from '@/lib/utils';

/**
 * "Only N left" scarcity pill. Shows nothing on first render (avoids
 * hydration mismatch), then fades in once the stock count is loaded.
 *
 * Hidden when count exceeds `hideAbove` — the threshold above which
 * "only N left" stops being credible.
 */
export function LowStockTag({
  sku,
  hideAbove = 8,
  variant = 'pill',
  className,
}: {
  sku: string;
  hideAbove?: number;
  variant?: 'pill' | 'inline';
  className?: string;
}) {
  const reduced = useReducedMotion();
  const count = useFakeStock(sku);

  if (count === null || count > hideAbove) return null;

  const urgent = count <= 4;
  const accent = urgent ? 'text-rust' : 'text-cobalt';
  const ring = urgent ? 'border-rust/35 bg-rust/8' : 'border-cobalt/30 bg-cobalt/6';

  if (variant === 'inline') {
    return (
      <motion.span
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={cn('inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em]', accent, className)}
      >
        <motion.span
          aria-hidden="true"
          animate={reduced || !urgent ? undefined : { opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className={cn('inline-block h-1.5 w-1.5 rounded-full', urgent ? 'bg-rust' : 'bg-cobalt')}
        />
        Only {count} left
      </motion.span>
    );
  }

  return (
    <motion.span
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
        ring,
        className,
      )}
    >
      <motion.span
        aria-hidden="true"
        animate={reduced || !urgent ? undefined : { scale: [1, 1.25, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        className={cn('inline-block h-1.5 w-1.5 rounded-full', urgent ? 'bg-rust' : 'bg-cobalt')}
      />
      <span className={cn('font-mono text-[10.5px] uppercase tracking-[0.18em] font-semibold', accent)}>
        Only {count} left
      </span>
    </motion.span>
  );
}
