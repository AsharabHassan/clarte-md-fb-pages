import { describe, it, expect } from 'vitest';
import {
  ACNE_GLOW,
  computeOfferSavings,
  SHIPPING_PKR,
} from '@/lib/funnel/offer';

describe('acne glow offer', () => {
  it('bundles exactly the four acne SKUs', () => {
    expect(ACNE_GLOW.itemSkus).toEqual(['rescue', 'acne', 'vitc', 'reti']);
    expect(ACNE_GLOW.slug).toBe('acne-glow-protocol');
    expect(ACNE_GLOW.offerPkr).toBe(6499);
  });

  it('computes savings against the list total', () => {
    const s = computeOfferSavings();
    // list total = 2000 + 3000 + 2950 + 2500 = 10450
    expect(s.listPkr).toBe(10450);
    expect(s.savingsPkr).toBe(10450 - 6499);
    expect(s.savingsPct).toBe(Math.round(((10450 - 6499) / 10450) * 100)); // 38
  });

  it('exposes flat shipping matching the server', () => {
    expect(SHIPPING_PKR).toBe(250);
  });
});
