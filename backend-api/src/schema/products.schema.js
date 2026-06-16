const { z } = require("zod");

const booleanTransform = z.preprocess((val) => {
  if (typeof val === "string") return val.toLowerCase() === "true";
  return Boolean(val);
}, z.boolean());

exports.createProductSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm không được để trống"),
  slug: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive("Giá phải lớn hơn 0"),
  stock: z.coerce.number().int().min(0).optional().default(0),
  product_type: z
    .enum(["sim", "device", "internet", "tv", "accessory", "bundle"])
    .optional()
    .default("device"),
  category_id: z.coerce.number().int().optional(),
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
