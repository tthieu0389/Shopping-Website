const { z } = require("zod");

// Hỗ trợ FormData gửi "true"/"false"
const booleanTransform = z.preprocess((val) => {
  if (typeof val === "string") {
    return val.toLowerCase() === "true";
  }
  return Boolean(val);
}, z.boolean());

exports.createProductSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm không được để trống"),

  slug: z.string().min(1, "Slug không được để trống"),

  description: z.string().optional(),

  price: z.coerce.number().positive("Giá phải lớn hơn 0"),

  stock: z.coerce
    .number()
    .int()
    .min(0, "Tồn kho không được âm")
    .optional()
    .default(0),

  product_type: z.enum([
    "sim",
    "device",
    "internet",
    "tv",
    "accessory",
    "bundle",
  ]),

  category_id: z.coerce.number().int(),

  is_available: booleanTransform.optional().default(true),
});

exports.updateProductSchema = z.object({
  name: z.string().min(1).optional(),

  slug: z.string().min(1).optional(),

  description: z.string().optional(),

  price: z.coerce.number().positive().optional(),

  stock: z.coerce.number().int().min(0).optional(),

  product_type: z
    .enum(["sim", "device", "internet", "tv", "accessory", "bundle"])
    .optional(),

  category_id: z.coerce.number().int().optional(),

  is_available: booleanTransform.optional(),
});
