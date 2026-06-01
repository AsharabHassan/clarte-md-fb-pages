import { z } from 'zod';

export const AnalyzeSkinSchema = z.object({
  image_base64: z.string().min(100),
  mime_type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  concern: z.string().min(1).max(64),
  consent: z.literal(true),
});

export type AnalyzeSkinInput = z.infer<typeof AnalyzeSkinSchema>;

export const AnalysisResultSchema = z.object({
  severity: z.enum(['mild', 'moderate', 'severe']),
  primary_concerns: z.array(z.string()).max(8),
  secondary_concerns: z.array(z.string()).max(8),
  recommended_protocol: z.string(),
  recommended_actives: z.array(z.string()).max(12),
  expected_timeline_weeks: z.number().int().min(0).max(52),
  warnings: z.array(z.string()).max(8),
  confidence: z.enum(['low', 'medium', 'high']),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
