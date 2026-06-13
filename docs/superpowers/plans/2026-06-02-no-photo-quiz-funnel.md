# No-Photo Acne Quiz Funnel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a no-photo, 4-question self-select quiz as the default funnel at `/`, reaching the same offer/result page as the selfie flow, with the existing selfie funnel preserved at `/scan`.

**Architecture:** Mirror the existing `ScanFunnel` client state-machine pattern with a new `QuizFunnel` (Quiz Q1–Q4 → LeadStep → OfferStep). Reuse the already-built `LeadStep`, `OfferStep`, lead API, cart, analytics, and Meta plumbing — generalising two of them (`LeadStep`, `OfferStep`) so both funnels share them. The quiz shows a **real** matched before/after pair (selected by Q1) instead of the selfie flow's AI-composited canvas.

**Tech Stack:** Next.js 15 (App Router, React 19, client components), TypeScript, Zod, Vitest (node env, pure-logic tests only), GTM dataLayer + Meta Pixel/CAPI.

**Decisions locked (from strategy session):**
- Quiz at `/`, selfie funnel moves to `/scan` (currently a redirect stub). Both stay live for A/B comparison.
- Product recommendation is **constant** (The Acne Glow Protocol). Q1 only selects the matched before/after + personalization wording.
- Before/after pairs sourced from a **static config** referencing real customer images hosted on `clartemd.com.pk` (already whitelisted in `next.config.ts`).

**Testing note (honest scope):** The Vitest config is `environment: 'node'` and only globs `tests/funnel/**/*.test.ts`; there is no React component test harness in this repo (none of `ScanFunnel`/`OfferStep`/`LeadStep` have tests). Therefore TDD applies to the **pure logic** module (`lib/funnel/quiz.ts`) and validator/analytics changes. Component tasks are verified with `npx tsc --noEmit`, `npm run build`, and a scripted manual dev-server checklist — matching the existing codebase idiom.

---

## File Structure

**Create:**
- `lib/funnel/quiz.ts` — quiz questions, acne-type → before/after map, constant recommendation, personalization sentence. Pure, no React, no server imports.
- `tests/funnel/quiz.test.ts` — Vitest unit tests for the above.
- `components/funnel/QuizStep.tsx` — one single-select question screen with progress bar.
- `components/funnel/QuizFunnel.tsx` — Quiz → Lead → Offer state machine + landing intro.
- `components/funnel/MatchedResult.tsx` — renders the real matched before/after pair (quiz offer hero).
- `components/funnel/quiz.css` — quiz-specific styles (imported by `QuizFunnel`).

**Modify:**
- `lib/funnel/analytics.ts` — extend `FunnelEvent` union with quiz events.
- `lib/funnel/meta.ts` — add `trackMetaLead(eventId)`.
- `lib/validators/lead.ts` — add `meta_event_id` + optional quiz answer fields.
- `app/api/lead/route.ts` — forward Meta `Lead` dedup block + quiz answers to the webhook.
- `components/funnel/LeadStep.tsx` — generalise: copy props, `extra` payload, `onComplete(lead)`, fire Meta `Lead`.
- `components/funnel/OfferStep.tsx` — replace selfie-specific `scan` prop with a `hero` slot + `page`/`usedAiPreview`/`aiSessionId` props.
- `components/funnel/ScanFunnel.tsx` — update `LeadStep`/`OfferStep` callers to the new signatures.
- `app/page.tsx` — render `QuizFunnel` instead of `ScanFunnel`.
- `app/scan/page.tsx` — render `ScanFunnel` instead of `redirect('/')`.

---

## Task 1: Quiz config + recommendation logic (TDD)

**Files:**
- Create: `lib/funnel/quiz.ts`
- Test: `tests/funnel/quiz.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/funnel/quiz.test.ts`:

```ts
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
    expect(s).toContain('marks');     // acne-type phrase
    expect(s).toContain('cheeks');    // location phrase
    expect(s).toContain('oily');      // skin-type phrase
    expect(s.endsWith('.')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- quiz`
Expected: FAIL — `Cannot find module '@/lib/funnel/quiz'` (or its exports are undefined).

- [ ] **Step 3: Write the implementation**

Create `lib/funnel/quiz.ts`:

