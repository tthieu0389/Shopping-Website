const { z } = require("zod");

exports.uploadBlogImageSchema = z.object({
  blog_id: z.coerce.number().int().positive().optional(),
  alt_text: z.string().max(200).optional(),
});

exports.attachBlogImageSchema = z.object({
  blog_id: z.coerce.number().int().positive(),
});
