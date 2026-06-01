import Image from 'next/image';
import { Star, BadgeCheck } from 'lucide-react';
import type { ReviewCard } from '@/lib/reviews/types';

/**
 * Continuously-looping marquee of real customer reviews (from the DB).
 * The list is rendered twice and the track translated -50% on an infinite
 * loop, so it scrolls seamlessly. Pauses on hover; honours reduced-motion
 * (falls back to a manual horizontal scroll). Renders nothing if empty.
 */
export function Reviews({
  reviews,
  heading = 'What customers say',
}: {
  reviews: ReviewCard[];
  heading?: string;
}) {
  if (!reviews.length) return null;

  // Slower for short lists, faster ceiling for long ones.
  const durationSec = Math.max(18, reviews.length * 4);

  const card = (r: ReviewCard, key: string, hidden = false) => (
    <article className="funnel-review-card" key={key} aria-hidden={hidden || undefined}>
      {r.photo && (
        <div className="funnel-review-photo">
          <Image src={r.photo} alt={`${r.name}'s result`} fill sizes="270px" style={{ objectFit: 'cover' }} />
        </div>
      )}
      <div className="funnel-review-stars" aria-label={`${r.rating} out of 5`}>
        {Array.from({ length: 5 }).map((_, j) => (
          <Star
            key={j}
            width={14}
            height={14}
            strokeWidth={1.5}
            fill={j < r.rating ? 'currentColor' : 'none'}
            className={j < r.rating ? 'funnel-star-on' : 'funnel-star-off'}
          />
        ))}
      </div>
      <p className="funnel-review-body">{r.body}</p>
      <div className="funnel-review-meta">
        <span className="funnel-review-name">
          — {r.name}{r.location ? `, ${r.location}` : ''}
        </span>
        {r.verified && (
          <span className="funnel-verified">
            <BadgeCheck width={12} height={12} /> Verified
          </span>
        )}
      </div>
    </article>
  );

  return (
    <section className="funnel-reviews">
      <h3 className="funnel-reviews-title">{heading}</h3>
      <div className="funnel-marquee">
        <div
          className="funnel-marquee-track"
          style={{ ['--marquee-duration' as string]: `${durationSec}s` }}
        >
          {reviews.map((r, i) => card(r, `a-${i}`))}
          {reviews.map((r, i) => card(r, `b-${i}`, true))}
        </div>
      </div>
    </section>
  );
}
