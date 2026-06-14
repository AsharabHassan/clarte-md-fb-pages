// lib/seo/pigmentation-jsonld.ts
/**
 * JSON-LD builders for the /pigmentation page. Mirrors lib/seo/jsonld.ts's
 * Product + FAQPage builders but anchored to the Even Tone Protocol.
 */
import { SITE_URL } from './site';
import { PIGMENTATION_BUNDLES, PIGMENTATION_LEAD_SLUG } from '@/lib/funnel/pigmentation-offer';
import { PIGMENTATION_FAQ } from './pigmentation-faq';
import type { ReviewCard } from '@/lib/reviews/types';

const BRAND = 'Clarté MD';

export function pigmentationProductLd({
  aggregate,
  reviews = [],
}: {
  aggregate: { avg: number; count: number };
  reviews?: ReviewCard[];
}): object {
  const lead = PIGMENTATION_BUNDLES.find((b) => b.slug === PIGMENTATION_LEAD_SLUG)!;
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    sku: lead.slug,
    name: lead.name,
    description: lead.description,
    image: lead.hero,
    brand: { '@type': 'Brand', name: BRAND },
    offers: {
      '@type': 'Offer',
      price: String(lead.offerPkr),
      priceCurrency: 'PKR',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/pigmentation`,
    },
  };
  if (aggregate.count > 0) {
    ld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregate.avg.toFixed(1),
      reviewCount: aggregate.count,
      bestRating: '5',
      worstRating: '1',
    };
  }
  const sample = reviews.slice(0, 3);
  if (sample.length) {
    ld.review = sample.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.name },
      reviewRating: { '@type': 'Rating', ratingValue: String(r.rating), bestRating: '5' },
      reviewBody: r.body,
    }));
  }
  return ld;
}

export function pigmentationFaqLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PIGMENTATION_FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
