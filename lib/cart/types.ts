import { z } from 'zod';

export const CartItemSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('bundle'),
    slug: z.string().min(1).max(64),
    qty: z.literal(1),
  }),
  z.object({
    type: z.literal('product'),
    sku: z.string().min(1).max(64),
    qty: z.number().int().min(1).max(20),
  }),
]);

export const CartSchema = z.object({
  items: z.array(CartItemSchema),
  createdAt: z.number().int(),
});

export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;
