import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';
import { extractClientIp, hashIp, RATE_LIMIT_ORDERS_PER_HOUR } from '@/lib/ai/rate-limit';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ number: string }> },
) {
  const { number } = await ctx.params;
  const url = new URL(req.url);
  const phone = (url.searchParams.get('phone') ?? '').replace(/\D/g, '');

  if (!phone || phone.length < 4) {
    return NextResponse.json(
      { ok: false, error: 'Phone number required (last 4 digits at minimum)' },
      { status: 400 },
    );
  }

  // Rate-limit by IP to defeat brute-force of phone-last-4 (10k combos
  // per known order_number). Every attempt — found or not — is logged
  // to order_lookups so the count includes guessers who never placed
  // an order. postgres-js .execute() returns the row array directly —
  // see [[project_runtime_quirks]] §5.
  const ipHash = hashIp(extractClientIp(req.headers));
  const recent = (await db.execute(sql`
    SELECT count(*)::int AS c FROM order_lookups
    WHERE client_ip_hash = ${ipHash} AND created_at > now() - interval '1 hour'
  `)) as unknown as Array<{ c: number }>;
  const count = Number(recent[0]?.c ?? 0);
  if (count >= RATE_LIMIT_ORDERS_PER_HOUR) {
    return NextResponse.json(
      { ok: false, error: 'Too many lookup attempts. WhatsApp us to check manually.' },
      { status: 429 },
    );
  }

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.orderNumber, number))
    .limit(1);

  const phoneLast4 = phone.slice(-4);
  const dbLast4 = order ? order.customerPhone.replace(/\D/g, '').slice(-4) : '';
  const matched = !!order && dbLast4 === phoneLast4;

  // Log the attempt before responding so brute-force counts up
  // even when callers abandon the response.
  await db.insert(schema.orderLookups).values({
    clientIpHash: ipHash,
    targetOrderNumber: number,
    found: matched,
  });

  // Don't leak existence. 404 for both missing-order and wrong-phone.
  if (!matched) {
    return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
  }

  const items = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, order.id));

  // Sanitize — first name only, city only (no full address).
  const firstName = order.customerName.split(/\s+/)[0] || 'Customer';

  return NextResponse.json({
    ok: true,
    order: {
      order_number: order.orderNumber,
      status: order.status,
      payment_status: order.paymentStatus,
      payment_method: order.paymentMethod,
      customer_first_name: firstName,
      shipping_city: order.shippingCity,
      items: items.map((i) => ({
        name: i.name,
        qty: i.qty,
        unit_price_pkr: i.unitPricePkr,
        line_total_pkr: i.unitPricePkr * i.qty,
        is_bundle: i.isBundle,
      })),
      totals: {
        subtotal_pkr: order.subtotalPkr,
        shipping_pkr: order.shippingPkr,
        total_pkr: order.totalPkr,
      },
      created_at: order.createdAt.toISOString(),
    },
  });
}
