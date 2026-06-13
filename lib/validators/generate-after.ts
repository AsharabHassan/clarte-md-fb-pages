import { z } from 'zod';

export const GenerateAfterSchema = z.object({
  image_base64: z.string().min(100),
  mime_type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  concern: z.string().min(1).max(64),
  prompt: z.string().min(10).max(4000),
  /** Optional bundle slug — biases vision + edit prompts per protocol. */
  bundle_slug: z.string().min(1).max(64).optional(),
  /**
   * Optional image-generation quality. Lower = faster + cheaper, at the cost
   * of fidelity. Omitted = server default (existing callers unaffected). The
   * scan funnel passes 'low' for speed.
   */
  quality: z.enum(['low', 'medium', 'high', 'auto']).optional(),
});

export type GenerateAfterInput = z.infer<typeof GenerateAfterSchema>;
