/**
 * Builds a WhatsApp "click-to-chat" deep link prefilled with the live cart
 * contents, so a customer can place a COD order by chat and the team has full
 * order context. Pure + display-only — the server stays price-authoritative.
 */
import type { Cart } from '@/lib/cart/types';
import { PRODUCT_META } from '@/lib/products/catalog';
import { bundleBySlug } from './offer';
import { computeCartTotals } from './shop';

/** Brand WhatsApp number (same one used on the order page). */
export const WHATSAPP_NUMBER = '923249986822';

/** Human label for a cart line — bundle name or product short name. */
export function cartItemLabel(item: Cart['items'][number]): string {
  if (item.type === 'bundle') return bundleBySlug(item.slug)?.name ?? item.slug;
  return PRODUCT_META[item.sku]?.shortName ?? PRODUCT_META[item.sku]?.name ?? item.sku;
}

/** The chat message body listing each line + the total (incl. flat shipping). */
export function buildWhatsAppOrderMessage(cart: Cart): string {
  const lines = cart.items.map((i) => {
    const qty = i.qty > 1 ? ` ×${i.qty}` : '';
    return `• ${cartItemLabel(i)}${qty}`;
  });
  const { totalPkr } = computeCartTotals(cart);
  return [
    'Hi! I’d like to order my acne protocol (Cash on Delivery):',
    '',
    ...lines,
    '',
    `Total: PKR ${totalPkr.toLocaleString('en-PK')} (incl. shipping)`,
  ].join('\n');
}

/** `https://wa.me/<number>?text=<encoded message>`. */
export function buildWhatsAppOrderLink(cart: Cart): string {
  const text = encodeURIComponent(buildWhatsAppOrderMessage(cart));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
