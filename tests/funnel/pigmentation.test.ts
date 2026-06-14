// tests/funnel/pigmentation.test.ts
import { describe, it, expect } from 'vitest';
import { PIGMENTATION_BUNDLES, PIGMENTATION_LEAD_SLUG } from '@/lib/funnel/pigmentation-offer';
import { bundleSavings, bundleBySlug } from '@/lib/funnel/offer';
import { getConcernConfig } from '@/lib/funnel/concern-config';

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

describe('getConcernConfig', () => {
  it('defaults to acne', () => {
    const c = getConcernConfig();
    expect(c.concern).toBe('acne');
    expect(c.leadSlug).toBe('acne-solo-protocol');
    expect(c.bundleSkus).toEqual(['rescue', 'acne', 'vitc', 'reti']);
    expect(c.addonSkus).toEqual(['spf', 'ha', 'prep']);
    expect(c.bundles.length).toBe(3);
  });

  it('returns the pigmentation config', () => {
    const c = getConcernConfig('pigmentation');
    expect(c.concern).toBe('pigmentation');
    expect(c.leadSlug).toBe('even-tone-protocol');
    expect(c.bundleSkus).toEqual(['prep', 'vitc', 'light', 'spf']);
    expect(c.addonSkus).toEqual(['rescue', 'acne', 'ha', 'reti']);
    expect(c.bundles.length).toBe(1);
    expect(c.aiPrompt).toContain('tranexamic');
    expect(c.protocolHeroAlt).toBe('The Even Tone Protocol');
  });

  it('falls back to acne for unknown concerns', () => {
    expect(getConcernConfig('xyz').concern).toBe('acne');
  });
});
