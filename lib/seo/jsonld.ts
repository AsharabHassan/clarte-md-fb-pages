// lib/seo/jsonld.ts
/**
 * Pure JSON-LD builders. Return plain objects; the caller serializes with
 * JSON.stringify inside a <script type="application/ld+json">. All facts come
 * from existing single sources (offer.ts, faq.ts, reviews) — no invented data.
 */
import { SITE_URL } from './site';
import { FUNNEL_BUNDLES, LEAD_BUNDLE_SLUG } from '@/lib/funnel/offer';
import { PRODUCT_META } from '@/lib/products/catalog';
import { ACNE_FAQ } from './faq';
import type { ReviewCard } from '@/lib/reviews/types';

const BRAND = 'Clarté MD';
const LOGO = `${SITE_URL}/protocols/acne-glow-protocol/hero.webp`;

/**
 * Serialize a JSON-LD object for safe embedding in a <script> tag.
 * JSON.stringify does NOT escape `<`, `>` or `&`, so a user-generated value
 * (e.g. review text) containing "</script>" could break out of the script
 * element — a stored-XSS vector on a public page. Escaping those three as
 * unicode keeps the JSON valid for consumers while making breakout impossible.
 */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/[<>&]/g, (ch) =>
    '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'),
  );
}

interface OrgLd {
  '@context': string;
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
}
export function organizationLd(): OrgLd {
  return { '@context': 'https://schema.org', '@type': 'Organization', name: BRAND, url: SITE_URL, logo: LOGO };
}

interface SiteLd {
  '@context': string;
  '@type': 'WebSite';
  name: string;
  url: string;
}
export function webSiteLd(): SiteLd {
  return { '@context': 'https://schema.org', '@type': 'WebSite', name: BRAND, url: SITE_URL };
}

interface OfferLd {
  '@type': 'Offer';
  price: string;
  priceCurrency: string;
  availability: string;
  url: string;
}
interface RatingLd {
  '@type': 'AggregateRating';
  ratingValue: string;
  reviewCount: number;
  bestRating: string;
  worstRating: string;
}
interface ReviewLd {
  '@type': 'Review';
  author: { '@type': 'Person'; name: string };
  reviewRating: { '@type': 'Rating'; ratingValue: string; bestRating: string };
  reviewBody: string;
}
interface ProductLd {
  '@context': string;
  '@type': 'Product';
  sku: string;
  name: string;
  description: string;
  image: string;
  brand: { '@type': 'Brand'; name: string };
  offers: OfferLd;
  aggregateRating?: RatingLd;
  review?: ReviewLd[];
}

export function productLd({
  aggregate,
  reviews = [],
}: {
  aggregate: { avg: number; count: number };
  reviews?: ReviewCard[];
}): ProductLd {
  const lead = FUNNEL_BUNDLES.find((b) => b.slug === LEAD_BUNDLE_SLUG)!;
  const ld: ProductLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    sku: lead.slug,
    name: lead.name,
    description: lead.description,
    image: `${SITE_URL}${lead.hero}`,
    brand: { '@type': 'Brand', name: BRAND },
    offers: {
      '@type': 'Offer',
      price: String(lead.offerPkr),
      priceCurrency: 'PKR',
      availability: 'https://schema.org/InStock',
      url: SITE_URL,
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

interface FaqLd {
  '@context': string;
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: { '@type': 'Answer'; text: string };
  }>;
}
export function faqLd(): FaqLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ACNE_FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/**
 * One schema.org/Product block per individual product (all 8 SKUs).
 * Ad crawlers (Meta, Google) read these to verify SKUs against the catalog.
 */
export function catalogProductsLd(): object[] {
  return Object.values(PRODUCT_META).map((p) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    sku: p.sku,
    name: p.name,
    description: p.actives,
    image: `${SITE_URL}${p.imagePath}`,
    brand: { '@type': 'Brand', name: BRAND },
    offers: {
      '@type': 'Offer',
      price: String(p.pricePkr),
      priceCurrency: 'PKR',
      availability: 'https://schema.org/InStock',
      url: SITE_URL,
    },
  }));
}

// All 8 protocols/bundles — 3 acne funnel bundles + 5 additional from the DB.
// Prices and slugs mirror lib/db/seed.ts. Non-funnel protocols without a local
// asset are served from the main site (clartemd.com.pk).
const MAIN_SITE = 'https://clartemd.com.pk';

const EXTRA_PROTOCOLS = [
  {
    slug: 'clear-skin-protocol',
    name: 'The Clear Skin Protocol',
    description: 'Full acne-clearing routine — salicylic wash, niacinamide serum, vitamin C, and retinol. Clinically dosed for 12-week skin transformation.',
    image: `${MAIN_SITE}/protocols/clear-skin-protocol/hero.webp`,
    offerPkr: 6499,
  },
  {
    slug: 'barrier-protocol',
    name: 'The Barrier Protocol',
    description: 'Hydration-first routine that rebuilds a damaged skin barrier — hyaluronic acid, panthenol, and SPF 50+.',
    image: `${MAIN_SITE}/protocols/barrier-protocol/hero.webp`,
    offerPkr: 4799,
  },
  {
    slug: 'even-tone-protocol',
    name: 'The Even Tone Protocol',
    description: 'Targets stubborn pigmentation and dark spots with tranexamic acid 3%, kojic, and arbutin — plus vitamin C and SPF.',
    image: `${SITE_URL}/protocols/even-tone-protocol/hero.webp`,
    offerPkr: 6999,
  },
  {
    slug: 'even-tone-essentials-protocol',
    name: 'Radiance Prep Essential',
    description: 'Entry pigmentation tier — the Radiance Prep Cleanser with glutathione, sodium lactate and citric acid to gently brighten and even tone daily.',
    image: `${SITE_URL}/protocols/even-tone-essentials-protocol/hero.webp`,
    offerPkr: 1799,
  },
  {
    slug: 'renewal-protocol',
    name: 'The Renewal Protocol',
    description: 'Anti-ageing routine built on retinol 0.5%, vitamin CE ferrulic, and SPF 50+ — for fine lines, dull texture, and loss of firmness.',
    image: `${MAIN_SITE}/protocols/renewal-protocol/hero.webp`,
    offerPkr: 7999,
  },
];

/**
 * One schema.org/Product block per protocol/bundle — all 7 DB slugs.
 * Protocol slugs serve as SKUs so Meta CAPI and Google can match them.
 */
export function catalogProtocolsLd(): object[] {
  const funnelLd = FUNNEL_BUNDLES.map((b) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    sku: b.slug,
    name: b.name,
    description: b.description,
    image: `${SITE_URL}${b.hero}`,
    brand: { '@type': 'Brand', name: BRAND },
    offers: {
      '@type': 'Offer',
      price: String(b.offerPkr),
      priceCurrency: 'PKR',
      availability: 'https://schema.org/InStock',
      url: SITE_URL,
    },
  }));

  const extraLd = EXTRA_PROTOCOLS.map((p) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    sku: p.slug,
    name: p.name,
    description: p.description,
    image: p.image,
    brand: { '@type': 'Brand', name: BRAND },
    offers: {
      '@type': 'Offer',
      price: String(p.offerPkr),
      priceCurrency: 'PKR',
      availability: 'https://schema.org/InStock',
      url: SITE_URL,
    },
  }));

  return [...funnelLd, ...extraLd];
}
