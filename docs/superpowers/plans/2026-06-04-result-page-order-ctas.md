# Result-page Order CTAs + Sticky Attention Cart — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two "Order Now" buttons, a prefilled "Order on WhatsApp" action, and an attention-grabbing sticky bottom-bar cart to the funnel result page.

**Architecture:** All work is client-side in the funnel UI. A new pure helper builds a `wa.me` deep link from the live cart; a new `StickyCartBar` component renders the pinned bar; `OfferStep.tsx` gains a form ref + smooth-scroll helper and renders the new buttons/bar. The cart already auto-loads the Acne Glow Protocol on mount, so no checkout/API changes are needed.

**Tech Stack:** Next.js (App Router), React client components, TypeScript, Vitest (node env), plain CSS (`funnel-*` convention), lucide-react icons.

---

## File Structure

- **Create** `lib/funnel/whatsapp.ts` — `WHATSAPP_NUMBER`, `buildWhatsAppOrderMessage(cart)`, `buildWhatsAppOrderLink(cart)`. Pure, unit-tested.
- **Create** `tests/funnel/whatsapp.test.ts` — unit tests for the helper.
- **Create** `components/funnel/StickyCartBar.tsx` — the pinned attention bar (checkout + WhatsApp).
- **Modify** `lib/funnel/analytics.ts` — add 3 event names to the `FunnelEvent` union.
- **Modify** `components/funnel/OfferStep.tsx` — form ref, `scrollToCheckout()`, IntersectionObserver, two "Order Now" buttons, render `<StickyCartBar>`.
- **Modify** `components/funnel/funnel.css` — order-now button + sticky-bar styles, section bottom padding, pulse keyframes.

Reference values confirmed in the codebase:
- WhatsApp number: `923249986822` (`app/order/[number]/page.tsx:155`).
- Brand primary: `#2e5ba8`; `.funnel-cta` is the primary button (`funnel.css:11`).
- Cart label sources: bundle → `bundleBySlug(slug)?.name`; product → `PRODUCT_META[sku]?.shortName` (matches `OrderSummary.tsx`).
- Totals: `computeCartTotals(cart).totalPkr` (`lib/funnel/shop.ts:28`). Acne Glow total = 6499 + 250 shipping = **6749**.
- Vitest only includes `tests/funnel/**/*.test.ts` (`vitest.config.ts:16`), node environment (no DOM) — so only the pure helper is unit-tested; UI is verified manually.

---

### Task 1: WhatsApp order-link helper (TDD)

**Files:**
- Create: `lib/funnel/whatsapp.ts`
- Test: `tests/funnel/whatsapp.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/funnel/whatsapp.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { Cart } from '@/lib/cart/types';
import {
  WHATSAPP_NUMBER,
  buildWhatsAppOrderMessage,
  buildWhatsAppOrderLink,
} from '@/lib/funnel/whatsapp';

const acneGlowCart: Cart = {
  items: [{ type: 'bundle', slug: 'acne-glow-protocol', qty: 1 }],
  createdAt: 0,
};

describe('whatsapp order link', () => {
  it('exposes the brand WhatsApp number', () => {
    expect(WHATSAPP_NUMBER).toBe('923249986822');
  });

  it('writes a message naming the protocol and its total (incl. shipping)', () => {
    const msg = buildWhatsAppOrderMessage(acneGlowCart);
    expect(msg).toContain('The Acne Glow Protocol');
    expect(msg).toContain('PKR 6,749'); // 6499 + 250 shipping
  });

  it('shows quantity for stacked products', () => {
    const msg = buildWhatsAppOrderMessage({
      items: [{ type: 'product', sku: 'spf', qty: 2 }],
      createdAt: 0,
    });
    expect(msg).toContain('×2');
  });

  it('builds a wa.me link with the URL-encoded message', () => {
    const link = buildWhatsAppOrderLink(acneGlowCart);
    expect(link.startsWith('https://wa.me/923249986822?text=')).toBe(true);
    const text = decodeURIComponent(link.split('text=')[1]);
    expect(text).toBe(buildWhatsAppOrderMessage(acneGlowCart));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/funnel/whatsapp.test.ts`
