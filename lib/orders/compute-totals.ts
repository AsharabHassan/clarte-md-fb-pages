/**
 * Canonical price calculator. Server-side authoritative — every
 * /api/create-order request re-runs this on the items[] array
 * resolved against the products table and ignores whatever totals
 * the client sent. Without this, a hostile client could POST
 * `{ total: 1 }` and place an order for one rupee.
 */

export const FLAT_SHIPPING_PKR = 250;

export interface ComputeTotalsItem {
  sku: string;
  name: string;
  qty: number;
  unitPricePkr: number;
  isBundle: boolean;
}

export interface Totals {
  subtotal: number;
  shipping: number;
  total: number;
}

export function computeTotals(items: ComputeTotalsItem[]): Totals {
  if (items.length === 0) {
    return { subtotal: 0, shipping: 0, total: 0 };
  }
  const subtotal = items.reduce((s, i) => s + i.unitPricePkr * i.qty, 0);
  return { subtotal, shipping: FLAT_SHIPPING_PKR, total: subtotal + FLAT_SHIPPING_PKR };
}
