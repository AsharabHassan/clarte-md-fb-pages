// tests/funnel/pigmentation.test.ts
import { describe, it, expect } from 'vitest';
import { PIGMENTATION_BUNDLES, PIGMENTATION_LEAD_SLUG } from '@/lib/funnel/pigmentation-offer';
import { bundleSavings, bundleBySlug } from '@/lib/funnel/offer';

describe('pigmentation offer', () => {
  it('has a single even-tone-protocol bundle as the lead', () => {
    expect(PIGMENTATION_LEAD_SLUG).toBe('even-tone-protocol');
    expect(PIGMENTATION_BUNDLES).toHaveLength(1);
    expect(PIGMENTATION_BUNDLES[0].slug).toBe('even-tone-protocol');
    expect(PIGMENTATION_BUNDLES[0].offerPkr).toBe(6999);
    expect(PIGMENTATION_BUNDLES[0].itemSkus).toEqual(['prep', 'vitc', 'light', 'spf']);
  });

  it('computes 41% savings vs the list price', () => {
    const sv = bundleSavings(PIGMENTATION_BUNDLES[0]);
    expect(sv.listPkr).toBe(11950); // 2000+2950+4500+2500
    expect(sv.savingsPkr).toBe(4951);
    expect(sv.savingsPct).toBe(41);
  });
});

describe('bundleBySlug cross-concern lookup', () => {
  it('finds the even-tone-protocol bundle', () => {
    const b = bundleBySlug('even-tone-protocol');
    expect(b?.offerPkr).toBe(6999);
  });

  it('still finds acne bundles', () => {
    expect(bundleBySlug('acne-solo-protocol')?.offerPkr).toBe(1999);
  });

  it('returns undefined for unknown slugs', () => {
    expect(bundleBySlug('nope')).toBeUndefined();
  });
});
