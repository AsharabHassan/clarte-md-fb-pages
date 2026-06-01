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
