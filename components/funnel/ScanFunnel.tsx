'use client';

import { useState } from 'react';
import NextImage from 'next/image';
import { bundleBySlug, LEAD_BUNDLE_SLUG } from '@/lib/funnel/offer';
import { ScanStep, type ScanResult } from './ScanStep';
import { LeadStep } from './LeadStep';
import { OfferStep } from './OfferStep';
import { Collage } from './Collage';
import type { ReviewCard, CaseStudy } from '@/lib/reviews/types';
import './funnel.css';

export function ScanFunnel({
  reviews,
  caseStudies,
  aggregate,
}: {
  reviews: ReviewCard[];
  caseStudies: CaseStudy[];
  aggregate: { avg: number; count: number };
}) {
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [leadDone, setLeadDone] = useState(false);
  const [directBuy, setDirectBuy] = useState(false);

  // Direct buy: user skipped the scan — straight to the offer/checkout.
  if (directBuy) {
    const lead = bundleBySlug(LEAD_BUNDLE_SLUG)!;
    return (
      <OfferStep
        hero={
          <section className="funnel-direct-hero">
            <h1 className="funnel-h1">{lead.name}</h1>
            <p className="funnel-sub">
              Start clearing acne from just PKR {lead.offerPkr.toLocaleString()} —
              niacinamide 10% + azelaic acid, cash on delivery across Pakistan.
            </p>
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

  // Scan → Lead (gate) → Offer (results).
  if (!scan) {
    return <ScanStep onComplete={setScan} onBuyDirect={() => setDirectBuy(true)} reviews={reviews} caseStudies={caseStudies} aggregate={aggregate} />;
  }
  if (!leadDone) {
    return <LeadStep aiSessionId={scan.aiSessionId} onComplete={() => setLeadDone(true)} />;
  }
  return (
    <OfferStep
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
