# Result-page Order CTAs + sticky attention cart — design

**Date:** 2026-06-04
**Branch:** `feat/no-photo-quiz-funnel`
**Status:** Approved, ready for implementation plan

## Goal

Add prominent ordering calls-to-action and an attention-grabbing cart to the
funnel **result page** (`components/funnel/OfferStep.tsx`), to lift conversion
from the result/offer screen into a placed COD order.

The result page is shared by **both** the quiz funnel (`page="quiz-funnel"`)
and the selfie scan funnel (`page="scan-funnel"`), so every change here applies
to both result screens. This is intended.

## Requirements (from the user)

1. An **"Order Now"** button immediately after the before/after result.
2. An **"Order Now"** button after the protocol listings.
3. An **"Order on WhatsApp"** button.
4. A **cart** that, by default, contains the Acne Glow Protocol and **attracts
   the user's attention**.

## Approved decisions

| Question | Decision |
|---|---|
| What do the "Order Now" buttons do? | Smooth-scroll to the existing COD checkout form (reuse current flow, no new checkout logic). |
| What does "Order on WhatsApp" do? | Open WhatsApp chat to `923249986822` with a **prefilled message** listing the selected protocol + total PKR. |
| How does the attention cart appear? | A **sticky bottom bar** pinned to the viewport, showing protocol + total + a Checkout button, with a subtle pulse/glow. |
| Where does "Order on WhatsApp" live? | **Once**, inside the sticky bottom bar. |

## Existing architecture (what we build on)

- `OfferStep.tsx` is the result page. On mount it already calls
  `clearCart()` then `addBundle(ACNE_GLOW.slug)` (`OfferStep.tsx:79-84`), so the
  cart **already defaults to the Acne Glow Protocol**. Requirement 4's "default
  contents" is satisfied; the work is making it visible and persuasive.
- Cart state comes from `useCart()` (`lib/cart/use-cart.ts`); totals from
  `computeCartTotals(cart)` (`lib/funnel/shop.ts`); the live summary is rendered
  by `OrderSummary.tsx`.
- Checkout is a COD `<form>` in `OfferStep.tsx` (`OfferStep.tsx:215-232`) that
  POSTs to `/api/create-order`. **No server/API changes are needed.**
- WhatsApp number `923249986822` is already used on the order page
  (`app/order/[number]/page.tsx:155`).
- Funnel analytics fire via `pushFunnelEvent(event, params)` into the GTM
  `dataLayer` (`lib/funnel/analytics.ts`).
- Styling uses a `funnel-*` BEM-ish class convention in the funnel CSS files
  imported by `QuizFunnel.tsx` (`funnel.css`, `quiz.css`).

## Components & changes

### A. "Order Now" buttons (smooth-scroll to COD form)

- In `OfferStep.tsx`, attach a `ref` (and an `id="cod-checkout"`) to the
  existing COD `<form>`, and add a `scrollToCheckout()` helper that calls
  `formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })`.
- **Button #1** rendered directly after `{hero}`.
- **Button #2** rendered directly after the `funnel-bundles` block (the
  "Choose your protocol" cards).
- Both reuse the primary CTA appearance (`funnel-cta` styling) and fire
  `order_now_clicked` with `{ placement: 'hero' | 'after-protocols' }`.

### B. Sticky bottom-bar cart (`components/funnel/StickyCartBar.tsx` — new)

- Client component rendered inside `OfferStep` (so it can share
  `scrollToCheckout`).
- Reads `useCart()` + `computeCartTotals()` for live name/total.
- Displays: 🛒 icon, selected protocol name (or item count if mixed), **total
  PKR**, a **"Checkout →"** button (`scrollToCheckout()`, fires
  `sticky_checkout_clicked`), and an **"Order on WhatsApp"** button (section C).
- **Visibility rules:**
  - Hidden when `cart.items.length === 0`.
  - Auto-hidden when the COD form is on screen (IntersectionObserver on the form
    element) so it never covers the "Confirm my order" submit button.
- Subtle attention animation (CSS pulse/glow keyframes), respecting
  `prefers-reduced-motion`.
- The result `<section>` gets bottom padding equal to the bar height so the bar
  never obscures page content.

### C. "Order on WhatsApp" (prefilled cart message) — `lib/funnel/whatsapp.ts` (new)

- Exports `WHATSAPP_NUMBER = '923249986822'`.
- Exports `buildWhatsAppOrderLink(cart): string` → builds
  `https://wa.me/923249986822?text=<encodeURIComponent(message)>`. The message
  lists each cart line item (name × qty) and the total PKR, with a short intro
  line so the team has order context.
- Rendered in the sticky bar; opens in a new tab
  (`target="_blank" rel="noopener"`); fires `whatsapp_order_clicked`.

### D. Analytics (`lib/funnel/analytics.ts`)

- Add three event names to the `FunnelEvent` union:
  `order_now_clicked`, `whatsapp_order_clicked`, `sticky_checkout_clicked`.

### E. Styling (funnel CSS)

- New rules: `.funnel-sticky-bar` (and inner elements), pulse/glow keyframes,
  and the order-now button row — following the existing `funnel-*` naming.
  Added to the funnel CSS imported by the result page.

## Data flow

```
useCart() ──┬─> OrderSummary (existing)
            ├─> StickyCartBar ──> total/name display
            │                  ├─> Checkout button ─> scrollToCheckout() ─> COD form
            │                  └─> WhatsApp button ─> buildWhatsAppOrderLink(cart) ─> wa.me
            └─> COD form submit ─> /api/create-order (unchanged)
```

## Out of scope (YAGNI)

- No new checkout/express-modal flow — buttons scroll to the existing form.
- No server, schema, or `/api/create-order` changes.
- No changes to the landing/quiz/lead steps — result page only.
- WhatsApp ordering is a hand-off to chat; it does not auto-create a DB order.

## Testing / verification

- Manual: load the result page (both `/` quiz result and `/scan` result) →
  confirm both "Order Now" buttons smooth-scroll to the COD form; sticky bar
  shows the protocol + correct total; bar hides when cart emptied and when the
  form is in view; WhatsApp button opens a chat with a correct prefilled order
  summary; `dataLayer` receives the three new events.
- Unit (if a test harness fits): `buildWhatsAppOrderLink` produces a correctly
  encoded `wa.me` URL with the expected line items and total for a sample cart.