Expected: FAIL — cannot resolve `@/lib/funnel/whatsapp` (module not found).

- [ ] **Step 3: Write the implementation**

Create `lib/funnel/whatsapp.ts`:

```ts
/**
 * Builds a WhatsApp "click-to-chat" deep link prefilled with the live cart
 * contents, so a customer can place a COD order by chat and the team has full
 * order context. Pure + display-only — the server stays price-authoritative.
 */
import type { Cart } from '@/lib/cart/types';
import { PRODUCT_META } from '@/lib/products/catalog';
import { bundleBySlug } from './offer';
import { computeCartTotals } from './shop';

/** Brand WhatsApp number (same one used on the order page). */
export const WHATSAPP_NUMBER = '923249986822';

/** Human label for a cart line — bundle name or product short name. */
export function cartItemLabel(item: Cart['items'][number]): string {
  if (item.type === 'bundle') return bundleBySlug(item.slug)?.name ?? item.slug;
  return PRODUCT_META[item.sku]?.shortName ?? PRODUCT_META[item.sku]?.name ?? item.sku;
}

/** The chat message body listing each line + the total (incl. flat shipping). */
export function buildWhatsAppOrderMessage(cart: Cart): string {
  const lines = cart.items.map((i) => {
    const qty = i.qty > 1 ? ` ×${i.qty}` : '';
    return `• ${cartItemLabel(i)}${qty}`;
  });
  const { totalPkr } = computeCartTotals(cart);
  return [
    'Hi! I’d like to order my acne protocol (Cash on Delivery):',
    '',
    ...lines,
    '',
    `Total: PKR ${totalPkr.toLocaleString()} (incl. shipping)`,
  ].join('\n');
}

/** `https://wa.me/<number>?text=<encoded message>`. */
export function buildWhatsAppOrderLink(cart: Cart): string {
  const text = encodeURIComponent(buildWhatsAppOrderMessage(cart));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/funnel/whatsapp.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/funnel/whatsapp.ts tests/funnel/whatsapp.test.ts
git commit -m "feat(funnel): WhatsApp order-link helper from live cart"
```

---

### Task 2: Add the three analytics events

**Files:**
- Modify: `lib/funnel/analytics.ts:7-21`

- [ ] **Step 1: Extend the `FunnelEvent` union**

In `lib/funnel/analytics.ts`, change the end of the union (the line `| 'cod_checkout_clicked';`) to add the three new events:

```ts
  | 'result_viewed'
  | 'cod_checkout_clicked'
  // result-page order CTAs + sticky cart
  | 'order_now_clicked'
  | 'whatsapp_order_clicked'
  | 'sticky_checkout_clicked';
```

- [ ] **Step 2: Verify the project still type-checks**

Run: `npx tsc --noEmit`
Expected: PASS (no errors). The new literals are now valid `pushFunnelEvent` arguments.

- [ ] **Step 3: Commit**

```bash
git add lib/funnel/analytics.ts
git commit -m "feat(analytics): add order-now/whatsapp/sticky-checkout events"
```

---

### Task 3: StickyCartBar component

**Files:**
- Create: `components/funnel/StickyCartBar.tsx`

- [ ] **Step 1: Write the component**

Create `components/funnel/StickyCartBar.tsx`:

```tsx
'use client';

import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/cart/use-cart';
import { computeCartTotals } from '@/lib/funnel/shop';
import { bundleBySlug } from '@/lib/funnel/offer';
import { PRODUCT_META } from '@/lib/products/catalog';
import { buildWhatsAppOrderLink } from '@/lib/funnel/whatsapp';
import { pushFunnelEvent } from '@/lib/funnel/analytics';

/**
 * Attention-grabbing cart pinned to the bottom of the result page. Shows the
 * selected protocol + live total and offers Checkout (scrolls to the COD form)
 * and Order-on-WhatsApp. Renders nothing when the cart is empty or when the
 * checkout form is already on screen (`visible === false`).
 */
export function StickyCartBar({
  visible,
  onCheckout,
}: {
  visible: boolean;
  onCheckout: () => void;
}) {
  const { cart } = useCart();
  if (!visible || cart.items.length === 0) return null;

  const totals = computeCartTotals(cart);
  const first = cart.items[0];
  const firstLabel =
    first.type === 'bundle'
      ? bundleBySlug(first.slug)?.name ?? first.slug
      : PRODUCT_META[first.sku]?.shortName ?? first.sku;
  const extra = cart.items.length - 1;
  const label = extra > 0 ? `${firstLabel} +${extra} more` : firstLabel;
  const waLink = buildWhatsAppOrderLink(cart);

  return (
    <div className="funnel-sticky-bar" role="region" aria-label="Your order">
      <div className="funnel-sticky-info">
        <ShoppingCart className="h-5 w-5" />
        <div className="funnel-sticky-text">
          <span className="funnel-sticky-name">{label}</span>
          <span className="funnel-sticky-total">PKR {totals.totalPkr.toLocaleString()}</span>
        </div>
      </div>
      <div className="funnel-sticky-actions">
        <a
          className="funnel-sticky-wa"
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => pushFunnelEvent('whatsapp_order_clicked')}
        >
          WhatsApp
        </a>
        <button
          type="button"
          className="funnel-sticky-checkout"
          onClick={() => {
            pushFunnelEvent('sticky_checkout_clicked');
            onCheckout();
          }}
        >
          Checkout →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/funnel/StickyCartBar.tsx
git commit -m "feat(funnel): StickyCartBar component (checkout + WhatsApp)"
```

---

### Task 4: Wire OfferStep — form ref, scroll, Order-Now buttons, sticky bar

**Files:**
- Modify: `components/funnel/OfferStep.tsx`

- [ ] **Step 1: Update imports**

In `components/funnel/OfferStep.tsx`, change the React import on line 3 and add the StickyCartBar import after the existing component imports (near line 29):

Change line 3:
```tsx
import { useEffect, useRef, useState } from 'react';
```

Add after `import { CaseStudies } from './CaseStudies';` (line 29):
```tsx
import { StickyCartBar } from './StickyCartBar';
```

- [ ] **Step 2: Add form ref, in-view state, and scroll helper**

Inside the `OfferStep` function, just after the existing `const [prefill] = useState(() => loadLead());` line (≈line 56), add:

```tsx
  const formRef = useRef<HTMLFormElement>(null);
  const [formInView, setFormInView] = useState(false);

  function scrollToCheckout() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
```

- [ ] **Step 3: Observe the form so the bar hides when checkout is visible**

Add a second `useEffect` immediately after the existing mount effect (the one that calls `clearCart()` / `addBundle(...)`, ending ≈line 84):

```tsx
  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setFormInView(entry.isIntersecting),
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
```

- [ ] **Step 4: Add "Order Now" button #1 after the hero**

In the returned JSX, the hero is rendered as `{hero}` (≈line 150). Immediately after it, add:

```tsx
      <button
        type="button"
        className="funnel-cta funnel-order-now"
        onClick={() => {
          pushFunnelEvent('order_now_clicked', { placement: 'hero' });
          scrollToCheckout();
        }}
      >
        Order now →
      </button>
```

- [ ] **Step 5: Add "Order Now" button #2 after the protocol listings**

The bundles block ends with the closing `</div>` of `<div className="funnel-bundles">` (≈line 197). Immediately after that closing `</div>`, add:

```tsx
      <button
        type="button"
        className="funnel-cta funnel-order-now"
        onClick={() => {
          pushFunnelEvent('order_now_clicked', { placement: 'after-protocols' });
          scrollToCheckout();
        }}
      >
        Order now →
      </button>
```

- [ ] **Step 6: Attach the ref to the COD form**

Find the checkout form (≈line 215):
```tsx
        <form
          className="funnel-form"
          onSubmit={(e) => { e.preventDefault(); placeOrder(e.currentTarget); }}
        >
```
Add the `ref`:
```tsx
        <form
          ref={formRef}
          className="funnel-form"
          onSubmit={(e) => { e.preventDefault(); placeOrder(e.currentTarget); }}
        >
```

- [ ] **Step 7: Render the sticky bar**

Just before the closing `</section>` of the component (after the `<Reviews reviews={reviews} />` line, ≈line 239), add:

```tsx
      <StickyCartBar visible={!formInView} onCheckout={scrollToCheckout} />
```

- [ ] **Step 8: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add components/funnel/OfferStep.tsx
git commit -m "feat(funnel): order-now buttons + sticky cart on result page"
```

---

### Task 5: Styles

**Files:**
- Modify: `components/funnel/funnel.css` (append at end of file)

- [ ] **Step 1: Append the styles**

Add to the end of `components/funnel/funnel.css`:

```css
/* ── Order-now CTA + sticky attention cart ───────────────────────── */
.funnel-order-now { margin: 4px 0 18px; }

/* Keep page content clear of the fixed bottom bar. */
.funnel-offer { padding-bottom: 96px; }

.funnel-sticky-bar {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 50;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  max-width: 560px; margin: 0 auto;
  padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
  background: #fff; border-top: 1px solid #ece7df;
  box-shadow: 0 -6px 20px rgba(14,31,58,.12);
  animation: funnel-sticky-pulse 2.4s ease-in-out infinite;
}
.funnel-sticky-info { display: flex; align-items: center; gap: 10px; color: #2e5ba8; min-width: 0; }
.funnel-sticky-text { display: flex; flex-direction: column; min-width: 0; }
.funnel-sticky-name {
  font-size: 13px; font-weight: 600; color: #0e1f3a;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 42vw;
}
.funnel-sticky-total { font-size: 15px; font-weight: 700; color: #0e1f3a; }
.funnel-sticky-actions { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
.funnel-sticky-wa {
  display: inline-flex; align-items: center; height: 44px; padding: 0 14px;
  border-radius: 999px; border: 1.5px solid #25d366; color: #128c4b; background: #fff;
  font-size: 14px; font-weight: 600; text-decoration: none;
}
.funnel-sticky-checkout {
  display: inline-flex; align-items: center; height: 44px; padding: 0 18px;
  border-radius: 999px; border: none; background: #2e5ba8; color: #fff;
  font-size: 14px; font-weight: 700; cursor: pointer;
}
@keyframes funnel-sticky-pulse {
  0%, 100% { box-shadow: 0 -6px 20px rgba(14,31,58,.12); }
  50%      { box-shadow: 0 -6px 26px rgba(46,91,168,.34); }
}
@media (prefers-reduced-motion: reduce) {
  .funnel-sticky-bar { animation: none; }
}
```

- [ ] **Step 2: Commit**

```bash
git add components/funnel/funnel.css
git commit -m "style(funnel): order-now + sticky cart bar styling"
```

---

### Task 6: Full verification

**Files:** none (manual + automated verification)

- [ ] **Step 1: Run the funnel test suite**

Run: `npx vitest run tests/funnel`
Expected: PASS, including the new `whatsapp.test.ts` (existing offer/quiz/countdown/collage tests stay green).

- [ ] **Step 2: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Manual check on the quiz result page**

Start the dev server (note: dev runs on port 3001; per project memory, `npm run build` corrupts the live turbopack `.next`, so don't build while dev is running). Complete the quiz at `/` through to the result page, then confirm:
  - The before/after hero is followed by an **"Order now →"** button; tapping it smooth-scrolls to the COD form.
  - After the "Choose your protocol" cards there is a second **"Order now →"** button that also scrolls to the form.
  - A **sticky bottom bar** shows "The Acne Glow Protocol" + "PKR 6,749" and pulses gently.
  - Tapping **Checkout →** in the bar scrolls to the form; the bar then **hides** while the form is on screen, and reappears when you scroll the form out of view.
  - Tapping **WhatsApp** opens `wa.me/923249986822` with a prefilled message listing the protocol and "Total: PKR 6,749 (incl. shipping)".
  - Removing all items from the order summary **hides** the sticky bar.
  - In devtools, `window.dataLayer` receives `funnel_order_now_clicked` (with `placement`), `funnel_sticky_checkout_clicked`, and `funnel_whatsapp_order_clicked`.

- [ ] **Step 4: Manual check on the scan result page**

Navigate through `/scan` to its result page and confirm the same buttons + sticky bar appear and behave identically (they share `OfferStep.tsx`).

- [ ] **Step 5: Final confirmation**

All automated checks pass and both result pages behave as specified. No further commit required (each task committed its own changes).
```
