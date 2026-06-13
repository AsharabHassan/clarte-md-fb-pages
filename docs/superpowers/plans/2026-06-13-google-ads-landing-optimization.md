# Google Ads Landing Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the AI photo-scan funnel the Google Ads landing page at `/`, with a close-up capture guide, server-rendered keyword content + JSON-LD for ad/AI crawlers, and AI/organic crawler access.

**Architecture:** Add a small `lib/seo/*` layer (single-source SITE_URL, FAQ data, JSON-LD builders) consumed by server components. `app/page.tsx` becomes the scan funnel + server-rendered SEO content + Product/FAQ JSON-LD; the quiz moves to `/quiz`. `layout.tsx` gets Organization/WebSite JSON-LD and index/canonical metadata. Add `robots.ts`, `sitemap.ts`, `public/llms.txt`. Camera gets a non-cropping framing-guide overlay (front camera stays the default).

**Tech Stack:** Next.js 15 (App Router, RSC), TypeScript, Vitest. JSON-LD via `<script type="application/ld+json">`. Crawler config via Next metadata routes.

**Spec:** `docs/superpowers/specs/2026-06-13-google-ads-landing-optimization-design.md`

**Conventions:**
- Tests live under `tests/funnel/**` (vitest `include` is `tests/funnel/**/*.test.ts`). New SEO tests go there so they're picked up with no config change.
- Path alias `@/` = project root.
- Run all tests: `npm test`. Run one file: `npx vitest run tests/funnel/<file>.test.ts`.
- Commit after each task.

---

## File Structure

**Create:**
- `lib/seo/site.ts` — single source for `SITE_URL`.
- `lib/seo/faq.ts` — `ACNE_FAQ` data + `RESULTS_DISCLAIMER` (shared by visible FAQ + FAQPage JSON-LD).
- `lib/seo/jsonld.ts` — pure JSON-LD builder functions.
- `components/seo/JsonLd.tsx` — tiny client-safe component that renders a `<script type="application/ld+json">`.
- `components/seo/AcneLandingContent.tsx` — server-rendered keyword content + visible FAQ + disclaimer.
- `components/seo/seo-content.css` — styles for the above.
- `app/robots.ts` — crawler rules (allow all + AI crawlers) + sitemap ref.
- `app/sitemap.ts` — `/` and `/quiz`.
- `app/quiz/page.tsx` — the relocated no-photo quiz funnel.
- `public/llms.txt` — AI-crawler content guide.
- `tests/funnel/seo-jsonld.test.ts`, `tests/funnel/seo-routes.test.ts` — unit tests.

**Modify:**
- `app/page.tsx` — render ScanFunnel + JsonLd(product, faq) + AcneLandingContent.
- `app/layout.tsx` — import SITE_URL; index/canonical/OpenGraph metadata; render Organization + WebSite JSON-LD.
- `components/funnel/CameraCapture.tsx` — framing-guide overlay in the open-camera view.
- `components/funnel/funnel.css` — overlay styles + disclaimer style.
- `components/funnel/ScanStep.tsx` — pre-camera close-up instruction + results disclaimer under the before/after.
- `.env.example` — document that `NEXT_PUBLIC_SITE_URL` must be the production domain.

---

## Task 1: SITE_URL single source

**Files:**
- Create: `lib/seo/site.ts`

- [ ] **Step 1: Create the module**

```ts
// lib/seo/site.ts
/**
 * Single source of truth for the public site origin. Used by metadata,
 * JSON-LD, robots, and sitemap so canonical/absolute URLs never drift.
 * MUST be set to the production domain in deploy env (see .env.example).
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';
```

- [ ] **Step 2: Commit**

```bash
git add lib/seo/site.ts
git commit -m "feat(seo): single-source SITE_URL constant"
```

---

## Task 2: FAQ + disclaimer content

**Files:**
- Create: `lib/seo/faq.ts`

- [ ] **Step 1: Create the content module** (real copy, accurate to offer.ts/evidence.ts)

```ts
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
    a: 'The full Acne Glow Protocol is PKR 6,499 with a flat PKR 250 delivery charge, payable by cash on delivery anywhere in Pakistan. If you prefer a simpler start, a 2-step Acne Essentials Duo is available from PKR 3,499.',
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/seo/faq.ts
git commit -m "feat(seo): landing FAQ content + results disclaimer"
```

