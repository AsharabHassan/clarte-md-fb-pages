/**
 * Stores the lead's name/email/phone in sessionStorage (this browser
 * session only) so the checkout can prefill them. Address is never stored —
 * the customer enters that fresh on the offer page.
 */

const KEY = 'clarte:funnel-lead';

export interface LeadContact {
  name: string;
  email: string;
  phone: string;
}

export function saveLead(lead: LeadContact): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(lead));
  } catch {
    /* sessionStorage may be blocked (private mode) — non-fatal */
  }
}

export function loadLead(): LeadContact | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<LeadContact>;
    if (typeof p.name === 'string' && typeof p.email === 'string' && typeof p.phone === 'string') {
      return { name: p.name, email: p.email, phone: p.phone };
    }
  } catch {
    /* ignore malformed data */
  }
  return null;
}
