// lib/seo/faq.ts
/**
 * Landing-page FAQ copy. Single source for BOTH the visible FAQ section
 * (AcneLandingContent) and the FAQPage JSON-LD (lib/seo/jsonld.ts) so the
 * two never diverge. Facts mirror lib/funnel/offer.ts + lib/funnel/evidence.ts.
 */
export interface FaqItem {
  q: string;
  a: string;
}

export const ACNE_FAQ: FaqItem[] = [
  {
    q: 'How does the AI acne scan work?',
    a: 'Take a clear close-up photo of the area that bothers you most. Our dermatologist-trained AI maps your active breakouts, post-acne marks and skin texture, then projects how your skin could look after a consistent 12-week routine. It takes a few seconds and is free — with no obligation to buy.',
  },
  {
    q: 'Is the Acne Glow Protocol suitable for skin in Pakistan?',
    a: 'Yes. The protocol pairs a salicylic acid 2% wash with niacinamide 10% and azelaic acid serums, plus vitamin C and retinol — actives well suited to the humid, oily-skin conditions common across Pakistan. It ships nationwide with cash on delivery.',
  },
  {
    q: 'Will it help acne scars and dark spots?',
    a: 'The protocol targets post-inflammatory hyperpigmentation — the brown and red marks acne leaves behind — with niacinamide, azelaic acid and vitamin C, which help fade marks and even out skin tone over 8 to 12 weeks of consistent use.',
  },
  {
    q: 'How much does it cost and how do I pay?',
    a: 'You can start with the Clarifying Acne Serum for just PKR 1,999, payable by cash on delivery anywhere in Pakistan (flat PKR 250 delivery). Prefer a fuller routine? The 2-step Acne Essentials Duo is PKR 3,499 and the complete Acne Glow Protocol is PKR 6,499.',
  },
  {
    q: 'How long until I see results?',
    a: 'In published studies the protocol’s actives show measurable change between 8 and 12 weeks — for example, azelaic acid showed a 70% mean reduction in comedones at 12 weeks (Webster, J Am Acad Dermatol 2000). Individual results vary.',
  },
  {
    q: 'Is the 12-week preview a guarantee?',
    a: 'No. The AI preview is an illustrative projection meant to show realistic clinical improvement — it is not a guarantee. Actual results depend on skin type, consistency and other factors.',
  },
];

/** Shown near before/after imagery + AI projections for ad-policy safety. */
export const RESULTS_DISCLAIMER =
  'Illustrative AI projection — individual results vary.';
