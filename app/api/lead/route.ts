import { NextRequest, NextResponse } from 'next/server';
import { LeadSchema } from '@/lib/validators/lead';
import { dispatchWebhook } from '@/lib/webhooks/dispatcher';
import { FB_PIXEL_ID } from '@/lib/funnel/meta';

/**
 * POST /api/lead — captures the name/email/phone gate shown before results,
 * fires the `lead.captured` webhook server-side (URL kept off the client),
 * and carries a Meta `Lead` dedup block + any quiz answers for the CRM.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
  const lead = parsed.data;

  const hasQuiz = Boolean(lead.q1 || lead.q2 || lead.q3 || lead.q4);

  await dispatchWebhook(
    process.env.WEBHOOK_LEAD_CAPTURED,
    {
      event: 'lead.captured',
      timestamp: new Date().toISOString(),
      meta: {
        pixel_id: FB_PIXEL_ID,
        event_id: lead.meta_event_id ?? null,
        event_name: 'Lead',
      },
      lead: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        surface: hasQuiz ? 'quiz-funnel' : 'scan-funnel',
        scan_title: hasQuiz ? 'No-Photo Acne Quiz' : 'AI Skin Analysis',
        concern: lead.concern,
        ai_session_id: lead.ai_session_id ?? null,
        source_url: lead.source_url ?? null,
        ...(hasQuiz
          ? { quiz: { q1: lead.q1 ?? null, q2: lead.q2 ?? null, q3: lead.q3 ?? null, q4: lead.q4 ?? null } }
          : {}),
      },
    },
    'lead.captured',
  );

  return NextResponse.json({ ok: true });
}
