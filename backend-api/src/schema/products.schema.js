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

exports.createProductSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm không được để trống"),
  slug: z.string().min(1).optional(), // sẽ auto-generate nếu thiếu
  description: z.string().optional(),
  price: z.coerce.number().positive("Giá phải lớn hơn 0"),
  stock: z.coerce.number().int().min(0).optional().default(0),
  product_type: z.string().min(1).max(50).optional().default("device"),
  category_id: z.coerce.number().int().optional(),
  brand: z.string().max(100).optional().default("VNPT"),
  model: z.string().max(100).optional(),
  attributes: jsonTransform.optional().default({}),
  is_available: booleanTransform.optional().default(true),
  is_featured: booleanTransform.optional().default(false),
  is_deleted: booleanTransform.optional().default(false),
  deleted_at: z.coerce.date().nullable().optional(),
});

exports.updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  product_type: z.string().min(1).max(50).optional(),
  category_id: z.coerce.number().int().optional(),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  attributes: jsonTransform.optional(),
  is_available: booleanTransform.optional(),
  is_featured: booleanTransform.optional(),
  is_deleted: booleanTransform.optional(),
  deleted_at: z.coerce.date().nullable().optional(),
});
