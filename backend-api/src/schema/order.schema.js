const { z } = require("zod");

// CREATE ORDER
exports.createOrderSchema = z
  .object({
    // Chỉ admin/staff được dùng field này để tạo đơn hộ user khác.
    // User thường gửi field này sẽ bị bỏ qua ở controller.
    user_id: z.coerce.number().int().positive().optional(),

    address_id: z.coerce.number().int().optional(),
    pickup_store_id: z.coerce.number().int().optional(),

    payment_method: z.enum(["cod", "card", "wallet"]),

    note: z.string().optional(),

    items: z
      .array(
        z.object({
          product_id: z.coerce.number().int(),
          quantity: z.coerce.number().int().min(1),
        }),
      )
      .min(1),
  })
  .refine(
    (data) => {
      // phải có 1 trong 2: address hoặc pickup
      return !!data.address_id || !!data.pickup_store_id;
    },
    {
      message: "Either address_id or pickup_store_id is required",
      path: ["address_id"],
    },
  )
  .refine(
    (data) => {
      // không được chọn cả 2
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

  note: z.string().optional(),
});

// UPDATE PAYMENT STATUS (tach rieng khoi status don hang, thuong do admin/he thong thanh toan goi)
exports.updatePaymentStatusSchema = z.object({
  payment_status: z.enum(["unpaid", "paid", "failed", "refunded"]),
});

exports.previewOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.coerce.number().int().min(1),
        quantity: z.coerce.number().int().min(1),
      }),
    )
    .min(1),
  address_id: z.coerce.number().int().positive().optional(),
  pickup_store_id: z.coerce.number().int().positive().optional(),
});
