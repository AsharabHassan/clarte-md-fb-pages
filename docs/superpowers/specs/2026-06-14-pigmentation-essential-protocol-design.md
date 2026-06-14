# Pigmentation Essential Protocol — Design Spec
**Date:** 2026-06-14
**Status:** Approved

## Goal
Add a second, entry-tier protocol to the `/pigmentation` funnel and make it the default
pre-selected option, mirroring how *Acne Serum Solo* is the default lead on the acne page.
Swap in proper hero imagery for both pigmentation protocols.

## Decisions (approved)
- **Essential = Radiance Prep Cleanser solo** (just `prep`).
- **Exactly 2 protocol cards** on the pigmentation page: Radiance Prep Essential (default) + The Even Tone Protocol.
- **Name:** "Radiance Prep Essential" · **slug:** `even-tone-essentials-protocol` · **price:** ₨1,799.

## Changes

### 1. Database (new bundle so checkout works)
- INSERT `bundles`: slug `even-tone-essentials-protocol`, name "Radiance Prep Essential", concern `pigmentation`, price_pkr 1799.
- INSERT `bundle_items`: that bundle → product `prep`, position 0.

### 2. Images (convert to webp, host locally)
- `Premium_skincare_advertisement...jpeg` (single Prep Cleanser) → `public/protocols/even-tone-essentials-protocol/hero.webp`.
- `recreate_this_picture...jpeg` (4-product lineup) → overwrite `public/protocols/even-tone-protocol/hero.webp` (proper full-protocol hero, replacing the single-bottle stand-in). Also serves as the scan-step hero (path unchanged in config, file content upgraded).
- Both resized to ~1200px webp.

### 3. `lib/funnel/pigmentation-offer.ts`
- `PIGMENTATION_LEAD_SLUG` → `even-tone-essentials-protocol`.
- `PIGMENTATION_BUNDLES` = [essential (first/default), even-tone]. Both heroFit `cover` (landscape lifestyle shots). Essential hero `/protocols/even-tone-essentials-protocol/hero.webp`; even-tone hero stays `/protocols/even-tone-protocol/hero.webp`.

### 4. `lib/funnel/concern-config.ts`
- No change needed: `leadSlug` derives from `PIGMENTATION_LEAD_SLUG`; `protocolHero` already points at `/protocols/even-tone-protocol/hero.webp` (now the 4-product image). `bundles` = `PIGMENTATION_BUNDLES` (now 2).

### 5. Structured data / crawler consistency
- Homepage `lib/seo/jsonld.ts` `EXTRA_PROTOCOLS`: add `even-tone-essentials-protocol` (₨1,799) so it appears in catalog JSON-LD.
- `app/pigmentation/layout.tsx` og:product: add `even-tone-essentials-protocol` retailer_item_id; keep even-tone.
- `lib/seo/pigmentation-jsonld.ts`: lead-based productLd now describes the essential (automatic via lead slug) — acceptable, matches acne pattern.

### Unchanged
- AI bot still recommends `even-tone-protocol` for pigmentation.
- Acne funnel untouched.
- `bundleBySlug` already searches `PIGMENTATION_BUNDLES`, so the new bundle resolves in cart/whatsapp/order-summary automatically.

## Verification
- DB bundle exists; order for `even-tone-essentials-protocol` returns ok.
- `/pigmentation` shows 2 cards, essential pre-selected, both hero images render (optimizer 200).
- tsc clean; acne page unaffected.
