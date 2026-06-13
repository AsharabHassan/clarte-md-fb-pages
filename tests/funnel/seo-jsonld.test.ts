// tests/funnel/seo-jsonld.test.ts
import { describe, it, expect } from 'vitest';
import { organizationLd, webSiteLd, productLd, faqLd, serializeJsonLd } from '@/lib/seo/jsonld';
import { bundleBySlug, LEAD_BUNDLE_SLUG } from '@/lib/funnel/offer';
import { ACNE_FAQ } from '@/lib/seo/faq';

describe('jsonld builders', () => {
  it('organizationLd is an Organization with a url', () => {
    const ld = organizationLd();
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Organization');
    expect(typeof ld.url).toBe('string');
  });

  it('webSiteLd is a WebSite', () => {
    expect(webSiteLd()['@type']).toBe('WebSite');
  });

  it('productLd reflects the offer price, currency and aggregate rating', () => {
    const ld = productLd({ aggregate: { avg: 4.8, count: 120 } });
    expect(ld['@type']).toBe('Product');
    expect(ld.offers.price).toBe(String(bundleBySlug(LEAD_BUNDLE_SLUG)!.offerPkr));
    expect(ld.offers.priceCurrency).toBe('PKR');
    expect(ld.aggregateRating?.ratingValue).toBe('4.8');
    expect(ld.aggregateRating?.reviewCount).toBe(120);
  });

  it('productLd omits aggregateRating when there are no reviews', () => {
    const ld = productLd({ aggregate: { avg: 0, count: 0 } });
    expect(ld.aggregateRating).toBeUndefined();
  });

  it('productLd includes up to 3 reviews when provided', () => {
    const ld = productLd({
      aggregate: { avg: 5, count: 4 },
      reviews: [
        { name: 'A', location: null, rating: 5, body: 'x', verified: true, photo: null },
        { name: 'B', location: null, rating: 4, body: 'y', verified: true, photo: null },
        { name: 'C', location: null, rating: 5, body: 'z', verified: true, photo: null },
        { name: 'D', location: null, rating: 5, body: 'w', verified: true, photo: null },
      ],
    });
    expect(ld.review).toHaveLength(3);
    expect(ld.review?.[0]['@type']).toBe('Review');
  });

  it('faqLd has one Question entity per FAQ item', () => {
    const ld = faqLd();
    expect(ld['@type']).toBe('FAQPage');
    expect(ld.mainEntity).toHaveLength(ACNE_FAQ.length);
    expect(ld.mainEntity[0]['@type']).toBe('Question');
  });
});

describe('serializeJsonLd', () => {
  it('neutralizes a </script> breakout from user-generated review text', () => {
    const out = serializeJsonLd(
      productLd({
        aggregate: { avg: 5, count: 1 },
        reviews: [
          {
            name: 'Mal',
            location: null,
            rating: 5,
            body: '</script><script>alert(1)</script> & <img src=x>',
            verified: true,
            photo: null,
          },
        ],
      }),
    );
    // No raw tag-forming characters survive in the embedded string.
    expect(out).not.toMatch(/<\/script>/i);
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
    expect(out).not.toContain('&');
    // Still valid JSON that round-trips back to the original text.
    const parsed = JSON.parse(out);
    expect(parsed.review[0].reviewBody).toBe('</script><script>alert(1)</script> & <img src=x>');
  });
});
