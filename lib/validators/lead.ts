import { z } from 'zod';

export const LeadSchema = z.object({
  name: z.string().min(1).max(128),
  email: z.string().email().max(128),
  phone: z.string().min(7).max(32),
  concern: z.string().min(1).max(64),
  ai_session_id: z.string().uuid().optional(),
  source_url: z.string().max(512).optional(),
});

export type LeadInput = z.infer<typeof LeadSchema>;
