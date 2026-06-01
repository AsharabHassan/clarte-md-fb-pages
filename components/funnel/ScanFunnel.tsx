'use client';

import { useState } from 'react';
import { ScanStep, type ScanResult } from './ScanStep';
import { OfferStep } from './OfferStep';
import './funnel.css';

export function ScanFunnel() {
  const [scan, setScan] = useState<ScanResult | null>(null);
  return scan
    ? <OfferStep scan={scan} />
    : <ScanStep onComplete={setScan} />;
}
