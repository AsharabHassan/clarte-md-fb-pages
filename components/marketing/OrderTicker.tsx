'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ShoppingBag, X } from 'lucide-react';
import {
  generateOrderEvent,
  type OrderTickerEvent,
} from '@/lib/marketing/fake-social';
import { useReducedMotion } from '@/lib/anim/hooks';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'clarte:ticker-dismissed';
const SHOW_DELAY_MS = 4000;       // wait this long after mount before first show
const VISIBLE_MS = 9000;          // each card shown this long
const HIDDEN_MS = 11000;          // gap between cards

/**
 * Floating bottom-left toast that periodically shows an invented recent
 * order from a Pakistani customer. Cycles through events forever until
 * the user dismisses (per-session dismiss).
 *
 * ⚠ Uses mock data from lib/marketing/fake-social — swap to real DB
 * before public launch. See the file header there.
 */
export function OrderTicker() {
  const reduced = useReducedMotion();
  const [event, setEvent] = useState<OrderTickerEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true); // start true to avoid hydration mismatch

  useEffect(() => {
    // Read dismiss state after mount (avoids SSR/CSR diff)
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      setDismissed(raw === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    if (dismissed) return;
    let timerId: number | undefined;
    let seed = Date.now();

    function showOne() {
      seed += 7919;
      setEvent(generateOrderEvent(seed));
      setVisible(true);
      timerId = window.setTimeout(() => {
        setVisible(false);
        timerId = window.setTimeout(showOne, HIDDEN_MS);
      }, VISIBLE_MS);
    }

    timerId = window.setTimeout(showOne, SHOW_DELAY_MS);
    return () => {
      if (timerId) window.clearTimeout(timerId);
    };
  }, [dismissed]);

  function dismiss() {
    setVisible(false);
    setDismissed(true);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
  }

  if (dismissed) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-4 left-4 z-40 sm:bottom-6 sm:left-6"
    >
      <AnimatePresence mode="wait">
        {visible && event && (
          <motion.div
            key={`${event.name}-${event.city}-${event.product}`}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: -24, y: 12 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: -24, y: 12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'pointer-events-auto flex max-w-[20rem] items-start gap-3 rounded-2xl border border-sand/60 bg-card/95 p-3.5 pr-4',
              'shadow-[0_18px_40px_-16px_rgba(14,31,58,0.28)] backdrop-blur-md',
            )}
          >
            <span
              aria-hidden="true"
              className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-cobalt/10 text-cobalt"
            >
              <ShoppingBag className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[13.5px] leading-snug text-navy">
                <span className="font-medium">{event.name}</span>{' '}
                <span className="text-ink-mute">from</span>{' '}
                <span className="font-medium">{event.city}</span>{' '}
                <span className="text-ink-mute">just ordered</span>{' '}
                <em className="italic">{event.product}</em>
              </p>
              <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-faint">
                {event.minutesAgo === 1 ? '1 minute' : `${event.minutesAgo} minutes`} ago · Verified order
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="ml-1 -mr-1 -mt-1 grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:bg-sky hover:text-navy"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