```ts
/**
 * No-photo acne quiz: questions, answer→content mapping, and the
 * constant product recommendation. Pure module — no React, no server
 * imports — so it is unit-testable under the node Vitest env and safe to
 * import from both client components and tests. See the matching strategy
 * doc in docs/superpowers/plans/.
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
// next.config.ts). REPLACE these filenames with the actual uploaded pairs
// (see Task 10). Cystic intentionally has NO pair — it falls back to
// `breakouts` via effectiveAcneType() rather than faking a cystic result.
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- quiz`
Expected: PASS (all 6 tests green). Then run the full suite to confirm no regressions:
Run: `npm run test`
Expected: PASS (existing collage/countdown/offer tests still green).

- [ ] **Step 5: Commit**

```bash
git add lib/funnel/quiz.ts tests/funnel/quiz.test.ts
git commit -m "feat(quiz): quiz config, before/after matching, constant recommendation"
```

---

## Task 2: Extend the analytics event union

**Files:**
- Modify: `lib/funnel/analytics.ts:7-13`

- [ ] **Step 1: Add the quiz events to the union**

In `lib/funnel/analytics.ts`, replace the `FunnelEvent` type:

```ts
export type FunnelEvent =
  | 'scan_started'
  | 'analysis_complete'
  | 'lead_captured'
  | 'offer_viewed'
  | 'add_shipping'
  | 'order_placed'
  // quiz funnel — per-step drop-off instrumentation
  | 'quiz_start'
  | 'quiz_q1_complete'
  | 'quiz_q2_complete'
  | 'quiz_q3_complete'
  | 'quiz_q4_complete'
  | 'result_viewed'
  | 'cod_checkout_clicked';
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no errors — this only widens a union).

- [ ] **Step 3: Commit**

```bash
git add lib/funnel/analytics.ts
git commit -m "feat(analytics): add quiz funnel events to FunnelEvent union"
```

---

## Task 3: Meta `Lead` event + CAPI dedup wiring

**Files:**
- Modify: `lib/funnel/meta.ts` (append helper)
- Modify: `lib/validators/lead.ts`
- Modify: `app/api/lead/route.ts`

- [ ] **Step 1: Add `trackMetaLead` to `lib/funnel/meta.ts`**

Append to `lib/funnel/meta.ts` (after `trackMetaPurchase`):

```ts
/**
 * Fire a browser Pixel `Lead` with an explicit eventID so it dedupes
 * against the server-side CAPI `Lead` carrying the same id (forwarded by
 * the lead webhook). No-op if the Pixel hasn't loaded or on the server.
 */
export function trackMetaLead(eventId: string): void {
  if (typeof window === 'undefined') return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (typeof fbq !== 'function') return;
  fbq('track', 'Lead', {}, { eventID: eventId });
}
```

- [ ] **Step 2: Extend the lead validator**

In `lib/validators/lead.ts`, replace the schema body:

```ts
import { z } from 'zod';

export const LeadSchema = z.object({
  name: z.string().min(1).max(128),
  email: z.string().email().max(128),
  phone: z.string().min(7).max(32),
  concern: z.string().min(1).max(64),
  ai_session_id: z.string().uuid().optional(),
  source_url: z.string().max(512).optional(),
  /** Pixel eventID from the browser for Meta CAPI Lead dedup. */
  meta_event_id: z.string().uuid().optional(),
  /** Quiz answers (quiz funnel only) — forwarded to the webhook for segmentation. */
  q1: z.string().max(64).optional(),
  q2: z.string().max(64).optional(),
  q3: z.string().max(64).optional(),
  q4: z.string().max(64).optional(),
});

