/**
 * Peer-reviewed ingredient studies behind the acne protocol's actives.
 * Lifted verbatim (figures + citations) from the main site's
 * lib/protocols/evidence.ts EVIDENCE_BY_BUNDLE['clear-skin-protocol'].
 * NOT invented Clarté trial data — these are the published source studies
 * that justify the protocol's composition.
 */

export interface FunnelStat {
  active: string;
  figure: number;
  suffix: string;
  context: string;
  citation: string;
}

export const ACNE_STATS: FunnelStat[] = [
  {
    active: 'Niacinamide',
    figure: 60,
    suffix: '%',
    context: 'reduction in inflammatory lesions at 8 weeks',
    citation: 'Khodaeiani et al., Int J Dermatol 2013',
  },
  {
    active: 'Azelaic Acid',
    figure: 70,
    suffix: '%',
    context: 'mean reduction in comedones at 12 weeks',
    citation: 'Webster, J Am Acad Dermatol 2000',
  },
  {
    active: 'Salicylic Acid 2%',
    figure: 47,
    suffix: '%',
    context: 'fewer comedones at 12 weeks',
    citation: 'Zander & Weisman, Cutis 1992',
  },
];

/** Credibility line — matches the main site's wording; no invented names. */
export const DOCTOR_LINE = 'Formulated by dermatologists in London & Lahore';
