import { NextRequest, NextResponse } from 'next/server';
import { LeadSchema } from '@/lib/validators/lead';
import { dispatchWebhook } from '@/lib/webhooks/dispatcher';

/**
 * POST /api/lead — captures the name/email/phone gate shown before the
 * results are revealed, and fires the `lead.captured` webhook server-side
 * (URL kept off the client; no CORS). The webhook payload mirrors the
 * main site's quiz lead shape.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
  const lead = parsed.data;

  await dispatchWebhook(
    process.env.WEBHOOK_LEAD_CAPTURED,
    {
      event: 'lead.captured',
      timestamp: new Date().toISOString(),
      lead: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        surface: 'scan-funnel',
        scan_title: 'AI Skin Analysis',
        concern: lead.concern,
        ai_session_id: lead.ai_session_id ?? null,
        source_url: lead.source_url ?? null,
      },
    },
    'lead.captured',
  );

  return NextResponse.json({ ok: true });
}
