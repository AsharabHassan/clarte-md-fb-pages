// components/seo/PigmentationLandingContent.tsx
/**
 * Server-rendered keyword content for ad/AI crawlers on /pigmentation.
 * Mirrors AcneLandingContent. Facts come from lib/funnel/pigmentation-offer.ts,
 * lib/funnel/evidence.ts (PIGMENTATION_STATS) and lib/seo/pigmentation-faq.ts.
 */
import { PIGMENTATION_STATS } from '@/lib/funnel/evidence';
import { SHIPPING_PKR, bundleBySlug } from '@/lib/funnel/offer';
import { PIGMENTATION_LEAD_SLUG } from '@/lib/funnel/pigmentation-offer';
import { PIGMENTATION_FAQ, PIGMENTATION_RESULTS_DISCLAIMER } from '@/lib/seo/pigmentation-faq';
import '@/components/seo/seo-content.css';

export function PigmentationLandingContent() {
  const lead = bundleBySlug(PIGMENTATION_LEAD_SLUG)!;
  return (
    <section className="seo-content" aria-label="About the Clarté MD pigmentation treatment">
      <h2>How does the AI dark spot scan work?</h2>
      <p>
        The AI skin scan reads a single close-up photo of your skin. Take a clear
        picture of the area with dark spots or uneven tone — a cheek, the forehead,
        the upper lip or the jaw — and our dermatologist-trained AI maps your
        hyperpigmentation, sun damage and post-acne marks. It then projects how your
        skin could look after a consistent 12-week routine. The scan is free, takes a
        few seconds, and carries no obligation to buy. For the most accurate read, get
        close to the area, use natural light, and skip makeup and filters.
      </p>

      <h2>What is the Even Tone Protocol?</h2>
      <p>
        The Even Tone Protocol is a complete 12-week pigmentation treatment: a gentle
        PHA prep cleanser, a vitamin C 15% antioxidant serum, a tranexamic acid 3% +
        kojic + arbutin lightening cream, and a broad-spectrum SPF 50+ to protect your
        progress. Every active is dermatologist-dosed and backed by peer-reviewed
        research.
      </p>
      <table className="seo-evidence">
        <thead>
          <tr><th>Active</th><th>Evidence</th><th>Source</th></tr>
        </thead>
        <tbody>
          {PIGMENTATION_STATS.map((s) => (
            <tr key={s.active}>
              <td>{s.active}</td>
              <td>{s.figure}{s.suffix} {s.context}</td>
              <td className="seo-cite">{s.citation}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Does it help melasma and post-acne marks?</h2>
      <p>
        Yes — most uneven tone in South Asian skin is post-inflammatory
        hyperpigmentation: the brown marks left behind after acne or sun exposure. The
        protocol targets these with vitamin C, tranexamic acid, kojic acid and arbutin,
        which fade discolouration and even out tone over 8 to 16 weeks of consistent
        use. Daily SPF is essential to stop new pigmentation forming. Deep, symmetric
        hormonal melasma can be stubborn and may need an in-person dermatologist.
      </p>

      <h2>How to photograph your pigmentation for an accurate scan</h2>
      <p>
        A good photo gives a more accurate analysis. Get close so the affected area
        fills the frame, face a window or other natural light, hold the phone steady,
        and remove makeup and filters. The rear camera is usually sharper for a tight
        close-up of a single area.
      </p>

      <h2>Pigmentation treatment in Pakistan with cash on delivery</h2>
      <p>
        Clarté MD ships across Pakistan with cash on delivery, so you only pay when your
        order arrives. The complete Even Tone Protocol is PKR {lead.offerPkr.toLocaleString('en-PK')}{' '}
        plus a flat PKR {SHIPPING_PKR} delivery charge — a saving versus buying the four
        products separately. Formulated by dermatologists in London &amp; Lahore.
      </p>
      <p className="seo-disclaimer">{PIGMENTATION_RESULTS_DISCLAIMER}</p>

      <h2>Frequently asked questions</h2>
      <dl className="seo-faq">
        {PIGMENTATION_FAQ.map((f) => (
          <div key={f.q}>
            <dt>{f.q}</dt>
            <dd>{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