---

## Task 3: JSON-LD builders (TDD)

**Files:**
- Create: `lib/seo/jsonld.ts`
- Test: `tests/funnel/seo-jsonld.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/funnel/seo-jsonld.test.ts
import { describe, it, expect } from 'vitest';
import { organizationLd, webSiteLd, productLd, faqLd } from '@/lib/seo/jsonld';
import { ACNE_GLOW } from '@/lib/funnel/offer';
import { ACNE_FAQ } from '@/lib/seo/faq';

describe('jsonld builders', () => {
  it('organizationLd is an Organization with a url', () => {
    const ld = organizationLd();
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Organization');
    expect(typeof ld.url).toBe('string');
  });

  it('webSiteLd is a WebSite', () => {
    expect(webSiteLd()['@type']).toBe('WebSite');
  });

  it('productLd reflects the offer price, currency and aggregate rating', () => {
    const ld = productLd({ aggregate: { avg: 4.8, count: 120 } });
    expect(ld['@type']).toBe('Product');
    expect(ld.offers.price).toBe(String(ACNE_GLOW.offerPkr));
    expect(ld.offers.priceCurrency).toBe('PKR');
    expect(ld.aggregateRating?.ratingValue).toBe('4.8');
    expect(ld.aggregateRating?.reviewCount).toBe(120);
  });

  it('productLd omits aggregateRating when there are no reviews', () => {
    const ld = productLd({ aggregate: { avg: 0, count: 0 } });
    expect(ld.aggregateRating).toBeUndefined();
  });

  it('productLd includes up to 3 reviews when provided', () => {
    const ld = productLd({
      aggregate: { avg: 5, count: 4 },
      reviews: [
        { name: 'A', location: null, rating: 5, body: 'x', verified: true, photo: null },
        { name: 'B', location: null, rating: 4, body: 'y', verified: true, photo: null },
        { name: 'C', location: null, rating: 5, body: 'z', verified: true, photo: null },
        { name: 'D', location: null, rating: 5, body: 'w', verified: true, photo: null },
      ],
    });
    expect(ld.review).toHaveLength(3);
    expect(ld.review?.[0]['@type']).toBe('Review');
  });

  it('faqLd has one Question entity per FAQ item', () => {
    const ld = faqLd();
    expect(ld['@type']).toBe('FAQPage');
    expect(ld.mainEntity).toHaveLength(ACNE_FAQ.length);
    expect(ld.mainEntity[0]['@type']).toBe('Question');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/funnel/seo-jsonld.test.ts`
Expected: FAIL — cannot resolve `@/lib/seo/jsonld` (module not found).

- [ ] **Step 3: Write the implementation**

