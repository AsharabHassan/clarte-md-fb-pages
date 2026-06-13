/**
 * Pure helper: read (or initialise) a sticky sale-end timestamp in localStorage.
 *
 * This is its own module so it can be imported and unit-tested without pulling
 * in the React hook machinery of use-sale-countdown.ts.
 *
 * @param windowMs   Length of the sale window in milliseconds.
 * @param storageKey localStorage key under which the end-time is persisted.
 * @returns          Unix timestamp (ms) at which the current window expires.
 */
export function getOrCreateEndTime(windowMs: number, storageKey: string): number {
  if (typeof window === 'undefined') return Date.now() + windowMs;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      const end = parseInt(raw, 10);
      if (Number.isFinite(end) && end > Date.now()) return end;
    }
  } catch {
    /* localStorage may be blocked in private mode */
  }
  const end = Date.now() + windowMs;
  try {
    window.localStorage.setItem(storageKey, String(end));
  } catch {
    /* ignore */
  }
  return end;
}
