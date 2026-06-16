const { z } = require("zod");

exports.createBlogSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  content: z.string().min(1),
});

exports.updateBlogSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().optional(),
  content: z.string().min(1).optional(),
});
