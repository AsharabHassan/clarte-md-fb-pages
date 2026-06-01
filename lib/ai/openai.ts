import OpenAI from 'openai';

/**
 * Singleton OpenAI client. Reads OPENAI_API_KEY from env at first use.
 * Never logs the key. Server-only — never import this from a client component.
 */
let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (_client) return _client;
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      'OPENAI_API_KEY is not set. Add it to .env.local and restart the dev server.',
    );
  }
  _client = new OpenAI({ apiKey: key });
  return _client;
}

/** Vision model used for skin map analysis. */
export const OPENAI_VISION_MODEL = 'gpt-4o';

/**
 * Image generation model. `gpt-image-2` (released April 21, 2026) is
 * OpenAI's current SOTA image model — GPT-5.4 backbone, O-series
 * reasoning, near-perfect text rendering, 4K resolution, and
 * meaningfully better identity preservation on portrait edits than
 * gpt-image-1. Uses the same images.edit endpoint signature.
 */
export const OPENAI_IMAGE_MODEL = 'gpt-image-2';