export type LeadInput = z.infer<typeof LeadSchema>;
```

- [ ] **Step 3: Forward the Meta block + quiz answers in the lead webhook**

In `app/api/lead/route.ts`, replace the imports and the `dispatchWebhook` call. New file body:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { LeadSchema } from '@/lib/validators/lead';
import { dispatchWebhook } from '@/lib/webhooks/dispatcher';
import { FB_PIXEL_ID } from '@/lib/funnel/meta';

/**
 * POST /api/lead — captures the name/email/phone gate shown before results,
 * fires the `lead.captured` webhook server-side (URL kept off the client),
 * and carries a Meta `Lead` dedup block + any quiz answers for the CRM.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
  const lead = parsed.data;

  const hasQuiz = Boolean(lead.q1 || lead.q2 || lead.q3 || lead.q4);

  await dispatchWebhook(
    process.env.WEBHOOK_LEAD_CAPTURED,
    {
      event: 'lead.captured',
      timestamp: new Date().toISOString(),
      meta: {
        pixel_id: FB_PIXEL_ID,
        event_id: lead.meta_event_id ?? null,
        event_name: 'Lead',
      },
      lead: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        surface: hasQuiz ? 'quiz-funnel' : 'scan-funnel',
        scan_title: hasQuiz ? 'No-Photo Acne Quiz' : 'AI Skin Analysis',
        concern: lead.concern,
        ai_session_id: lead.ai_session_id ?? null,
        source_url: lead.source_url ?? null,
        ...(hasQuiz
          ? { quiz: { q1: lead.q1 ?? null, q2: lead.q2 ?? null, q3: lead.q3 ?? null, q4: lead.q4 ?? null } }
          : {}),
      },
    },
    'lead.captured',
  );

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/funnel/meta.ts lib/validators/lead.ts app/api/lead/route.ts
git commit -m "feat(meta): Lead pixel event + CAPI dedup block in lead webhook"
```

---

## Task 4: Generalise `LeadStep` for both funnels

**Files:**
- Modify: `components/funnel/LeadStep.tsx` (full rewrite)

- [ ] **Step 1: Rewrite `LeadStep` to be funnel-agnostic**

