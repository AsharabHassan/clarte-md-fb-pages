'use client';

import { useEffect, useState } from 'react';
import { QuizStep } from './QuizStep';
import { LeadStep } from './LeadStep';
import { OfferStep } from './OfferStep';
import { MatchedResult } from './MatchedResult';
import {
  QUIZ_QUESTIONS,
  beforeAfterForAcneType,
  personalizationSentence,
  type QuizAnswers,
} from '@/lib/funnel/quiz';
import { pushFunnelEvent, type FunnelEvent } from '@/lib/funnel/analytics';
import { DOCTOR_LINE } from '@/lib/funnel/evidence';
import { StarRating } from './StarRating';
import type { ReviewCard, CaseStudy } from '@/lib/reviews/types';
import './funnel.css';
import './quiz.css';

type Phase = 'intro' | 'quiz' | 'lead' | 'offer';
const STEP_EVENT: FunnelEvent[] = ['quiz_q1_complete', 'quiz_q2_complete', 'quiz_q3_complete', 'quiz_q4_complete'];

export function QuizFunnel({
  reviews,
  caseStudies,
  aggregate,
  onChooseScan,
}: {
  reviews: ReviewCard[];
  caseStudies: CaseStudy[];
  aggregate: { avg: number; count: number };
  /** Secondary CTA: route to the selfie scan funnel. */
  onChooseScan: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});

  function start() {
    pushFunnelEvent('quiz_start');
    setPhase('quiz');
  }

  function selectOption(value: string) {
    const q = QUIZ_QUESTIONS[stepIndex];
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    pushFunnelEvent(STEP_EVENT[stepIndex], { [q.id]: value });
    if (stepIndex < QUIZ_QUESTIONS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setPhase('lead');
    }
  }

  // ── Intro / landing ──────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <section className="funnel-scan quiz-intro">
        <h1 className="funnel-h1">See your skin clear in 12 weeks.</h1>
        <p className="funnel-sub">
          Answer 4 quick questions — no photo needed. Get your personalised acne
          protocol and see real 12-week results in under a minute.
        </p>
        <div className="funnel-trustline">
          <StarRating avg={aggregate.avg} count={aggregate.count} />
          <span className="funnel-doctor funnel-doctor--inline">{DOCTOR_LINE}</span>
        </div>
        <button type="button" className="funnel-cta" onClick={start}>
          Start my skin quiz →
        </button>
        <button type="button" className="quiz-secondary-link" onClick={onChooseScan}>
          Prefer an AI photo scan instead? Tap here
        </button>
      </section>
    );
  }

  // ── Quiz questions ───────────────────────────────────────────────
  if (phase === 'quiz') {
    const q = QUIZ_QUESTIONS[stepIndex];
    return (
      <QuizStep
        question={q}
        stepIndex={stepIndex}
        total={QUIZ_QUESTIONS.length}
        selected={answers[q.id]}
        onSelect={selectOption}
      />
    );
  }

  // ── Lead gate ────────────────────────────────────────────────────
  if (phase === 'lead') {
    return (
      <LeadStep
        eyebrow="Your protocol is ready"
        headline="Your protocol is ready."
        subhead="Enter your details and we'll show your match + send the full routine to your WhatsApp."
        cta="Show my result →"
        extra={{ q1: answers.q1, q2: answers.q2, q3: answers.q3, q4: answers.q4 }}
        onComplete={() => setPhase('offer')}
      />
    );
  }

  // ── Offer / result ───────────────────────────────────────────────
  const full = answers as QuizAnswers;
  const pair = beforeAfterForAcneType(full.q1);
  return (
    <QuizOffer
      pair={pair}
      caption={personalizationSentence(full)}
      reviews={reviews}
      caseStudies={caseStudies}
      aggregate={aggregate}
    />
  );
}

/** Wrapper so we can fire `result_viewed` exactly once on mount. */
function QuizOffer({
  pair,
  caption,
  reviews,
  caseStudies,
  aggregate,
}: {
  pair: ReturnType<typeof beforeAfterForAcneType>;
  caption: string;
  reviews: ReviewCard[];
  caseStudies: CaseStudy[];
  aggregate: { avg: number; count: number };
}) {
  useEffect(() => {
    pushFunnelEvent('result_viewed');
  }, []);
  return (
    <OfferStep
      hero={
        <MatchedResult
          pair={pair}
          headline="Your match: The Acne Glow Protocol"
          caption={caption}
        />
      }
      page="quiz-funnel"
      usedAiPreview={false}
      reviews={reviews}
      caseStudies={caseStudies}
      aggregate={aggregate}
    />
  );
}
