// lib/seo/pigmentation-faq.ts
/**
 * Pigmentation landing FAQ. Single source for BOTH the visible FAQ
 * (PigmentationLandingContent) and the FAQPage JSON-LD (pigmentation-jsonld).
 */
import type { FaqItem } from './faq';

export const PIGMENTATION_FAQ: FaqItem[] = [
  {
    q: 'How does the AI dark spot scan work?',
    a: 'Take a clear close-up photo of the area with dark spots or uneven tone. Our dermatologist-trained AI maps your pigmentation, sun damage and post-acne marks, then projects how your skin could look after a consistent 12-week routine. It takes a few seconds and is free — with no obligation to buy.',
  },
  {
    q: 'Is the Even Tone Protocol suitable for skin in Pakistan?',
    a: 'Yes. The protocol pairs vitamin C 15% with tranexamic acid 3%, kojic acid and arbutin, plus SPF 50+ — actives well suited to melanin-rich South Asian skin and the high UV exposure common across Pakistan. It ships nationwide with cash on delivery.',
  },
  {
    q: 'Will it help melasma and post-acne marks?',
    a: 'It is formulated for post-inflammatory hyperpigmentation (the brown marks left by acne and sun) and uneven tone, using vitamin C, tranexamic acid, kojic and arbutin to fade discolouration over 8 to 12 weeks. True hormonal melasma can be stubborn — for symmetric, deep melasma we recommend pairing the protocol with an in-person dermatologist consult.',
  },
  {
    q: 'How much does it cost and how do I pay?',
    a: 'The complete Even Tone Protocol is PKR 6,999, payable by cash on delivery anywhere in Pakistan (flat PKR 250 delivery). That is a saving of PKR 4,951 versus buying the four products separately.',
  },
  {
    q: 'How long until I see results?',
    a: 'In published studies the protocol’s actives show measurable change between 8 and 16 weeks — for example, tranexamic acid showed a ~60% mean reduction in melasma severity at 12 weeks (Lee et al., J Am Acad Dermatol 2016). Daily SPF is essential; results fade without it. Individual results vary.',
  },
  {
    q: 'Is the 12-week preview a guarantee?',
    a: 'No. The AI preview is an illustrative projection meant to show realistic clinical improvement — it is not a guarantee. Actual results depend on skin type, sun protection, consistency and other factors.',
  },
];

export const PIGMENTATION_RESULTS_DISCLAIMER =
  'Illustrative AI projection — individual results vary.';
