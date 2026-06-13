/**
 * Pure logic for the before/after collage. Turns the AI analysis into a
 * small set of face-region badges to overlay on the BEFORE panel. Has no
 * canvas/DOM dependency so it is unit-testable.
 */

export interface ZoneSource {
  /** From AnalysisResult.primary_concerns or SkinMap.primary_concerns. */
  primary_concerns?: string[];
}

const REGION_KEYWORDS: Array<{ region: string; match: RegExp }> = [
  { region: 'Forehead', match: /forehead|t-?zone|temple|brow/i },
  { region: 'Cheeks', match: /cheek|malar/i },
  { region: 'Chin', match: /chin|jaw|mandib/i },
  { region: 'Nose', match: /nose|nasal/i },
];

const DEFAULT_ZONES = ['Forehead', 'Cheeks', 'Chin'];

/**
 * Returns up to four face-region labels to mark on the BEFORE photo.
 * Matches known keywords first; falls back to a sensible default set so
 * the collage always has labels even when the map lacks coordinates.
 */
export function deriveZoneBadges(source: ZoneSource | null): string[] {
  const concerns = source?.primary_concerns ?? [];
  const matched = new Set<string>();
  for (const c of concerns) {
    for (const { region, match } of REGION_KEYWORDS) {
      if (match.test(c)) matched.add(region);
    }
  }
  const result = matched.size > 0 ? [...matched] : [...DEFAULT_ZONES];
  return result.slice(0, 4);
}