```ts
// lib/seo/jsonld.ts
/**
 * Pure JSON-LD builders. Return plain objects; the caller serializes with
 * JSON.stringify inside a <script type="application/ld+json">. All facts come
 * from existing single sources (offer.ts, faq.ts, reviews) — no invented data.
 */
import { SITE_URL } from './site';
import { ACNE_GLOW, FUNNEL_BUNDLES } from '@/lib/funnel/offer';
import { ACNE_FAQ } from './faq';
import type { ReviewCard } from '@/lib/reviews/types';

const BRAND = 'Clarté MD';
const LOGO = `${SITE_URL}/protocols/acne-glow-protocol/hero.webp`;

interface OrgLd {
  '@context': string;
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
}
export function organizationLd(): OrgLd {
  return { '@context': 'https://schema.org', '@type': 'Organization', name: BRAND, url: SITE_URL, logo: LOGO };
}

interface SiteLd {
  '@context': string;
  '@type': 'WebSite';
  name: string;
  url: string;
}
export function webSiteLd(): SiteLd {
  return { '@context': 'https://schema.org', '@type': 'WebSite', name: BRAND, url: SITE_URL };
}

interface OfferLd {
  '@type': 'Offer';
  price: string;
  priceCurrency: string;
  availability: string;
  url: string;
}
interface RatingLd {
  '@type': 'AggregateRating';
  ratingValue: string;
  reviewCount: number;
  bestRating: string;
  worstRating: string;
}
interface ReviewLd {
  '@type': 'Review';
  author: { '@type': 'Person'; name: string };
  reviewRating: { '@type': 'Rating'; ratingValue: string; bestRating: string };
  reviewBody: string;
}
interface ProductLd {
  '@context': string;
  '@type': 'Product';
  name: string;
  description: string;
  image: string;
  brand: { '@type': 'Brand'; name: string };
  offers: OfferLd;
  aggregateRating?: RatingLd;
  review?: ReviewLd[];
}

export function productLd({
  aggregate,
  reviews = [],
}: {
  aggregate: { avg: number; count: number };
  reviews?: ReviewCard[];
}): ProductLd {
  const glow = FUNNEL_BUNDLES.find((b) => b.slug === ACNE_GLOW.slug)!;
  const ld: ProductLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: ACNE_GLOW.name,
    description: glow.description,
    image: `${SITE_URL}${glow.hero}`,
    brand: { '@type': 'Brand', name: BRAND },
    offers: {
      '@type': 'Offer',
      price: String(ACNE_GLOW.offerPkr),
      priceCurrency: 'PKR',
      availability: 'https://schema.org/InStock',
      url: SITE_URL,
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

interface FaqLd {
  '@context': string;
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: { '@type': 'Answer'; text: string };
  }>;
}
export function faqLd(): FaqLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ACNE_FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/funnel/seo-jsonld.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/seo/jsonld.ts tests/funnel/seo-jsonld.test.ts
git commit -m "feat(seo): JSON-LD builders (Organization/WebSite/Product/FAQ) + tests"
```

---

## Task 4: JsonLd render component

**Files:**
- Create: `components/seo/JsonLd.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/seo/JsonLd.tsx
/**
 * Renders a JSON-LD <script>. Server-rendered into the initial HTML so
 * crawlers that don't run JS (Google AdsBot, GPTBot, ClaudeBot, etc.) read it.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/seo/JsonLd.tsx
git commit -m "feat(seo): JsonLd render component"
```

---

## Task 5: robots.ts + sitemap.ts (TDD)

**Files:**
- Create: `app/robots.ts`, `app/sitemap.ts`
- Test: `tests/funnel/seo-routes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/funnel/seo-routes.test.ts
import { describe, it, expect } from 'vitest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';

describe('robots', () => {
  it('allows the named AI crawlers and references the sitemap', () => {
    const r = robots();
    const agents = (Array.isArray(r.rules) ? r.rules : [r.rules])
      .flatMap((rule) => (Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent]));
    expect(agents).toEqual(
      expect.arrayContaining(['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot']),
    );
    expect(String(r.sitemap)).toContain('/sitemap.xml');
  });
});

describe('sitemap', () => {
  it('lists the landing and quiz URLs', () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls.some((u) => u.endsWith('/'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/quiz'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/funnel/seo-routes.test.ts`
Expected: FAIL — cannot resolve `@/app/robots` / `@/app/sitemap`.

- [ ] **Step 3: Create robots.ts**

```ts
// app/robots.ts
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      {
        userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot'],
        allow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 4: Create sitemap.ts**

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/quiz`, changeFrequency: 'weekly', priority: 0.8 },
  ];
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/funnel/seo-routes.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add app/robots.ts app/sitemap.ts tests/funnel/seo-routes.test.ts
git commit -m "feat(seo): robots + sitemap routes with AI-crawler allowlist"
```

---

## Task 6: llms.txt

**Files:**
- Create: `public/llms.txt`

- [ ] **Step 1: Create the file** (served statically at `/llms.txt`)

```text
# Clarté MD
> Dermatologist-grade acne treatment in Pakistan. Free AI acne scan that maps your breakouts and projects your skin 12 weeks ahead, plus cash-on-delivery protocols.

## Main pages
- [AI Acne Scan (home)](/): Snap a close-up of your acne, get an AI skin analysis and a 12-week projection, then order the matching protocol.
- [Acne Skin Quiz](/quiz): Answer 4 quick questions (no photo) to get a personalised acne protocol match.

