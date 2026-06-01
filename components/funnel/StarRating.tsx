import { Star } from 'lucide-react';

/**
 * Precise fractional star rating: a grey 5-star row with a gold 5-star row
 * overlaid and clipped to (avg/5) width, plus a "4.7 · N reviews" label.
 * Renders nothing when there are no reviews.
 */
export function StarRating({
  avg,
  count,
  size = 'md',
}: {
  avg: number;
  count: number;
  size?: 'sm' | 'md';
}) {
  if (!count) return null;
  const px = size === 'sm' ? 14 : 18;
  const pct = Math.max(0, Math.min(100, (avg / 5) * 100));

  const row = (filled: boolean) => (
    <span className="funnel-stars-set">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} width={px} height={px} strokeWidth={1.5} fill={filled ? 'currentColor' : 'none'} />
      ))}
    </span>
  );

  return (
    <span
      className={`funnel-stars funnel-stars--${size}`}
      aria-label={`${avg.toFixed(1)} out of 5 from ${count} reviews`}
    >
      <span className="funnel-stars-stack" aria-hidden="true">
        <span className="funnel-stars-empty">{row(false)}</span>
        <span className="funnel-stars-fill" style={{ width: `${pct}%` }}>{row(true)}</span>
      </span>
      <span className="funnel-stars-label">{avg.toFixed(1)} · {count} reviews</span>
    </span>
  );
}
