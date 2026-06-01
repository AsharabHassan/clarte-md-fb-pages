import { toFile } from 'openai/uploads';
import { getOpenAI, OPENAI_IMAGE_MODEL } from './openai';
import type { SkinMap } from './skin-map';

export interface GenerateAfterResult {
  outputBase64: string;
  mimeType: string;
  modelVersion: string;
  latencyMs: number;
}

/**
 * Build the image-edit prompt that biases the generated "after" toward
 * realistic clinical improvement for the protocol the user is on, while
 * referencing what the vision pass actually saw.
 */
function buildEditPrompt(args: {
  bundleSlug?: string;
  basePrompt: string;
  map?: SkinMap | null;
}): string {
  const { bundleSlug, map } = args;

  const concerns = map?.primary_concerns?.length
    ? `Visible issues to soften (do not invent issues that aren't there): ${map.primary_concerns.join(', ')}.`
    : '';
  const secondary = map?.secondary_concerns?.length
    ? `Secondary issues to gently improve: ${map.secondary_concerns.join(', ')}.`
    : '';
  const window = map?.expected_timeline_weeks
    ? `${map.expected_timeline_weeks} weeks of consistent protocol use`
    : '12 weeks of consistent protocol use';

  const protocolName = bundleSlug
    ? bundleSlug.replace(/-protocol$/, '').replace(/-/g, ' ')
    : 'clinical skincare';

  // Identity-preservation rules go FIRST and LAST. gpt-image-1 respects
  // emphasis placement; the wrap is intentional.
  return [
    'CRITICAL IDENTITY-PRESERVATION RULES — these override everything below:',
    '• Output must be a PHOTOREALISTIC photograph, NOT an illustration, painting, render, 3D model, stylization, cartoon, anime, or any artistic interpretation.',
    '• Preserve the subject\'s exact face geometry, bone structure, eye shape, eye color, nose, mouth, chin, jawline, ears, and eyebrows pixel-for-pixel.',
    '• Preserve ethnicity, age, gender expression, hairstyle, hair color, facial hair, eyewear (glasses, etc), and any accessories EXACTLY.',
    '• Preserve clothing, background, framing, camera angle, lighting direction and color temperature, and pose IDENTICALLY.',
    '• Same photographic style as the input: same lens look, same depth of field, same color grading, same noise/grain.',
    '',
    `EDIT ONLY THE SKIN CONDITION to reflect a realistic clinical improvement after ${window} of the ${protocolName} protocol:`,
    concerns,
    secondary,
    'The change should look like the same photo of the same person taken some weeks later — not a different photo, not a different person, not a stylized version.',
    '',
    'AVOID: airbrushed perfection, filter sheen, plastic skin, anime/cartoon aesthetic, painted look, beauty-app smoothing, age regression, ethnicity shift, "AI portrait" style.',
    'PREFER: realistic skin texture (pores still visible), normal photographic skin tone variation, natural healing appearance.',
    '',
    'OUTPUT: the same crop and dimensions as the input, photorealistic, indistinguishable from a real follow-up photograph.',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Edit the user's selfie via gpt-image-1 to produce a 12-week projection.
 * Uses the images.edit endpoint with the input photo as the edit source —
 * preserves identity better than text-to-image with a description prompt.
 */
export async function generateAfterOpenAI(args: {
  inputBase64: string;
  inputMimeType: string;
  prompt: string;
  bundleSlug?: string;
  map?: SkinMap | null;
  /** Image quality. Defaults to 'medium'. Funnel passes 'low' for speed. */
  quality?: 'low' | 'medium' | 'high' | 'auto';
}): Promise<GenerateAfterResult> {
  const openai = getOpenAI();
  const startedAt = Date.now();

  // The OpenAI SDK's images.edit expects a File. Convert the base64 buffer.
  const ext = args.inputMimeType.split('/')[1]?.split('+')[0] ?? 'png';
  const buf = Buffer.from(args.inputBase64, 'base64');
  const file = await toFile(buf, `input.${ext}`, { type: args.inputMimeType });

  const prompt = buildEditPrompt({
    bundleSlug: args.bundleSlug,
    basePrompt: args.prompt,
    map: args.map ?? null,
  });

  // gpt-image-2 (GPT-5.4 backbone + O-series reasoning) preserves identity
  // natively. Dropped `input_fidelity` (gpt-image-1 only — errors here).
  // quality:"medium" generally completes in ~30–60s with strong fidelity;
  // "high" doubles latency and often pushes past API timeouts.
  const response = await openai.images.edit({
    model: OPENAI_IMAGE_MODEL,
    image: file,
    prompt,
    size: '1024x1024',
    n: 1,
    // 'low' roughly halves generation latency vs 'medium' — the funnel opts
    // into it for speed; other callers keep 'medium' by default.
    quality: args.quality ?? 'medium',
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('OpenAI image edit returned no image data');
  }

  return {
    outputBase64: b64,
    // gpt-image-1 returns PNG.
    mimeType: 'image/png',
    modelVersion: OPENAI_IMAGE_MODEL,
    latencyMs: Date.now() - startedAt,
  };
}
