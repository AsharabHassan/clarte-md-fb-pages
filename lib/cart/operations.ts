/**
 * Pure cart operations. Every function is immutable: takes a Cart, returns
 * a new Cart. Storage + React Context layers (use-cart.ts + provider.tsx)
 * wrap these.
 */
import type { Cart, CartItem } from './types';

export function emptyCart(): Cart {
  return { items: [], createdAt: Date.now() };
}

export function addBundle(cart: Cart, slug: string): Cart {
  // Bundle qty is always 1 — second add replaces existing bundle of same slug.
  const items = cart.items.filter((i) => !(i.type === 'bundle' && i.slug === slug));
  items.push({ type: 'bundle', slug, qty: 1 });
  return { ...cart, items };
}

export function addProduct(cart: Cart, sku: string, qty = 1): Cart {
  const existing = cart.items.findIndex((i) => i.type === 'product' && i.sku === sku);
  if (existing >= 0) {
    const items = cart.items.slice();
    const current = items[existing] as Extract<CartItem, { type: 'product' }>;
    items[existing] = { type: 'product', sku, qty: Math.min(20, current.qty + qty) };
    return { ...cart, items };
  }
  return {
    ...cart,
    items: [...cart.items, { type: 'product', sku, qty: Math.min(20, qty) }],
  };
}

export function removeItem(cart: Cart, idx: number): Cart {
  if (idx < 0 || idx >= cart.items.length) return cart;
  const items = cart.items.slice();
  items.splice(idx, 1);
  return { ...cart, items };
}

export function updateQty(cart: Cart, idx: number, qty: number): Cart {
  if (idx < 0 || idx >= cart.items.length) return cart;
  const item = cart.items[idx];
  if (item.type === 'bundle') return cart; // bundles are always qty 1
  if (qty <= 0) return removeItem(cart, idx);
  const items = cart.items.slice();
  items[idx] = { type: 'product', sku: item.sku, qty: Math.min(20, qty) };
  return { ...cart, items };
}

export function clearCart(cart: Cart): Cart {
  return { ...cart, items: [] };
}

export function countItems(cart: Cart): number {
  return cart.items.reduce((n, i) => n + i.qty, 0);
}
