'use client';

import NextImage from 'next/image';
import { Banknote } from 'lucide-react';
import { bundleBySlug, bundleSavings, SHIPPING_PKR, FUNNEL_TIMER_KEY } from '@/lib/funnel/offer';
import type { ConcernConfig } from '@/lib/funnel/concern-config';
import { PRODUCT_META } from '@/lib/products/catalog';
import { pushFunnelEvent } from '@/lib/funnel/analytics';
import { CountdownTimer } from '@/components/marketing/CountdownTimer';
import { LowStockTag } from '@/components/marketing/LowStockTag';
import { OrderTicker } from '@/components/marketing/OrderTicker';
import { TrustStrip } from '@/components/marketing/TrustStrip';

/**
 * On-landing protocol offer card. Lets visitors who don't want the AI scan
 * buy the hero protocol directly, with price/savings, urgency (countdown +
 * low stock + live order ticker) and trust chips. The Buy now button jumps
 * straight to the offer/checkout (ScanFunnel's direct-buy path).
 */
export function LandingOffer({ config, onBuyNow }: { config: ConcernConfig; onBuyNow: () => void }) {
  const bundle = bundleBySlug(config.leadSlug)!; // lead offer = cheapest acne serum
  const sv = bundleSavings(bundle);

  return (
    <section className="funnel-landing-offer" aria-label="Buy the protocol directly">
      <div className="funnel-or-divider"><span>or buy your protocol now</span></div>

      <OrderTicker />

      <article className="funnel-bundle-card funnel-landing-card is-selected">
        <div className="funnel-hero-img">
          <NextImage
            src={bundle.hero}
            alt={bundle.name}
            fill
            sizes="(max-width: 560px) 100vw, 560px"
            style={{ objectFit: bundle.heroFit ?? 'cover' }}
          />
          <span className="funnel-bundle-badge">Best value</span>
        </div>

        <div className="funnel-bundle-top">
          <h2 className="funnel-bundle-name">{bundle.name}</h2>
          <span className="funnel-bundle-tag">{bundle.tagline}</span>
        </div>

        <p className="funnel-bundle-desc">{bundle.description}</p>

        <ul className="funnel-items">
          {bundle.itemSkus.map((sku) => (
            <li key={sku}>{PRODUCT_META[sku].name}</li>
          ))}
        </ul>

        <div className="funnel-offer-head">
          <CountdownTimer label="Offer reverts in" variant="pill" windowMinutes={5} storageKey={FUNNEL_TIMER_KEY} />
          <LowStockTag sku="acne" />
        </div>

        <div className="funnel-price">
          <span className="funnel-now">PKR {bundle.offerPkr.toLocaleString()}</span>
          <span className="funnel-was">PKR {sv.listPkr.toLocaleString()}</span>
          <span className="funnel-save">Save {sv.savingsPkr.toLocaleString()} ({sv.savingsPct}%)</span>
        </div>

        <button
          type="button"
          className="funnel-cta"
          onClick={() => {
            pushFunnelEvent('direct_buy_clicked', { placement: 'landing-offer' });
            onBuyNow();
          }}
        >
          Buy now — Cash on Delivery →
        </button>

        <p className="funnel-cod">
          <Banknote className="h-4 w-4" /> Cash on delivery · + PKR {SHIPPING_PKR} shipping
        </p>

        <TrustStrip variant="chips" tone="light" limit={5} />
      </article>
    </section>
  );
}
