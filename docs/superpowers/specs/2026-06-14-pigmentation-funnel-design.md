# Pigmentation Funnel — Design Spec
**Date:** 2026-06-14
**Status:** Approved — ready for implementation
**URL:** `/pigmentation`
**Protocol:** The Even Tone Protocol (`even-tone-protocol`) · ₨6,999

---

## 1. Overview

Duplicate the existing acne scan funnel at `/pigmentation` targeting users searching for dark spot, uneven skin tone, and hyperpigmentation treatment in Pakistan. The page uses the existing `even-tone-protocol` from the database (no new DB records needed), concern-specific AI prompts, pigmentation-filtered reviews, and pigmentation SEO copy — while reusing every UI component unchanged.

**Approach: Approach A — New data files, minimal additive component changes.**
The acne funnel at `/` is untouched. Three existing components (`ScanFunnel`, `LandingOffer`, `OfferStep`) receive additive props with acne defaults — no existing callers change.

---

## 2. File Structure

### New files
```
app/pigmentation/
  layout.tsx                          ← metadata, OG, JSON-LD, GTM/Pixel (same IDs)
  page.tsx                            ← server component, fetches reviews, renders funnel

lib/funnel/
  pigmentation-offer.ts               ← PIGMENTATION_BUNDLES, PIGMENTATION_LEAD_SLUG

lib/reviews/
  pigmentation-queries.ts             ← getPigmentationReviews()

lib/ai/
  pigmentation-prompts.ts             ← PIGMENTATION_BA_PROMPT, PIGMENTATION_ANALYSIS_PROMPT

lib/seo/
  pigmentation-faq.ts                 ← PIGMENTATION_FAQ (6 items, FaqItem[] type)
  pigmentation-jsonld.ts              ← productLd + faqLd for pigmentation

components/seo/
  PigmentationLandingContent.tsx      ← SEO long-form copy (mirrors AcneLandingContent)

public/protocols/even-tone-protocol/
  hero.webp                           ← ⚠ MISSING — use clartemd.com.pk remote URL until uploaded
```

### Unchanged (reused as-is)
- All funnel UI components: `ScanFunnel`, `OfferStep`, `LandingOffer`, `ProductCard`, `OrderSummary`, `StickyCartBar`, `Reviews`, `CaseStudies`, `ClinicalProof`, `CountdownTimer`, `LowStockTag`, `TrustStrip`, `OrderTicker`, `StarRating`
- All API routes: `/api/ai/analyze-skin`, `/api/generate-after`, `/api/lead`, `/api/create-order`
- GTM container `GTM-WPMSC53Q` and Meta Pixel `1506593321048508`

---

## 3. Data Layer

### `lib/funnel/pigmentation-offer.ts`
```ts
export const PIGMENTATION_LEAD_SLUG = 'even-tone-protocol'

export const PIGMENTATION_BUNDLES = [
  {
    slug: 'even-tone-protocol',
    name: 'The Even Tone Protocol',
    concern: 'pigmentation',
    offerPkr: 6999,
    tagline: 'Complete 12-week pigmentation routine',
    description: 'Targets dark spots, uneven skin tone and post-inflammatory hyperpigmentation
                  with Vitamin C 15%, Tranexamic Acid 3%, Kojic, Arbutin and SPF 50+ PA++++ —
                  dermatologist-dosed.',
    hero: 'https://clartemd.com.pk/protocols/even-tone-protocol/hero.webp', // remote until local asset uploaded
    itemSkus: ['prep', 'vitc', 'light', 'spf']
  }
]
```

**Savings math:**
- List price: prep ₨2,000 + vitc ₨2,950 + light ₨4,500 + spf ₨2,500 = **₨11,950**
- Offer: **₨6,999**
- Savings: **₨4,951 (41% off)**

**Protocol card layout (single card, pre-selected on page load):**
- Pre-selected via `addBundle(PIGMENTATION_LEAD_SLUG)` in `useEffect`
- Individual add-on grid shows: `rescue`, `acne`, `ha`, `reti` (products NOT in the protocol)

### `lib/reviews/pigmentation-queries.ts`
```sql
WHERE status = 'approved'
  AND (
    (subject_type = 'product'  AND subject_ref IN ('prep','vitc','light','spf'))
    OR (subject_type = 'protocol' AND subject_ref = 'even-tone-protocol')
  )
ORDER BY rating DESC, review_date DESC
```
Returns `ReviewsResult` (same type as `getAcneReviews`). Degrades gracefully with `console.warn` — returns `{ reviews: [], caseStudies: [], aggregate: { avg: 0, count: 0 } }` on any DB error.

