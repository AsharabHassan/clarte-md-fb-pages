import { describe, it, expect } from 'vitest';
import type { Cart } from '@/lib/cart/types';
import {
  WHATSAPP_NUMBER,
  buildWhatsAppOrderMessage,
  buildWhatsAppOrderLink,
} from '@/lib/funnel/whatsapp';

const acneGlowCart: Cart = {
  items: [{ type: 'bundle', slug: 'acne-glow-protocol', qty: 1 }],
  createdAt: 0,
};

describe('whatsapp order link', () => {
  it('exposes the brand WhatsApp number', () => {
    expect(WHATSAPP_NUMBER).toBe('923286772596');
  });

  it('writes a message naming the protocol and its total (incl. shipping)', () => {
    const msg = buildWhatsAppOrderMessage(acneGlowCart);
    expect(msg).toContain('The Acne Glow Protocol');
    expect(msg).toContain('PKR 6,749'); // 6499 + 250 shipping
  });

  it('shows quantity for stacked products', () => {
    const msg = buildWhatsAppOrderMessage({
      items: [{ type: 'product', sku: 'spf', qty: 2 }],
      createdAt: 0,
    });
    expect(msg).toContain('×2');
  });

  it('builds a wa.me link with the URL-encoded message', () => {
    const link = buildWhatsAppOrderLink(acneGlowCart);
    expect(link.startsWith('https://wa.me/923286772596?text=')).toBe(true);
    const text = decodeURIComponent(link.split('text=')[1]);
    expect(text).toBe(buildWhatsAppOrderMessage(acneGlowCart));
  });
});
