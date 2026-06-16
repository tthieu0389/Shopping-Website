const { z } = require("zod");

exports.createProductDetailSchema = z.object({
  product_id: z.coerce.number().int().positive(),

  detail_name: z.string().min(1, "Tên chi tiết không được để trống"),

  detail_value: z.string().min(1, "Giá trị chi tiết không được để trống"),
});

exports.updateProductDetailSchema = z.object({
  product_id: z.coerce.number().int().positive().optional(),

  detail_name: z.string().min(1).optional(),

  detail_value: z.string().min(1).optional(),
});
