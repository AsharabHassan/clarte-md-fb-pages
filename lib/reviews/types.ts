/** Shared review types — no server imports, safe for client + server. */

export interface ReviewCard {
  name: string;
  location: string | null;
  rating: number;
  body: string;
  verified: boolean;
}

export interface ReviewsResult {
  reviews: ReviewCard[];
  aggregate: { avg: number; count: number };
}
