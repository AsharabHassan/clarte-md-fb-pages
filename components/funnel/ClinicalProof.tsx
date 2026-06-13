import { ACNE_STATS, DOCTOR_LINE } from '@/lib/funnel/evidence';

/**
 * Three peer-reviewed efficacy stats for the protocol's actives, with
 * verbatim citations, plus the dermatologist credibility line.
 */
export function ClinicalProof() {
  return (
    <section className="funnel-clinical">
      <h3 className="funnel-clinical-title">The actives, in published numbers</h3>
      <div className="funnel-clinical-grid">
        {ACNE_STATS.map((s) => (
          <div className="funnel-stat" key={s.active}>
            <div className="funnel-stat-fig">
              {s.figure}<span>{s.suffix}</span>
            </div>
            <div className="funnel-stat-active">{s.active}</div>
            <div className="funnel-stat-ctx">{s.context}</div>
            <div className="funnel-stat-cite">{s.citation}</div>
          </div>
        ))}
      </div>
      <p className="funnel-doctor">{DOCTOR_LINE}</p>
    </section>
  );
}
