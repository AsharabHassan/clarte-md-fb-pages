'use client';

import { useState } from 'react';
import { Loader2, Lock, Sparkles } from 'lucide-react';
import { saveLead } from '@/lib/funnel/lead-storage';
import { pushFunnelEvent } from '@/lib/funnel/analytics';
import type { ScanResult } from './ScanStep';

/**
 * Lead-capture gate shown AFTER the AI analysis but BEFORE the results are
 * revealed. Required (no skip): the user must give name/email/phone. On
 * submit it persists the contact for checkout prefill and fires the
 * lead.captured webhook server-side, then reveals the results.
 */
export function LeadStep({ scan, onComplete }: { scan: ScanResult; onComplete: () => void }) {
  const [submitting, setSubmitting] = useState(false);

  async function submit(form: HTMLFormElement) {
    setSubmitting(true);
    const fd = new FormData(form);
    const lead = {
      name: String(fd.get('name') ?? '').trim(),
      email: String(fd.get('email') ?? '').trim(),
      phone: String(fd.get('phone') ?? '').trim(),
    };

    // Persist for checkout prefill (this session only).
    saveLead(lead);
    pushFunnelEvent('lead_captured');

    // Fire the lead webhook (best-effort; never trap the user on the gate).
    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...lead,
          concern: 'acne',
          ...(scan.aiSessionId ? { ai_session_id: scan.aiSessionId } : {}),
          source_url: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      });
    } catch {
      /* non-fatal — still reveal the results */
    }

    onComplete();
  }

  return (
    <section className="funnel-scan funnel-lead">
      <span className="funnel-lead-eyebrow">
        <Sparkles className="h-3.5 w-3.5" /> Analysis complete
      </span>
      <h1 className="funnel-h1">Your results are ready.</h1>
      <p className="funnel-sub">
        Enter your details to unlock your personalised 12-week skin projection and protocol.
      </p>

      <form
        className="funnel-form funnel-lead-form"
        onSubmit={(e) => { e.preventDefault(); submit(e.currentTarget); }}
      >
        <input name="name" required placeholder="Full name" autoComplete="name" />
        <input name="email" type="email" required placeholder="Email" autoComplete="email" />
        <input
          name="phone"
          required
          pattern="[0-9+\-\s()]{7,32}"
          inputMode="tel"
          placeholder="03XX XXXXXXX"
          autoComplete="tel"
        />
        <button type="submit" className="funnel-cta" disabled={submitting}>
          {submitting
            ? <><Loader2 className="h-5 w-5 animate-spin" /> Revealing…</>
            : 'Reveal my results →'}
        </button>
        <p className="funnel-lead-privacy">
          <Lock className="h-3 w-3" /> We only use this to send your results and order updates.
        </p>
      </form>
    </section>
  );
}