Replace the entire contents of `components/funnel/LeadStep.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Loader2, Lock, Sparkles } from 'lucide-react';
import { saveLead, type LeadContact } from '@/lib/funnel/lead-storage';
import { pushFunnelEvent } from '@/lib/funnel/analytics';
import { trackMetaLead } from '@/lib/funnel/meta';

/**
 * Lead-capture gate shown before results are revealed. Funnel-agnostic:
 *  - selfie funnel passes `aiSessionId` and the analysis copy;
 *  - quiz funnel passes `extra` (quiz answers) and the quiz copy.
 * On submit it persists the contact for checkout prefill, fires the GTM
 * `lead_captured` event AND the Meta `Lead` pixel event (deduped against
 * the server CAPI event via a shared event id), posts to /api/lead, then
 * reveals the results. Best-effort: a webhook failure never traps the user.
 */
export function LeadStep({
  onComplete,
  aiSessionId,
  extra,
  eyebrow = 'Analysis complete',
  headline = 'Your results are ready.',
  subhead = 'Enter your details to unlock your personalised 12-week skin projection and protocol.',
  cta = 'Reveal my results →',
}: {
  onComplete: (lead: LeadContact) => void;
  aiSessionId?: string;
  /** Extra fields merged into the /api/lead body (e.g. quiz answers). */
  extra?: Record<string, unknown>;
  eyebrow?: string;
  headline?: string;
  subhead?: string;
  cta?: string;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function submit(form: HTMLFormElement) {
    setSubmitting(true);
    const fd = new FormData(form);
    const lead: LeadContact = {
      name: String(fd.get('name') ?? '').trim(),
      email: String(fd.get('email') ?? '').trim(),
      phone: String(fd.get('phone') ?? '').trim(),
    };

    // Persist for checkout prefill (this session only).
    saveLead(lead);

    // One event id shared by the browser Pixel Lead + the lead webhook
    // (→ Meta CAPI) so Meta deduplicates the two.
    const metaEventId = crypto.randomUUID();
    pushFunnelEvent('lead_captured');
    trackMetaLead(metaEventId);

    // Fire the lead webhook (best-effort; never trap the user on the gate).
    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...lead,
          concern: 'acne',
          meta_event_id: metaEventId,
          ...(aiSessionId ? { ai_session_id: aiSessionId } : {}),
          ...(extra ?? {}),
          source_url: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      });
    } catch {
      /* non-fatal — still reveal the results */
    }

    onComplete(lead);
  }

  return (
    <section className="funnel-scan funnel-lead">
      <span className="funnel-lead-eyebrow">
        <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
      </span>
      <h1 className="funnel-h1">{headline}</h1>
      <p className="funnel-sub">{subhead}</p>

      <form
        className="funnel-form funnel-lead-form"
        onSubmit={(e) => { e.preventDefault(); submit(e.currentTarget); }}
      >
        <input name="name" required placeholder="Full name" autoComplete="name" />
        <input name="email" type="email" required placeholder="Email" autoComplete="email" />
        <input
          name="phone"
          required
          pattern="[0-9+\-\s()]{7,32}"
          inputMode="tel"
          placeholder="03XX XXXXXXX"
          autoComplete="tel"
        />
        <button type="submit" className="funnel-cta" disabled={submitting}>
          {submitting
            ? <><Loader2 className="h-5 w-5 animate-spin" /> Revealing…</>
            : cta}
        </button>
        <p className="funnel-lead-privacy">
          <Lock className="h-3 w-3" /> We only use this to send your results and order updates.
        </p>
      </form>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck (expect ONE known error to be fixed in Task 6)**

Run: `npx tsc --noEmit`
Expected: FAIL with one error in `components/funnel/ScanFunnel.tsx` — `LeadStep` no longer accepts a `scan` prop. This is expected and fixed in Task 6 (ScanFunnel update). Do not fix it here.

- [ ] **Step 3: Commit**

```bash
git add components/funnel/LeadStep.tsx
git commit -m "refactor(funnel): make LeadStep funnel-agnostic + fire Meta Lead"
```

---

## Task 5: Refactor `OfferStep` to a shared offer body with a hero slot

**Files:**
- Modify: `components/funnel/OfferStep.tsx`

- [ ] **Step 1: Change the props (remove `scan`, add `hero`/`page`/`usedAiPreview`/`aiSessionId`)**

In `components/funnel/OfferStep.tsx`:

Remove this import line:
```tsx
import type { ScanResult } from './ScanStep';
```

Replace the component signature (the `export function OfferStep({ ... })` block) with:

```tsx
export function OfferStep({
  hero,
  page,
  usedAiPreview,
  aiSessionId,
  reviews,
  caseStudies,
  aggregate,
}: {
  /** The before/after visual at the top of the offer (Collage or MatchedResult). */
  hero: React.ReactNode;
  /** sourcePage recorded on the order ('scan-funnel' | 'quiz-funnel'). */
  page: string;
  usedAiPreview: boolean;
  aiSessionId?: string;
  reviews: ReviewCard[];
  caseStudies: CaseStudy[];
  aggregate: { avg: number; count: number };
}) {
```

- [ ] **Step 2: Use the new props inside the body**

In the same file:

Replace the order POST `page` field:
```tsx
          page: 'scan-funnel',
```
with:
```tsx
          page,
```

Replace the `used_ai_preview` field:
```tsx
          used_ai_preview: Boolean(scan.afterUrl),
```
with:
```tsx
          used_ai_preview: usedAiPreview,
```

Replace the ai_session_id spread:
```tsx
          ...(scan.aiSessionId ? { ai_session_id: scan.aiSessionId } : {}),
```
with:
```tsx
          ...(aiSessionId ? { ai_session_id: aiSessionId } : {}),
```

Replace the Collage render line:
```tsx
      <Collage beforeUrl={scan.beforeUrl} afterUrl={scan.afterUrl} source={scan.source} />
```
with:
```tsx
      {hero}
```

Remove the now-unused Collage import line:
```tsx
import { Collage } from './Collage';
```

- [ ] **Step 3: Typecheck (expect the ScanFunnel error from Task 4 to persist)**

Run: `npx tsc --noEmit`
Expected: FAIL only in `components/funnel/ScanFunnel.tsx` (both `LeadStep` and `OfferStep` callers now mismatch). Fixed in Task 6.

- [ ] **Step 4: Commit**

```bash
git add components/funnel/OfferStep.tsx
git commit -m "refactor(funnel): OfferStep takes a hero slot + page/usedAiPreview props"
```

---

## Task 6: Update `ScanFunnel` to the new LeadStep/OfferStep signatures

**Files:**
- Modify: `components/funnel/ScanFunnel.tsx`

- [ ] **Step 1: Pass the Collage hero + selfie props**

Replace the entire contents of `components/funnel/ScanFunnel.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { ScanStep, type ScanResult } from './ScanStep';
import { LeadStep } from './LeadStep';
import { OfferStep } from './OfferStep';
import { Collage } from './Collage';
import type { ReviewCard, CaseStudy } from '@/lib/reviews/types';
import './funnel.css';

export function ScanFunnel({
  reviews,
  caseStudies,
  aggregate,
}: {
  reviews: ReviewCard[];
  caseStudies: CaseStudy[];
  aggregate: { avg: number; count: number };
}) {
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [leadDone, setLeadDone] = useState(false);

  // Scan → Lead (gate) → Offer (results).
  if (!scan) {
    return <ScanStep onComplete={setScan} reviews={reviews} caseStudies={caseStudies} aggregate={aggregate} />;
  }
  if (!leadDone) {
    return <LeadStep aiSessionId={scan.aiSessionId} onComplete={() => setLeadDone(true)} />;
  }
  return (
    <OfferStep
      hero={<Collage beforeUrl={scan.beforeUrl} afterUrl={scan.afterUrl} source={scan.source} />}
      page="scan-funnel"
      usedAiPreview={Boolean(scan.afterUrl)}
      aiSessionId={scan.aiSessionId}
      reviews={reviews}
      caseStudies={caseStudies}
      aggregate={aggregate}
    />
  );
}
```

- [ ] **Step 2: Typecheck — now clean**

Run: `npx tsc --noEmit`
Expected: PASS (the selfie funnel now matches both new signatures; no other callers exist).

- [ ] **Step 3: Run the test suite**

Run: `npm run test`
Expected: PASS (no logic changed in tested modules).

- [ ] **Step 4: Commit**

```bash
git add components/funnel/ScanFunnel.tsx
git commit -m "refactor(funnel): wire ScanFunnel to shared LeadStep/OfferStep"
```

---

## Task 7: `MatchedResult` — the quiz offer hero (real before/after)

**Files:**
- Create: `components/funnel/MatchedResult.tsx`

- [ ] **Step 1: Implement the component**

Create `components/funnel/MatchedResult.tsx`:

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/funnel/MatchedResult.tsx
git commit -m "feat(quiz): MatchedResult hero with real before/after pair"
```

---

## Task 8: `QuizStep` — one single-select question screen

**Files:**
- Create: `components/funnel/QuizStep.tsx`

- [ ] **Step 1: Implement the component**

Create `components/funnel/QuizStep.tsx`:

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/funnel/QuizStep.tsx
git commit -m "feat(quiz): single-select QuizStep with progress bar"
```

---

## Task 9: `QuizFunnel` state machine + quiz styles

**Files:**
- Create: `components/funnel/QuizFunnel.tsx`
- Create: `components/funnel/quiz.css`

- [ ] **Step 1: Create the stylesheet**

Create `components/funnel/quiz.css`:

```css
/* Quiz funnel — builds on funnel.css design tokens. */
.quiz-intro { text-align: center; }
.quiz-intro .funnel-cta { width: 100%; margin-top: 1rem; }
.quiz-secondary-link {
  display: inline-block;
  margin-top: 0.9rem;
  font-size: 0.86rem;
  color: var(--ink-mute, #5b6b85);
  text-decoration: underline;
  background: none;
  border: none;
  cursor: pointer;
}

.quiz-progress { margin-bottom: 1.1rem; }
.quiz-progress-label {
  display: block;
  font-family: ui-monospace, monospace;
  font-size: 0.66rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-mute, #5b6b85);
  margin-bottom: 0.4rem;
}
.quiz-progress-bar { height: 6px; border-radius: 999px; background: rgba(14,31,58,0.08); overflow: hidden; }
.quiz-progress-bar > span { display: block; height: 100%; background: var(--cobalt, #2f5fe0); transition: width 0.35s ease; }

.quiz-prompt { font-size: clamp(1.35rem, 5vw, 1.8rem); margin-bottom: 1.2rem; }

.quiz-options { display: flex; flex-direction: column; gap: 0.7rem; }
.quiz-option {
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
  width: 100%; min-height: 64px; padding: 0.9rem 1.1rem;
  border: 1.5px solid rgba(14,31,58,0.14); border-radius: 16px;
  background: #fff; text-align: left; cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.05s ease;
}
.quiz-option:active { transform: scale(0.99); }
.quiz-option.is-selected { border-color: var(--cobalt, #2f5fe0); background: rgba(47,95,224,0.05); }
.quiz-option-text { display: flex; flex-direction: column; gap: 0.15rem; }
.quiz-option-label { font-weight: 600; font-size: 1rem; color: var(--ink, #0e1f3a); }
.quiz-option-hint { font-size: 0.82rem; color: var(--ink-mute, #5b6b85); }
.quiz-option-tick { color: var(--cobalt, #2f5fe0); flex-shrink: 0; }

.quiz-result-hero { text-align: center; }
.quiz-result-caption { margin-bottom: 1rem; }
.quiz-ba { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.quiz-ba-fig { position: relative; aspect-ratio: 3/4; border-radius: 16px; overflow: hidden; }
.quiz-ba-fig figcaption {
  position: absolute; bottom: 0; left: 0; right: 0; padding: 0.35rem 0;
  background: rgba(14,31,58,0.82); color: #fff; text-align: center;
  font-size: 0.78rem; font-weight: 600;
}
.quiz-ba-note {
  margin-top: 0.6rem; text-align: center;
  font-family: ui-monospace, monospace; font-size: 0.66rem;
  letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-mute, #5b6b85);
}
```

- [ ] **Step 2: Create the state machine**

Create `components/funnel/QuizFunnel.tsx`:

```tsx
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
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/funnel/QuizFunnel.tsx components/funnel/quiz.css
git commit -m "feat(quiz): QuizFunnel state machine (intro → quiz → lead → offer)"
```

---

## Task 10: Routing swap — quiz at `/`, selfie at `/scan`

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/scan/page.tsx`

- [ ] **Step 1: Render the selfie funnel at `/scan`**

Replace the entire contents of `app/scan/page.tsx`:

```tsx
import { ScanFunnel } from '@/components/funnel/ScanFunnel';
import { getAcneReviews } from '@/lib/reviews/queries';

// Secondary funnel (AI photo scan). Re-fetch reviews at most every 5 min.
export const revalidate = 300;

export default async function Page() {
  const { reviews, caseStudies, aggregate } = await getAcneReviews();
  return <ScanFunnel reviews={reviews} caseStudies={caseStudies} aggregate={aggregate} />;
}
```

- [ ] **Step 2: Render the quiz at `/` with a client bridge to `/scan`**

`QuizFunnel` is a client component and needs `onChooseScan` (a navigation), but `app/page.tsx` must stay a **server** component to call `getAcneReviews()`. So split: a tiny `'use client'` bridge holds the `useRouter` navigation, and the server page passes the fetched reviews into it.

**(a)** Create `app/QuizFunnelClient.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { QuizFunnel } from '@/components/funnel/QuizFunnel';
import type { ReviewsResult } from '@/lib/reviews/types';

export function QuizFunnelClient({ data }: { data: ReviewsResult }) {
  const router = useRouter();
  return (
    <QuizFunnel
      reviews={data.reviews}
      caseStudies={data.caseStudies}
      aggregate={data.aggregate}
      onChooseScan={() => router.push('/scan')}
    />
  );
}
```

**(b)** Overwrite `app/page.tsx` (stays a server component):

```tsx
import { getAcneReviews } from '@/lib/reviews/queries';
import { QuizFunnelClient } from './QuizFunnelClient';

// Quiz funnel is the default landing. Re-fetch reviews at most every 5 min.
export const revalidate = 300;

export default async function Page() {
  const data = await getAcneReviews();
  return <QuizFunnelClient data={data} />;
}
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit`
Expected: PASS.
Run: `npm run build`
Expected: PASS — build completes; `/` and `/scan` both compile.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/scan/page.tsx app/QuizFunnelClient.tsx
git commit -m "feat(quiz): route quiz to / and selfie funnel to /scan"
```

---

## Task 11: Real before/after assets + manual verification

**Files:**
- Modify: `lib/funnel/quiz.ts` (`BEFORE_AFTER` URLs only)

- [ ] **Step 1: Upload the real pairs and point the config at them**

Upload the matched pairs to `clartemd.com.pk/protocols/acne-glow-protocol/visual-studies/` (same host the reviews already use). Per the spec's asset rules: identical framing/lighting per pair, no filter on the "after", crop-to-area where privacy needs it, **written consent on file**, and **at least 2–3 male pairs**. Update the four entries in `BEFORE_AFTER` in `lib/funnel/quiz.ts` to the real filenames (`blackheads`, `breakouts`, `marks`, `mix`). If a real `marks` or `blackheads` pair isn't ready, temporarily point it at the strongest `mix` pair and `log` the substitution in the PR description — never fabricate.

- [ ] **Step 2: Re-run the quiz tests (URLs still valid shape)**

Run: `npm run test -- quiz`
Expected: PASS (the `^https?://` and non-empty assertions still hold).

- [ ] **Step 3: Manual dev-server verification checklist**

Run: `npm run dev` and open `http://localhost:3001`. Confirm:
- [ ] `/` shows the quiz intro ("See your skin clear in 12 weeks", "Start my skin quiz →") and the secondary "Prefer an AI photo scan instead?" link.
- [ ] Tapping the secondary link navigates to `/scan` and shows the selfie funnel (camera/upload).
- [ ] Starting the quiz shows Q1; each tap advances and the "Step X of 4" bar grows.
- [ ] After Q4, the lead gate shows ("Your protocol is ready.") and submit reveals the offer.
- [ ] The offer hero shows the matched **real** before/after pair for the chosen Q1 answer (pick `cystic` once and confirm it shows the `breakouts` pair).
- [ ] The COD order form prefills name/email/phone from the lead gate and places an order (use a disposable test entry).
- [ ] In DevTools console, `window.dataLayer` contains: `funnel_quiz_start`, `funnel_quiz_q1_complete`…`q4_complete`, `funnel_lead_captured`, `funnel_result_viewed`, `funnel_offer_viewed`, and on order `funnel_order_placed`.
- [ ] In the Network tab, the lead submit POSTs to `/api/lead` with `meta_event_id` + `q1..q4`, and (if the Pixel is live) a Meta `Lead` event fires with the same `eventID`.

- [ ] **Step 4: Commit**

```bash
git add lib/funnel/quiz.ts
git commit -m "feat(quiz): wire real customer before/after pairs"
```

---

## Post-implementation: Meta campaign action (out of code scope)

Once `Lead` is firing (verified in Task 11 Step 3): create a **Leads-objective campaign** or a **custom conversion on `lead_submitted`/Meta `Lead`** so Meta optimises on the now-frequent mid-funnel signal while purchases are still sparse. Migrate the optimisation event to `Purchase` once daily purchases clear Meta's learning threshold (~50/week per ad set). Reconcile the GTM container ID before launch — the spec references `GTM-5NP9NGPD` but `app/layout.tsx` loads a different `NEXT_PUBLIC_GTM_ID`; confirm which container is actually live and holds the event tags.

---

## Self-Review (against the spec)

**Spec coverage:**
- Landing copy + primary/secondary CTA → Task 9 (intro) + Task 10 (routing). ✅
- Q1–Q4 content, one-per-screen, progress bar, single-select → Task 1 (config) + Task 8 (QuizStep). ✅
- Lead capture screen 5 copy ("Where should we send your protocol?" framing) + fields + microcopy → Task 4 (LeadStep copy props) + Task 9 (quiz copy). ✅
- Lead POST fired BEFORE result navigation → Task 4 (`await fetch` then `onComplete`). ✅
- Result page: matched B/A, recommended product card, price, COD CTA, trust row, testimonials → Task 7 (MatchedResult) + reused OfferStep (Task 5/6). ✅
- Single client route with internal state, no reloads → Task 8/9 (`QuizFunnel` state machine). ✅
- Recommendation config object, constant product, Q1 selects B/A → Task 1. ✅
- Per-step analytics events to Pixel + GTM, `Lead`/`Purchase` mapping → Task 2 (events) + Task 3 (Meta Lead + CAPI) + Task 9 (event firing). ✅
- Mobile-first big tap targets → Task 9 (`quiz.css`, 64px min option height). ✅
- Preload result B/A during quiz → **partial**: `next/image` on the result loads on mount; explicit prefetch during Q3/Q4 is a possible enhancement, not built (YAGNI for v1; note in PR). ⚠️
- Keep selfie flow as secondary → Task 10 (`/scan`). ✅
- B/A asset rules (consent, male reps, framing, honesty) → Task 11 Step 1 (documented, human action). ✅
- Meta campaign note → Post-implementation section. ✅

**Placeholder scan:** No "TBD"/"handle errors"/"similar to" left; every code step shows full code. The only deliberately deferred item is the optional image prefetch (flagged above) and the real asset filenames (Task 11, a human upload step).

**Type consistency:** `LeadContact` (from `lead-storage`), `QuizAnswers`/`BeforeAfterPair`/`AcneType` (from `quiz.ts`), `FunnelEvent` (analytics), and the `OfferStep`/`LeadStep` prop shapes are referenced identically across Tasks 1, 4, 5, 6, 7, 8, 9. `effectiveAcneType`/`beforeAfterForAcneType`/`recommendProtocol`/`personalizationSentence` names match between the test (Task 1 Step 1) and the implementation (Task 1 Step 3).
