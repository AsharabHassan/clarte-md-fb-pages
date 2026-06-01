/** Shared review types — no server imports, safe for client + server. */

export interface ReviewCard {
  name: string;
  location: string | null;
  rating: number;
  body: string;
  verified: boolean;
  /** Absolute photo URL (first photo) or null. */
  photo: string | null;
}

export interface CaseStudy {
  name: string;
  location: string | null;
  rating: number;
  body: string;
  /** Absolute before/after image URLs. 2 = before+after; 1 = a combined pair image. */
  photos: string[];
}

export interface ReviewsResult {
  reviews: ReviewCard[];
  caseStudies: CaseStudy[];
  aggregate: { avg: number; count: number };
}
