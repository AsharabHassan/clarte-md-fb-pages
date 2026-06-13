import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';
import { GenerateAfterSchema } from '@/lib/validators/generate-after';
import { extractClientIp, hashIp, RATE_LIMIT_AI_PER_HOUR } from '@/lib/ai/rate-limit';
import { generateSkinMap, type SkinMap } from '@/lib/ai/skin-map';
import { generateAfterOpenAI } from '@/lib/ai/openai-generate-after';
import { ACNE_BA_PROMPT } from '@/lib/ai/prompts';
import { PIGMENTATION_BA_PROMPT } from '@/lib/ai/pigmentation-prompts';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

// gpt-image-2 at quality:medium typically completes in 30-90s; bump
// the route ceiling so we don't kill long generations. (Vercel Hobby
// caps at 300s; Pro at 800s.)
export const maxDuration = 180;

/**
 * POST /api/generate-after
 *
 * Two-pass OpenAI pipeline:
 *  1. gpt-4o vision → structured skin map (primary/secondary concerns, severity, ...)
 *  2. gpt-image-1 edit → photoreal 12-week projection, biased by the map
 *
 * Returns: { image, skin_map, ai_session_id }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = GenerateAfterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
  const input = parsed.data;

  // Size check (base64 → ~1.33x bytes; 8 MB raw ~= 10.7 MB base64)
  if (input.image_base64.length > 11_000_000) {
    return NextResponse.json({ ok: false, error: 'Image too large (max 8 MB)' }, { status: 413 });
  }

  // Rate limit per IP per hour.
  const ipHash = hashIp(extractClientIp(req.headers));
  const recent = (await db.execute(sql`
    SELECT count(*)::int AS c FROM ai_sessions
    WHERE client_ip_hash = ${ipHash} AND created_at > now() - interval '1 hour'
  `)) as unknown as Array<{ c: number }>;
  const count = Number(recent[0]?.c ?? 0);
  if (count >= RATE_LIMIT_AI_PER_HOUR) {
    return NextResponse.json(
      { ok: false, error: 'Too many generations from your address. Try again in an hour or message us on WhatsApp.' },
      { status: 429 },
    );
  }

  // Upload input to Storage for observability.
  const supa = createSupabaseAdminClient();
  const sha = createHash('sha256').update(Buffer.from(input.image_base64, 'base64')).digest('hex');
  const yyyy = new Date().getFullYear();
  const mm = String(new Date().getMonth() + 1).padStart(2, '0');
  const inputPath = `${yyyy}/${mm}/${sha}.bin`;

  const { error: uploadErr } = await supa.storage
    .from('ai-inputs')
    .upload(inputPath, Buffer.from(input.image_base64, 'base64'), {
      contentType: input.mime_type,
      upsert: true,
    });
  if (uploadErr) {
    console.error('Storage upload (input) failed', uploadErr);
    // Continue — Storage is observability-grade, not request-critical.
  }

  // ─── PASS 1: skin map via gpt-4o vision ────────────────────────────────
  let map: SkinMap | null = null;
  let mapModel: string | undefined;
  try {
    const r = await generateSkinMap({
      imageBase64: input.image_base64,
      mimeType: input.mime_type,
      bundleSlug: input.bundle_slug,
    });
    map = r.map;
    mapModel = r.modelVersion;
  } catch (err) {
    // Map failure is non-fatal — fall through to image gen with default prompt.
    console.error('OpenAI vision skin-map failed', err);
  }

  // ─── PASS 2: photoreal 12-week projection via gpt-image-1 ─────────────
  let result;
  try {
    result = await generateAfterOpenAI({
      inputBase64: input.image_base64,
      inputMimeType: input.mime_type,
      prompt:
        input.prompt ||
        (input.concern === 'pigmentation' ? PIGMENTATION_BA_PROMPT : ACNE_BA_PROMPT),
      bundleSlug: input.bundle_slug,
      map,
      quality: input.quality,
    });
  } catch (err: unknown) {
    console.error('OpenAI generate-after failed', err);
    const errMsg = err instanceof Error ? err.message : String(err);

    await db.insert(schema.aiSessions).values({
      kind: 'before_after',
      concern: input.concern,
      inputImagePath: inputPath,
      inputImageSha256: sha,
      modelVersion: mapModel ?? 'gpt-image-1',
      consentGiven: true,
      clientIpHash: ipHash,
      clientUa: req.headers.get('user-agent') ?? null,
      error: errMsg.slice(0, 1000),
    });

    return NextResponse.json(
      { ok: false, error: "We couldn't generate your preview. Please submit a clearer, front-facing photograph in even light." },
      { status: 504 },
    );
  }

  // Upload output to Storage.
  const outputPath = `${yyyy}/${mm}/${sha}_out.bin`;
  const outputBuf = Buffer.from(result.outputBase64, 'base64');
  await supa.storage.from('ai-outputs').upload(outputPath, outputBuf, {
    contentType: result.mimeType,
    upsert: true,
  });

  // Persist session — combined model string captures both passes.
  const combinedModel = [mapModel, result.modelVersion].filter(Boolean).join(' + ');
  const [sessionRow] = await db
    .insert(schema.aiSessions)
    .values({
      kind: 'before_after',
      concern: input.concern,
      inputImagePath: inputPath,
      inputImageSha256: sha,
      outputImagePath: outputPath,
      modelVersion: combinedModel || result.modelVersion,
      latencyMs: result.latencyMs,
      consentGiven: true,
      clientIpHash: ipHash,
      clientUa: req.headers.get('user-agent') ?? null,
    })
    .returning({ id: schema.aiSessions.id });

  return NextResponse.json({
    image: `data:${result.mimeType};base64,${result.outputBase64}`,
    skin_map: map,
    ai_session_id: sessionRow.id,
  });
}
