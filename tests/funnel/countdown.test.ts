import { describe, it, expect, beforeEach } from 'vitest';
import { getOrCreateEndTime } from '@/lib/marketing/sale-window';

/**
 * Dependency-free storage-key isolation test.
 *
 * getOrCreateEndTime lives in its own module (sale-window.ts) so it can be
 * tested without pulling in the React hook.  It IS the critical unit: it must
 * write to the supplied storageKey and never touch the default key.
 *
 * A minimal localStorage shim is set up on globalThis so the function
 * runs its storage code-paths under the node test environment.
 */

// ── localStorage shim ──────────────────────────────────────────────────────
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};

// Make the helper believe it is running in a browser so it takes the
// localStorage path (otherwise it early-returns Date.now() + windowMs
// without writing).
if (typeof globalThis.window === 'undefined') {
  // @ts-expect-error – node environment; we only need the localStorage subset
  globalThis.window = { localStorage: mockLocalStorage };
} else {
  // @ts-expect-error – override in case window already exists
  globalThis.window.localStorage = mockLocalStorage;
}

beforeEach(() => mockLocalStorage.clear());

// ── tests ──────────────────────────────────────────────────────────────────

describe('useSaleCountdown with custom window + key', () => {
  it('initialises a 5-minute window under a custom storage key', () => {
    const CUSTOM_KEY = 'clarte:funnel-sale-end';
    const DEFAULT_KEY = 'clarte:sale-end';

    const windowMs = 5 * 60 * 1000;
    const end = getOrCreateEndTime(windowMs, CUSTOM_KEY);

    // Returns a timestamp in the future.
    expect(end).toBeGreaterThan(Date.now());
    // Stored under the custom key.
    expect(mockLocalStorage.getItem(CUSTOM_KEY)).not.toBeNull();
    expect(Number(mockLocalStorage.getItem(CUSTOM_KEY))).toBe(end);
    // Does NOT touch the default key.
    expect(mockLocalStorage.getItem(DEFAULT_KEY)).toBeNull();
  });

  it('returns a time roughly 5 minutes in the future', () => {
    const CUSTOM_KEY = 'clarte:funnel-sale-end';
    const windowMs = 5 * 60 * 1000;
    const before = Date.now();
    const end = getOrCreateEndTime(windowMs, CUSTOM_KEY);
    const after = Date.now();

    // Allow a small clock drift.
    expect(end).toBeGreaterThanOrEqual(before + windowMs);
    expect(end).toBeLessThanOrEqual(after + windowMs + 50);
  });

  it('re-uses a still-valid stored end time (no overwrite)', () => {
    const CUSTOM_KEY = 'clarte:funnel-sale-end';
    const windowMs = 5 * 60 * 1000;

    // Pre-seed the store with a future end time.
    const future = Date.now() + windowMs;
    mockLocalStorage.setItem(CUSTOM_KEY, String(future));

    const end = getOrCreateEndTime(windowMs, CUSTOM_KEY);
    expect(end).toBe(future);
  });

  it('default key is still written when passed explicitly', () => {
    const DEFAULT_KEY = 'clarte:sale-end';
    const windowMs = 6 * 60 * 60 * 1000;

    const end = getOrCreateEndTime(windowMs, DEFAULT_KEY);
    expect(mockLocalStorage.getItem(DEFAULT_KEY)).not.toBeNull();
    expect(Number(mockLocalStorage.getItem(DEFAULT_KEY))).toBe(end);
  });
});
