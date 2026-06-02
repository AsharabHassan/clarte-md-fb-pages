'use client';

import { useState } from 'react';
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

  // Scan → Lead (gate) → Offer (results).
  if (!scan) {
    return <ScanStep onComplete={setScan} reviews={reviews} caseStudies={caseStudies} aggregate={aggregate} />;
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
