/**
 * Meta (Facebook) Pixel + Conversions API helpers.
 * The Pixel ID is public (it ships in client HTML), so it's safe to hardcode.
 * The same `event_id` is used for the browser Pixel event AND the webhook
 * payload (forwarded to Meta CAPI by LeadConnector) so Meta deduplicates them.
 */

export const FB_PIXEL_ID = '1506593321048508';

/** Map an internal order event to its Meta standard event name. */
export function metaEventName(event: string): string {
  switch (event) {
    case 'order.created':
    case 'order.confirmed':
      return 'Purchase';
    case 'order.refunded':
      return 'Refund';
    default:
      return event;
  }
}

type Fbq = (...args: unknown[]) => void;

/**
 * Fire a browser Pixel `Purchase` with an explicit eventID so it dedupes
 * against the server-side CAPI event carrying the same id. No-op if the
 * Pixel hasn't loaded or on the server.
 */
export function trackMetaPurchase(valuePkr: number, eventId: string): void {
  if (typeof window === 'undefined') return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (typeof fbq !== 'function') return;
  fbq('track', 'Purchase', { value: valuePkr, currency: 'PKR' }, { eventID: eventId });
}

/**
 * Fire a browser Pixel `Lead` with an explicit eventID so it dedupes
 * against the server-side CAPI `Lead` carrying the same id (forwarded by
 * the lead webhook). No-op if the Pixel hasn't loaded or on the server.
 */
export function trackMetaLead(eventId: string): void {
  if (typeof window === 'undefined') return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (typeof fbq !== 'function') return;
  fbq('track', 'Lead', {}, { eventID: eventId });
}