## Key facts
- The Acne Glow Protocol is PKR 6,499 (flat PKR 250 delivery), cash on delivery across Pakistan.
- A 2-step Acne Essentials Duo is available from PKR 3,499.
- Actives are evidence-backed: niacinamide (60% reduction in inflammatory lesions at 8 weeks, Khodaeiani 2013), azelaic acid (70% mean reduction in comedones at 12 weeks, Webster 2000), salicylic acid 2% (47% fewer comedones at 12 weeks, Zander & Weisman 1992).
- Formulated by dermatologists in London & Lahore.
- The 12-week AI preview is an illustrative projection, not a guarantee; individual results vary.
```

- [ ] **Step 2: Commit**

```bash
git add public/llms.txt
git commit -m "feat(seo): add llms.txt AI-crawler content guide"
```

---

## Task 7: Layout metadata + sitewide JSON-LD

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace the SITE_URL local + metadata block**

Replace the existing top of `app/layout.tsx` (the `const SITE_URL = ...` line and the `export const metadata` block) with:

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/cart/provider';
import { FB_PIXEL_ID } from '@/lib/funnel/meta';
import { SITE_URL } from '@/lib/seo/site';
import { JsonLd } from '@/components/seo/JsonLd';
import { organizationLd, webSiteLd } from '@/lib/seo/jsonld';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'AI Acne Scan & 12-Week Acne Treatment in Pakistan | Clarté MD',
  description:
    'Free AI acne scan — snap a close-up, see your skin projected 12 weeks ahead, and get a dermatologist-grade acne protocol. Cash on delivery across Pakistan.',
  applicationName: 'Clarté MD',
  keywords: [
    'acne treatment Pakistan',
    'AI acne scan',
    'pimple treatment Pakistan',
    'acne scars',
    'dark spots',
    'acne protocol',
    'cash on delivery skincare',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Clarté MD',
    url: '/',
    title: 'AI Acne Scan & 12-Week Acne Treatment in Pakistan | Clarté MD',
    description:
      'Free AI acne scan — see your 12-week skin and get a dermatologist-grade protocol. Cash on delivery across Pakistan.',
    images: ['/protocols/acne-glow-protocol/hero.webp'],
  },
  robots: { index: true, follow: true },
};
```

