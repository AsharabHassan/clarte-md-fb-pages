// lib/funnel/concern-config.ts
/**
 * Per-concern configuration for the shared scan funnel. One object carries
 * everything that differs between concerns (bundles, SKUs, AI prompt, hero
 * art, and the headline/sub copy) so the funnel components stay generic.
 * Acne is the default — existing callers that pass no concern are unchanged.
 */
import type { FunnelBundle } from './offer';
import { FUNNEL_BUNDLES, LEAD_BUNDLE_SLUG, FUNNEL_AI_PROMPT, ACNE_GLOW } from './offer';
import { PIGMENTATION_BUNDLES, PIGMENTATION_LEAD_SLUG, PIGMENTATION_AI_PROMPT } from './pigmentation-offer';
import { BUNDLE_SKUS, ADDON_SKUS } from './shop';

export interface ConcernConfig {
  /** Value written to the `concern` field on all API calls. */
  concern: string;
  /** Protocol cards shown in the offer step (display subset). */
  bundles: FunnelBundle[];
  /** Pre-selected protocol slug on load. */
  leadSlug: string;
  /** Product SKUs shown in the "Add individual products" grid. */
  bundleSkus: readonly string[];
  /** Product SKUs shown in the "Popular add-ons" grid. */
  addonSkus: readonly string[];
  /** Before/after prompt passed to /api/generate-after. */
  aiPrompt: string;
  /** bundle_slug sent to /api/generate-after (biases the skin map). */
  baBundleSlug: string;
  /** Scan-step hero image (remote or /public path). */
  protocolHero: string;
  /** Alt text for the scan-step hero. */
  protocolHeroAlt: string;
  copy: {
    scanHeadline: string;
    scanSub: string;
    /** Step-1 label in the "How it works" list (steps 2-3 are identical). */
    step1Label: string;
    /** Direct-buy hero subline; receives the lead offer price. */
    directBuySub: (offerPkr: number) => string;
  };
}

const ACNE_CONFIG: ConcernConfig = {
  concern: 'acne',
  bundles: FUNNEL_BUNDLES,
  leadSlug: LEAD_BUNDLE_SLUG,
  bundleSkus: BUNDLE_SKUS,
  addonSkus: ADDON_SKUS,
  aiPrompt: FUNNEL_AI_PROMPT,
  baBundleSlug: ACNE_GLOW.slug,
  protocolHero: '/protocols/acne-glow-protocol/hero.webp',
  protocolHeroAlt: 'The Acne Glow Protocol',
  copy: {
    scanHeadline: 'See your skin in 12 weeks.',
    scanSub:
      'Take a clear close-up of the area that bothers you most. Our dermatologist-trained ' +
      'AI maps your acne and projects your skin after the 12-week protocol — free, in seconds.',
    step1Label: 'Take a photo of the area that bothers you',
    directBuySub: (offerPkr) =>
      `Start clearing acne from just PKR ${offerPkr.toLocaleString()} — ` +
      'niacinamide 10% + azelaic acid, cash on delivery across Pakistan.',
  },
};

const PIGMENTATION_CONFIG: ConcernConfig = {
  concern: 'pigmentation',
  bundles: PIGMENTATION_BUNDLES,
  leadSlug: PIGMENTATION_LEAD_SLUG,
  bundleSkus: ['prep', 'vitc', 'light', 'spf'],
  addonSkus: ['rescue', 'acne', 'ha', 'reti'],
  aiPrompt: PIGMENTATION_AI_PROMPT,
  baBundleSlug: 'even-tone-protocol',
  protocolHero: 'https://clartemd.com.pk/protocols/even-tone-protocol/hero.webp',
  protocolHeroAlt: 'The Even Tone Protocol',
  copy: {
    scanHeadline: 'See your skin in 12 weeks.',
    scanSub:
      'Take a clear close-up of the area with dark spots or uneven tone. Our dermatologist-trained ' +
      'AI maps your pigmentation and projects your skin after the 12-week protocol — free, in seconds.',
    step1Label: 'Take a photo of your dark spots or uneven tone',
    directBuySub: (offerPkr) =>
      `Start fading dark spots from just PKR ${offerPkr.toLocaleString()} — ` +
      'vitamin C 15% + tranexamic acid, cash on delivery across Pakistan.',
  },
};

export function getConcernConfig(concern = 'acne'): ConcernConfig {
  return concern === 'pigmentation' ? PIGMENTATION_CONFIG : ACNE_CONFIG;
}
