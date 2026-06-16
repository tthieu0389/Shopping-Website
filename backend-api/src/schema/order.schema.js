const { z } = require("zod");

exports.createOrderSchema = z.object({
  address_id: z.coerce.number().int().optional(),
  pickup_store_id: z.coerce.number().int().optional(),
  payment_method: z.string().optional(),
  note: z.string().optional(),
  items: z
    .array(
      z.object({
        product_id: z.coerce.number().int(),
        quantity: z.coerce.number().int().min(1),
      }),
    )
    .min(1),
});

exports.updateOrderSchema = z.object({
  status: z
    .enum([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "completed",
      "cancelled",
    ])
    .optional(),
  note: z.string().optional(),
});
