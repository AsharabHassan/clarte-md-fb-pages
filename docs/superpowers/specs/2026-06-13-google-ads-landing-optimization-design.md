# Google Ads Landing Optimization — Design

**Date:** 2026-06-13
**Branch:** `feat/no-photo-quiz-funnel` (or a new `feat/google-ads-landing` off it)
**Goal:** Make the AI photo-scan funnel the primary Google Ads landing page, optimized
for Ad Rank / Quality Score (landing-page relevance + keyword content), readable by
ad/AI crawlers (server-rendered JSON-LD), and guiding the user to take a **close-up
photo of the concern acne area**. Also open the page to organic + AI search (GEO).

## Decisions (from brainstorming)

- **Ad landing = the photo-scan funnel**, served at `/`.
- **Open to AI + organic** crawlers (remove `noindex`; add robots.txt, sitemap, llms.txt, AI-crawler allowlist).
- **Close-up capture** = framing-guide overlay + instructions. **Default camera stays the front/selfie camera (mirrored)**, exactly as today; rear is one tap away via the existing switch button.
- **Keywords** = acne treatment Pakistan, cash on delivery (pimples, acne scars / dark spots, breakouts, dermatologist-grade).
- **Footer = unchanged.** No new footer, no `/privacy` or `/terms` pages.
- Keep a lightweight **results disclaimer** near the before/after + AI projection (ad-policy safety; needs no contact info).
- **Organization** JSON-LD uses name "Clarté MD" + site URL + logo only (no contactPoint).

## Non-goals (YAGNI)

- No footer/privacy/terms changes.
- No contact/business-detail collection.
- No redesign of the funnel steps (quiz, lead, offer) beyond what's listed.
- No changes to AI analysis / order / payment flows.

---

## A. Routing — make the scan funnel the landing

- `app/page.tsx`: render `ScanFunnel` (currently renders `QuizFunnelClient`), plus the new
  server-rendered SEO content section and JSON-LD (see C, D). Keep `revalidate = 300`.
