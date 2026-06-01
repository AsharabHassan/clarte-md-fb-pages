import Image from 'next/image';
import { Star, BadgeCheck } from 'lucide-react';
import type { CaseStudy } from '@/lib/reviews/types';

/**
 * Real before/after case studies pulled from the DB (protocol reviews that
 * carry imagery). Two photos → before/after pair; one photo → a combined
 * before/after image. Renders nothing if there are none.
 */
export function CaseStudies({
  cases,
  heading = 'Real 12-week results',
}: {
  cases: CaseStudy[];
  heading?: string;
}) {
  if (!cases.length) return null;
  return (
    <section className="funnel-cases">
      <h3 className="funnel-cases-title">{heading}</h3>
      <div className="funnel-cases-list">
        {cases.map((c, i) => (
          <article className="funnel-case-card" key={`${c.name}-${i}`}>
            <div className={`funnel-case-media ${c.photos.length >= 2 ? 'is-split' : 'is-pair'}`}>
              {c.photos.length >= 2 ? (
                <>
                  <figure className="funnel-case-img">
                    <Image src={c.photos[0]} alt={`${c.name} before`} fill sizes="(max-width:560px) 50vw, 270px" style={{ objectFit: 'cover' }} />
                    <figcaption>Before</figcaption>
                  </figure>
                  <figure className="funnel-case-img">
                    <Image src={c.photos[1]} alt={`${c.name} week 12`} fill sizes="(max-width:560px) 50vw, 270px" style={{ objectFit: 'cover' }} />
                    <figcaption>Week 12</figcaption>
                  </figure>
                </>
              ) : (
                <figure className="funnel-case-img funnel-case-img--pair">
                  <Image src={c.photos[0]} alt={`${c.name} before and after`} fill sizes="(max-width:560px) 100vw, 540px" style={{ objectFit: 'cover' }} />
                  <figcaption>Before / Week 12</figcaption>
                </figure>
              )}
            </div>
            <div className="funnel-case-stars" aria-label={`${c.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} width={13} height={13} strokeWidth={1.5} fill={j < c.rating ? 'currentColor' : 'none'} className={j < c.rating ? 'funnel-star-on' : 'funnel-star-off'} />
              ))}
            </div>
            <p className="funnel-case-body">{c.body}</p>
            <p className="funnel-case-name">
              — {c.name}{c.location ? `, ${c.location}` : ''}
              <span className="funnel-verified"><BadgeCheck width={11} height={11} /> Verified</span>
            </p>
          </article>
        ))}
      </div>
      <p className="funnel-cases-note">✨ Real customers · individual results vary.</p>
    </section>
  );
}
