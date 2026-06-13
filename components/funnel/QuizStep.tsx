'use client';

import { Check } from 'lucide-react';
import type { QuizQuestion } from '@/lib/funnel/quiz';

/**
 * A single quiz question. One option per tap immediately advances (no
 * separate "Next" button — fewer taps on mobile). Shows a "Step X of N"
 * progress bar. Selecting an option calls onSelect(value).
 */
export function QuizStep({
  question,
  stepIndex,
  total,
  selected,
  onSelect,
}: {
  question: QuizQuestion;
  stepIndex: number; // 0-based
  total: number;
  selected?: string;
  onSelect: (value: string) => void;
}) {
  const pct = Math.round(((stepIndex) / total) * 100);
  return (
    <section className="funnel-scan quiz-step">
      <div className="quiz-progress" aria-label={`Step ${stepIndex + 1} of ${total}`}>
        <span className="quiz-progress-label">Step {stepIndex + 1} of {total}</span>
        <div className="quiz-progress-bar"><span style={{ width: `${pct}%` }} /></div>
      </div>

      <h1 className="funnel-h1 quiz-prompt">{question.prompt}</h1>

      <div className="quiz-options" role="radiogroup" aria-label={question.prompt}>
        {question.options.map((o) => {
          const isSel = selected === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={isSel}
              className={`quiz-option ${isSel ? 'is-selected' : ''}`}
              onClick={() => onSelect(o.value)}
            >
              <span className="quiz-option-text">
                <span className="quiz-option-label">{o.label}</span>
                {o.hint && <span className="quiz-option-hint">{o.hint}</span>}
              </span>
              <span className="quiz-option-tick">{isSel && <Check className="h-4 w-4" />}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