- Move the no-photo quiz to **`app/quiz/page.tsx`** (same body as today's `app/page.tsx`),
  so it stays reachable. `/scan` continues to render `ScanFunnel` (unchanged) — `/` and
  `/scan` then show the same funnel; that's fine.
- `QuizFunnel`'s `onChooseScan` already routes to `/scan`; no change needed. The scan
  funnel has no link back to the quiz today — leave as-is (not required).

**Interface:** `app/page.tsx` becomes a server component that composes
`<JsonLd/>` (head/body script) + `<ScanFunnel/>` + `<AcneLandingContent/>`. It fetches
reviews via `getAcneReviews()` (already used) and passes the aggregate into the JSON-LD
builder for `AggregateRating`.

## B. Close-up photo capture

Files: `components/funnel/CameraCapture.tsx`, `components/funnel/funnel.css`,
`components/funnel/ScanStep.tsx`.

1. **Framing-guide overlay** inside `.funnel-cam-frame`: an absolutely-positioned rounded
   target box (centered, ~70% width, 4:5) with a short caption beneath/over it:
   *"Fill this box with the breakout area — get close, use natural light, no filters."*
   Purely visual (pointer-events: none); does not crop the captured image (we still capture
   the full frame — the box is a guide). Add `aria-hidden` on the decorative box; expose the
   instruction as readable text.
2. **Default camera unchanged**: `facing` stays `'user'`, front view stays mirrored. The
   existing switch button (already shown when >1 camera) lets users flip to rear for a
   sharper close-up. No logic change to defaults.
3. **Pre-camera instruction** in `ScanStep` intro: replace/augment the "Take a selfie"
   subcopy with close-up guidance, e.g. a short helper line above the "Open camera" button:
   *"Take a clear close-up of the area that bothers you most — good light, no makeup or
   filters."* Keep the existing headline/trustline.
4. Upload fallback, switch button, mirror behavior, capture-to-JPEG, and downstream
   analyze/generate flow are **unchanged**.

**Acceptance:** Camera opens to front view (as today); a target box + caption is visible;
flipping to rear works; capture still produces `selfie.jpg` and the funnel proceeds.

## C. Keyword content (server-rendered, in the HTML)

New server component `components/seo/AcneLandingContent.tsx`, rendered by `app/page.tsx`
**below** the funnel so it is always present in the SSR HTML (crawlers do not run JS) and
does not depend on the funnel's client state.

Structure (GEO-aligned: question H2s, 130–165-word self-contained answer blocks, lead answer
in first ~50 words, lists/tables where natural):

- `<h2>` "How does the AI acne scan work?" — explains photo → AI maps acne → 12-week projection.
- `<h2>` "What is the Acne Glow Protocol?" — product summary + **ingredient evidence table**
  built from `ACNE_STATS` (Niacinamide 60% / Azelaic 70% / Salicylic 47%) **with the real
  citations** from `lib/funnel/evidence.ts`. This is the strongest citable block.
- `<h2>` "Does it help acne scars and dark spots?" — PIH / post-acne marks.
- `<h2>` "How to photograph your acne for an accurate scan" — close-up, light, no filters
  (reinforces the capture UX, keyword-rich).
- `<h2>` "Cash on delivery across Pakistan" — COD, shipping (`SHIPPING_PKR = 250`), price
  (`ACNE_GLOW.offerPkr = 6499`) — pulled from `lib/funnel/offer.ts`, not hardcoded.
- `<h2>` "Frequently asked questions" — visible FAQ (4–6 Q&As) that **mirrors** the FAQPage
  JSON-LD in D.

All copy must be accurate to the existing data (prices, ingredients, citations). Include the
results disclaimer line here and near the before/after: *"Illustrative AI projection —
individual results vary."*

Styling: a new `components/seo/seo-content.css` (or extend `funnel.css`) consistent with the
funnel's type/spacing. Keep it readable on mobile (short paragraphs, 2–4 sentences).

## D. Structured data / JSON-LD

New `lib/seo/jsonld.ts` exporting pure builder functions that return plain objects
(serialized with `JSON.stringify`), rendered as
`<script type="application/ld+json" dangerouslySetInnerHTML=...>`:

- `organizationLd()` → `Organization` (name "Clarté MD", `url` = SITE_URL, `logo`). Rendered
  sitewide in `layout.tsx`.
- `webSiteLd()` → `WebSite` (name, url). Sitewide in `layout.tsx`.
- `productLd({ aggregate })` → `Product` "The Acne Glow Protocol" with:
  - `offers` → `Offer`: `price` 6499, `priceCurrency` "PKR", `availability` InStock,
    `url` = SITE_URL. Values from `ACNE_GLOW` / `offer.ts`.
  - `aggregateRating` → from the live reviews `aggregate` ({ avg, count }).
  - a small number of `review` items from the fetched reviews (name, rating, body — trimmed).
- `faqLd()` → `FAQPage` mirroring the visible FAQ in C (same Q&A text).

`organizationLd` + `webSiteLd` go in `layout.tsx`; `productLd` + `faqLd` go in `app/page.tsx`
(the landing). All server-rendered. **Single source of truth:** FAQ Q&A text and product
price/rating are imported from the same modules the visible content uses — no duplication
drift.

## E. Open to AI + organic crawlers

- `app/layout.tsx` `metadata`:
  - `robots: { index: true, follow: true }` (remove the `noindex`).
  - `alternates: { canonical: SITE_URL }`.
  - `openGraph` (title, description, url, siteName, image — reuse `PROTOCOL_HERO` if public-URL-able).
  - Title/description tuned to the keyword theme (e.g. title "AI Acne Scan & 12-Week Acne
    Treatment | Clarté MD — Cash on Delivery Pakistan").
- `app/robots.ts` (Next metadata route): allow all user agents; explicitly list
  **GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot** as allowed; set
  `sitemap` to `${SITE_URL}/sitemap.xml`.
- `app/sitemap.ts`: entries for `/` and `/quiz` (the only crawlable pages; no privacy/terms).
- `public/llms.txt`: title + one-line description; "Main sections" linking `/` and `/quiz`;
  "Key facts" (COD across Pakistan, Acne Glow Protocol PKR 6,499, the three cited ingredient
  stats). Served statically from `public/`.

## F. Config dependency

`NEXT_PUBLIC_SITE_URL` currently defaults to `http://localhost:3001`. For canonical,
OpenGraph, sitemap, robots `sitemap:`, and JSON-LD `url`/`offers.url` to be valid, it **must
be set to the production domain** in the deploy environment. Document this in `.env.example`.
All new code reads the existing `SITE_URL` constant pattern from `layout.tsx`; centralize it
in `lib/seo/site.ts` (`export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'`)
and import from there (layout + jsonld + robots + sitemap) to avoid drift.

---

## Testing

- **Unit (vitest):**
  - `lib/seo/jsonld.ts` — each builder returns a valid shape: `@context`/`@type` present;
    `productLd` reflects `ACNE_GLOW.offerPkr` + passed aggregate; `faqLd` Q count matches the
    FAQ source; `priceCurrency === 'PKR'`.
  - `app/sitemap.ts` returns expected URLs; `app/robots.ts` allows the named AI crawlers and
    sets the sitemap URL.
- **Manual / Playwright:** load `/`, confirm the camera opens to front view with the framing
  overlay + caption, rear switch works, capture proceeds; view-source shows the JSON-LD
  scripts and the SEO content in the initial HTML (JS disabled).
- **External validation (post-deploy):** Google Rich Results Test / Schema validator on the
  live URL.

## Risks / notes

- **Ad-policy risk:** before/after imagery + "see your 12-week skin" AI projection can trip
  Google's *unrealistic/personalized health results* policy. Mitigations in scope: results
  disclaimer + evidence-backed claims with citations. Residual risk remains; monitor
  disapprovals after launch.
- `/` and `/scan` render the same funnel (duplicate). Canonical points to `/`; acceptable.
  If duplicate-content matters later, `redirect('/')` from `/scan` or set its canonical to `/`.
- SEO content stays mounted under the funnel across all funnel phases (below the fold).
  Simplest and best for crawlers; if it harms conversion UX later, gate it to the intro phase.

## Implementation order (for the plan)

1. `lib/seo/site.ts` (SITE_URL) + `lib/seo/jsonld.ts` builders + unit tests.
2. `layout.tsx` metadata (index/canonical/OG) + Organization/WebSite JSON-LD.
3. `app/robots.ts`, `app/sitemap.ts`, `public/llms.txt` + tests.
4. Routing: `app/page.tsx` → ScanFunnel + JSON-LD; new `app/quiz/page.tsx`.
5. `components/seo/AcneLandingContent.tsx` + styles (with disclaimer).
6. Camera overlay + instructions (`CameraCapture.tsx`, `funnel.css`, `ScanStep.tsx`).
7. Manual/Playwright verification + Rich Results validation.
