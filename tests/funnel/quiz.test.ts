import { describe, it, expect } from 'vitest';
import {
  QUIZ_QUESTIONS,
  ACNE_TYPES,
  effectiveAcneType,
  beforeAfterForAcneType,
  recommendProtocol,
  personalizationSentence,
  type QuizAnswers,
} from '@/lib/funnel/quiz';
import { ACNE_GLOW } from '@/lib/funnel/offer';

describe('quiz config', () => {
  it('has exactly 4 questions with ids q1..q4, each with options', () => {
    expect(QUIZ_QUESTIONS.map((q) => q.id)).toEqual(['q1', 'q2', 'q3', 'q4']);
    for (const q of QUIZ_QUESTIONS) {
      expect(q.prompt.length).toBeGreaterThan(0);
      expect(q.options.length).toBeGreaterThanOrEqual(4);
      for (const o of q.options) {
        expect(o.value.length).toBeGreaterThan(0);
        expect(o.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('q1 option values are exactly the acne types', () => {
    const q1 = QUIZ_QUESTIONS.find((q) => q.id === 'q1')!;
    expect(q1.options.map((o) => o.value).sort()).toEqual([...ACNE_TYPES].sort());
  });
});

describe('recommendation', () => {
  it('always recommends the Acne Glow Protocol (constant product)', () => {
    expect(recommendProtocol().slug).toBe(ACNE_GLOW.slug);
  });
});

describe('before/after matching', () => {
  it('maps cystic to the active-breakouts pair (no faked cystic pair)', () => {
    expect(effectiveAcneType('cystic')).toBe('breakouts');
    expect(beforeAfterForAcneType('cystic')).toEqual(beforeAfterForAcneType('breakouts'));
  });

  it('every acne type resolves to a pair with non-empty before+after urls', () => {
    for (const t of ACNE_TYPES) {
      const pair = beforeAfterForAcneType(t);
      expect(pair.beforeUrl).toMatch(/^https?:\/\//);
      expect(pair.afterUrl).toMatch(/^https?:\/\//);
      expect(pair.alt.length).toBeGreaterThan(0);
    }
  });
});

describe('personalization sentence', () => {
  it('weaves the chosen acne type, location, and skin type into one sentence', () => {
    const answers: QuizAnswers = { q1: 'marks', q2: 'cheeks', q3: 'oily', q4: 'months' };
    const s = personalizationSentence(answers);
    expect(s).toContain('marks');
    expect(s).toContain('cheeks');
    expect(s).toContain('oily');
    expect(s.endsWith('.')).toBe(true);
  });
});
