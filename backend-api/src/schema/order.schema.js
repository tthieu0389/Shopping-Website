const { z } = require("zod");

// CREATE ORDER
exports.createOrderSchema = z
  .object({
    user_id: z.coerce.number().int().positive().optional(),

    address_id: z.coerce.number().int().optional(),
    pickup_store_id: z.coerce.number().int().optional(),

    payment_method: z.enum(["cod", "card", "wallet"]),

    note: z
      .string()
      .max(1000, "Ghi chú không được vượt quá 1000 ký tự")
      .optional(),

    items: z
      .array(
        z.object({
          product_id: z.coerce.number().int(),
          quantity: z.coerce
            .number()
            .int()
            .min(1)
            .max(100, "Số lượng tối đa là 100"),
        }),
      )
      .min(1),
  })
  .refine(
    (data) => {
      return !!data.address_id || !!data.pickup_store_id;
    },
    {
      message: "Either address_id or pickup_store_id is required",
      path: ["address_id"],
    },
  )
  .refine(
    (data) => {
      return !(data.address_id && data.pickup_store_id);
    },
    {
      message: "Cannot use both address and pickup_store_id",
      path: ["pickup_store_id"],
    },
  );

// UPDATE ORDER
exports.updateOrderSchema = z.object({
  status: z.enum(["pending", "confirmed", "shipping", "completed"]).optional(),
  note: z
    .string()
    .max(1000, "Ghi chú không được vượt quá 1000 ký tự")
    .optional(),
});

exports.updatePaymentStatusSchema = z.object({
  payment_status: z.enum(["unpaid", "paid", "failed", "refunded"]),
});

exports.previewOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.coerce.number().int().min(1),
        quantity: z.coerce
          .number()
          .int()
          .min(1)
          .max(100, "Số lượng tối đa là 100"),
      }),
    )
    .min(1),
  address_id: z.coerce.number().int().positive().optional(),
  pickup_store_id: z.coerce.number().int().positive().optional(),
});
