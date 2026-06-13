// components/seo/AcneLandingContent.tsx
/**
 * Server-rendered keyword content for ad/AI crawlers. Lives below the funnel
 * so it's always in the SSR HTML regardless of funnel client state. Facts come
 * from lib/funnel/offer.ts, lib/funnel/evidence.ts and lib/seo/faq.ts.
 */
import { ACNE_STATS } from '@/lib/funnel/evidence';
import { ACNE_GLOW, SHIPPING_PKR, ACNE_ESSENTIALS, bundleBySlug, LEAD_BUNDLE_SLUG } from '@/lib/funnel/offer';
import { ACNE_FAQ, RESULTS_DISCLAIMER } from '@/lib/seo/faq';
import './seo-content.css';

export function AcneLandingContent() {
  return (
    <section className="seo-content" aria-label="About the Clarté MD acne treatment">
      <h2>How does the AI acne scan work?</h2>
      <p>
        The AI acne scan reads a single close-up photo of your skin. Take a clear
        picture of the area that bothers you most — a cheek, the forehead, the chin
        or the jaw — and our dermatologist-trained AI maps your active breakouts,
        post-acne marks and texture. It then projects how your skin could look after
        a consistent 12-week routine. The scan is free, takes a few seconds, and
        carries no obligation to buy. For the most accurate read, get close to the
        breakout area, use natural light, and skip makeup and filters.
      </p>

      <h2>What is the Acne Glow Protocol?</h2>
      <p>
        The Acne Glow Protocol is a complete 12-week acne treatment: a salicylic
        acid 2% wash to decongest pores, a niacinamide 10% + azelaic acid serum to
        calm active breakouts, plus vitamin C and retinol to fade post-acne marks and
        restore glow. Every active is dermatologist-dosed and backed by peer-reviewed
        research.
      </p>
      <table className="seo-evidence">
        <thead>
          <tr><th>Active</th><th>Evidence</th><th>Source</th></tr>
        </thead>
        <tbody>
          {ACNE_STATS.map((s) => (
            <tr key={s.active}>
              <td>{s.active}</td>
              <td>{s.figure}{s.suffix} {s.context}</td>
              <td className="seo-cite">{s.citation}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Does it help acne scars and dark spots?</h2>
      <p>
        Yes — acne often leaves post-inflammatory hyperpigmentation, the brown and red
        marks left behind after a breakout heals. The protocol targets these marks with
        niacinamide, azelaic acid and vitamin C, which help fade discolouration and even
        out skin tone over 8 to 12 weeks of consistent use, alongside clearing the active
        acne that causes new marks to form.
      </p>

      <h2>How to photograph your acne for an accurate scan</h2>
      <p>
        A good photo gives a more accurate analysis. Get close so the breakout area
        fills the frame, face a window or other natural light, hold the phone steady,
        and remove makeup and filters. You can use the front or rear camera — the rear
        camera is usually sharper for a tight close-up of a single area.
      </p>

      <h2>Acne treatment in Pakistan with cash on delivery</h2>
      <p>
        Clarté MD ships across Pakistan with cash on delivery, so you only pay when your
        order arrives. Start clearing acne from just PKR {bundleBySlug(LEAD_BUNDLE_SLUG)!.offerPkr.toLocaleString('en-PK')}{' '}
        with the Clarifying Acne Serum, plus a flat PKR {SHIPPING_PKR} delivery charge. Want the
        complete routine? The full Acne Glow Protocol is PKR {ACNE_GLOW.offerPkr.toLocaleString('en-PK')}{' '}
        and the Acne Essentials Duo is PKR {ACNE_ESSENTIALS.offerPkr.toLocaleString('en-PK')}.
        Formulated by dermatologists in London &amp; Lahore.
      </p>
      <p className="seo-disclaimer">{RESULTS_DISCLAIMER}</p>

      <h2>Frequently asked questions</h2>
      <dl className="seo-faq">
        {ACNE_FAQ.map((f) => (
          <div key={f.q}>
            <dt>{f.q}</dt>
            <dd>{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
