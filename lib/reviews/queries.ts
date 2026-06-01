import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import type { ReviewCard, ReviewsResult } from './types';

/**
 * Reads acne-relevant, approved reviews from the shared Supabase `reviews`
 * table. The table is managed directly in Supabase (not in the Drizzle
 * schema), so we query it with raw SQL via db.execute() — same pattern as
 * app/api/create-order/route.ts. postgres-js returns the row array directly.
 *
 * Reviews are a conversion enhancement, not critical path: any DB error
 * degrades gracefully to an empty result so the funnel still renders.
 */
export async function getAcneReviews(): Promise<ReviewsResult> {
  try {
    const rows = (await db.execute(sql`
      SELECT name, location, rating, body, verified
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
    }>;

    const reviews: ReviewCard[] = rows.map((r) => ({
      name: r.name,
      location: r.location,
      rating: Number(r.rating),
      body: r.body,
      verified: Boolean(r.verified),
    }));

    const count = reviews.length;
    const avg = count
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
      : 0;

    return { reviews, aggregate: { avg, count } };
  } catch (err) {
    console.error('getAcneReviews failed', err);
    return { reviews: [], aggregate: { avg: 0, count: 0 } };
  }
}
