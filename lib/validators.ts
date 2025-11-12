import { z } from "zod";

export const createMenuSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().nonnegative(),
  category: z.string().optional(),
  image: z.string().min(1),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().min(5).optional(),
  note: z.string().max(300).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.number().int().positive(),
        qty: z.number().int().min(1),
      })
    )
    .min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
