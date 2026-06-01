import { NextRequest, NextResponse } from 'next/server';
import { inArray, sql } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';
import { CreateOrderSchema } from '@/lib/validators/create-order';
import { computeTotals } from '@/lib/orders/compute-totals';
import { nextOrderNumber } from '@/lib/orders/order-number';
import { extractClientIp, hashIp, RATE_LIMIT_ORDERS_PER_HOUR } from '@/lib/ai/rate-limit';
import { dispatchWebhook } from '@/lib/webhooks/dispatcher';
import { buildOrderEventPayload } from '@/lib/webhooks/payloads';
import type { OrderItem } from '@/lib/db/schema';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
  const input = parsed.data;

  const ipHash = hashIp(extractClientIp(req.headers));

  // postgres-js .execute() returns the row array directly — see [[project_runtime_quirks]] §5
  const recent = (await db.execute(sql`
    SELECT count(*)::int AS c FROM orders
    WHERE client_ip_hash = ${ipHash} AND created_at > now() - interval '1 hour'
  `)) as unknown as Array<{ c: number }>;
  const count = Number(recent[0]?.c ?? 0);
  if (count >= RATE_LIMIT_ORDERS_PER_HOUR) {
    return NextResponse.json(
      { ok: false, error: 'Too many orders from your address. WhatsApp us to place this manually.' },
      { status: 429 },
    );
  }

  // ─── Server-authoritative price resolution ─────────────────────────
  // Trust ZERO client-sent prices. Look up every SKU/slug in the DB and
  // use those prices. Sub-project #6 Phase D Task 25: this hardens the
  // mixed-cart flow (where the universal /checkout may submit price: 0
  // values) and any future hostile client that lies about prices.
  //
  // Bundle SKUs end with '-protocol' and match against bundles.slug.
  // Individual product SKUs match against products.sku.
  const bundleSlugs = input.items.filter((i) => i.sku.endsWith('-protocol')).map((i) => i.sku);
  const productSkus = input.items.filter((i) => !i.sku.endsWith('-protocol')).map((i) => i.sku);

  const dbBundles =
    bundleSlugs.length > 0
      ? await db
          .select()
          .from(schema.bundles)
          .where(inArray(schema.bundles.slug, bundleSlugs))
      : [];
  const dbProducts =
    productSkus.length > 0
      ? await db
          .select()
          .from(schema.products)
          .where(inArray(schema.products.sku, productSkus))
      : [];

  // Reconstruct items with REAL prices + names from DB. Any unknown SKU
  // is rejected (the client sent something we don't sell).
  const items: Array<{
    sku: string;
    name: string;
    qty: number;
    unitPricePkr: number;
    isBundle: boolean;
  }> = [];
  for (const i of input.items) {
    const isBundle = i.sku.endsWith('-protocol');
    if (isBundle) {
      const b = dbBundles.find((x) => x.slug === i.sku);
      if (!b) {
        return NextResponse.json(
          { ok: false, error: `Unknown bundle: ${i.sku}` },
          { status: 400 },
        );
      }
      items.push({ sku: b.slug, name: b.name, qty: 1, unitPricePkr: b.pricePkr, isBundle: true });
    } else {
      const p = dbProducts.find((x) => x.sku === i.sku);
      if (!p) {
        return NextResponse.json(
          { ok: false, error: `Unknown product: ${i.sku}` },
          { status: 400 },
        );
      }
      items.push({
        sku: p.sku,
        name: p.name,
        qty: i.qty,
        unitPricePkr: p.pricePkr,
        isBundle: false,
      });
    }
  }

  // Recompute totals from real prices. Server is authoritative; we do
  // NOT compare to client-sent totals (the previous defense), because
  // the cart-driven flow legitimately submits zeros and lets the server
  // compute. Anyone bypassing this comparison loses no security because
  // we already overrode prices above.
  const totals = computeTotals(items);

  const orderNumber = await nextOrderNumber(db);

  // Validate ai_session_id if present (drop silently if unknown)
  let aiSessionUuid: string | null = null;
  if (input.ai_session_id) {
    const found = await db
      .select()
      .from(schema.aiSessions)
      .where(sql`id = ${input.ai_session_id}`)
      .limit(1);
    if (found.length) aiSessionUuid = found[0].id;
  }

  try {
    const [order] = await db
      .insert(schema.orders)
      .values({
        orderNumber,
        status: 'pending',
        concern: input.concern,
        sourcePage: input.page,
        customerName: input.contact.name,
        customerPhone: input.contact.phone,
        customerEmail: input.contact.email,
        shippingAddress: input.shipping.address,
        shippingCity: input.shipping.city,
        shippingPostal: input.shipping.postal || null,
        shippingNotes: input.shipping.notes || null,
        paymentMethod: input.payment,
        paymentStatus: 'pending',
        subtotalPkr: totals.subtotal,
        shippingPkr: totals.shipping,
        totalPkr: totals.total,
        bundleInCart: input.bundle_in_cart,
        usedAiPreview: input.used_ai_preview,
        aiSessionId: aiSessionUuid,
        clientIpHash: ipHash,
      })
      .returning();

    let insertedItems: OrderItem[] = [];
    if (items.length > 0) {
      insertedItems = await db
        .insert(schema.orderItems)
        .values(
          items.map((i) => ({
            orderId: order.id,
            sku: i.sku,
            name: i.name,
            qty: i.qty,
            unitPricePkr: i.unitPricePkr,
            isBundle: i.isBundle,
          })),
        )
        .returning();
    }

    // Fire-and-forget automation webhook (sub-project #3). The 3s
    // timeout inside dispatchWebhook bounds customer-visible latency.
    await dispatchWebhook(
      process.env.WEBHOOK_ORDER_CREATED,
      buildOrderEventPayload({
        event: 'order.created',
        order,
        items: insertedItems,
        metaEventId: input.meta_event_id,
      }) as unknown as Record<string, unknown>,
      'order.created',
    );

    return NextResponse.json({ ok: true, order_number: orderNumber });
  } catch (err) {
    console.error('Order insert failed', err);
    return NextResponse.json(
      { ok: false, error: "We couldn't place your order. Please WhatsApp us and we'll take it manually." },
      { status: 500 },
    );
  }
}
