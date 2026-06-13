'use client';

import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/cart/use-cart';
import { computeCartTotals } from '@/lib/funnel/shop';
import { buildWhatsAppOrderLink, cartItemLabel } from '@/lib/funnel/whatsapp';
import { pushFunnelEvent } from '@/lib/funnel/analytics';

/**
 * Attention-grabbing cart pinned to the bottom of the result page. Shows the
 * selected protocol + live total and offers Checkout (scrolls to the COD form)
 * and Order-on-WhatsApp. Renders nothing when the cart is empty or when the
 * checkout form is already on screen (`visible === false`).
 */
export function StickyCartBar({
  visible,
  onCheckout,
}: {
  visible: boolean;
  onCheckout: () => void;
}) {
  const { cart } = useCart();
  if (!visible || cart.items.length === 0) return null;

  const totals = computeCartTotals(cart);
  const first = cart.items[0];
  const firstLabel = cartItemLabel(first);
  const extra = cart.items.length - 1;
  const label = extra > 0 ? `${firstLabel} +${extra} more` : firstLabel;
  const waLink = buildWhatsAppOrderLink(cart);

  return (
    <div className="funnel-sticky-bar" role="region" aria-label="Your order">
      <div className="funnel-sticky-info">
        <ShoppingCart className="h-5 w-5" />
        <div className="funnel-sticky-text">
          <span className="funnel-sticky-name">{label}</span>
          <span className="funnel-sticky-total">PKR {totals.totalPkr.toLocaleString()}</span>
        </div>
      </div>
      <div className="funnel-sticky-actions">
        <a
          className="funnel-sticky-wa"
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => pushFunnelEvent('whatsapp_order_clicked')}
        >
          WhatsApp
        </a>
        <button
          type="button"
          className="funnel-sticky-checkout"
          onClick={() => {
            pushFunnelEvent('sticky_checkout_clicked');
            onCheckout();
          }}
        >
          Checkout →
        </button>
      </div>
    </div>
  );
}
