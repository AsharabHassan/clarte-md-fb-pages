import { getOpenAI, OPENAI_VISION_MODEL } from './openai';

/**
 * Structured triage analysis returned by GPT-4o vision. Mirrors the schema
 * documented in lib/ai/prompts.ts ANALYSIS_PROMPT — but tuned for a per-
 * protocol AI generator context (acne, even-tone, renewal, barrier).
 *
 * The model is instructed to *only* return JSON matching this shape. The
 * fields surface in the UI as the visible "map" beside the before/after.
 */
export interface SkinMap {
  /** 1–5 dominant issues visible in the photograph. */
  primary_concerns: string[];
  /** Minor co-occurring issues (0–4). */
  secondary_concerns: string[];
  /** Skin type observation: 'oily' | 'combination' | 'dry' | 'normal' | 'sensitive'. */
  skin_type: string;
  /** 'mild' | 'moderate' | 'severe' — cosmetic-concern severity only. */
  severity: 'mild' | 'moderate' | 'severe';
  /** 0..1 confidence score. */
  confidence: number;
  /** Realistic timeframe to see meaningful change with the given protocol. */
  expected_timeline_weeks: number;
  /** Optional warnings (cystic acne, suspected non-cosmetic conditions, etc). */
  warnings: string[];
  /** 3–6 ingredient strings with percentages where applicable. */
  recommended_actives: string[];
  /** One short paragraph (1–2 sentences) describing the visible state — used as the editorial caption under the map. */
  observation: string;
}

/** Per-protocol prompt context that biases the vision call toward the right concern. */
const PROTOCOL_CONTEXT: Record<string, string> = {
  'clear-skin-protocol':
    'The user is viewing the Clear Skin (acne) protocol. Focus on inflammatory acne, comedones, post-inflammatory hyperpigmentation, and barrier impact.',
  'even-tone-protocol':
    'The user is viewing the Even Tone (pigmentation/melasma) protocol. Focus on melasma, post-inflammatory hyperpigmentation, sun damage, uneven tone.',
  'renewal-protocol':
    'The user is viewing the Renewal (anti-ageing) protocol. Focus on fine lines, texture, pore visibility, dullness, early photoageing.',
  'barrier-protocol':
    'The user is viewing the Barrier (sensitivity/hydration) protocol. Focus on redness, dehydration, flaking, reactivity, compromised barrier.',
};

function buildPrompt(bundleSlug?: string): string {
  const ctx = bundleSlug ? PROTOCOL_CONTEXT[bundleSlug] : '';
  return `You are a dermatologist-trained triage assistant for a Pakistan-based clinical skincare brand (Clarté MD).

${ctx ? ctx + '\n\n' : ''}Analyze the photograph and return ONLY a valid JSON object (no prose, no markdown fences) matching this exact schema:

{
  "primary_concerns": string[],          // 1-5 dominant visible issues, each 2-5 words
  "secondary_concerns": string[],        // 0-4 minor co-occurring issues
  "skin_type": "oily" | "combination" | "dry" | "normal" | "sensitive",
  "severity": "mild" | "moderate" | "severe",
  "confidence": number,                  // 0..1
  "expected_timeline_weeks": number,     // realistic, typically 8-16
  "warnings": string[],                  // include anything outside cosmetic skincare (cystic acne, suspected pathology, etc)
  "recommended_actives": string[],       // 3-6 ingredient strings with percentages
  "observation": string                  // 1-2 sentence editorial caption describing the visible skin state
}

Rules:
- You are NOT a substitute for an in-person dermatologist; this is triage.
- For cystic acne, suspected skin cancer, infected lesions, or anything outside cosmetic concerns, add a clear warning and recommend in-person care.
- Severity reflects cosmetic-concern severity only.
- Be specific. "Forehead congestion" beats "skin issues". "Mild PIH on cheeks" beats "spots".
- The "observation" must be honest, not flattering. No idealization.`;
}

/**
 * Run a GPT-4o vision pass over the user's selfie and return a structured
 * skin map. Throws on parse failure — the caller decides what to surface.
 */
export async function generateSkinMap(args: {
  imageBase64: string;
  mimeType: string;
  bundleSlug?: string;
}): Promise<{ map: SkinMap; modelVersion: string; latencyMs: number }> {
  const openai = getOpenAI();
  const startedAt = Date.now();

  const dataUrl = `data:${args.mimeType};base64,${args.imageBase64}`;

  const response = await openai.chat.completions.create({
    model: OPENAI_VISION_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: buildPrompt(args.bundleSlug) },
          { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
        ],
      },
    ],
    max_tokens: 800,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('OpenAI vision returned no content');

  let map: SkinMap;
  try {
    map = JSON.parse(text) as SkinMap;
  } catch {
    throw new Error('OpenAI vision returned malformed JSON');
  }

  return {
    map,
    modelVersion: OPENAI_VISION_MODEL,
    latencyMs: Date.now() - startedAt,
  };
}
