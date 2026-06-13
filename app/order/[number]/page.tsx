/* eslint-disable react/no-unescaped-entities */
import { headers } from 'next/headers';
import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  MessageCircle,
  PackageCheck,
  Truck,
  Package,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrustStrip } from '@/components/marketing/TrustStrip';
import { Reveal, RevealGroup } from '@/lib/anim/reveal';
import { cn } from '@/lib/utils';
import './order.css';

interface PageParams {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ phone?: string; placed?: string }>;
}

interface OrderPayload {
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  customer_first_name: string;
  shipping_city: string;
  items: Array<{
    name: string;
    qty: number;
    unit_price_pkr: number;
    line_total_pkr: number;
    is_bundle: boolean;
  }>;
  totals: { subtotal_pkr: number; shipping_pkr: number; total_pkr: number };
  created_at: string;
}

/** Step in the visual timeline. Linear order: pending → confirmed → dispatched → delivered. */
const TIMELINE_STEPS = [
  { key: 'pending', label: 'Order received', icon: PackageCheck },
  { key: 'confirmed', label: 'Preparing parcel', icon: Package },
  { key: 'dispatched', label: 'Courier on the way', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
] as const;

const TIMELINE_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  dispatched: 2,
  delivered: 3,
};

const STATUS_COPY: Record<string, { label: string; sub: string }> = {
  pending: {
    label: 'Order received',
    sub: 'We are confirming and will dispatch within 24 hours.',
  },
  confirmed: {
    label: 'Confirmed — preparing your parcel',
    sub: 'Packing now. Courier collects within 24 hours.',
  },
  dispatched: {
    label: 'On the way',
    sub: 'The courier has it. You will receive a tracking SMS shortly.',
  },
  delivered: {
    label: 'Delivered',
    sub: 'Welcome to the protocol. Message our team on WhatsApp anytime.',
  },
  cancelled: {
    label: 'Cancelled',
    sub: 'This order was cancelled. WhatsApp us if you need help.',
  },
  refunded: {
    label: 'Refunded',
    sub: 'A refund was issued. WhatsApp us with questions.',
  },
};

