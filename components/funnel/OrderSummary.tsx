'use client';

import { X } from 'lucide-react';
import { useCart } from '@/lib/cart/use-cart';
import { PRODUCT_META } from '@/lib/products/catalog';
import { bundleBySlug } from '@/lib/funnel/offer';
import { computeCartTotals, lineUnitPkr } from '@/lib/funnel/shop';

/** Live cart summary: line items (removable) + subtotal / shipping / total. */
export function OrderSummary() {
  const { cart, removeItem } = useCart();
  const totals = computeCartTotals(cart);

  if (cart.items.length === 0) {
    return (
      <div className="funnel-summary funnel-summary--empty">
        Your cart is empty — add the protocol or a product to continue.
      </div>
    );
  }

  return (
    <div className="funnel-summary">
      <div className="funnel-summary-title">Your order</div>
      {cart.items.map((item, idx) => {
        const name = item.type === 'bundle'
          ? (bundleBySlug(item.slug)?.name ?? item.slug)
          : (PRODUCT_META[item.sku]?.shortName ?? item.sku);
        const line = lineUnitPkr(item) * item.qty;
        return (
          <div className="funnel-summary-line" key={item.type === 'bundle' ? `b-${item.slug}` : `p-${item.sku}`}>
            <button type="button" className="funnel-summary-remove" onClick={() => removeItem(idx)} aria-label={`Remove ${name}`}>
              <X className="h-3.5 w-3.5" />
            </button>
            <span className="funnel-summary-name">
              {name}{item.qty > 1 ? ` ×${item.qty}` : ''}
            </span>
            <span className="funnel-summary-amt">PKR {line.toLocaleString()}</span>
          </div>
        );
      })}
      <div className="funnel-summary-sub">
        <span>Subtotal</span><span>PKR {totals.subtotalPkr.toLocaleString()}</span>
      </div>
      <div className="funnel-summary-sub">
        <span>Shipping</span><span>PKR {totals.shippingPkr.toLocaleString()}</span>
      </div>
      <div className="funnel-summary-total">
        <span>Total</span><span>PKR {totals.totalPkr.toLocaleString()}</span>
      </div>
    </div>
  );
}