### `lib/seo/pigmentation-faq.ts`
Six FAQs covering:
1. How the AI pigmentation scan works
2. Suitability for Pakistan skin tones (melanin-rich skin, sun exposure)
3. Dark spots vs. melasma — what this protocol treats
4. Price and payment (₨6,999 COD, flat ₨250 shipping)
5. Timeline (8–12 weeks, vitamin C/tranexamic evidence cited)
6. AI preview disclaimer

---

## 4. AI Layer

### `lib/ai/pigmentation-prompts.ts`

**`PIGMENTATION_BA_PROMPT`** (replaces `ACNE_BA_PROMPT` for this funnel):
```
Generate a photorealistic projection of this person's skin after 12 weeks of consistent
pigmentation treatment with a Vitamin C 15% + Tranexamic Acid 3% + Kojic Acid + Arbutin
+ SPF 50+ PA++++ regimen. Show: visibly faded dark spots and post-inflammatory
hyperpigmentation, more even skin tone, reduced discolouration, brighter complexion.
Critical: keep identity, ethnicity, age, hair, lighting, framing and pose IDENTICAL.
Realistic clinical improvement only — no airbrushing, no skin-lightening beyond what a
dermatologist would expect from these actives.
```

**`PIGMENTATION_ANALYSIS_PROMPT`** (replaces `ANALYSIS_PROMPT` for this funnel):
- Same structure and safety rules as the acne prompt
- `primary_concerns` anchored to: hyperpigmentation, melasma, uneven tone, sun damage, PIH
- `recommended_protocol` defaults to `even-tone-protocol`; escalates to `see-doctor-in-person` for suspected true melasma or rapidly-changing pigmentation
- `recommended_actives`: Vitamin C 15%, Tranexamic Acid 3%, Kojic Acid, Arbutin, SPF 50+
- Adds melasma screening: if asymmetric, hormone-linked, or rapidly changing → `warnings` flag + `see-doctor-in-person`

**Wiring (no new API routes):**
Both `/api/ai/analyze-skin` and `/api/generate-after` already accept a `concern` field.
Add a `concern` switch in each route handler:
```ts
const prompt = input.concern === 'pigmentation'
  ? PIGMENTATION_ANALYSIS_PROMPT
  : ANALYSIS_PROMPT
```
Same pattern for the before/after generator. Same API keys, same rate limiting, same session DB table.

---

## 5. Page & SEO

### `app/pigmentation/layout.tsx`
```
title:       "AI Dark Spot Scan & 12-Week Pigmentation Treatment in Pakistan | Clarté MD"
description: "Free AI skin scan — see your dark spots projected 12 weeks ahead and get a
              dermatologist-grade pigmentation protocol. Cash on delivery across Pakistan."
og:type:     website
og:image:    /protocols/even-tone-protocol/hero.webp (or remote URL)
canonical:   /pigmentation
og:product:retailer_item_id: even-tone-protocol
product:availability:        in stock
product:price:amount:        6999
product:price:currency:      PKR

keywords: pigmentation treatment Pakistan, dark spots treatment, uneven skin tone,
          hyperpigmentation treatment, melasma Pakistan, skin brightening Pakistan,
          vitamin C serum Pakistan, cash on delivery skincare
```

GTM + Meta Pixel: identical snippets to root layout. Same container and pixel IDs. `fbq('track', 'PageView')` fires on load. Purchase/Lead events fire via existing `trackMetaPurchase()` / `trackMetaLead()`.

### `app/pigmentation/page.tsx`
```ts
export const revalidate = 300

export default async function Page() {
  const { reviews, caseStudies, aggregate } = await getPigmentationReviews()
  return (
    <>
      <JsonLd data={pigmentationProductLd({ aggregate, reviews })} />
      <JsonLd data={pigmentationFaqLd()} />
      <ScanFunnel
        concern="pigmentation"
        reviews={reviews}
        caseStudies={caseStudies}
        aggregate={aggregate}
      />
      <PigmentationLandingContent />
    </>
  )
}
```