(Remove the old `const SITE_URL = process.env... ;` line — it's now imported.)

- [ ] **Step 2: Render Organization + WebSite JSON-LD in the body**

In the same file, immediately after `<body suppressHydrationWarning>` opening tag (before the Meta Pixel noscript), add:

```tsx
        <JsonLd data={organizationLd()} />
        <JsonLd data={webSiteLd()} />
```

- [ ] **Step 3: Verify it compiles + tests still pass**

Run: `npm test`
Expected: PASS (all existing + new SEO tests).

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(seo): index/canonical/OG metadata + Organization/WebSite JSON-LD"
```

---

## Task 8: Relocate quiz to /quiz; make / the scan funnel + SEO

**Files:**
- Create: `app/quiz/page.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create `app/quiz/page.tsx`** (same behavior the old `/` had)

```tsx
// app/quiz/page.tsx
import { getAcneReviews } from '@/lib/reviews/queries';
import { QuizFunnelClient } from '../QuizFunnelClient';

// No-photo quiz funnel. Re-fetch reviews at most every 5 min.
export const revalidate = 300;

export default async function Page() {
  const data = await getAcneReviews();
  return <QuizFunnelClient data={data} />;
}
```

- [ ] **Step 2: Replace `app/page.tsx`** with the scan funnel + JSON-LD + SEO content

```tsx
// app/page.tsx
import { ScanFunnel } from '@/components/funnel/ScanFunnel';
import { getAcneReviews } from '@/lib/reviews/queries';
import { JsonLd } from '@/components/seo/JsonLd';
import { productLd, faqLd } from '@/lib/seo/jsonld';
import { AcneLandingContent } from '@/components/seo/AcneLandingContent';

// AI photo-scan funnel is the ad landing. Re-fetch reviews at most every 5 min.
export const revalidate = 300;

export default async function Page() {
  const { reviews, caseStudies, aggregate } = await getAcneReviews();
  return (
    <>
      <JsonLd data={productLd({ aggregate, reviews })} />
      <JsonLd data={faqLd()} />
      <ScanFunnel reviews={reviews} caseStudies={caseStudies} aggregate={aggregate} />
      <AcneLandingContent />
    </>
  );
}
```

> NOTE: `AcneLandingContent` is created in Task 9. Run order: this task compiles only after Task 9. If executing strictly task-by-task, do Task 9 before running the dev server / typecheck for Task 8, or temporarily stub the import. Recommended: commit Task 8 and Task 9 together.

- [ ] **Step 3: Commit** (after Task 9 exists, or stub)

```bash
git add app/page.tsx app/quiz/page.tsx
git commit -m "feat(funnel): make photo-scan the landing; move quiz to /quiz"
```

---

## Task 9: Keyword content + visible FAQ + disclaimer

**Files:**
- Create: `components/seo/AcneLandingContent.tsx`, `components/seo/seo-content.css`

- [ ] **Step 1: Create the styles**

```css
/* components/seo/seo-content.css */
.seo-content {
  max-width: 720px;
  margin: 0 auto;
  padding: 2.5rem 1.25rem 4rem;
  color: #1f2430;
  font-size: 1rem;
  line-height: 1.65;
}
.seo-content h2 {
  font-family: var(--font-fraunces, Georgia, serif);
  font-size: 1.4rem;
  line-height: 1.25;
  margin: 2rem 0 0.6rem;
}
.seo-content p { margin: 0 0 0.9rem; }
.seo-disclaimer {
  font-size: 0.85rem;
  color: #6b7280;
  font-style: italic;
}
.seo-evidence {
  width: 100%;
  border-collapse: collapse;
  margin: 0.5rem 0 1rem;
  font-size: 0.92rem;
}
.seo-evidence th,
.seo-evidence td {
  text-align: left;
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid #e7e9ee;
  vertical-align: top;
}
.seo-evidence th { font-weight: 600; }
.seo-faq dt { font-weight: 600; margin-top: 1rem; }
.seo-faq dd { margin: 0.3rem 0 0; }
.seo-cite { color: #6b7280; font-size: 0.85rem; }
```

- [ ] **Step 2: Create the component** (real copy; pulls facts from existing modules)

```tsx
// components/seo/AcneLandingContent.tsx
/**
 * Server-rendered keyword content for ad/AI crawlers. Lives below the funnel
 * so it's always in the SSR HTML regardless of funnel client state. Facts come
 * from lib/funnel/offer.ts, lib/funnel/evidence.ts and lib/seo/faq.ts.
 */
import { ACNE_STATS } from '@/lib/funnel/evidence';
import { ACNE_GLOW, SHIPPING_PKR, ACNE_ESSENTIALS } from '@/lib/funnel/offer';
import { ACNE_FAQ, RESULTS_DISCLAIMER } from '@/lib/seo/faq';
import './seo-content.css';

export function AcneLandingContent() {
  return (
    <section className="seo-content" aria-label="About the Clarté MD acne treatment">
      <h2>How does the AI acne scan work?</h2>
      <p>
        The AI acne scan reads a single close-up photo of your skin. Take a clear
        picture of the area that bothers you most — a cheek, the forehead, the chin
        or the jaw — and our dermatologist-trained AI maps your active breakouts,
        post-acne marks and texture. It then projects how your skin could look after
        a consistent 12-week routine. The scan is free, takes a few seconds, and
        carries no obligation to buy. For the most accurate read, get close to the
        breakout area, use natural light, and skip makeup and filters.
      </p>

      <h2>What is the Acne Glow Protocol?</h2>
      <p>
        The Acne Glow Protocol is a complete 12-week acne treatment: a salicylic
        acid 2% wash to decongest pores, a niacinamide 10% + azelaic acid serum to
        calm active breakouts, plus vitamin C and retinol to fade post-acne marks and
        restore glow. Every active is dermatologist-dosed and backed by peer-reviewed
        research.
      </p>
      <table className="seo-evidence">
        <thead>
          <tr><th>Active</th><th>Evidence</th><th>Source</th></tr>
        </thead>
        <tbody>
          {ACNE_STATS.map((s) => (
            <tr key={s.active}>
              <td>{s.active}</td>
              <td>{s.figure}{s.suffix} {s.context}</td>
              <td className="seo-cite">{s.citation}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Does it help acne scars and dark spots?</h2>
      <p>
        Yes — acne often leaves post-inflammatory hyperpigmentation, the brown and red
        marks left behind after a breakout heals. The protocol targets these marks with
        niacinamide, azelaic acid and vitamin C, which help fade discolouration and even
        out skin tone over 8 to 12 weeks of consistent use, alongside clearing the active
        acne that causes new marks to form.
      </p>

      <h2>How to photograph your acne for an accurate scan</h2>
      <p>
        A good photo gives a more accurate analysis. Get close so the breakout area
        fills the frame, face a window or other natural light, hold the phone steady,
        and remove makeup and filters. You can use the front or rear camera — the rear
        camera is usually sharper for a tight close-up of a single area.
      </p>

      <h2>Acne treatment in Pakistan with cash on delivery</h2>
      <p>
        Clarté MD ships across Pakistan with cash on delivery, so you only pay when your
        order arrives. The full Acne Glow Protocol is PKR {ACNE_GLOW.offerPkr.toLocaleString('en-PK')}{' '}
        with a flat PKR {SHIPPING_PKR} delivery charge. If you prefer a simpler start, the
        Acne Essentials Duo begins at PKR {ACNE_ESSENTIALS.offerPkr.toLocaleString('en-PK')}.
        Formulated by dermatologists in London &amp; Lahore.
      </p>
      <p className="seo-disclaimer">{RESULTS_DISCLAIMER}</p>

      <h2>Frequently asked questions</h2>
      <dl className="seo-faq">
        {ACNE_FAQ.map((f) => (
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

- [ ] **Step 3: Verify it compiles + typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (Confirms `app/page.tsx` from Task 8 now resolves.)

- [ ] **Step 4: Commit**

```bash
git add components/seo/AcneLandingContent.tsx components/seo/seo-content.css
git commit -m "feat(seo): keyword landing content, evidence table + visible FAQ"
```

---

## Task 10: Close-up camera guide + instructions + disclaimer

**Files:**
- Modify: `components/funnel/CameraCapture.tsx`, `components/funnel/funnel.css`, `components/funnel/ScanStep.tsx`

- [ ] **Step 1: Add the framing-guide overlay to the open-camera view**

In `components/funnel/CameraCapture.tsx`, inside the `if (open) { return (...) }` block, within `<div className="funnel-cam-frame">`, add the overlay right after the `<video ... />` element (before the `{starting && ...}` block):

```tsx
          {/* Non-cropping framing guide: helps the user fill the frame with the
              concern area. Purely visual — capture still uses the full frame. */}
          <div className="funnel-cam-guide" aria-hidden="true" />
          <p className="funnel-cam-hint">
            Fill this box with the breakout area — get close, use natural light, no filters.
          </p>
```

- [ ] **Step 2: Add overlay + disclaimer styles**

Append to `components/funnel/funnel.css`:

```css
/* Close-up framing guide overlay (CameraCapture) */
.funnel-cam-frame { position: relative; }
.funnel-cam-guide {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70%;
  aspect-ratio: 4 / 5;
  transform: translate(-50%, -55%);
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.25);
  pointer-events: none;
}
.funnel-cam-hint {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  width: min(86%, 22rem);
  margin: 0;
  text-align: center;
  font-size: 0.8rem;
  line-height: 1.35;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}
