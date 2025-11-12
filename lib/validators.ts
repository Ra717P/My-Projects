import { z } from "zod";

export const createMenuSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().nonnegative(),
  category: z.string().min(1),
  image_url: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  is_active: z.boolean().optional().default(true),
});

export const updateMenuSchema = createMenuSchema.partial();
