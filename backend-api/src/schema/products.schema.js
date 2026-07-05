const { z } = require("zod");

// boolean helper
const booleanTransform = z.preprocess((val) => {
  if (typeof val === "string") return val.toLowerCase() === "true";
  return Boolean(val);
}, z.boolean());

// JSONB helper
const jsonTransform = z.preprocess((val) => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  }
  return val;
}, z.record(z.any()));

// price NUMERIC(12,2) - tối đa 10 chữ số phần nguyên + 2 số thập phân
const MAX_PRICE = 9999999999.99;

exports.createProductSchema = z.object({
  name: z
    .string()
    .min(1, "Tên sản phẩm không được để trống")
    .max(200, "Tên sản phẩm không được vượt quá 200 ký tự"),
  slug: z
    .string()
    .min(1)
    .max(200, "Slug không được vượt quá 200 ký tự")
    .optional(), // sẽ auto-generate nếu thiếu
  description: z
    .string()
    .max(3000, "Mô tả sản phẩm không được vượt quá 3000 ký tự")
    .optional(),
  price: z.coerce
    .number()
    .positive("Giá phải lớn hơn 0")
    .max(
      MAX_PRICE,
      "Giá bán vượt quá giới hạn cho phép (tối đa 9,999,999,999.99 ₫)",
    ),
  product_type: z.string().min(1).max(20).optional().default("device"),
  category_id: z.coerce.number().int().optional(),
  brand: z
    .string()
    .max(100, "Thương hiệu không được vượt quá 100 ký tự")
    .optional()
    .default("VNPT"),
  model: z
    .string()
    .max(100, "Mã thiết bị không được vượt quá 100 ký tự")
    .optional(),
  attributes: jsonTransform.optional().default({}),
  is_available: booleanTransform.optional().default(true),
  is_featured: booleanTransform.optional().default(false),
  is_deleted: booleanTransform.optional().default(false),
  deleted_at: z.coerce.date().nullable().optional(),
});

exports.updateProductSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(200, "Tên sản phẩm không được vượt quá 200 ký tự")
    .optional(),
  slug: z
    .string()
    .min(1)
    .max(200, "Slug không được vượt quá 200 ký tự")
    .optional(),
  description: z
    .string()
    .max(3000, "Mô tả sản phẩm không được vượt quá 3000 ký tự")
    .optional(),
  price: z.coerce
    .number()
    .positive()
    .max(
      MAX_PRICE,
      "Giá bán vượt quá giới hạn cho phép (tối đa 9,999,999,999.99 ₫)",
    )
    .optional(),
  product_type: z.string().min(1).max(20).optional(),
  category_id: z.coerce.number().int().optional(),
  brand: z
    .string()
    .max(100, "Thương hiệu không được vượt quá 100 ký tự")
    .optional(),
  model: z
    .string()
    .max(100, "Mã thiết bị không được vượt quá 100 ký tự")
    .optional(),
  attributes: jsonTransform.optional(),
  is_available: booleanTransform.optional(),
  is_featured: booleanTransform.optional(),
  is_deleted: booleanTransform.optional(),
  deleted_at: z.coerce.date().nullable().optional(),
});
