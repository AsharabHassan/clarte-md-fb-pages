'use client';

import { useState } from 'react';
import { Loader2, Lock, Sparkles } from 'lucide-react';
import { saveLead, type LeadContact } from '@/lib/funnel/lead-storage';
import { pushFunnelEvent } from '@/lib/funnel/analytics';
import { trackMetaLead } from '@/lib/funnel/meta';

/**
 * Lead-capture gate shown before results are revealed. Funnel-agnostic:
 *  - selfie funnel passes `aiSessionId` and the analysis copy;
 *  - quiz funnel passes `extra` (quiz answers) and the quiz copy.
 * On submit it persists the contact for checkout prefill, fires the GTM
 * `lead_captured` event AND the Meta `Lead` pixel event (deduped against
 * the server CAPI event via a shared event id), posts to /api/lead, then
 * reveals the results. Best-effort: a webhook failure never traps the user.
 */
export function LeadStep({
  onComplete,
  concern = 'acne',
  aiSessionId,
  extra,
  eyebrow = 'Analysis complete',
  headline = 'Your results are ready.',
  subhead = 'Enter your details to unlock your personalised 12-week skin projection and protocol.',
  cta = 'Reveal my results →',
}: {
  onComplete: (lead: LeadContact) => void;
  concern?: string;
  aiSessionId?: string;
  /** Extra fields merged into the /api/lead body (e.g. quiz answers). */
  extra?: Record<string, unknown>;
  eyebrow?: string;
  headline?: string;
  subhead?: string;
  cta?: string;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function submit(form: HTMLFormElement) {
    setSubmitting(true);
    const fd = new FormData(form);
    const lead: LeadContact = {
      name: String(fd.get('name') ?? '').trim(),
      email: String(fd.get('email') ?? '').trim(),
      phone: String(fd.get('phone') ?? '').trim(),
    };

    // Persist for checkout prefill (this session only).
    saveLead(lead);

    // One event id shared by the browser Pixel Lead + the lead webhook
    // (→ Meta CAPI) so Meta deduplicates the two.
    const metaEventId = crypto.randomUUID();
    pushFunnelEvent('lead_captured');
    trackMetaLead(metaEventId);

    // Fire the lead webhook (best-effort; never trap the user on the gate).
    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...lead,
          concern,
          meta_event_id: metaEventId,
          ...(aiSessionId ? { ai_session_id: aiSessionId } : {}),
          ...(extra ?? {}),
          source_url: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      });
    } catch {
      /* non-fatal — still reveal the results */
    }

    onComplete(lead);
  }

  return (
    <section className="funnel-scan funnel-lead">
      <span className="funnel-lead-eyebrow">
        <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
      </span>
      <h1 className="funnel-h1">{headline}</h1>
      <p className="funnel-sub">{subhead}</p>

      <form
        className="funnel-form funnel-lead-form"
        onSubmit={(e) => { e.preventDefault(); submit(e.currentTarget); }}
      >
        <input name="name" required placeholder="Full name" autoComplete="name" />
        <input name="email" type="email" required placeholder="Email" autoComplete="email" />
        <input
          name="phone"
          required
          pattern="[0-9+\-\s\(\)]{7,32}"
          inputMode="tel"
          placeholder="03XX XXXXXXX"
          autoComplete="tel"
        />
        <button type="submit" className="funnel-cta" disabled={submitting}>
          {submitting
            ? <><Loader2 className="h-5 w-5 animate-spin" /> Revealing…</>
            : cta}
        </button>
        <p className="funnel-lead-privacy">
          <Lock className="h-3 w-3" /> We only use this to send your results and order updates.
        </p>
      </form>
    </section>
  );
}
