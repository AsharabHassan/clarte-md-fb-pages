import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';
import { AnalyzeSkinSchema } from '@/lib/validators/analyze-skin';
import { extractClientIp, hashIp, RATE_LIMIT_AI_PER_HOUR } from '@/lib/ai/rate-limit';
import { analyzeSkin } from '@/lib/ai/analyze-skin';
import { PIGMENTATION_ANALYSIS_PROMPT } from '@/lib/ai/pigmentation-prompts';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = AnalyzeSkinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
  const input = parsed.data;

  if (input.image_base64.length > 11_000_000) {
    return NextResponse.json({ ok: false, error: 'Image too large (max 8 MB)' }, { status: 413 });
  }

  // postgres-js .execute() returns the row array directly — see [[project_runtime_quirks]] §5
  const ipHash = hashIp(extractClientIp(req.headers));
  const recent = (await db.execute(sql`
    SELECT count(*)::int AS c FROM ai_sessions
    WHERE client_ip_hash = ${ipHash} AND created_at > now() - interval '1 hour'
  `)) as unknown as Array<{ c: number }>;
  const count = Number(recent[0]?.c ?? 0);
  if (count >= RATE_LIMIT_AI_PER_HOUR) {
    return NextResponse.json({ ok: false, error: 'Rate limit reached. Try again in an hour.' }, { status: 429 });
  }

  const supa = createSupabaseAdminClient();
  const sha = createHash('sha256').update(Buffer.from(input.image_base64, 'base64')).digest('hex');
  const yyyy = new Date().getFullYear();
  const mm = String(new Date().getMonth() + 1).padStart(2, '0');
  const inputPath = `${yyyy}/${mm}/${sha}_analysis.bin`;

  await supa.storage.from('ai-inputs').upload(inputPath, Buffer.from(input.image_base64, 'base64'), {
    contentType: input.mime_type,
    upsert: true,
  });

  let result;
  try {
    result = await analyzeSkin({
      inputBase64: input.image_base64,
      inputMimeType: input.mime_type,
      prompt: input.concern === 'pigmentation' ? PIGMENTATION_ANALYSIS_PROMPT : undefined,
    });
  } catch (err: unknown) {
    console.error('Gemini analyze-skin failed', err);
    const errMsg = err instanceof Error ? err.message : String(err);
    await db.insert(schema.aiSessions).values({
      kind: 'skin_analysis',
      concern: input.concern,
      inputImagePath: inputPath,
      inputImageSha256: sha,
      modelVersion: 'gemini-2.5-pro',
      consentGiven: input.consent,
      clientIpHash: ipHash,
      clientUa: req.headers.get('user-agent') ?? null,
      error: errMsg.slice(0, 1000),
    });
    return NextResponse.json(
      { ok: false, error: 'Analysis failed. Please try a clearer photograph.' },
      { status: 504 },
    );
  }

  const [sessionRow] = await db
    .insert(schema.aiSessions)
    .values({
      kind: 'skin_analysis',
      concern: input.concern,
      inputImagePath: inputPath,
      inputImageSha256: sha,
      analysisJson: result.analysis,
      modelVersion: result.modelVersion,
      latencyMs: result.latencyMs,
      consentGiven: input.consent,
      clientIpHash: ipHash,
      clientUa: req.headers.get('user-agent') ?? null,
    })
    .returning({ id: schema.aiSessions.id });

  return NextResponse.json({ ai_session_id: sessionRow.id, analysis: result.analysis });
}
