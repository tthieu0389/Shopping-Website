const { z } = require("zod");

exports.createBlogSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  content: z.string().min(1),
  thumbnail_url: z.string().url().optional(),
});

exports.updateBlogSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().optional(),
  content: z.string().min(1).optional(),
  thumbnail_url: z.string().url().optional(),
});
