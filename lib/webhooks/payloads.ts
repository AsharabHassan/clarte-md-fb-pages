/**
 * Builders that turn DB rows into webhook payloads.
 * Keeps the route handlers thin and the payload shape in one place.
 */

import type { Order, OrderItem } from '@/lib/db/schema';
import type { OrderEvent, OrderEventPayload } from './types';
import { FB_PIXEL_ID, metaEventName } from '@/lib/funnel/meta';

export function buildOrderEventPayload(args: {
  event: OrderEvent;
  order: Order;
  items: OrderItem[];
  previousStatus?: string;
  /** Pixel eventID from the browser, used for Meta CAPI dedup (order.created). */
  metaEventId?: string;
}): OrderEventPayload {
  const { event, order, items, previousStatus, metaEventId } = args;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lp.clartemd.com.pk';

  return {
    event,
    timestamp: new Date().toISOString(),
    meta: {
      pixel_id: FB_PIXEL_ID,
      // Falls back to a deterministic id for admin-triggered status events
      // (which have no matching browser event).
      event_id: metaEventId ?? `${order.orderNumber}:${event}`,
      event_name: metaEventName(event),
      value: order.totalPkr,
      currency: 'PKR',
    },
    order: {
      id: order.id,
      order_number: order.orderNumber,
      status: order.status,
      ...(previousStatus ? { previous_status: previousStatus } : {}),
      concern: order.concern,
      source_page: order.sourcePage,
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail,
      },
      shipping: {
        address: order.shippingAddress,
        city: order.shippingCity,
        postal: order.shippingPostal,
        notes: order.shippingNotes,
      },
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      items: items.map((i) => ({
        sku: i.sku,
        name: i.name,
        qty: i.qty,
        unit_price_pkr: i.unitPricePkr,
        is_bundle: i.isBundle,
      })),
      totals: {
        subtotal_pkr: order.subtotalPkr,
        shipping_pkr: order.shippingPkr,
        total_pkr: order.totalPkr,
      },
      used_ai_preview: order.usedAiPreview,
      ai_session_id: order.aiSessionId,
      created_at: order.createdAt.toISOString(),
      admin_link: `${siteUrl}/admin/orders/${order.id}`,
    },
  };
}

/**
 * Map a new order status to its corresponding webhook env var name.
 * Returns undefined for statuses that don't have a webhook (none currently).
 */
export function statusToWebhookEnvVar(status: string): string | undefined {
  switch (status) {
    case 'confirmed':
      return 'WEBHOOK_ORDER_CONFIRMED';
    case 'dispatched':
      return 'WEBHOOK_ORDER_DISPATCHED';
    case 'delivered':
      return 'WEBHOOK_ORDER_DELIVERED';
    case 'cancelled':
      return 'WEBHOOK_ORDER_CANCELLED';
    case 'refunded':
      return 'WEBHOOK_ORDER_REFUNDED';
    default:
      return undefined;
  }
}

/**
 * Map a status string to its OrderEvent. Returns undefined when the
 * status has no event (e.g. 'pending' — there's no webhook for that
 * since order.created covers the initial pending state).
 */
export function statusToOrderEvent(status: string): OrderEvent | undefined {
  switch (status) {
    case 'confirmed':
      return 'order.confirmed';
    case 'dispatched':
      return 'order.dispatched';
    case 'delivered':
      return 'order.delivered';
    case 'cancelled':
      return 'order.cancelled';
    case 'refunded':
      return 'order.refunded';
    default:
      return undefined;
  }
}
