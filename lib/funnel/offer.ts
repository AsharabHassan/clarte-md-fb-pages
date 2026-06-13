/**
 * Single source of truth for the acne scan funnel offer.
 * Prices mirror lib/products/catalog.ts (PRODUCT_META) and lib/db/seed.ts.
 * The server (/api/create-order) remains price-authoritative; these values
 * are for rendering the offer block only.
 */
import { PRODUCT_META } from '@/lib/products/catalog';

export const SHIPPING_PKR = 250; // mirrors FLAT_SHIPPING_PKR

/** localStorage key for the funnel's 5-minute offer timer (kept distinct from the site-wide sale timer). */
export const FUNNEL_TIMER_KEY = 'clarte:funnel-sale-end';

export const ACNE_GLOW = {
  slug: 'acne-glow-protocol',
  name: 'The Acne Glow Protocol',
  concern: 'acne',
  itemSkus: ['rescue', 'acne', 'vitc', 'reti'] as const,
  offerPkr: 6499,
};

export const ACNE_ESSENTIALS = {
  slug: 'acne-essentials-protocol',
  name: 'Acne Essentials Duo',
  concern: 'acne',
  itemSkus: ['rescue', 'acne'] as const,
  offerPkr: 3499,
};

/**
 * The lowest-priced acne option — featured as the lead/default offer for a
 * price-sensitive market. Just the Clarifying Acne Serum (PKR 1,999).
 */
export const LEAD_BUNDLE_SLUG = 'acne-solo-protocol';

export interface FunnelBundle {
  slug: string;
  name: string;
  itemSkus: readonly string[];
  offerPkr: number;
  tagline: string;
  description: string;
  hero: string; // public image path or remote URL
  /** How the hero fits its frame. Lifestyle photos = cover; product shots = contain. */
  heroFit?: 'cover' | 'contain';
}

/** The bundles offered in the funnel, in display order (hero first). */
export const FUNNEL_BUNDLES: FunnelBundle[] = [
  {
    slug: 'acne-solo-protocol',
    name: 'Acne Serum Solo',
    itemSkus: ['acne'],
    offerPkr: 1999,
    tagline: 'Entry tier · the hero serum',
    description:
      'Just the clinical Acne Serum — niacinamide 10% + azelaic acid that calm active breakouts and fade post-acne marks. The most affordable way to start.',
    hero: '/protocols/acne-solo-protocol/hero.webp',
  },
  {
    slug: ACNE_ESSENTIALS.slug,
    name: ACNE_ESSENTIALS.name,
    itemSkus: ACNE_ESSENTIALS.itemSkus,
    offerPkr: ACNE_ESSENTIALS.offerPkr,
    tagline: 'Simple start · 2 essentials',
    description:
      'The two essentials to start clearing acne — a salicylic 2% wash that decongests pores, plus a niacinamide 10% + azelaic serum that calms active breakouts. The simplest way to begin.',
    hero: '/protocols/acne-essentials-protocol/hero.webp',
  },
  {
    slug: ACNE_GLOW.slug,
    name: ACNE_GLOW.name,
    itemSkus: ACNE_GLOW.itemSkus,
    offerPkr: ACNE_GLOW.offerPkr,
    tagline: 'Best results · full 12-week routine',
    description:
      'The complete protocol — cleanse, clear active breakouts, fade post-acne marks, and restore glow. Rescue Wash, Acne Serum, Vitamin C and Retinol, dermatologist-dosed.',
    hero: '/protocols/acne-glow-protocol/hero.webp',
  },
];

export function bundleBySlug(slug: string): FunnelBundle | undefined {
  return FUNNEL_BUNDLES.find((b) => b.slug === slug);
}

export interface BundleSavings {
  listPkr: number;
  offerPkr: number;
  savingsPkr: number;
  savingsPct: number;
}

/** Savings vs the list-price total for any funnel bundle. */
export function bundleSavings(b: FunnelBundle): BundleSavings {
  const listPkr = b.itemSkus.reduce((s, sku) => s + (PRODUCT_META[sku]?.listPricePkr ?? 0), 0);
  const savingsPkr = listPkr - b.offerPkr;
  return { listPkr, offerPkr: b.offerPkr, savingsPkr, savingsPct: Math.round((savingsPkr / listPkr) * 100) };
}

/** The 12-week projection prompt passed to /api/generate-after. */
export const FUNNEL_AI_PROMPT =
  "Generate a photorealistic projection of this person's skin after 12 weeks of " +
  'consistent acne treatment with a niacinamide 10% + azelaic + salicylic 2% + ' +
  'vitamin C + retinol regimen. Show: cleared active breakouts, faded ' +
  'post-inflammatory hyperpigmentation, smoother texture, healthier barrier. ' +
  'Keep identity, ethnicity, age, hair, lighting, framing and pose IDENTICAL. ' +
  'Realistic clinical improvement only — no airbrushing.';

export interface OfferSavings {
  listPkr: number;
  offerPkr: number;
  savingsPkr: number;
  savingsPct: number;
}

export function computeOfferSavings(): OfferSavings {
  const listPkr = ACNE_GLOW.itemSkus.reduce(
    (sum, sku) => sum + PRODUCT_META[sku].listPricePkr,
    0,
  );
  const savingsPkr = listPkr - ACNE_GLOW.offerPkr;
  return {
    listPkr,
    offerPkr: ACNE_GLOW.offerPkr,
    savingsPkr,
    savingsPct: Math.round((savingsPkr / listPkr) * 100),
  };
}
