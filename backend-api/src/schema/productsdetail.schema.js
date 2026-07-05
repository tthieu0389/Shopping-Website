const { z } = require("zod");

exports.createProductDetailSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  detail_name: z
    .string()
    .min(1, "Tên chi tiết không được để trống")
    .max(100, "Tên chi tiết không được vượt quá 100 ký tự"),
  detail_value: z
    .string()
    .min(1, "Giá trị chi tiết không được để trống")
    .max(1000, "Giá trị chi tiết không được vượt quá 1000 ký tự"),
});

exports.updateProductDetailSchema = z.object({
  product_id: z.coerce.number().int().positive().optional(),
  detail_name: z
    .string()
    .min(1)
    .max(100, "Tên chi tiết không được vượt quá 100 ký tự")
    .optional(),
  detail_value: z
    .string()
    .min(1)
    .max(1000, "Giá trị chi tiết không được vượt quá 1000 ký tự")
    .optional(),
});
