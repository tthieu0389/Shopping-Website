const { z } = require("zod");

exports.createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  is_deleted: z.boolean().optional(),
});

exports.updateCategorySchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  is_deleted: z.boolean().optional(),
});
