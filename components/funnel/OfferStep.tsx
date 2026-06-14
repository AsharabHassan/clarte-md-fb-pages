'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Banknote, Loader2, Check } from 'lucide-react';
import { useCart } from '@/lib/cart/use-cart';
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
import { trackMetaPurchase } from '@/lib/funnel/meta';
import { loadLead } from '@/lib/funnel/lead-storage';
import { ProductCard } from './ProductCard';
import { OrderSummary } from './OrderSummary';
import { CountdownTimer } from '@/components/marketing/CountdownTimer';
import { OrderTicker } from '@/components/marketing/OrderTicker';
import { LowStockTag } from '@/components/marketing/LowStockTag';
import { TrustStrip } from '@/components/marketing/TrustStrip';
import { StarRating } from './StarRating';
import { ClinicalProof } from './ClinicalProof';
import { Reviews } from './Reviews';
import { CaseStudies } from './CaseStudies';
import { StickyCartBar } from './StickyCartBar';
import type { ReviewCard, CaseStudy } from '@/lib/reviews/types';

const PK_CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Quetta', 'Other'];

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
  const { cart, addBundle, removeItem, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [prefill] = useState(() => loadLead()); // name/email/phone from the lead gate
  const formRef = useRef<HTMLFormElement>(null);
  const [formInView, setFormInView] = useState(false);

  function scrollToCheckout() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // The funnel sells one protocol at a time (the two bundles overlap), so
  // selecting a bundle replaces any other. Individual products stack on top.
  let currentBundleSlug: string | null = null;
  for (const i of cart.items) {
    if (i.type === 'bundle') { currentBundleSlug = i.slug; break; }
  }

  function selectBundle(slug: string) {
    let idx = -1;
    for (let k = 0; k < cart.items.length; k++) {
      if (cart.items[k].type === 'bundle') { idx = k; break; }
    }
    if (idx >= 0) {
      const existing = cart.items[idx];
      const sameSlug = existing.type === 'bundle' && existing.slug === slug;
      removeItem(idx);
      if (sameSlug) return; // tapped the selected one → deselect
    }
    addBundle(slug);
  }

  useEffect(() => {
    clearCart();
    addBundle(config.leadSlug); // default to the lowest-priced serum (price-sensitive lead)
    pushFunnelEvent('offer_viewed');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function placeOrder(form: HTMLFormElement) {
    setErr(null);
    pushFunnelEvent('cod_checkout_clicked');
    if (cart.items.length === 0) {
      setErr('Your cart is empty — choose a protocol or add a product first.');
      return;
    }
    setSubmitting(true);
    pushFunnelEvent('add_shipping');
    const fd = new FormData(form);
    const phone = String(fd.get('phone') ?? '');
    const items = cart.items.map((i) =>
      i.type === 'bundle'
        ? { sku: i.slug, name: bundleBySlug(i.slug)?.name ?? i.slug, qty: 1, price: 0 }
        : { sku: i.sku, name: PRODUCT_META[i.sku]?.name ?? i.sku, qty: i.qty, price: 0 },
    );
    // One event id shared by the browser Pixel Purchase + the order webhook
    // (→ Meta CAPI via LeadConnector) so Meta deduplicates the two.
    const metaEventId = crypto.randomUUID();
    const totalPkr = computeCartTotals(cart).totalPkr;
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          concern: config.concern,
          page,
          contact: { name: fd.get('name'), phone, email: fd.get('email') },
          shipping: {
            address: fd.get('address'),
            city: fd.get('city'),
            notes: fd.get('notes') || '',
          },
          payment: 'COD',
          items,
          totals: { subtotal: 0, shipping: 0, total: 0 }, // server recomputes
          bundle_in_cart: cart.items.some((i) => i.type === 'bundle'),
          used_ai_preview: usedAiPreview,
          ts: new Date().toISOString(),
          meta_event_id: metaEventId,
          ...(aiSessionId ? { ai_session_id: aiSessionId } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setErr(data.error || `Couldn't place your order (status ${res.status}). WhatsApp us and we'll take it manually.`);
        setSubmitting(false);
        return;
      }
      pushFunnelEvent('order_placed', { order_number: data.order_number });
      trackMetaPurchase(totalPkr, metaEventId); // same eventID as the webhook → dedup
      const last4 = phone.replace(/\D/g, '').slice(-4);
      clearCart();
      window.location.assign(`/order/${data.order_number}?phone=${last4}&placed=1`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network issue. WhatsApp us.');
      setSubmitting(false);
    }
  }

  return (
    <section className="funnel-offer">
      <OrderTicker />

      {hero}

      <button
        type="button"
        aria-label="Order now"
        className="funnel-cta funnel-order-now"
        onClick={() => {
          pushFunnelEvent('order_now_clicked', { placement: 'hero' });
          scrollToCheckout();
        }}
      >
        Order now →
      </button>

      <ClinicalProof />

      {/* Social proof up front — before the offer */}
      <CaseStudies cases={caseStudies} heading="Real 12-week before & afters" />
      <Reviews reviews={reviews.slice(0, 6)} heading="What our customers say" />

      {/* Choose-your-protocol */}
      <div className="funnel-offer-head">
        <CountdownTimer label="Offer reverts in" variant="pill" windowMinutes={5} storageKey={FUNNEL_TIMER_KEY} />
        <LowStockTag sku="acne" />
      </div>
      <div className="funnel-choose-title">
        <h2 className="funnel-h2">Choose your protocol</h2>
        <StarRating avg={aggregate.avg} count={aggregate.count} size="sm" />
      </div>

      <div className="funnel-bundles">
        {config.bundles.map((b) => {
          const selected = currentBundleSlug === b.slug;
          const sv = bundleSavings(b);
          return (
            <article key={b.slug} className={`funnel-bundle-card ${selected ? 'is-selected' : ''}`}>
              <div className="funnel-hero-img">
                <Image src={b.hero} alt={b.name} fill sizes="(max-width: 560px) 100vw, 560px" style={{ objectFit: b.heroFit ?? 'cover' }} />
                {selected && <span className="funnel-bundle-badge"><Check className="h-3.5 w-3.5" /> Selected</span>}
              </div>
              <div className="funnel-bundle-top">
                <h3 className="funnel-bundle-name">{b.name}</h3>
                <span className="funnel-bundle-tag">{b.tagline}</span>
              </div>
              <p className="funnel-bundle-desc">{b.description}</p>
              <ul className="funnel-items">
                {b.itemSkus.map((sku) => <li key={sku}>{PRODUCT_META[sku].name}</li>)}
              </ul>
              <div className="funnel-price">
                <span className="funnel-now">PKR {b.offerPkr.toLocaleString()}</span>
                <span className="funnel-was">PKR {sv.listPkr.toLocaleString()}</span>
                <span className="funnel-save">Save {sv.savingsPkr.toLocaleString()} ({sv.savingsPct}%)</span>
              </div>
              <button
                type="button"
                className={`funnel-bundle-select ${selected ? 'is-selected' : ''}`}
                onClick={() => selectBundle(b.slug)}
              >
                {selected ? '✓ Selected — tap to remove' : 'Choose this protocol'}
              </button>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Order now"
        className="funnel-cta funnel-order-now"
        onClick={() => {
          pushFunnelEvent('order_now_clicked', { placement: 'after-protocols' });
          scrollToCheckout();
        }}
      >
        Order now →
      </button>

      <div className="funnel-offer-card">
        <div className="funnel-products">
          <p className="funnel-products-label">Add individual products</p>
          <div className="funnel-products-grid">
            {config.bundleSkus.map((sku) => <ProductCard key={sku} sku={sku} />)}
          </div>
          <p className="funnel-products-label">Popular add-ons</p>
          <div className="funnel-products-grid">
            {config.addonSkus.map((sku) => <ProductCard key={sku} sku={sku} />)}
          </div>
        </div>

        <OrderSummary />

        <p className="funnel-cod"><Banknote className="h-4 w-4" /> Cash on delivery · + PKR {SHIPPING_PKR} shipping</p>

        <form
          ref={formRef}
          className="funnel-form"
          onSubmit={(e) => { e.preventDefault(); placeOrder(e.currentTarget); }}
        >
          <input name="name" required placeholder="Full name" autoComplete="name" defaultValue={prefill?.name ?? ''} />
          <input name="phone" required pattern="[0-9+\-\s\(\)]{7,32}" inputMode="tel" placeholder="03XX XXXXXXX" autoComplete="tel" defaultValue={prefill?.phone ?? ''} />
          <input name="email" type="email" required placeholder="Email" autoComplete="email" defaultValue={prefill?.email ?? ''} />
          <input name="address" required minLength={3} placeholder="Street address" autoComplete="street-address" />
          <select name="city" required defaultValue="">
            <option value="" disabled>Select your city</option>
            {PK_CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input name="notes" placeholder="Delivery notes (optional)" />
          <button type="submit" className="funnel-cta" disabled={submitting}>
            {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Placing order…</> : 'Confirm my order (COD)'}
          </button>
          {err && <p className="funnel-error">{err}</p>}
        </form>

        <TrustStrip variant="chips" tone="light" limit={5} className="mt-4" />
      </div>

      <Reviews reviews={reviews} heading="More customer reviews" />

      <StickyCartBar visible={!formInView} onCheckout={scrollToCheckout} />
    </section>
  );
}
