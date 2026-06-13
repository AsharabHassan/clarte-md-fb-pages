/**
 * Funnel mini-shop config + client-side total math. The server
 * (/api/create-order) remains price-authoritative; these totals are for
 * live display only and mirror lib/orders/compute-totals.ts (flat shipping).
 */
import type { Cart } from '@/lib/cart/types';
import { PRODUCT_META } from '@/lib/products/catalog';
import { SHIPPING_PKR, bundleBySlug } from './offer';

/** The four products that make up the bundle, sold individually too. */
export const BUNDLE_SKUS = ['rescue', 'acne', 'vitc', 'reti'] as const;
/** Add-ons that pair with the acne routine. */
export const ADDON_SKUS = ['spf', 'ha', 'prep'] as const;

export interface CartTotals {
  subtotalPkr: number;
  shippingPkr: number;
  totalPkr: number;
  count: number;
}

/** Line-item unit price for display: bundle = its offer price, product = catalog price. */
export function lineUnitPkr(item: Cart['items'][number]): number {
  if (item.type === 'bundle') return bundleBySlug(item.slug)?.offerPkr ?? 0;
  return PRODUCT_META[item.sku]?.pricePkr ?? 0;
}

export function computeCartTotals(cart: Cart): CartTotals {
  const subtotalPkr = cart.items.reduce((sum, i) => sum + lineUnitPkr(i) * i.qty, 0);
  const count = cart.items.reduce((n, i) => n + i.qty, 0);
  const shippingPkr = cart.items.length ? SHIPPING_PKR : 0;
  return { subtotalPkr, shippingPkr, totalPkr: subtotalPkr + shippingPkr, count };
}
