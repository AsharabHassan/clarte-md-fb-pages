/**
 * Payload shapes for outbound automation webhooks (sub-project #3).
 * Documented in docs/runbooks/2026-05-17-automation-webhooks.md so
 * operators wiring Zapier/Make.com know what to expect.
 */

export type OrderEvent =
  | 'order.created'
  | 'order.confirmed'
  | 'order.dispatched'
  | 'order.delivered'
  | 'order.cancelled'
  | 'order.refunded';

export interface OrderEventPayload {
  event: OrderEvent;
  timestamp: string; // ISO 8601 UTC
  order: {
    id: string;
    order_number: string;
    status: string;
    previous_status?: string; // present on status-change events, not on order.created
    concern: string | null;
    source_page: string;
    customer: {
      name: string;
      phone: string;
      email: string;
    };
    shipping: {
      address: string;
      city: string;
      postal: string | null;
      notes: string | null;
    };
    payment_method: string;
    payment_status: string;
    items: Array<{
      sku: string;
      name: string;
      qty: number;
      unit_price_pkr: number;
      is_bundle: boolean;
    }>;
    totals: {
      subtotal_pkr: number;
      shipping_pkr: number;
      total_pkr: number;
    };
    used_ai_preview: boolean;
    ai_session_id: string | null;
    created_at: string;
    admin_link: string;
  };
}
