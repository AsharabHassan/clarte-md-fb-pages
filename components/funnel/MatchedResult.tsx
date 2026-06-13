'use client';

import Image from 'next/image';
import type { BeforeAfterPair } from '@/lib/funnel/quiz';

/**
 * Quiz offer hero: a REAL matched before/after pair (selected by the Q1
 * answer) plus the personalization sentence. Replaces the selfie funnel's
 * AI-composited <Collage> — the quiz never has a user photo.
 */
export function MatchedResult({
  pair,
  headline,
  caption,
}: {
  pair: BeforeAfterPair;
  headline: string;
  caption: string;
}) {
  return (
    <section className="quiz-result-hero">
      <h1 className="funnel-h1">{headline}</h1>
      <p className="funnel-sub quiz-result-caption">{caption}</p>
      <div className="quiz-ba">
        <figure className="quiz-ba-fig">
          <Image src={pair.beforeUrl} alt={`Before — ${pair.alt}`} fill sizes="(max-width:560px) 50vw, 270px" style={{ objectFit: 'cover' }} />
          <figcaption>Before</figcaption>
        </figure>
        <figure className="quiz-ba-fig">
          <Image src={pair.afterUrl} alt={`Week 12 — ${pair.alt}`} fill sizes="(max-width:560px) 50vw, 270px" style={{ objectFit: 'cover' }} />
          <figcaption>Week 12</figcaption>
        </figure>
      </div>
      <p className="quiz-ba-note">✨ Real customers · individual results vary.</p>
    </section>
  );
}
