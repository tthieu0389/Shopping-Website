const { z } = require("zod");

exports.createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Tên danh mục không được vượt quá 100 ký tự"),
  slug: z.string().max(100, "Slug không được vượt quá 100 ký tự").optional(),
  description: z
    .string()
    .max(2000, "Mô tả không được vượt quá 2000 ký tự")
    .optional()
    .default(""),
  is_deleted: z.boolean().optional(),
});

exports.updateCategorySchema = z.object({
  name: z
    .string()
    .max(100, "Tên danh mục không được vượt quá 100 ký tự")
    .optional(),
  slug: z.string().max(100, "Slug không được vượt quá 100 ký tự").optional(),
  description: z
    .string()
    .max(2000, "Mô tả không được vượt quá 2000 ký tự")
    .optional(),
  is_deleted: z.boolean().optional(),
});
