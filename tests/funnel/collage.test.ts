import { describe, it, expect } from 'vitest';
import { deriveZoneBadges } from '@/lib/funnel/collage';

describe('deriveZoneBadges', () => {
  it('maps known concern keywords to face regions', () => {
    const badges = deriveZoneBadges({
      primary_concerns: ['forehead breakouts', 'cheek acne', 'chin cysts'],
    });
    expect(badges).toEqual(expect.arrayContaining(['Forehead', 'Cheeks', 'Chin']));
  });

  it('falls back to default zones when nothing matches', () => {
    const badges = deriveZoneBadges({ primary_concerns: ['oiliness'] });
    expect(badges.length).toBeGreaterThan(0);
    expect(badges).toEqual(expect.arrayContaining(['Forehead', 'Cheeks']));
  });

  it('handles missing/empty input', () => {
    expect(deriveZoneBadges(null).length).toBeGreaterThan(0);
    expect(deriveZoneBadges({ primary_concerns: [] }).length).toBeGreaterThan(0);
  });

  it('never returns more than four badges', () => {
    const badges = deriveZoneBadges({
      primary_concerns: ['forehead', 'cheek', 'chin', 'nose', 'jaw', 'temple'],
    });
    expect(badges.length).toBeLessThanOrEqual(4);
  });
});
