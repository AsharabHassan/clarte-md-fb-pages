'use client';

import { useState } from 'react';
import { ScanStep, type ScanResult } from './ScanStep';
import { LeadStep } from './LeadStep';
import { OfferStep } from './OfferStep';
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
    return <LeadStep scan={scan} onComplete={() => setLeadDone(true)} />;
  }
  return <OfferStep scan={scan} reviews={reviews} caseStudies={caseStudies} aggregate={aggregate} />;
}
