'use client';

import { useEffect, useState } from 'react';

/**
 * ⚠ MOCK SCARCITY — invented "Only N left" per SKU.
 *
 * Persists per-SKU count in localStorage so the number is consistent
 * across page refreshes. Decrements by 1 every ~5 minutes for "realism".
 * Never drops below 2; tops out at the initial range so it never looks
 * suspicious.
 *
 * Swap to real inventory by replacing the body of `useFakeStock` with
 * a fetch to /api/products/[sku] stock field.
 */
const STORAGE_PREFIX = 'clarte:stock:';
const DECREMENT_EVERY_MS = 5 * 60 * 1000; // 5 min
const FLOOR = 2;

function deriveInitial(sku: string): number {
  // Stable per-SKU seed so the count is the same for a given product
  // across all visitors (until the next decrement window).
  let hash = 0;
  for (let i = 0; i < sku.length; i += 1) {
    hash = ((hash << 5) - hash + sku.charCodeAt(i)) | 0;
  }
  // Range: 3..11 — small enough to feel urgent, never absurdly low.
  return 3 + (Math.abs(hash) % 9);
}

interface StoredStock {
  count: number;
  lastDecrementAt: number;
}

function loadStock(sku: string): StoredStock {
  if (typeof window === 'undefined') {
    return { count: deriveInitial(sku), lastDecrementAt: Date.now() };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + sku);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredStock;
      if (typeof parsed.count === 'number' && typeof parsed.lastDecrementAt === 'number') {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  const fresh: StoredStock = {
    count: deriveInitial(sku),
    lastDecrementAt: Date.now(),
  };
  saveStock(sku, fresh);
  return fresh;
}

function saveStock(sku: string, stock: StoredStock): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + sku, JSON.stringify(stock));
  } catch {
    /* ignore */
  }
}

/**
 * Returns the current "stock" count for the SKU, decrementing on a
 * 5-min cadence. Returns null on first render to avoid hydration mismatch;
 * caller should render a static placeholder until the first count lands.
 */
export function useFakeStock(sku: string): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!sku) return;
    let cancelled = false;

    function tick() {
      if (cancelled) return;
      const stored = loadStock(sku);
      const now = Date.now();
      const elapsed = now - stored.lastDecrementAt;
      const decrements = Math.floor(elapsed / DECREMENT_EVERY_MS);
      if (decrements > 0) {
        const next: StoredStock = {
          count: Math.max(FLOOR, stored.count - decrements),
          lastDecrementAt: now,
        };
        saveStock(sku, next);
        setCount(next.count);
      } else {
        setCount(stored.count);
      }
    }

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [sku]);

  return count;
}
