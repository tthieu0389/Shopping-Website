const { z } = require("zod");

// CREATE ORDER
exports.createOrderSchema = z
  .object({
    // Chỉ admin/staff được dùng field này để tạo đơn hộ user khác.
    // User thường gửi field này sẽ bị bỏ qua ở controller.
    user_id: z.coerce.number().int().positive().optional(),

    address_id: z.coerce.number().int().optional(),
    pickup_store_id: z.coerce.number().int().optional(),

    // payment method:
    // - cod = thanh toán khi nhận hàng
    // - payment_method_id = id từ user_payment_methods
    payment_method: z
      .union([z.literal("cod"), z.coerce.number().int()])
      .default("cod"),

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
