'use client';

/**
 * Pushes a funnel event into the GTM dataLayer (GTM-P8VD7TBS is loaded
 * site-wide). No-op on the server or if dataLayer is unavailable.
 */
export type FunnelEvent =
  | 'scan_started'
  | 'analysis_complete'
  | 'lead_captured'
  | 'offer_viewed'
  | 'add_shipping'
  | 'order_placed'
  // quiz funnel — per-step drop-off instrumentation
  | 'quiz_start'
  | 'quiz_q1_complete'
  | 'quiz_q2_complete'
  | 'quiz_q3_complete'
  | 'quiz_q4_complete'
  | 'result_viewed'
  | 'cod_checkout_clicked'
  // result-page order CTAs + sticky cart
  | 'order_now_clicked'
  | 'whatsapp_order_clicked'
  | 'sticky_checkout_clicked'
  | 'direct_buy_clicked';

export function pushFunnelEvent(event: FunnelEvent, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { dataLayer?: Array<Record<string, unknown>> };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event: `funnel_${event}`, funnel: 'acne-scan', ...params });
}
