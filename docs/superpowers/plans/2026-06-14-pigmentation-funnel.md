# Pigmentation Funnel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a `/pigmentation` landing funnel that mirrors the acne funnel exactly, selling the existing Even Tone Protocol (₨6,999) with a pigmentation-specific AI bot, reviews, SEO, and trust signals.

**Architecture:** New per-concern data/config files drive the existing reusable funnel components via a single `ConcernConfig` object. The acne funnel at `/` is untouched except for additive props with acne defaults. No new DB records, no new API routes.

**Tech Stack:** Next.js 15 (App Router, Turbopack), React 19, TypeScript, Drizzle + postgres-js (Supabase), Zod, Vitest, Gemini + OpenAI.

**Spec:** `docs/superpowers/specs/2026-06-14-pigmentation-funnel-design.md`

---

## File Map

**New files:**
| Path | Responsibility |
|---|---|
| `lib/funnel/pigmentation-offer.ts` | `PIGMENTATION_BUNDLES`, `PIGMENTATION_LEAD_SLUG`, `PIGMENTATION_AI_PROMPT` |
| `lib/funnel/concern-config.ts` | `ConcernConfig` type + `getConcernConfig(concern)` registry |
| `lib/ai/pigmentation-prompts.ts` | `PIGMENTATION_BA_PROMPT`, `PIGMENTATION_ANALYSIS_PROMPT` |
| `lib/reviews/pigmentation-queries.ts` | `getPigmentationReviews()` |
| `lib/seo/pigmentation-faq.ts` | `PIGMENTATION_FAQ`, `PIGMENTATION_RESULTS_DISCLAIMER` |
| `lib/seo/pigmentation-jsonld.ts` | `pigmentationProductLd()`, `pigmentationFaqLd()` |
| `components/seo/PigmentationLandingContent.tsx` | Below-fold SEO copy |
| `app/pigmentation/layout.tsx` | Metadata, OG, og:product, GTM/Pixel |
| `app/pigmentation/page.tsx` | Server component, fetch reviews, render funnel |
| `tests/funnel/pigmentation.test.ts` | Unit tests for config + offer + reviews query |

**Modified files (additive, acne behaviour preserved):**
| Path | Change |
|---|---|
| `lib/funnel/offer.ts` | `bundleBySlug()` searches acne **and** pigmentation bundles |
| `lib/funnel/evidence.ts` | add `PIGMENTATION_STATS` |
| `components/funnel/ScanFunnel.tsx` | add `concern?` prop → builds config, passes down |
| `components/funnel/ScanStep.tsx` | add `config` prop, replace hardcoded acne values |
| `components/funnel/LandingOffer.tsx` | add `config` prop |
| `components/funnel/OfferStep.tsx` | add `config` prop, replace hardcoded acne values |
| `lib/ai/analyze-skin.ts` | accept optional `prompt` arg |
| `app/api/ai/analyze-skin/route.ts` | pick prompt by `concern` |

---

## Task 1: Pigmentation offer data

**Files:**
- Create: `lib/funnel/pigmentation-offer.ts`
- Test: `tests/funnel/pigmentation.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/funnel/pigmentation.test.ts
import { describe, it, expect } from 'vitest';
import { PIGMENTATION_BUNDLES, PIGMENTATION_LEAD_SLUG } from '@/lib/funnel/pigmentation-offer';
import { bundleSavings } from '@/lib/funnel/offer';

describe('pigmentation offer', () => {
  it('has a single even-tone-protocol bundle as the lead', () => {
    expect(PIGMENTATION_LEAD_SLUG).toBe('even-tone-protocol');
    expect(PIGMENTATION_BUNDLES).toHaveLength(1);
    expect(PIGMENTATION_BUNDLES[0].slug).toBe('even-tone-protocol');
    expect(PIGMENTATION_BUNDLES[0].offerPkr).toBe(6999);
    expect(PIGMENTATION_BUNDLES[0].itemSkus).toEqual(['prep', 'vitc', 'light', 'spf']);
  });

  it('computes 41% savings vs the list price', () => {
    const sv = bundleSavings(PIGMENTATION_BUNDLES[0]);
    expect(sv.listPkr).toBe(11950); // 2000+2950+4500+2500
    expect(sv.savingsPkr).toBe(4951);
    expect(sv.savingsPct).toBe(41);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/funnel/pigmentation.test.ts`
Expected: FAIL — cannot resolve `@/lib/funnel/pigmentation-offer`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/funnel/pigmentation-offer.ts
/**
 * Single source of truth for the pigmentation scan funnel offer.
 * Mirrors lib/funnel/offer.ts but for the Even Tone Protocol. Prices match
 * lib/db/seed.ts and the `bundles` table. The server (/api/create-order)
 * remains price-authoritative; these values render the offer block only.
 */
import type { FunnelBundle } from './offer';

export const PIGMENTATION_LEAD_SLUG = 'even-tone-protocol';

