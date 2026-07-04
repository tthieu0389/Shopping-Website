const { z } = require("zod");

// Cột quantity/min_quantity là INT trong Postgres giới hạn INT4 (2,147,483,647)
const MAX_INT4 = 2147483647;

exports.createInventorySchema = z.object({
  product_id: z.coerce.number().int().positive(),
  quantity: z.coerce
    .number()
    .int()
    .min(0)
    .max(
      MAX_INT4,
      `Số lượng tồn kho không được vượt quá ${MAX_INT4.toLocaleString("vi-VN")}`,
    )
    .default(0),
  min_quantity: z.coerce
    .number()
    .int()
    .min(0)
    .max(
      MAX_INT4,
      `Ngưỡng cảnh báo không được vượt quá ${MAX_INT4.toLocaleString("vi-VN")}`,
    )
    .default(5),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});

exports.updateInventorySchema = z.object({
  product_id: z.coerce.number().int().positive().optional(),
  quantity: z.coerce
    .number()
    .int()
    .min(0)
    .max(
      MAX_INT4,
      `Số lượng tồn kho không được vượt quá ${MAX_INT4.toLocaleString("vi-VN")}`,
    )
    .optional(),
  min_quantity: z.coerce
    .number()
    .int()
    .min(0)
    .max(
      MAX_INT4,
      `Ngưỡng cảnh báo không được vượt quá ${MAX_INT4.toLocaleString("vi-VN")}`,
    )
    .optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
});
