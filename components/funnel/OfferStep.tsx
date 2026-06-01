'use client';

import { useEffect, useState } from 'react';
import { Banknote, Loader2 } from 'lucide-react';
import { useCart } from '@/lib/cart/use-cart';
import { ACNE_GLOW, SHIPPING_PKR, FUNNEL_TIMER_KEY, computeOfferSavings } from '@/lib/funnel/offer';
import { pushFunnelEvent } from '@/lib/funnel/analytics';
import Image from 'next/image';
import { PRODUCT_META } from '@/lib/products/catalog';
import { PROTOCOL_HERO } from '@/lib/funnel/product-images';
import { BUNDLE_SKUS, ADDON_SKUS, computeCartTotals } from '@/lib/funnel/shop';
import { trackMetaPurchase } from '@/lib/funnel/meta';
import { Collage } from './Collage';
import { ProductCard } from './ProductCard';
import { OrderSummary } from './OrderSummary';
import { CountdownTimer } from '@/components/marketing/CountdownTimer';
import { OrderTicker } from '@/components/marketing/OrderTicker';
import { LowStockTag } from '@/components/marketing/LowStockTag';
import { TrustStrip } from '@/components/marketing/TrustStrip';
import { StarRating } from './StarRating';
import { ClinicalProof } from './ClinicalProof';
import { Reviews } from './Reviews';
import type { ReviewCard } from '@/lib/reviews/types';
import type { ScanResult } from './ScanStep';

const PK_CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Quetta', 'Other'];

export function OfferStep({
  scan,
  reviews,
  aggregate,
}: {
  scan: ScanResult;
  reviews: ReviewCard[];
  aggregate: { avg: number; count: number };
}) {
  const { cart, addBundle, removeItem, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const savings = computeOfferSavings();

  const bundleInCart = cart.items.some((i) => i.type === 'bundle' && i.slug === ACNE_GLOW.slug);
  function toggleBundle() {
    const idx = cart.items.findIndex((i) => i.type === 'bundle' && i.slug === ACNE_GLOW.slug);
    if (idx >= 0) removeItem(idx);
    else addBundle(ACNE_GLOW.slug);
  }

  useEffect(() => {
    clearCart();
    addBundle(ACNE_GLOW.slug);
    pushFunnelEvent('offer_viewed');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function placeOrder(form: HTMLFormElement) {
    setErr(null);
    if (cart.items.length === 0) {
      setErr('Your cart is empty — add the protocol or a product first.');
      return;
    }
    setSubmitting(true);
    pushFunnelEvent('add_shipping');
    const fd = new FormData(form);
    const phone = String(fd.get('phone') ?? '');
    const items = cart.items.map((i) =>
      i.type === 'bundle'
        ? { sku: i.slug, name: ACNE_GLOW.name, qty: 1, price: 0 }
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
          concern: 'acne',
          page: 'scan-funnel',
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
          used_ai_preview: Boolean(scan.afterUrl),
          ts: new Date().toISOString(),
          meta_event_id: metaEventId,
          ...(scan.aiSessionId ? { ai_session_id: scan.aiSessionId } : {}),
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

      <Collage beforeUrl={scan.beforeUrl} afterUrl={scan.afterUrl} source={scan.source} />
      {!scan.afterUrl && (
        <p className="funnel-note">
          Our dermatologists will review your photo personally with your order.
        </p>
      )}

      <ClinicalProof />

      <div className="funnel-offer-card">
        <div className="funnel-hero-img">
          <Image
            src={PROTOCOL_HERO}
            alt={ACNE_GLOW.name}
            fill
            sizes="(max-width: 560px) 100vw, 560px"
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
        <div className="funnel-offer-head">
          <CountdownTimer
            label="Offer reverts in"
            variant="pill"
            windowMinutes={5}
            storageKey={FUNNEL_TIMER_KEY}
          />
          <LowStockTag sku="acne" />
        </div>

        <h2 className="funnel-h2">{ACNE_GLOW.name}</h2>
        <StarRating avg={aggregate.avg} count={aggregate.count} size="sm" />
        <ul className="funnel-items">
          {ACNE_GLOW.itemSkus.map((sku) => (
            <li key={sku}>{PRODUCT_META[sku].name}</li>
          ))}
        </ul>

        <div className="funnel-price">
          <span className="funnel-now">PKR {savings.offerPkr.toLocaleString()}</span>
          <span className="funnel-was">PKR {savings.listPkr.toLocaleString()}</span>
          <span className="funnel-save">Save {savings.savingsPkr.toLocaleString()} ({savings.savingsPct}%)</span>
        </div>
        <p className="funnel-cod"><Banknote className="h-4 w-4" /> Cash on delivery · + PKR {SHIPPING_PKR} shipping</p>

        <button
          type="button"
          className={`funnel-bundle-toggle ${bundleInCart ? 'is-in' : ''}`}
          onClick={toggleBundle}
        >
          {bundleInCart
            ? '✓ Full protocol in your order — tap to remove'
            : '+ Add the full protocol (best value)'}
        </button>

        <div className="funnel-products">
          <p className="funnel-products-label">In your protocol — buy individually</p>
          <div className="funnel-products-grid">
            {BUNDLE_SKUS.map((sku) => <ProductCard key={sku} sku={sku} />)}
          </div>
          <p className="funnel-products-label">Popular add-ons</p>
          <div className="funnel-products-grid">
            {ADDON_SKUS.map((sku) => <ProductCard key={sku} sku={sku} />)}
          </div>
        </div>

        <OrderSummary />

        <form
          className="funnel-form"
          onSubmit={(e) => { e.preventDefault(); placeOrder(e.currentTarget); }}
        >
          <input name="name" required placeholder="Full name" autoComplete="name" />
          <input name="phone" required pattern="[0-9+\-\s()]{7,32}" inputMode="tel" placeholder="03XX XXXXXXX" autoComplete="tel" />
          <input name="email" type="email" required placeholder="Email" autoComplete="email" />
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

      <Reviews reviews={reviews} />
    </section>
  );
}
