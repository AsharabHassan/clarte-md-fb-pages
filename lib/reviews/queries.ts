import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import type { ReviewCard, CaseStudy, ReviewsResult } from './types';

/** Review/case-study images live on the main site; reference them there. */
const IMG_BASE = 'https://clartemd.com.pk';

function toAbsolute(src: string): string {
  return src.startsWith('http') ? src : `${IMG_BASE}${src.startsWith('/') ? '' : '/'}${src}`;
}

/** photos column is jsonb but is sometimes stored as a JSON string. */
function parsePhotos(raw: unknown): string[] {
  let arr = raw;
  if (typeof arr === 'string') {
    try { arr = JSON.parse(arr); } catch { return []; }
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((p) => (p && typeof p === 'object' && typeof (p as { src?: unknown }).src === 'string' ? (p as { src: string }).src : null))
    .filter((s): s is string => !!s)
    .map(toAbsolute);
}

/**
 * Reads acne-relevant approved reviews from the shared Supabase `reviews`
 * table (same data + photos as the main site). Splits them into:
 *  - reviews: product reviews (text + a single photo) → the marquee
 *  - caseStudies: protocol reviews carrying before/after images → the gallery
 * Degrades gracefully to empty on any DB error (reviews are enhancement).
 */
export async function getAcneReviews(): Promise<ReviewsResult> {
  try {
    const rows = (await db.execute(sql`
      SELECT name, location, rating, body, verified, photos, subject_type
      FROM reviews
      WHERE status = 'approved'
        AND (
          (subject_type = 'product'  AND subject_ref IN ('rescue','acne','vitc','reti'))
          OR (subject_type = 'protocol' AND subject_ref IN ('clear-skin-protocol','acne-glow-protocol'))
        )
      ORDER BY rating DESC, review_date DESC
    `)) as unknown as Array<{
      name: string;
      location: string | null;
      rating: number;
      body: string;
      verified: boolean;
      photos: unknown;
      subject_type: string;
    }>;

    const reviews: ReviewCard[] = [];
    const caseStudies: CaseStudy[] = [];

    for (const r of rows) {
      const photos = parsePhotos(r.photos);
      if (r.subject_type === 'protocol' && photos.length > 0) {
        // Protocol review with before/after imagery = a case study.
        caseStudies.push({
          name: r.name,
          location: r.location,
          rating: Number(r.rating),
          body: r.body,
          photos,
        });
      } else {
        reviews.push({
          name: r.name,
          location: r.location,
          rating: Number(r.rating),
          body: r.body,
          verified: Boolean(r.verified),
          photo: photos[0] ?? null,
        });
      }
    }

    // Aggregate over ALL acne-relevant approved reviews (product + protocol).
    const count = rows.length;
    const avg = count
      ? Math.round((rows.reduce((s, r) => s + Number(r.rating), 0) / count) * 10) / 10
      : 0;

    return { reviews, caseStudies, aggregate: { avg, count } };
  } catch (err) {
    console.error('getAcneReviews failed', err);
    return { reviews: [], caseStudies: [], aggregate: { avg: 0, count: 0 } };
  }
}
