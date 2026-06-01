/**
 * Lightweight static catalog used by client-side cart, checkout, and
 * post-purchase upsell components — anywhere we need a SKU → display
 * data lookup without a DB round-trip.
 *
 * Mirrors the canonical price/name pairs in lib/db/seed.ts. The server
 * (/api/cart/preview, /api/create-order) remains authoritative on
 * totals; this map is only for rendering names, thumbs, and the
 * client-side upsell prompts.
 */

export interface ProductMeta {
  sku: string;
  name: string;
  shortName: string;
  pricePkr: number;
  /** Strikethrough comparison price — used to show savings on upsell rows. */
  listPricePkr: number;
  actives: string;
  /** Why a user might want to add this to an existing routine. */
  upsellHook: string;
  /** Local thumbnail path. */
  imagePath: string;
}

export const PRODUCT_META: Record<string, ProductMeta> = {
  prep: {
    sku: 'prep',
    name: 'Radiance Prep Cleanser',
    shortName: 'Prep Cleanser',
    pricePkr: 1799,
    listPricePkr: 2000,
    actives: 'PHA 4% · Aloe',
    upsellHook: 'Gentle daily cleanser that primes skin so actives absorb better.',
    imagePath: '/products/prep/hero.webp',
  },
  rescue: {
    sku: 'rescue',
    name: 'Clarifying Rescue Face Wash',
    shortName: 'Rescue Wash',
    pricePkr: 1799,
    listPricePkr: 2000,
    actives: 'Salicylic 2% · Zinc',
    upsellHook: 'Salicylic 2% wash — pairs with any acne routine for an extra clear.',
    imagePath: '/products/rescue/hero.webp',
  },
  vitc: {
    sku: 'vitc',
    name: 'Vitamin CE Ferrulic Serum',
    shortName: 'Vitamin C Serum',
    pricePkr: 2250,
    listPricePkr: 2950,
    actives: 'Vit C 15% · Vit E · Ferulic',
    upsellHook: 'Morning antioxidant — fades marks and adds glow under SPF.',
    imagePath: '/products/vitc/hero.webp',
  },
  acne: {
    sku: 'acne',
    name: 'Clarifying Acne Serum',
    shortName: 'Acne Serum',
    pricePkr: 2100,
    listPricePkr: 3000,
    actives: 'Niacinamide 10% · Azelaic 10%',
    upsellHook: 'Niacinamide + azelaic — fades active breakouts without harshness.',
    imagePath: '/products/acne/hero.webp',
  },
  ha: {
    sku: 'ha',
    name: 'Hyaluronic Acid Serum',
    shortName: 'Hyaluronic Serum',
    pricePkr: 2000,
    listPricePkr: 2500,
    actives: 'HA · Panthenol',
    upsellHook: 'Plump hydration — the easiest add-on for any dry-skin day.',
    imagePath: '/products/ha/hero.webp',
  },
  reti: {
    sku: 'reti',
    name: 'Retinol Serum',
    shortName: 'Retinol',
    pricePkr: 2000,
    listPricePkr: 2500,
    actives: 'Retinol 0.5%',
    upsellHook: 'Evening renewal — start at 2 nights a week, build up slowly.',
    imagePath: '/products/reti/hero.webp',
  },
  light: {
    sku: 'light',
    name: 'Radiance Lightening Cream',
    shortName: 'Lightening Cream',
    pricePkr: 2500,
    listPricePkr: 4500,
    actives: 'Tranexamic 3% · Kojic · Arbutin',
    upsellHook: 'Targeted spot treatment for stubborn dark patches.',
    imagePath: '/products/light/hero.webp',
  },
  spf: {
    sku: 'spf',
    name: 'Barrier Restore SPF 50+',
    shortName: 'SPF 50+',
    pricePkr: 1900,
    listPricePkr: 2500,
    actives: 'SPF 50+ PA++++ · Centella',
    upsellHook: 'Non-greasy SPF 50+ — the single most important product, every day.',
    imagePath: '/products/spf/hero.webp',
  },
};

export const BUNDLE_META: Record<string, { slug: string; name: string }> = {
  'clear-skin-protocol': { slug: 'clear-skin-protocol', name: 'The Clear Skin Protocol' },
  'even-tone-protocol': { slug: 'even-tone-protocol', name: 'The Even Tone Protocol' },
  'renewal-protocol': { slug: 'renewal-protocol', name: 'The Renewal Protocol' },
  'barrier-protocol': { slug: 'barrier-protocol', name: 'The Barrier Protocol' },
  'acne-glow-protocol': { slug: 'acne-glow-protocol', name: 'The Acne Glow Protocol' },
};

/** Highest-conversion upsell SKUs in priority order. SPF is universal, HA helps every routine. */
const UPSELL_PRIORITY: string[] = ['spf', 'ha', 'vitc', 'prep', 'rescue', 'reti', 'light', 'acne'];

/**
 * Returns up to `limit` upsell SKUs that are NOT already in the cart.
 * Used by cart, checkout, and thank-you to recommend the highest-value
 * cross-sell candidates without duplicating anything the customer
 * already has.
 */
export function suggestUpsells(
  skusInCart: string[],
  limit = 3,
): ProductMeta[] {
  const inCart = new Set(skusInCart);
  const out: ProductMeta[] = [];
  for (const sku of UPSELL_PRIORITY) {
    if (inCart.has(sku)) continue;
    const meta = PRODUCT_META[sku];
    if (!meta) continue;
    out.push(meta);
    if (out.length >= limit) break;
  }
  return out;
}

/** Returns the display name for a SKU or bundle slug. Falls back to the raw key. */
export function lookupName(key: string, type: 'product' | 'bundle'): string {
  if (type === 'bundle') return BUNDLE_META[key]?.name ?? key;
  return PRODUCT_META[key]?.name ?? key;
}
