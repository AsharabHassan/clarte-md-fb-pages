'use client';

import { useState } from 'react';
import { ScanStep, type ScanResult } from './ScanStep';
import { OfferStep } from './OfferStep';
import type { ReviewCard } from '@/lib/reviews/types';
import './funnel.css';

export function ScanFunnel({
  reviews,
  aggregate,
}: {
  reviews: ReviewCard[];
  aggregate: { avg: number; count: number };
}) {
  const [scan, setScan] = useState<ScanResult | null>(null);
  return scan
    ? <OfferStep scan={scan} reviews={reviews} aggregate={aggregate} />
    : <ScanStep onComplete={setScan} reviews={reviews} aggregate={aggregate} />;
}
