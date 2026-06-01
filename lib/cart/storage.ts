/**
 * localStorage persistence for the cart. Server-safe: returns an empty
 * cart when window is undefined (SSR pass). Drops the stored cart on
 * Zod parse failure (forward-compat) or after a 14-day TTL.
 */
import { CartSchema, type Cart } from './types';
import { emptyCart } from './operations';

const STORAGE_KEY = 'clarte_cart_v1';
const TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function loadCart(): Cart {
  if (typeof window === 'undefined') return emptyCart();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCart();
    const parsed = CartSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return emptyCart();
    if (Date.now() - parsed.data.createdAt > TTL_MS) return emptyCart();
    return parsed.data;
  } catch {
    return emptyCart();
  }
}

export function saveCart(cart: Cart): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // localStorage full, private mode, etc. — silently ignore; cart still
    // works in-memory for the rest of the session.
  }
}

export function clearStoredCart(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