### `lib/seo/pigmentation-jsonld.ts`
- `pigmentationProductLd()` — `schema.org/Product` with `sku: 'even-tone-protocol'`, price ₨6,999, brand Clarté MD, aggregate rating from DB
- `pigmentationFaqLd()` — `schema.org/FAQPage` from `PIGMENTATION_FAQ`

### `components/seo/PigmentationLandingContent.tsx`
Long-form SEO copy rendered below the funnel fold. Topics:
- What causes dark spots and hyperpigmentation (sun, PIH, hormones)
- How the Even Tone Protocol works ingredient by ingredient
- Clinical evidence for Vitamin C, Tranexamic Acid, SPF
- Pakistan-specific context (UV index, skin tones, post-acne marks common in South Asian skin)
- How to use the products (AM/PM routine order)
- FAQPage section (renders `PIGMENTATION_FAQ`)

---

## 6. Existing component changes (additive only)

Three existing components hardcode acne-specific data and need additive prop changes. All changes use defaults so every existing caller (`app/page.tsx`, `app/scan/page.tsx`, `app/quiz/page.tsx`) requires zero changes.

### `lib/funnel/concern-config.ts` (new helper)
A single `getConcernConfig(concern)` lookup that returns the right bundles, lead slug, bundle SKUs, and add-on SKUs for a given concern. Keeps the prop surface small — one config object flows down instead of five separate props.

```ts
export interface ConcernConfig {
  concern: string
  bundles: FunnelBundle[]
  leadSlug: string
  bundleSkus: readonly string[]   // shown in the protocol — individual product list
  addonSkus: readonly string[]    // shown in add-ons grid below
}

// acne (default)
const ACNE_CONFIG: ConcernConfig = {
  concern: 'acne',
  bundles: FUNNEL_BUNDLES,
  leadSlug: LEAD_BUNDLE_SLUG,
  bundleSkus: ['rescue', 'acne', 'vitc', 'reti'],
  addonSkus: ['spf', 'ha', 'prep'],
}

// pigmentation
const PIGMENTATION_CONFIG: ConcernConfig = {
  concern: 'pigmentation',
  bundles: PIGMENTATION_BUNDLES,
  leadSlug: PIGMENTATION_LEAD_SLUG,
  bundleSkus: ['prep', 'vitc', 'light', 'spf'],   // the protocol items
  addonSkus: ['rescue', 'acne', 'ha', 'reti'],     // everything else
}

export function getConcernConfig(concern = 'acne'): ConcernConfig {
  return concern === 'pigmentation' ? PIGMENTATION_CONFIG : ACNE_CONFIG
}
```

### `components/funnel/ScanFunnel.tsx`
Add `concern?: string` prop (default `'acne'`). Calls `getConcernConfig(concern)` and passes the config object down to `LandingOffer` and `OfferStep`.

### `components/funnel/LandingOffer.tsx`
Add `config: ConcernConfig` prop. Replace hardcoded `bundleBySlug(LEAD_BUNDLE_SLUG)` with `bundleBySlug(config.leadSlug)`.

### `components/funnel/OfferStep.tsx`
Add `config: ConcernConfig` prop. Replace:
- `FUNNEL_BUNDLES` → `config.bundles`
- `LEAD_BUNDLE_SLUG` → `config.leadSlug`
- `BUNDLE_SKUS` → `config.bundleSkus`
- `ADDON_SKUS` → `config.addonSkus`

`concern` field on API calls (`/api/lead`, `/api/create-order`, `/api/ai/analyze-skin`, `/api/generate-after`) already accepts any string — slots straight in from `config.concern`.

---

## 7. Error Handling

| Scenario | Behaviour |
|---|---|
| DB unavailable (reviews query) | `console.warn`, returns empty reviews — page renders without social proof |
| No pigmentation reviews in DB yet | Same — aggregate shows 0, review sections hidden gracefully |
| Gemini analysis fails | Existing error path in `/api/ai/analyze-skin` — returns 504, user sees retry message |
| Before/after generation fails | Existing error path in `/api/generate-after` |
| `even-tone-protocol` hero image 404 | Remote `clartemd.com.pk` URL used as fallback until local asset uploaded |

---

## 8. Out of Scope

- New database records (the `even-tone-protocol` bundle already exists)
- New API routes
- Changes to existing acne funnel files (beyond the `concern` prop default on `ScanFunnel`)
- Payment method changes
- Admin dashboard
- Barrier / renewal protocol pages (future)
