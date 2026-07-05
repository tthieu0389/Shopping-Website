const { z } = require("zod");

exports.addToCartSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z
    .number()
    .int()
    .min(1)
    .max(100, "Số lượng tối đa là 100")
    .default(1),
});

exports.updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(100, "Số lượng tối đa là 100"),
  is_selected: z.boolean().optional(),
});

exports.checkoutSchema = z.object({
  address_id: z.number().int().optional(),
  pickup_store_id: z.number().int().optional(),
  payment_method: z.enum(["cod", "card", "wallet"]),
  note: z.string().optional(),

  items: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        quantity: z.number().int().min(1).max(100, "Số lượng tối đa là 100"),
      }),
    )
    .optional(),
});
