'use client';

/**
 * Pushes a funnel event into the GTM dataLayer (GTM-P8VD7TBS is loaded
 * site-wide). No-op on the server or if dataLayer is unavailable.
 */
export type FunnelEvent =
  | 'scan_started'
  | 'analysis_complete'
  | 'offer_viewed'
  | 'add_shipping'
  | 'order_placed';

export function pushFunnelEvent(event: FunnelEvent, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { dataLayer?: Array<Record<string, unknown>> };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event: `funnel_${event}`, funnel: 'acne-scan', ...params });
}
