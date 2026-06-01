import { z } from 'zod';

export const CreateOrderSchema = z.object({
  concern: z.string().min(1).max(64),
  page: z.string().min(1).max(64),
  contact: z.object({
    name: z.string().min(1).max(128),
    phone: z.string().min(7).max(32),
    email: z.string().email().max(128),
  }),
  shipping: z.object({
    address: z.string().min(3).max(256),
    city: z.string().min(1).max(64),
    postal: z.string().max(16).optional().or(z.literal('')),
    notes: z.string().max(256).optional().or(z.literal('')),
  }),
  // COD-only until sub-project #4 (wallet payments) ships. The form
  // on every protocol page now shows only the COD radio — the 3 other
  // options (JazzCash, Card, Bank) were hidden from the UI when the
  // merchant accounts came back as not-yet-approved. Re-enable each
  // option as its merchant account approves (JazzCash usually first).
  payment: z.enum(['COD']),
  items: z
    .array(
      z.object({
        sku: z.string().min(1).max(64),
        name: z.string().min(1).max(128),
        qty: z.number().int().min(1).max(20),
        price: z.number().int().min(0),
      }),
    )
    .min(1)
    .max(20),
  totals: z.object({
    subtotal: z.number().int().min(0),
    shipping: z.number().int().min(0),
    total: z.number().int().min(0),
  }),
  bundle_in_cart: z.boolean(),
  used_ai_preview: z.boolean(),
  ts: z.string().datetime(),
  ai_session_id: z.string().uuid().optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
