import { ai, MODEL_ANALYSIS } from './gemini';
// `ai` is referenced via the responseSchema cast below; explicit suppress
// for the unused-import lint rule isn't needed since it IS used at runtime.
import { ANALYSIS_PROMPT } from './prompts';
import { AnalysisResultSchema, type AnalysisResult } from '@/lib/validators/analyze-skin';

const responseSchema = {
  type: 'object',
  properties: {
    severity: { type: 'string', enum: ['mild', 'moderate', 'severe'] },
    primary_concerns: { type: 'array', items: { type: 'string' } },
    secondary_concerns: { type: 'array', items: { type: 'string' } },
    recommended_protocol: { type: 'string' },
    recommended_actives: { type: 'array', items: { type: 'string' } },
    expected_timeline_weeks: { type: 'integer' },
    warnings: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
  },
  required: [
    'severity',
    'primary_concerns',
    'secondary_concerns',
    'recommended_protocol',
    'recommended_actives',
    'expected_timeline_weeks',
    'warnings',
    'confidence',
  ],
};

export interface AnalyzeResult {
  analysis: AnalysisResult;
  modelVersion: string;
  latencyMs: number;
}

export async function analyzeSkin(args: {
  inputBase64: string;
  inputMimeType: string;
  /** Override the analysis prompt (e.g. pigmentation). Defaults to acne. */
  prompt?: string;
}): Promise<AnalyzeResult> {
  const startedAt = Date.now();

  const response = await ai.models.generateContent({
    model: MODEL_ANALYSIS,
    contents: [
      { inlineData: { data: args.inputBase64, mimeType: args.inputMimeType } },
      { text: args.prompt ?? ANALYSIS_PROMPT },
    ],
    config: {
      responseMimeType: 'application/json',
      // Gemini SDK types responseSchema more strictly than the plain JSON
      // Schema object the runtime accepts. Cast through unknown to bypass.
      responseSchema: responseSchema as unknown as Record<string, unknown>,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Gemini returned no analysis text');

  const json = JSON.parse(text);
  const parsed = AnalysisResultSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error('Gemini returned malformed analysis: ' + parsed.error.message);
  }

  return {
    analysis: parsed.data,
    modelVersion: MODEL_ANALYSIS,
    latencyMs: Date.now() - startedAt,
  };
}
