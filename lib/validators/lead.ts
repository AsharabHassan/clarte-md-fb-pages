import { z } from 'zod';

export const LeadSchema = z.object({
  name: z.string().min(1).max(128),
  email: z.string().email().max(128),
  phone: z.string().min(7).max(32),
  concern: z.string().min(1).max(64),
  ai_session_id: z.string().uuid().optional(),
  source_url: z.string().max(512).optional(),
  /** Pixel eventID from the browser for Meta CAPI Lead dedup. */
  meta_event_id: z.string().uuid().optional(),
  /** Quiz answers (quiz funnel only) — forwarded to the webhook for segmentation. */
  q1: z.string().max(64).optional(),
  q2: z.string().max(64).optional(),
  q3: z.string().max(64).optional(),
  q4: z.string().max(64).optional(),
});

export type LeadInput = z.infer<typeof LeadSchema>;
