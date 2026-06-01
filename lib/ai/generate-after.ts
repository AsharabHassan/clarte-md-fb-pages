import { ai, MODEL_GENERATE_IMAGE } from './gemini';

export interface GenerateAfterResult {
  outputBase64: string;
  mimeType: string;
  modelVersion: string;
  latencyMs: number;
}

export async function generateAfter(args: {
  inputBase64: string;
  inputMimeType: string;
  prompt: string;
}): Promise<GenerateAfterResult> {
  const startedAt = Date.now();

  const response = await ai.models.generateContent({
    model: MODEL_GENERATE_IMAGE,
    contents: [
      { inlineData: { data: args.inputBase64, mimeType: args.inputMimeType } },
      { text: args.prompt },
    ],
    config: { responseModalities: ['IMAGE'] },
  });

  const part = response.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData,
  );
  if (!part?.inlineData?.data) {
    throw new Error('Gemini returned no image');
  }

  return {
    outputBase64: part.inlineData.data,
    mimeType: part.inlineData.mimeType ?? 'image/jpeg',
    modelVersion: MODEL_GENERATE_IMAGE,
    latencyMs: Date.now() - startedAt,
  };
}
