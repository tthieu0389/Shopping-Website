const { z } = require("zod");

// CREATE ORDER
exports.createOrderSchema = z
  .object({
    address_id: z.number().int().optional(),
    pickup_store_id: z.number().int().optional(),

    payment_method: z.enum(["cod", "card", "bank_transfer"]),

    note: z.string().optional(),

    items: z
      .array(
        z.object({
          product_id: z.number().int(),
          quantity: z.number().int().min(1),
        }),
      )
      .min(1),
  })
  .refine((data) => data.address_id || data.pickup_store_id, {
    message: "Either address_id or pickup_store_id is required",
  });

// UPDATE ORDER
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
