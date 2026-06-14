// lib/funnel/pigmentation-offer.ts
/**
 * Single source of truth for the pigmentation scan funnel offer.
 * Mirrors lib/funnel/offer.ts but for the Even Tone Protocol. Prices match
 * lib/db/seed.ts and the `bundles` table. The server (/api/create-order)
 * remains price-authoritative; these values render the offer block only.
 */
import type { FunnelBundle } from './offer';

/** Entry tier is the default/lead — cheapest hook for a price-sensitive market. */
export const PIGMENTATION_LEAD_SLUG = 'even-tone-essentials-protocol';

/**
 * The pigmentation funnel sells two protocols: the entry Radiance Prep Essential
 * (default) and the complete Even Tone Protocol. Both slugs exist in the DB
 * `bundles` table so checkout/ordering resolves their real prices.
 */
export const PIGMENTATION_BUNDLES: FunnelBundle[] = [
  {
    slug: 'even-tone-essentials-protocol',
    name: 'Radiance Prep Essential',
    itemSkus: ['prep'],
    offerPkr: 1799,
    tagline: 'Entry tier · the brightening cleanser',
    description:
      'Start brightening with the Radiance Prep Cleanser — glutathione + sodium ' +
      'lactate + citric acid gently clarify and even tone daily. The most ' +
      'affordable way to begin fading dark spots.',
    hero: '/protocols/even-tone-essentials-protocol/hero.webp',
    heroFit: 'cover',
  },
  {
    slug: 'even-tone-protocol',
    name: 'The Even Tone Protocol',
    itemSkus: ['prep', 'vitc', 'light', 'spf'],
    offerPkr: 6999,
    tagline: 'Best results · full 12-week routine',
    description:
      'Targets dark spots, uneven skin tone and post-acne marks — a PHA prep ' +
      'cleanser, vitamin C 15% antioxidant serum, a tranexamic 3% + kojic + ' +
      'arbutin lightening cream, and SPF 50+ to lock in results. Dermatologist-dosed.',
    hero: '/protocols/even-tone-protocol/hero.webp',
    heroFit: 'cover',
  },
];

/** The 12-week projection prompt passed by the client to /api/generate-after. */
export const PIGMENTATION_AI_PROMPT =
  "Generate a photorealistic projection of this person's skin after 12 weeks of " +
  'consistent pigmentation treatment with a vitamin C 15% + tranexamic acid 3% + ' +
  'kojic acid + arbutin + SPF 50+ regimen. Show: visibly faded dark spots and ' +
  'post-inflammatory hyperpigmentation, a more even skin tone, reduced ' +
  'discolouration and a brighter complexion. Keep identity, ethnicity, age, hair, ' +
  'lighting, framing and pose IDENTICAL. Realistic clinical improvement only — no ' +
  'airbrushing, no skin-lightening beyond what these actives would achieve.';