/* Results disclaimer near before/after imagery */
.funnel-disclaimer {
  margin: 0.4rem 0 0;
  text-align: center;
  font-size: 0.8rem;
  font-style: italic;
  color: #8a8f9a;
}
```

- [ ] **Step 3: Add pre-camera instruction + disclaimer in ScanStep**

In `components/funnel/ScanStep.tsx`:

(a) Add the import near the other lib imports:

```tsx
import { RESULTS_DISCLAIMER } from '@/lib/seo/faq';
```

(b) Replace the existing intro subcopy paragraph

```tsx
      <p className="funnel-sub">
        Take a selfie. Our dermatologist-trained AI maps your acne and projects your
        skin after the 12-week protocol — free, in seconds.
      </p>
```

with:

```tsx
      <p className="funnel-sub">
        Take a clear close-up of the area that bothers you most. Our dermatologist-trained
        AI maps your acne and projects your skin after the 12-week protocol — free, in seconds.
      </p>
```

(c) Add a results disclaimer directly under the CaseStudies before/after. Replace

```tsx
      <CaseStudies cases={caseStudies} heading="Real 12-week before & afters" />
```

with:

```tsx
      <CaseStudies cases={caseStudies} heading="Real 12-week before & afters" />
      <p className="funnel-disclaimer">{RESULTS_DISCLAIMER}</p>