async function fetchOrder(number: string, phone: string): Promise<OrderPayload | null> {
  const h = await headers();
  const host = h.get('host') ?? 'localhost:3001';
  const proto =
    h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  const base = `${proto}://${host}`;
  const res = await fetch(
    `${base}/api/order/${encodeURIComponent(number)}?phone=${encodeURIComponent(phone)}`,
    { cache: 'no-store' },
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.order;
}

const PHONE_LOOKUP_WRAP = 'mx-auto max-w-[42rem] px-6 pt-16 pb-24 md:pt-24';

export default async function OrderPage({ params, searchParams }: PageParams) {
  const { number } = await params;
  const { phone, placed } = await searchParams;
  const isFirstVisit = placed === '1';

  /* ─── Phone-input lookup (anyone hitting /order/[number] without ?phone) ─── */
  if (!phone) {
    return (
      <div className="bg-canvas">
        <div className={PHONE_LOOKUP_WRAP}>
          <RevealGroup stagger={0.1}>
            <Reveal>
              <Eyebrow className="mb-3 text-cobalt">— Track your order</Eyebrow>
            </Reveal>
            <Reveal>
              <h1 className="mb-3 font-display font-light text-navy text-[clamp(32px,4.5vw,48px)] leading-[1.05] tracking-[-0.025em]">
                Look up <em className="italic">{number}.</em>
              </h1>
            </Reveal>
            <Reveal>
              <p className="mb-8 font-display italic text-[16px] leading-relaxed text-ink-mute md:text-[18px]">
                Enter the last 4 digits of the phone number you ordered with.
              </p>
            </Reveal>
            <Reveal>
              <form method="get" className="rounded-2xl border border-rule bg-card p-5 md:p-6">
                <label className="block">
                  <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">
                    Last 4 digits of your phone
                  </span>
                  <Input
                    name="phone"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    required
                    placeholder="XXXX"
                    autoFocus
                    className="h-14 text-center font-mono text-lg tracking-[0.5em]"
                  />
                </label>
                <Button type="submit" size="lg" className="mt-4 h-14 w-full text-[15px]">
                  Look up {number} →
                </Button>
              </form>
            </Reveal>
          </RevealGroup>
          <p className="mt-8 text-center text-[13.5px] text-ink-mute">
            Can't find your order?{' '}
            <a
              href="https://wa.me/923249986822"
              className="font-semibold text-cobalt hover:underline"
            >
              WhatsApp our team
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  const order = await fetchOrder(number, phone);

  /* ─── Order not found ─── */
  if (!order) {
    return (
      <div className="bg-canvas">
        <div className={PHONE_LOOKUP_WRAP}>
          <Eyebrow className="mb-3 text-destructive">— Not found</Eyebrow>
          <h1 className="mb-3 font-display font-light text-navy text-[clamp(28px,4vw,40px)] leading-[1.05] tracking-[-0.02em]">
            Couldn't find that order.
          </h1>
          <p className="mb-7 text-[15px] leading-relaxed text-ink-2">
            We looked for{' '}
            <code className="rounded bg-sky px-1.5 py-0.5 font-mono text-[13px] text-navy">
              {number}
            </code>{' '}
            with phone ending{' '}
            <code className="rounded bg-sky px-1.5 py-0.5 font-mono text-[13px] text-navy">
              {phone}
            </code>{' '}
            — no match.
          </p>
          <p className="text-[14px] text-ink-mute">
            Double-check the order number and the phone you used at checkout, or{' '}
            <a
              href="https://wa.me/923249986822"
              className="font-semibold text-cobalt hover:underline"
            >
              WhatsApp our team
            </a>{' '}
            — we'll find it manually.
          </p>
        </div>
      </div>
    );
  }

  const copy = STATUS_COPY[order.status] || { label: order.status, sub: '' };
  const isDead = order.status === 'cancelled' || order.status === 'refunded';
  const activeIdx = TIMELINE_INDEX[order.status] ?? 0;

  return (
    <div className="bg-canvas pb-24">
      {/* ───── Cinematic celebration band — only after a fresh checkout submit ───── */}
      {isFirstVisit && (
        <section className="relative isolate overflow-hidden bg-navy-deep text-white">
          {/* Backdrop grid + halo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#8ab0e0_1px,transparent_1px),linear-gradient(to_bottom,#8ab0e0_1px,transparent_1px)] [background-size:60px_60px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-cobalt/30 blur-[120px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 bottom-0 h-[24rem] w-[24rem] rounded-full bg-cobalt-glow/15 blur-[100px]"
          />

          <div className="relative mx-auto max-w-[60rem] px-6 pt-16 pb-12 md:pt-20 md:pb-16 [text-shadow:0_2px_18px_rgba(8,21,42,0.55)]">
            <RevealGroup stagger={0.1}>
              <Reveal>
                <span className="mb-4 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-cobalt-glow">
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                  Order confirmed
                </span>
              </Reveal>
              <Reveal>
                <h1
                  style={{ color: '#ffffff' }}
                  className="mb-3 font-display font-light text-[clamp(34px,5.5vw,64px)] leading-[1.02] tracking-[-0.025em]"
                >
                  Thank you, <em className="italic text-cobalt-glow">{order.customer_first_name}.</em>
                </h1>
              </Reveal>
              <Reveal>
                <p className="mb-8 max-w-[40rem] font-display italic text-[clamp(16px,1.7vw,20px)] leading-relaxed text-white/80">
                  We've received order{' '}
                  <span className="font-mono text-[14px] text-cobalt-glow">
                    {order.order_number}
                  </span>{' '}
                  and will dispatch within 24 hours. A WhatsApp confirmation is on its way.
                </p>
              </Reveal>

              {/* Three-step "what happens next" */}
              <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <Reveal>
                  <NextStepCard
                    num="01"
                    title="We confirm"
                    body="A WhatsApp message lands within 2 hours."
                  />
                </Reveal>
                <Reveal>
                  <NextStepCard
                    num="02"
                    title="Courier collects"
                    body="Sealed protocol leaves Lahore within 24 hours."
                  />
                </Reveal>
                <Reveal>
                  <NextStepCard
                    num="03"
                    title="Pay on delivery"
                    body={`Rs. ${order.totals.total_pkr.toLocaleString('en-PK')} in cash to the courier.`}
                  />
                </Reveal>
              </ol>

              <Reveal>
                <a
                  href="https://wa.me/923249986822"
                  target="_blank"
                  rel="noopener"
                  className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-white backdrop-blur transition-colors hover:bg-white/20"
                >
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Need to change something? WhatsApp us
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </Reveal>
            </RevealGroup>
          </div>
        </section>
      )}

      {/* ───── Order details + timeline ───── */}
      <div className="mx-auto max-w-[60rem] px-6 pt-12 md:pt-16">
        <Reveal>
          <header className="mb-7 flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-5 md:mb-9">
            <div>
              <Eyebrow className="mb-2 text-ink-mute">Order</Eyebrow>
              {isFirstVisit ? (
                <h2 className="font-mono text-[24px] font-semibold tracking-[0.02em] text-navy md:text-[28px]">
                  {order.order_number}
                </h2>
              ) : (
                <h1 className="font-mono text-[24px] font-semibold tracking-[0.02em] text-navy md:text-[28px]">
                  {order.order_number}
                </h1>
              )}
              <p className="mt-1 font-mono text-[11.5px] uppercase tracking-[0.18em] text-ink-mute">
                Placed {new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })} · {order.shipping_city}
              </p>
            </div>
            <span
              className={cn(
                'rounded-full px-3 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em]',
                isDead
                  ? 'bg-rose-50 text-destructive'
                  : order.status === 'delivered'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-cobalt/10 text-cobalt',
              )}
            >
              {copy.label}
            </span>
          </header>
        </Reveal>

        {/* Visual timeline */}
        {!isDead && (
          <Reveal>
            <section className="mb-10 rounded-2xl border border-rule bg-card p-5 md:p-7" aria-label="Delivery timeline">
              <ol className="relative grid grid-cols-1 gap-5 sm:grid-cols-4 sm:gap-0">
                {TIMELINE_STEPS.map((step, idx) => {
                  const isDone = idx < activeIdx;
                  const isActive = idx === activeIdx;
                  const Icon = step.icon;
                  return (
                    <li key={step.key} className="relative flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                      <span
                        className={cn(
                          'relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition-colors',
                          isDone && 'border-cobalt bg-cobalt text-white',
                          isActive && 'border-cobalt bg-white text-cobalt ring-4 ring-cobalt/15',
                          !isDone && !isActive && 'border-rule bg-white text-ink-faint',
                        )}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
                        ) : (
                          <Icon className="h-4.5 w-4.5" strokeWidth={1.5} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1 sm:mt-3">
                        <p
                          className={cn(
                            'font-display text-[14px] font-medium leading-tight',
                            isActive ? 'text-navy' : isDone ? 'text-cobalt' : 'text-ink-mute',
                          )}
                        >
                          {step.label}
                        </p>
                        {isActive && (
                          <p className="mt-1 font-body text-[12.5px] leading-snug text-ink-mute">
                            {copy.sub}
                          </p>
                        )}
                      </div>
                      {/* Connector line (desktop only) */}
                      {idx < TIMELINE_STEPS.length - 1 && (
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute top-5 left-1/2 hidden h-0.5 w-full -translate-y-1/2 sm:block',
                            idx < activeIdx ? 'bg-cobalt' : 'bg-rule',
                          )}
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          </Reveal>
        )}

        {isDead && (
          <Reveal>
            <section
              className={cn(
                'mb-10 flex items-start gap-3 rounded-2xl border-l-4 border-l-destructive bg-rose-50/50 px-5 py-5',
              )}
            >
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" strokeWidth={1.5} />
              <div>
                <h2 className="font-display text-[18px] font-medium text-navy">{copy.label}</h2>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{copy.sub}</p>
              </div>
            </section>
          </Reveal>
        )}

        {/* Items + totals */}
        <Reveal>
          <section className="mb-10 rounded-2xl border border-rule bg-card p-5 md:p-7">
            <div className="mb-4 flex items-center justify-between">
              <Eyebrow className="text-cobalt">— What's in this order</Eyebrow>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-mute">
                {order.items.reduce((n, i) => n + i.qty, 0)} {order.items.reduce((n, i) => n + i.qty, 0) === 1 ? 'item' : 'items'}
              </span>
            </div>
            <ul className="mb-5 flex flex-col divide-y divide-rule-soft">
              {order.items.map((i, idx) => (
                <li
                  key={idx}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-3 text-[14px] sm:gap-5"
                >
                  <span className="min-w-0">
                    <span className="font-display font-medium text-navy">{i.name}</span>
                    {i.is_bundle && (
                      <span className="ml-2 inline-block rounded bg-cobalt/10 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-cobalt">
                        Bundle
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[12px] text-ink-mute tabular-nums">×{i.qty}</span>
                  <span className="font-mono text-[13.5px] tabular-nums text-navy">
                    Rs. {i.line_total_pkr.toLocaleString('en-PK')}
                  </span>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t border-rule pt-4 text-[13.5px] text-ink-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">Rs. {order.totals.subtotal_pkr.toLocaleString('en-PK')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-mono tabular-nums">
                  {order.totals.shipping_pkr === 0
                    ? 'FREE'
                    : `Rs. ${order.totals.shipping_pkr.toLocaleString('en-PK')}`}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-rule pt-3 font-display text-[18px] font-medium text-navy">
                <span>Total</span>
                <span className="font-mono font-semibold tabular-nums">
                  Rs. {order.totals.total_pkr.toLocaleString('en-PK')}
                </span>
              </div>
              <p className="pt-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-mute">
                Payment: {order.payment_method} · {order.payment_status}
              </p>
            </div>
          </section>
        </Reveal>

        {/* WhatsApp support card */}
        <Reveal>
          <section className="mb-12 flex flex-col items-start gap-4 rounded-2xl border border-cobalt/25 bg-cobalt/5 p-5 sm:flex-row sm:items-center md:p-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-cobalt text-white">
              <MessageCircle className="h-5 w-5" strokeWidth={1.6} />
            </span>
            <div className="flex-1">
              <h2 className="font-display text-[16px] font-medium text-navy md:text-[18px]">
                Anything we can help with?
              </h2>
              <p className="mt-1 font-body text-[13.5px] leading-relaxed text-ink-2">
                A real person from our team replies on WhatsApp, usually within 2 hours, Mon–Sat.
              </p>
            </div>
            <a
              href="https://wa.me/923249986822"
              target="_blank"
              rel="noopener"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-emerald-700"
            >
              WhatsApp our team
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </section>
        </Reveal>

        {/* Continue-shopping CTA */}
        <Reveal>
          <div className="mb-12 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-mute">
              <Sparkles className="h-3.5 w-3.5 text-cobalt" />
              Want to add to the protocol later?
            </span>
            <Link
              href="https://clartemd.com.pk/products"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-rule bg-card px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-navy transition-colors hover:border-navy/30"
            >
              Browse the catalogue →
            </Link>
          </div>
        </Reveal>
      </div>

      {/* Trust band */}
      <section className="bg-canvas-soft py-12 md:py-16">
        <div className="mx-auto max-w-[60rem] px-6">
          <Reveal>
            <Eyebrow className="mb-5 text-cobalt">— Every order, every time</Eyebrow>
          </Reveal>
          <Reveal>
            <TrustStrip variant="cards" tone="light" limit={6} />
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function NextStepCard({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <li className="rounded-2xl border border-white/15 bg-white/[0.07] p-5 backdrop-blur-sm">
      <span
        aria-hidden="true"
        className="font-display italic text-cobalt-glow text-[28px] leading-none"
      >
        {num}
      </span>
      <h3 className="mt-3 font-display text-[15px] font-medium text-white">{title}</h3>
      <p className="mt-1 font-body text-[12.5px] leading-snug text-white/70">{body}</p>
    </li>
  );
}
