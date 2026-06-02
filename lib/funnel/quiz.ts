/**
 * No-photo acne quiz: questions, answer→content mapping, and the
 * constant product recommendation. Pure module — no React, no server
 * imports — so it is unit-testable under the node Vitest env and safe to
 * import from both client components and tests.
 *
 * Product is CONSTANT (The Acne Glow Protocol). Q1 selects WHICH real
 * before/after pair to show and seeds the personalization copy; Q2–Q4
 * only feed personalization + the lead payload.
 */
import { ACNE_GLOW } from './offer';

export const ACNE_TYPES = ['blackheads', 'breakouts', 'cystic', 'marks', 'mix'] as const;
export type AcneType = (typeof ACNE_TYPES)[number];

export interface QuizOption {
  value: string;
  label: string;
  /** Optional sub-label shown under the option. */
  hint?: string;
}

export interface QuizQuestion {
  id: 'q1' | 'q2' | 'q3' | 'q4';
  prompt: string;
  options: QuizOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    prompt: 'What does your acne mostly look like?',
    options: [
      { value: 'blackheads', label: 'Whiteheads & blackheads', hint: 'Clogged pores, small bumps' },
      { value: 'breakouts', label: 'Red pimples / active breakouts' },
      { value: 'cystic', label: 'Deep, painful cysts under the skin' },
      { value: 'marks', label: 'Mostly dark marks & scars left behind' },
      { value: 'mix', label: 'A mix of these' },
    ],
  },
  {
    id: 'q2',
    prompt: 'Where do you break out most?',
    options: [
      { value: 'forehead', label: 'Forehead' },
      { value: 'cheeks', label: 'Cheeks' },
      { value: 'jawline', label: 'Jawline & neck' },
      { value: 'chin', label: 'Chin / around the mouth' },
      { value: 'all-over', label: 'All over' },
    ],
  },
  {
    id: 'q3',
    prompt: 'How does your skin usually feel?',
    options: [
      { value: 'oily', label: 'Oily / shiny by midday' },
      { value: 'dry', label: 'Dry or tight' },
      { value: 'combination', label: 'Combination (oily T-zone, dry cheeks)' },
      { value: 'sensitive', label: 'Sensitive / reacts easily' },
    ],
  },
  {
    id: 'q4',
    prompt: 'How long have you been dealing with this?',
    options: [
      { value: 'weeks', label: 'Just started (a few weeks)' },
      { value: 'months', label: 'A few months' },
      { value: 'over-a-year', label: 'Over a year' },
      { value: 'years', label: 'Years — tried many things' },
    ],
  },
];

export interface QuizAnswers {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
}

export interface BeforeAfterPair {
  beforeUrl: string;
  afterUrl: string;
  alt: string;
}

// Real customer pairs hosted on the main site (host whitelisted in
// next.config.ts). Filenames are placeholders to be replaced with the
// actual uploaded pairs. Cystic intentionally has NO pair — it falls back
// to `breakouts` via effectiveAcneType() rather than faking a cystic result.
const BASE = 'https://clartemd.com.pk/protocols/acne-glow-protocol/visual-studies';
export const BEFORE_AFTER: Record<Exclude<AcneType, 'cystic'>, BeforeAfterPair> = {
  blackheads: {
    beforeUrl: `${BASE}/case-blackheads-before.webp`,
    afterUrl: `${BASE}/case-blackheads-after.webp`,
    alt: 'Clogged pores cleared after 12 weeks',
  },
  breakouts: {
    beforeUrl: `${BASE}/case-breakouts-before.webp`,
    afterUrl: `${BASE}/case-breakouts-after.webp`,
    alt: 'Active breakouts calmed after 12 weeks',
  },
  marks: {
    beforeUrl: `${BASE}/case-marks-before.webp`,
    afterUrl: `${BASE}/case-marks-after.webp`,
    alt: 'Post-acne dark marks faded after 12 weeks',
  },
  mix: {
    beforeUrl: `${BASE}/case-mix-before.webp`,
    afterUrl: `${BASE}/case-mix-after.webp`,
    alt: 'Overall skin transformation after 12 weeks',
  },
};

/** Cystic has no honest pair of its own → show the closest real case. */
export function effectiveAcneType(q1: string): Exclude<AcneType, 'cystic'> {
  if (q1 === 'cystic') return 'breakouts';
  if (q1 === 'blackheads' || q1 === 'breakouts' || q1 === 'marks' || q1 === 'mix') return q1;
  return 'mix'; // safe default for any unexpected value
}

export function beforeAfterForAcneType(q1: string): BeforeAfterPair {
  return BEFORE_AFTER[effectiveAcneType(q1)];
}

/** Product recommendation is constant: the hero protocol. */
export function recommendProtocol(): typeof ACNE_GLOW {
  return ACNE_GLOW;
}

const ACNE_PHRASE: Record<string, string> = {
  blackheads: 'blackheads & congestion',
  breakouts: 'active breakouts',
  cystic: 'deeper, painful breakouts',
  marks: 'post-acne marks',
  mix: 'a mix of breakouts and marks',
};
const LOCATION_PHRASE: Record<string, string> = {
  forehead: 'forehead',
  cheeks: 'cheeks',
  jawline: 'jawline',
  chin: 'chin',
  'all-over': 'whole face',
};
const SKIN_PHRASE: Record<string, string> = {
  oily: 'oily',
  dry: 'dry',
  combination: 'combination',
  sensitive: 'sensitive',
};

export function personalizationSentence(a: QuizAnswers): string {
  const acne = ACNE_PHRASE[a.q1] ?? 'acne';
  const loc = LOCATION_PHRASE[a.q2] ?? 'skin';
  const skin = SKIN_PHRASE[a.q3] ?? 'your';
  return `Based on your answers — ${acne} on your ${loc}, ${skin} skin — here's the routine that's worked for customers like you.`;
}