```

- [ ] **Step 4: Verify compile + tests**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm test`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add components/funnel/CameraCapture.tsx components/funnel/funnel.css components/funnel/ScanStep.tsx
git commit -m "feat(funnel): close-up framing guide, capture instructions + results disclaimer"
```

---

## Task 11: Document env + final verification

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Ensure `.env.example` documents the production URL requirement**

Confirm `.env.example` has a `NEXT_PUBLIC_SITE_URL` entry; if missing or vague, set its comment to:

```
# Public origin of the deployed site. MUST be the production domain (https://...)
# — used for canonical URLs, OpenGraph, sitemap.xml, robots sitemap ref, and JSON-LD.
NEXT_PUBLIC_SITE_URL=https://your-production-domain
```

- [ ] **Step 2: Full test + typecheck + build**

Run: `npm test`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds; `/`, `/quiz`, `/scan`, `/robots.txt`, `/sitemap.xml` all appear in the route list.

- [ ] **Step 3: Manual verification (dev server)**

Run: `npm run dev` then load `http://localhost:3001/`.
Confirm:
- Landing shows the photo-scan funnel (Open camera CTA), not the quiz.
- "Open camera" → camera opens to the **front** view with the framing-guide box + hint caption; switch button flips to rear.
- Scrolling down shows the keyword content (H2s), the evidence table with citations, and the FAQ.
- View source (or disable JS) shows: the JSON-LD `<script type="application/ld+json">` blocks (Organization, WebSite, Product, FAQPage) AND the SEO content text present in the initial HTML.
- `http://localhost:3001/quiz` shows the no-photo quiz.
- `http://localhost:3001/robots.txt` lists the AI crawlers + sitemap; `http://localhost:3001/sitemap.xml` lists `/` and `/quiz`; `http://localhost:3001/llms.txt` serves.

- [ ] **Step 4: Commit**

```bash
git add .env.example
git commit -m "docs(seo): document NEXT_PUBLIC_SITE_URL production requirement"
```

- [ ] **Step 5: Post-deploy (manual, external)**

After deploying with a real `NEXT_PUBLIC_SITE_URL`, validate the live URL with Google's Rich Results Test / Schema Markup Validator (Product, FAQPage, Organization). Note: FAQ rich results are limited to certain site types, but the markup still aids ad/AI crawler comprehension.

---

## Self-Review

**Spec coverage:**
- A (scan = landing, quiz → /quiz): Task 8. ✓
- B (close-up overlay + instructions, front default): Task 10. ✓
- C (keyword content, evidence table, FAQ): Task 9. ✓
- D (Organization/WebSite/Product+Offer+AggregateRating+Review/FAQPage JSON-LD): Tasks 3, 4, 7, 8. ✓
- E (index/canonical/OG, robots, sitemap, llms.txt): Tasks 5, 6, 7. ✓
- F (SITE_URL config): Tasks 1, 11. ✓
- Footer unchanged / no privacy-terms: honored (no such tasks). ✓
- Results disclaimer: Tasks 2, 9, 10. ✓

**Placeholder scan:** No TBD/TODO; all code blocks are complete; all copy is written out. ✓

**Type consistency:** `productLd`/`faqLd`/`organizationLd`/`webSiteLd` signatures match between Task 3 (definition), Task 7 (layout use), Task 8 (page use), and Task 3 tests. `ACNE_FAQ`/`RESULTS_DISCLAIMER` from `lib/seo/faq.ts` used consistently in Tasks 9 & 10. `SITE_URL` import path `@/lib/seo/site` consistent across Tasks 3, 5, 7. `aggregate: { avg, count }` matches `ReviewsResult`. ✓

**Cross-task note:** Tasks 8 and 9 are mutually dependent at compile time (page imports AcneLandingContent); flagged in Task 8 — implement 9 before typechecking, or commit together.