/** The pigmentation funnel sells one protocol: the Even Tone Protocol. */
export const PIGMENTATION_BUNDLES: FunnelBundle[] = [
  {
    slug: 'even-tone-protocol',
    name: 'The Even Tone Protocol',
    itemSkus: ['prep', 'vitc', 'light', 'spf'],
    offerPkr: 6999,
    tagline: 'Complete 12-week pigmentation routine',
    description:
      'Targets dark spots, uneven skin tone and post-acne marks — a PHA prep ' +
      'cleanser, vitamin C 15% antioxidant serum, a tranexamic 3% + kojic + ' +
      'arbutin lightening cream, and SPF 50+ to lock in results. Dermatologist-dosed.',
    hero: 'https://clartemd.com.pk/protocols/even-tone-protocol/hero.webp',
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/funnel/pigmentation.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/funnel/pigmentation-offer.ts tests/funnel/pigmentation.test.ts
git commit -m "feat(pigmentation): add even-tone-protocol offer data"
```

---

## Task 2: Make bundleBySlug aware of pigmentation bundles

**Why:** `bundleBySlug()` in `offer.ts` only searches `FUNNEL_BUNDLES` (acne). `OrderSummary`, `StickyCartBar`, `lib/funnel/shop.ts` `lineUnitPkr`, and `whatsapp.ts` all call it — so `even-tone-protocol` would resolve to ₨0 in the cart. This makes it search both arrays.

**Files:**
- Modify: `lib/funnel/offer.ts:82-84`
- Test: `tests/funnel/pigmentation.test.ts`

- [ ] **Step 1: Add the failing test**

Append to `tests/funnel/pigmentation.test.ts`:

```ts
import { bundleBySlug } from '@/lib/funnel/offer';

describe('bundleBySlug cross-concern lookup', () => {
  it('finds the even-tone-protocol bundle', () => {
    const b = bundleBySlug('even-tone-protocol');
    expect(b?.offerPkr).toBe(6999);
  });

  it('still finds acne bundles', () => {
    expect(bundleBySlug('acne-solo-protocol')?.offerPkr).toBe(1999);
  });

  it('returns undefined for unknown slugs', () => {
    expect(bundleBySlug('nope')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/funnel/pigmentation.test.ts`
Expected: FAIL — `bundleBySlug('even-tone-protocol')` is `undefined`.

- [ ] **Step 3: Edit `bundleBySlug` in `lib/funnel/offer.ts`**

Replace lines 82-84:

```ts
export function bundleBySlug(slug: string): FunnelBundle | undefined {
  return FUNNEL_BUNDLES.find((b) => b.slug === slug);
}
```

with:

```ts
export function bundleBySlug(slug: string): FunnelBundle | undefined {
  // Search acne bundles first, then pigmentation. Imported lazily-at-module-
  // load via a function to avoid a static import cycle (pigmentation-offer
  // imports the FunnelBundle *type* from this file).
  return (
    FUNNEL_BUNDLES.find((b) => b.slug === slug) ??
    PIGMENTATION_BUNDLES.find((b) => b.slug === slug)
  );
}
```

Add this import at the top of `lib/funnel/offer.ts` (after the existing `import { PRODUCT_META } ...` line):

```ts
import { PIGMENTATION_BUNDLES } from './pigmentation-offer';
```

> Note: `pigmentation-offer.ts` imports only the `FunnelBundle` **type** from `offer.ts` (`import type`), which is erased at compile time — so there is no runtime import cycle.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/funnel/pigmentation.test.ts`
Expected: PASS (all tests, including the acne savings test still green).

- [ ] **Step 5: Run the full suite to confirm no acne regression**

Run: `npx vitest run`
Expected: PASS — existing `tests/funnel/offer.test.ts` and `whatsapp.test.ts` still green.

- [ ] **Step 6: Commit**

```bash
git add lib/funnel/offer.ts tests/funnel/pigmentation.test.ts
git commit -m "feat(pigmentation): bundleBySlug resolves even-tone-protocol"
```

---

## Task 3: Pigmentation evidence stats

**Files:**
- Modify: `lib/funnel/evidence.ts` (append)

- [ ] **Step 1: Append `PIGMENTATION_STATS` to `lib/funnel/evidence.ts`**

Add after the `ACNE_STATS` array (before `DOCTOR_LINE`):

```ts
export const PIGMENTATION_STATS: FunnelStat[] = [
  {
    active: 'Vitamin C 15%',
    figure: 73,
    suffix: '%',
    context: 'reduction in pigmentation intensity at 16 weeks',
    citation: 'Espinal-Perez et al., Int J Dermatol 2004',
  },
  {
    active: 'Tranexamic Acid',
    figure: 60,
    suffix: '%',
    context: 'mean melasma area & severity reduction at 12 weeks',
    citation: 'Lee et al., J Am Acad Dermatol 2016',
  },
  {
    active: 'Kojic Acid',
    figure: 51,
    suffix: '%',
    context: 'improvement in melasma vs vehicle at 12 weeks',
    citation: 'Lim, Dermatol Surg 1999',
  },
];
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add lib/funnel/evidence.ts
git commit -m "feat(pigmentation): add ingredient evidence stats"
```

---

## Task 4: Concern config registry

**Files:**
- Create: `lib/funnel/concern-config.ts`
- Test: `tests/funnel/pigmentation.test.ts`

- [ ] **Step 1: Add the failing test**

Append to `tests/funnel/pigmentation.test.ts`:

```ts
import { getConcernConfig } from '@/lib/funnel/concern-config';

describe('getConcernConfig', () => {
  it('defaults to acne', () => {
    const c = getConcernConfig();
    expect(c.concern).toBe('acne');
    expect(c.leadSlug).toBe('acne-solo-protocol');
    expect(c.bundleSkus).toEqual(['rescue', 'acne', 'vitc', 'reti']);
    expect(c.addonSkus).toEqual(['spf', 'ha', 'prep']);
    expect(c.bundles.length).toBe(3);
  });

  it('returns the pigmentation config', () => {
    const c = getConcernConfig('pigmentation');
    expect(c.concern).toBe('pigmentation');
    expect(c.leadSlug).toBe('even-tone-protocol');
    expect(c.bundleSkus).toEqual(['prep', 'vitc', 'light', 'spf']);
    expect(c.addonSkus).toEqual(['rescue', 'acne', 'ha', 'reti']);
    expect(c.bundles.length).toBe(1);
    expect(c.aiPrompt).toContain('tranexamic');
    expect(c.protocolHeroAlt).toBe('The Even Tone Protocol');
  });

  it('falls back to acne for unknown concerns', () => {
    expect(getConcernConfig('xyz').concern).toBe('acne');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/funnel/pigmentation.test.ts`
Expected: FAIL — cannot resolve `@/lib/funnel/concern-config`.

- [ ] **Step 3: Write the implementation**

```ts
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
  bundleSkus: ['rescue', 'acne', 'vitc', 'reti'],
  addonSkus: ['spf', 'ha', 'prep'],
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
```

> Confirm `FUNNEL_AI_PROMPT` and `ACNE_GLOW` are exported from `offer.ts` (they are: lines 14 and 101). `LEAD_BUNDLE_SLUG` is line 34.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/funnel/pigmentation.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/funnel/concern-config.ts tests/funnel/pigmentation.test.ts
git commit -m "feat(pigmentation): add concern config registry"
```

---

## Task 5: Server-side pigmentation AI prompts

**Files:**
- Create: `lib/ai/pigmentation-prompts.ts`

- [ ] **Step 1: Write the file**

```ts
// lib/ai/pigmentation-prompts.ts
/**
 * Pigmentation-funnel AI prompts. PIGMENTATION_BA_PROMPT is the server-side
 * before/after default; PIGMENTATION_ANALYSIS_PROMPT replaces ANALYSIS_PROMPT
 * for the skin-analysis bot when concern === 'pigmentation'. Same response
 * schema as the acne analysis (lib/ai/analyze-skin.ts).
 */
export const PIGMENTATION_BA_PROMPT = `Generate a photorealistic projection of this person's skin after 12 weeks of consistent pigmentation treatment with a vitamin C 15% + tranexamic acid 3% + kojic acid + arbutin + SPF 50 regimen. Show: visibly faded dark spots and post-inflammatory hyperpigmentation, a more even skin tone, reduced discolouration, brighter complexion. Critical: keep identity, ethnicity, age, hair, lighting, framing, and pose IDENTICAL. Realistic clinical improvement only — no airbrushing, no skin-lightening beyond what a dermatologist would expect from these actives.`;

export const PIGMENTATION_ANALYSIS_PROMPT = `You are a dermatologist-trained triage AI assisting a Pakistan-based clinical skincare brand, focused on pigmentation and uneven skin tone. Analyze this photograph and return ONLY a JSON object matching the schema.

Rules:
- You are NOT a substitute for an in-person dermatologist. Your output is a triage aid only.
- For any of the following, set "recommended_protocol" to "see-doctor-in-person" and explain why in "warnings": suspected skin cancer (asymmetric moles, bleeding lesions, rapidly changing or growing pigmentation), suspected hormonal/dermal melasma that is symmetric across the cheeks, infected or inflamed lesions, anything outside cosmetic pigmentation / uneven tone / post-acne marks.
- "severity" must reflect cosmetic pigmentation severity only (extent and darkness of spots / unevenness).
- "primary_concerns" are the dominant issues (e.g. post-inflammatory hyperpigmentation, sun spots, uneven tone, dullness); "secondary_concerns" are minor co-occurring issues.
- "recommended_protocol" should normally be "even-tone-protocol" for pigmentation-led skin, but use "clear-skin-protocol" if active acne dominates, "renewal-protocol" if ageing dominates, "barrier-protocol" if sensitivity/dryness dominates, or "see-doctor-in-person" per the rules above.
- "recommended_actives" lists 3-6 ingredient strings with percentages where applicable, drawn from: Vitamin C 15%, Tranexamic Acid 3%, Kojic Acid, Arbutin, Niacinamide, SPF 50+.
- "expected_timeline_weeks" is realistic for pigmentation — typically 8-16.
- "warnings" is required if there's anything the user should know before starting (e.g. daily SPF is mandatory; melasma may need a doctor).
- "confidence" reflects your certainty given image quality and concern complexity.`;
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add lib/ai/pigmentation-prompts.ts
git commit -m "feat(pigmentation): add server-side AI prompts"
```

---

## Task 6: Route the AI bots by concern

**Why:** `analyzeSkin()` hardcodes `ANALYSIS_PROMPT`. Make it accept an optional prompt and have the route pick the pigmentation prompt when `concern === 'pigmentation'`. Also wire `PIGMENTATION_BA_PROMPT` as the before/after server default for pigmentation (belt-and-suspenders: the client always sends `config.aiPrompt`, but if a request omits `prompt` the server default should still match the concern).

**Files:**
- Modify: `lib/ai/analyze-skin.ts:37-55`
- Modify: `app/api/ai/analyze-skin/route.ts:7`, `:46-48`
- Modify: `app/api/generate-after/route.ts:9`, `:93`

- [ ] **Step 1: Make `analyzeSkin` accept a prompt**

In `lib/ai/analyze-skin.ts`, leave the `import { ANALYSIS_PROMPT } from './prompts';` line on line 4 as-is (it stays the default). Change the function signature + body (lines 37-55):

```ts
export async function analyzeSkin(args: {
  inputBase64: string;
  inputMimeType: string;
  /** Override the analysis prompt (e.g. pigmentation). Defaults to acne. */
  prompt?: string;
}): Promise<AnalyzeResult> {
  const startedAt = Date.now();

  const response = await ai.models.generateContent({
    model: MODEL_ANALYSIS,
    contents: [
      { inlineData: { data: args.inputBase64, mimeType: args.inputMimeType } },
      { text: args.prompt ?? ANALYSIS_PROMPT },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema as unknown as Record<string, unknown>,
    },
  });
```

(Leave the rest of the function unchanged.)

- [ ] **Step 2: Pick the prompt in the route**

In `app/api/ai/analyze-skin/route.ts`, add an import after line 7 (`import { analyzeSkin } ...`):

```ts
import { PIGMENTATION_ANALYSIS_PROMPT } from '@/lib/ai/pigmentation-prompts';
```

Then change the call site (line ~48) from:

```ts
    result = await analyzeSkin({ inputBase64: input.image_base64, inputMimeType: input.mime_type });
```

to:

```ts
    result = await analyzeSkin({
      inputBase64: input.image_base64,
      inputMimeType: input.mime_type,
      prompt: input.concern === 'pigmentation' ? PIGMENTATION_ANALYSIS_PROMPT : undefined,
    });
```

- [ ] **Step 3: Wire the before/after server default by concern**

In `app/api/generate-after/route.ts`, add an import after line 9 (`import { ACNE_BA_PROMPT } from '@/lib/ai/prompts';`):

```ts
import { PIGMENTATION_BA_PROMPT } from '@/lib/ai/pigmentation-prompts';
```

Then change line ~93 from:

```ts
      prompt: input.prompt || ACNE_BA_PROMPT,
```

to:

```ts
      prompt:
        input.prompt ||
        (input.concern === 'pigmentation' ? PIGMENTATION_BA_PROMPT : ACNE_BA_PROMPT),
```

- [ ] **Step 4: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add lib/ai/analyze-skin.ts app/api/ai/analyze-skin/route.ts app/api/generate-after/route.ts
git commit -m "feat(pigmentation): route AI prompts by concern"
```

---

## Task 7: Pigmentation reviews query

**Files:**
- Create: `lib/reviews/pigmentation-queries.ts`

- [ ] **Step 1: Write the file** (mirrors `lib/reviews/queries.ts` exactly, swapping the WHERE filter)

```ts
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import type { ReviewCard, CaseStudy, ReviewsResult } from './types';

const IMG_BASE = 'https://clartemd.com.pk';

function toAbsolute(src: string): string {
  return src.startsWith('http') ? src : `${IMG_BASE}${src.startsWith('/') ? '' : '/'}${src}`;
}

function parsePhotos(raw: unknown): string[] {
  let arr = raw;
  if (typeof arr === 'string') {
    try { arr = JSON.parse(arr); } catch { return []; }
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((p) => (p && typeof p === 'object' && typeof (p as { src?: unknown }).src === 'string' ? (p as { src: string }).src : null))
    .filter((s): s is string => !!s)
    .map(toAbsolute);
}

/**
 * Reads pigmentation-relevant approved reviews from the shared Supabase
 * `reviews` table. Product reviews → marquee; protocol reviews with photos →
 * case studies. Degrades gracefully to empty on any DB error.
 */
export async function getPigmentationReviews(): Promise<ReviewsResult> {
  try {
    const rows = (await db.execute(sql`
      SELECT name, location, rating, body, verified, photos, subject_type
      FROM reviews
      WHERE status = 'approved'
        AND (
          (subject_type = 'product'  AND subject_ref IN ('prep','vitc','light','spf'))
          OR (subject_type = 'protocol' AND subject_ref = 'even-tone-protocol')
        )
      ORDER BY rating DESC, review_date DESC
    `)) as unknown as Array<{
      name: string;
      location: string | null;
      rating: number;
      body: string;
      verified: boolean;
      photos: unknown;
      subject_type: string;
    }>;

    const reviews: ReviewCard[] = [];
    const caseStudies: CaseStudy[] = [];

    for (const r of rows) {
      const photos = parsePhotos(r.photos);
      if (r.subject_type === 'protocol' && photos.length > 0) {
        caseStudies.push({
          name: r.name,
          location: r.location,
          rating: Number(r.rating),
          body: r.body,
          photos,
        });
      } else {
        reviews.push({
          name: r.name,
          location: r.location,
          rating: Number(r.rating),
          body: r.body,
          verified: Boolean(r.verified),
          photo: photos[0] ?? null,
        });
      }
    }

    const count = rows.length;
    const avg = count
      ? Math.round((rows.reduce((s, r) => s + Number(r.rating), 0) / count) * 10) / 10
      : 0;

    return { reviews, caseStudies, aggregate: { avg, count } };
  } catch (err) {
    console.warn('getPigmentationReviews: skipping reviews (DB query failed):', err instanceof Error ? err.message : err);
    return { reviews: [], caseStudies: [], aggregate: { avg: 0, count: 0 } };
  }
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add lib/reviews/pigmentation-queries.ts
git commit -m "feat(pigmentation): add reviews query"
```

---

## Task 8: Pigmentation FAQ

**Files:**
- Create: `lib/seo/pigmentation-faq.ts`

- [ ] **Step 1: Write the file**

```ts
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
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no new errors (confirm `FaqItem` is exported from `lib/seo/faq.ts` — it is, line 7).

- [ ] **Step 3: Commit**

```bash
git add lib/seo/pigmentation-faq.ts
git commit -m "feat(pigmentation): add FAQ content"
```

---

## Task 9: Pigmentation JSON-LD

**Files:**
- Create: `lib/seo/pigmentation-jsonld.ts`

- [ ] **Step 1: Write the file** (reuses the builders/escaping from `lib/seo/jsonld.ts`)

```ts
// lib/seo/pigmentation-jsonld.ts
/**
 * JSON-LD builders for the /pigmentation page. Mirrors lib/seo/jsonld.ts's
 * Product + FAQPage builders but anchored to the Even Tone Protocol.
 */
import { SITE_URL } from './site';
import { PIGMENTATION_BUNDLES, PIGMENTATION_LEAD_SLUG } from '@/lib/funnel/pigmentation-offer';
import { PIGMENTATION_FAQ } from './pigmentation-faq';
import type { ReviewCard } from '@/lib/reviews/types';

const BRAND = 'Clarté MD';

export function pigmentationProductLd({
  aggregate,
  reviews = [],
}: {
  aggregate: { avg: number; count: number };
  reviews?: ReviewCard[];
}): object {
  const lead = PIGMENTATION_BUNDLES.find((b) => b.slug === PIGMENTATION_LEAD_SLUG)!;
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    sku: lead.slug,
    name: lead.name,
    description: lead.description,
    image: lead.hero,
    brand: { '@type': 'Brand', name: BRAND },
    offers: {
      '@type': 'Offer',
      price: String(lead.offerPkr),
      priceCurrency: 'PKR',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/pigmentation`,
    },
  };
  if (aggregate.count > 0) {
    ld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregate.avg.toFixed(1),
      reviewCount: aggregate.count,
      bestRating: '5',
      worstRating: '1',
    };
  }
  const sample = reviews.slice(0, 3);
  if (sample.length) {
    ld.review = sample.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.name },
      reviewRating: { '@type': 'Rating', ratingValue: String(r.rating), bestRating: '5' },
      reviewBody: r.body,
    }));
  }
  return ld;
}

export function pigmentationFaqLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PIGMENTATION_FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add lib/seo/pigmentation-jsonld.ts
git commit -m "feat(pigmentation): add JSON-LD builders"
```

---

## Task 10: Generalize ScanFunnel with a concern prop

**Files:**
- Modify: `components/funnel/ScanFunnel.tsx`

- [ ] **Step 1: Rewrite `components/funnel/ScanFunnel.tsx`**

```tsx
'use client';

import { useState } from 'react';
import NextImage from 'next/image';
import { bundleBySlug } from '@/lib/funnel/offer';
import { getConcernConfig } from '@/lib/funnel/concern-config';
import { ScanStep, type ScanResult } from './ScanStep';
import { LeadStep } from './LeadStep';
import { OfferStep } from './OfferStep';
import { Collage } from './Collage';
import type { ReviewCard, CaseStudy } from '@/lib/reviews/types';
import './funnel.css';

export function ScanFunnel({
  concern = 'acne',
  reviews,
  caseStudies,
  aggregate,
}: {
  concern?: string;
  reviews: ReviewCard[];
  caseStudies: CaseStudy[];
  aggregate: { avg: number; count: number };
}) {
  const config = getConcernConfig(concern);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [leadDone, setLeadDone] = useState(false);
  const [directBuy, setDirectBuy] = useState(false);

  if (directBuy) {
    const lead = bundleBySlug(config.leadSlug)!;
    return (
      <OfferStep
        config={config}
        hero={
          <section className="funnel-direct-hero">
            <h1 className="funnel-h1">{lead.name}</h1>
            <p className="funnel-sub">{config.copy.directBuySub(lead.offerPkr)}</p>
            <div className="funnel-hero-img funnel-hero-img--scan">
              <NextImage
                src={lead.hero}
                alt={lead.name}
                fill
                sizes="(max-width: 560px) 100vw, 560px"
                style={{ objectFit: lead.heroFit ?? 'cover' }}
                priority
              />
            </div>
          </section>
        }
        page="scan-direct"
        usedAiPreview={false}
        reviews={reviews}
        caseStudies={caseStudies}
        aggregate={aggregate}
      />
    );
  }

  if (!scan) {
    return <ScanStep config={config} onComplete={setScan} onBuyDirect={() => setDirectBuy(true)} reviews={reviews} caseStudies={caseStudies} aggregate={aggregate} />;
  }
  if (!leadDone) {
    return <LeadStep concern={config.concern} aiSessionId={scan.aiSessionId} onComplete={() => setLeadDone(true)} />;
  }
  return (
    <OfferStep
      config={config}
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

> `ScanStep`, `LeadStep`, and `OfferStep` get the new props in Tasks 11-13. This file will not type-check until those are done — that's expected; run `tsc` after Task 13.

- [ ] **Step 2: Commit** (deferred type-check)

```bash
git add components/funnel/ScanFunnel.tsx
git commit -m "feat(pigmentation): ScanFunnel accepts concern prop"
```

---

## Task 11: Add concern to LeadStep

**Files:**
- Modify: `components/funnel/LeadStep.tsx:18-35`, `:60-69`

- [ ] **Step 1: Add the `concern` prop**

In the `LeadStep` props (after `onComplete`), add `concern`:

```tsx
export function LeadStep({
  onComplete,
  concern = 'acne',
  aiSessionId,
  extra,
  eyebrow = 'Analysis complete',
  headline = 'Your results are ready.',
  subhead = 'Enter your details to unlock your personalised 12-week skin projection and protocol.',
  cta = 'Reveal my results →',
}: {
  onComplete: (lead: LeadContact) => void;
  concern?: string;
  aiSessionId?: string;
  extra?: Record<string, unknown>;
  eyebrow?: string;
  headline?: string;
  subhead?: string;
  cta?: string;
}) {
```

- [ ] **Step 2: Use it in the `/api/lead` body**

Change line ~63 from `concern: 'acne',` to `concern,`.

- [ ] **Step 3: Commit**

```bash
git add components/funnel/LeadStep.tsx
git commit -m "feat(pigmentation): LeadStep accepts concern prop"
```

---

## Task 12: Generalize ScanStep with config

**Files:**
- Modify: `components/funnel/ScanStep.tsx`

- [ ] **Step 1: Update imports + props**

Replace the import on line 6:

```tsx
import { ACNE_GLOW, FUNNEL_AI_PROMPT } from '@/lib/funnel/offer';
```

with:

```tsx
import type { ConcernConfig } from '@/lib/funnel/concern-config';
```

Remove the `PROTOCOL_HERO` import on line 5 (`import { PROTOCOL_HERO } from '@/lib/funnel/product-images';`).

Change the component signature (lines 56-68) to add `config` first:

```tsx
export function ScanStep({
  config,
  onComplete,
  onBuyDirect,
  reviews,
  caseStudies,
  aggregate,
}: {
  config: ConcernConfig;
  onComplete: (r: ScanResult) => void;
  onBuyDirect: () => void;
  reviews: ReviewCard[];
  caseStudies: CaseStudy[];
  aggregate: { avg: number; count: number };
}) {
```

- [ ] **Step 2: Use config in the two fetch bodies**

In `analyzeReq` (line ~115): change `concern: 'acne',` to `concern: config.concern,`.

In `generateReq` (lines ~123-129): change
```tsx
          concern: 'acne',
          prompt: FUNNEL_AI_PROMPT,
          bundle_slug: ACNE_GLOW.slug,
```
to
```tsx
          concern: config.concern,
          prompt: config.aiPrompt,
          bundle_slug: config.baBundleSlug,
```

- [ ] **Step 3: Use config copy in the JSX**

- Line ~161 headline: `<h1 className="funnel-h1">{config.copy.scanHeadline}</h1>`
- Lines ~162-165 sub: `<p className="funnel-sub">{config.copy.scanSub}</p>`
- Line ~175 step-1 label: `<span className="funnel-step__label">{config.copy.step1Label}</span>`
- Lines ~188-194 hero image:
```tsx
        <NextImage
          src={config.protocolHero}
          alt={config.protocolHeroAlt}
          fill
          sizes="(max-width: 560px) 100vw, 560px"
          style={{ objectFit: 'cover' }}
          priority
        />
```

- [ ] **Step 4: Commit**

```bash
git add components/funnel/ScanStep.tsx
git commit -m "feat(pigmentation): ScanStep driven by concern config"
```

---

## Task 13: Generalize LandingOffer and OfferStep with config

**Files:**
- Modify: `components/funnel/LandingOffer.tsx`
- Modify: `components/funnel/OfferStep.tsx`

- [ ] **Step 1: LandingOffer — add config prop**

In `components/funnel/LandingOffer.tsx`, change the import on line 5 to drop `LEAD_BUNDLE_SLUG`:

```tsx
import { bundleBySlug, bundleSavings, SHIPPING_PKR, FUNNEL_TIMER_KEY } from '@/lib/funnel/offer';
import type { ConcernConfig } from '@/lib/funnel/concern-config';
```

Change the signature (line 19):

```tsx
export function LandingOffer({ config, onBuyNow }: { config: ConcernConfig; onBuyNow: () => void }) {
  const bundle = bundleBySlug(config.leadSlug)!;
```

(The `LowStockTag sku="acne"` on line 56 stays — see note in Task 14.)

- [ ] **Step 2: ScanStep passes config to LandingOffer**

In `components/funnel/ScanStep.tsx` (line ~205), change `<LandingOffer onBuyNow={onBuyDirect} />` to `<LandingOffer config={config} onBuyNow={onBuyDirect} />`.

- [ ] **Step 3: OfferStep — add config prop and replace constants**

In `components/funnel/OfferStep.tsx`:

Change imports (lines 7-17). Replace:
```tsx
import {
  LEAD_BUNDLE_SLUG,
  SHIPPING_PKR,
  FUNNEL_TIMER_KEY,
  FUNNEL_BUNDLES,
  bundleBySlug,
  bundleSavings,
} from '@/lib/funnel/offer';
import { pushFunnelEvent } from '@/lib/funnel/analytics';
import { PRODUCT_META } from '@/lib/products/catalog';
import { BUNDLE_SKUS, ADDON_SKUS, computeCartTotals } from '@/lib/funnel/shop';
```
with:
```tsx
import {
  SHIPPING_PKR,
  FUNNEL_TIMER_KEY,
  bundleBySlug,
  bundleSavings,
} from '@/lib/funnel/offer';
import type { ConcernConfig } from '@/lib/funnel/concern-config';
import { pushFunnelEvent } from '@/lib/funnel/analytics';
import { PRODUCT_META } from '@/lib/products/catalog';
import { computeCartTotals } from '@/lib/funnel/shop';
```

Add `config` to the props (after the opening of the props object, line ~35):
```tsx
export function OfferStep({
  config,
  hero,
  page,
  usedAiPreview,
  aiSessionId,
  reviews,
  caseStudies,
  aggregate,
}: {
  config: ConcernConfig;
  hero: React.ReactNode;
  page: string;
  usedAiPreview: boolean;
  aiSessionId?: string;
  reviews: ReviewCard[];
  caseStudies: CaseStudy[];
  aggregate: { avg: number; count: number };
}) {
```

In the `useEffect` default-select (line ~88): change `addBundle(LEAD_BUNDLE_SLUG);` to `addBundle(config.leadSlug);`.

In `placeOrder` (line ~129): change `concern: 'acne',` to `concern: config.concern,`.

In the bundles map (line ~199): change `{FUNNEL_BUNDLES.map((b) => {` to `{config.bundles.map((b) => {`.

In the products grids (lines ~249, ~253): change `{BUNDLE_SKUS.map(...)}` to `{config.bundleSkus.map(...)}` and `{ADDON_SKUS.map(...)}` to `{config.addonSkus.map(...)}`.

- [ ] **Step 4: Full type-check now that all consumers are updated**

Run: `npx tsc --noEmit`
Expected: no errors. (Fixes any prop mismatch surfaced from Task 10.)

- [ ] **Step 5: Run the test suite**

Run: `npx vitest run`
Expected: PASS — all funnel tests green.

- [ ] **Step 6: Commit**

```bash
git add components/funnel/LandingOffer.tsx components/funnel/OfferStep.tsx components/funnel/ScanStep.tsx
git commit -m "feat(pigmentation): LandingOffer + OfferStep driven by concern config"
```

---

## Task 14: PigmentationLandingContent (SEO copy)

**Files:**
- Create: `components/seo/PigmentationLandingContent.tsx`

- [ ] **Step 1: Write the file** (mirrors `AcneLandingContent.tsx`, reuses `seo-content.css`)

```tsx
// components/seo/PigmentationLandingContent.tsx
/**
 * Server-rendered keyword content for ad/AI crawlers on /pigmentation.
 * Mirrors AcneLandingContent. Facts come from lib/funnel/pigmentation-offer.ts,
 * lib/funnel/evidence.ts (PIGMENTATION_STATS) and lib/seo/pigmentation-faq.ts.
 */
import { PIGMENTATION_STATS } from '@/lib/funnel/evidence';
import { SHIPPING_PKR, bundleBySlug } from '@/lib/funnel/offer';
import { PIGMENTATION_LEAD_SLUG } from '@/lib/funnel/pigmentation-offer';
import { PIGMENTATION_FAQ, PIGMENTATION_RESULTS_DISCLAIMER } from '@/lib/seo/pigmentation-faq';
import '@/components/seo/seo-content.css';

export function PigmentationLandingContent() {
  const lead = bundleBySlug(PIGMENTATION_LEAD_SLUG)!;
  return (
    <section className="seo-content" aria-label="About the Clarté MD pigmentation treatment">
      <h2>How does the AI dark spot scan work?</h2>
      <p>
        The AI skin scan reads a single close-up photo of your skin. Take a clear
        picture of the area with dark spots or uneven tone — a cheek, the forehead,
        the upper lip or the jaw — and our dermatologist-trained AI maps your
        hyperpigmentation, sun damage and post-acne marks. It then projects how your
        skin could look after a consistent 12-week routine. The scan is free, takes a
        few seconds, and carries no obligation to buy. For the most accurate read, get
        close to the area, use natural light, and skip makeup and filters.
      </p>

      <h2>What is the Even Tone Protocol?</h2>
      <p>
        The Even Tone Protocol is a complete 12-week pigmentation treatment: a gentle
        PHA prep cleanser, a vitamin C 15% antioxidant serum, a tranexamic acid 3% +
        kojic + arbutin lightening cream, and a broad-spectrum SPF 50+ to protect your
        progress. Every active is dermatologist-dosed and backed by peer-reviewed
        research.
      </p>
      <table className="seo-evidence">
        <thead>
          <tr><th>Active</th><th>Evidence</th><th>Source</th></tr>
        </thead>
        <tbody>
          {PIGMENTATION_STATS.map((s) => (
            <tr key={s.active}>
              <td>{s.active}</td>
              <td>{s.figure}{s.suffix} {s.context}</td>
              <td className="seo-cite">{s.citation}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Does it help melasma and post-acne marks?</h2>
      <p>
        Yes — most uneven tone in South Asian skin is post-inflammatory
        hyperpigmentation: the brown marks left behind after acne or sun exposure. The
        protocol targets these with vitamin C, tranexamic acid, kojic acid and arbutin,
        which fade discolouration and even out tone over 8 to 16 weeks of consistent
        use. Daily SPF is essential to stop new pigmentation forming. Deep, symmetric
        hormonal melasma can be stubborn and may need an in-person dermatologist.
      </p>

      <h2>How to photograph your pigmentation for an accurate scan</h2>
      <p>
        A good photo gives a more accurate analysis. Get close so the affected area
        fills the frame, face a window or other natural light, hold the phone steady,
        and remove makeup and filters. The rear camera is usually sharper for a tight
        close-up of a single area.
      </p>

      <h2>Pigmentation treatment in Pakistan with cash on delivery</h2>
      <p>
        Clarté MD ships across Pakistan with cash on delivery, so you only pay when your
        order arrives. The complete Even Tone Protocol is PKR {lead.offerPkr.toLocaleString('en-PK')}{' '}
        plus a flat PKR {SHIPPING_PKR} delivery charge — a saving versus buying the four
        products separately. Formulated by dermatologists in London &amp; Lahore.
      </p>
      <p className="seo-disclaimer">{PIGMENTATION_RESULTS_DISCLAIMER}</p>

      <h2>Frequently asked questions</h2>
      <dl className="seo-faq">
        {PIGMENTATION_FAQ.map((f) => (
          <div key={f.q}>
            <dt>{f.q}</dt>
            <dd>{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/seo/PigmentationLandingContent.tsx
git commit -m "feat(pigmentation): add SEO landing content"
```

---

## Task 15: Pigmentation page layout (metadata, OG, GTM/Pixel)

**Files:**
- Create: `app/pigmentation/layout.tsx`

> The root `app/layout.tsx` already renders `<html>`, `<body>`, GTM, Pixel, and `CartProvider`. A nested `app/pigmentation/layout.tsx` must NOT re-render those — it only overrides `metadata`. Next.js merges nested metadata over the root.

- [ ] **Step 1: Write the file**

```tsx
// app/pigmentation/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Dark Spot Scan & 12-Week Pigmentation Treatment in Pakistan | Clarté MD',
  description:
    'Free AI skin scan — snap a close-up, see your dark spots projected 12 weeks ahead, and get a dermatologist-grade pigmentation protocol. Cash on delivery across Pakistan.',
  keywords: [
    'pigmentation treatment Pakistan',
    'dark spots treatment',
    'uneven skin tone',
    'hyperpigmentation treatment',
    'melasma treatment Pakistan',
    'skin brightening Pakistan',
    'vitamin C serum Pakistan',
    'cash on delivery skincare',
  ],
  alternates: { canonical: '/pigmentation' },
  openGraph: {
    type: 'website',
    siteName: 'Clarté MD',
    url: '/pigmentation',
    title: 'AI Dark Spot Scan & 12-Week Pigmentation Treatment in Pakistan | Clarté MD',
    description:
      'Free AI skin scan — see your dark spots projected 12 weeks ahead and get a dermatologist-grade pigmentation protocol. Cash on delivery across Pakistan.',
    images: ['https://clartemd.com.pk/protocols/even-tone-protocol/hero.webp'],
  },
  robots: { index: true, follow: true },
  other: {
    'product:retailer_item_id': 'even-tone-protocol',
    'product:availability': 'in stock',
    'product:price:amount': '6999',
    'product:price:currency': 'PKR',
  },
};

export default function PigmentationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/pigmentation/layout.tsx
git commit -m "feat(pigmentation): add page metadata + og:product"
```

---

## Task 16: Pigmentation page

**Files:**
- Create: `app/pigmentation/page.tsx`

- [ ] **Step 1: Write the file**

```tsx
// app/pigmentation/page.tsx
import { ScanFunnel } from '@/components/funnel/ScanFunnel';
import { getPigmentationReviews } from '@/lib/reviews/pigmentation-queries';
import { JsonLd } from '@/components/seo/JsonLd';
import { pigmentationProductLd, pigmentationFaqLd } from '@/lib/seo/pigmentation-jsonld';
import { PigmentationLandingContent } from '@/components/seo/PigmentationLandingContent';

// Pigmentation ad landing. Re-fetch reviews at most every 5 min.
export const revalidate = 300;

export default async function Page() {
  const { reviews, caseStudies, aggregate } = await getPigmentationReviews();
  return (
    <>
      <JsonLd data={pigmentationProductLd({ aggregate, reviews })} />
      <JsonLd data={pigmentationFaqLd()} />
      <ScanFunnel concern="pigmentation" reviews={reviews} caseStudies={caseStudies} aggregate={aggregate} />
      <PigmentationLandingContent />
    </>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors anywhere.

- [ ] **Step 3: Commit**

```bash
git add app/pigmentation/page.tsx
git commit -m "feat(pigmentation): add /pigmentation page"
```

---

## Task 17: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Restart the dev server**

```bash
taskkill //F //IM node.exe; npm run dev
```
Wait for `✓ Ready`.

- [ ] **Step 2: Homepage (acne) regression check**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/`
Expected: `200`. Then confirm acne SKUs still present:
Run: `curl -s http://localhost:3000/ | grep -o '"sku":"acne-solo-protocol"' | head -1`
Expected: one match.

- [ ] **Step 3: Pigmentation page renders**

Run: `curl -s -o /tmp/pig.html -w "%{http_code}\n" http://localhost:3000/pigmentation`
Expected: `200`.

- [ ] **Step 4: Pigmentation SKU + JSON-LD present**

Run: `curl -s http://localhost:3000/pigmentation | grep -o '"sku":"even-tone-protocol"'`
Expected: at least one match.
Run: `curl -s http://localhost:3000/pigmentation | grep -o 'product:retailer_item_id'`
Expected: at least one match (the og:product tag).

- [ ] **Step 5: Pigmentation copy present**

Run: `curl -s http://localhost:3000/pigmentation | grep -o 'Even Tone Protocol' | head -1`
Expected: a match.
Run: `curl -s http://localhost:3000/pigmentation | grep -o 'tranexamic' | head -1`
Expected: a match (SEO content rendered).

- [ ] **Step 6: Order creation with the pigmentation protocol**

```bash
curl -s -X POST http://localhost:3000/api/create-order \
  -H "Content-Type: application/json" \
  -d '{"concern":"pigmentation","page":"/pigmentation","contact":{"name":"Test","phone":"03001234567","email":"t@t.com"},"shipping":{"address":"1 Test St","city":"Lahore"},"payment":"COD","items":[{"sku":"even-tone-protocol","name":"The Even Tone Protocol","qty":1,"price":6999}],"totals":{"subtotal":6999,"shipping":250,"total":7249},"bundle_in_cart":true,"used_ai_preview":false,"ts":"2026-06-14T00:00:00.000Z"}'
```
Expected: `{"ok":true,"order_number":"CLM-..."}`.

- [ ] **Step 7: Check server log is clean**

Read the dev server output file. Expected: no errors/warnings beyond the known `getPigmentationReviews` warning IF the DB has no pigmentation reviews (acceptable — page still renders).

- [ ] **Step 8: Final commit (if any verification fixes were needed)**

```bash
git add -A
git commit -m "test(pigmentation): end-to-end verification"
```

---

## Notes / Known Follow-ups

- **`LowStockTag sku="acne"`** appears in `LandingOffer` (line 56) and `OfferStep` (lines ~191) as hardcoded urgency. It only drives a fake-stock counter (`useFakeStock`) — harmless on the pigmentation page but semantically odd. Left as-is to keep this change focused; a follow-up could make it `config`-driven (e.g. `sku="light"`).
- **Hero image** uses the remote `clartemd.com.pk` URL. Confirm `clartemd.com.pk` is in `next.config.ts` `images.remotePatterns` (it is — see `lib/funnel/product-images.ts` note). Upload a local `public/protocols/even-tone-protocol/hero.webp` later and switch the two references (`pigmentation-offer.ts`, `concern-config.ts`) to the local path.
- **Reviews** show empty until pigmentation reviews exist in the `reviews` table with `subject_ref IN ('prep','vitc','light','spf')` or `'even-tone-protocol'`. The page degrades gracefully.
- **No new DB records, no new API routes** — `/api/create-order` already resolves `even-tone-protocol` from the `bundles` table.
