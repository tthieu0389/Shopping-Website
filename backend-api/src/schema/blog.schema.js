const { z } = require("zod");

const thumbnailUrlSchema = z
  .string()
  .refine(
    (val) =>
      val.startsWith("/") ||
      val.startsWith("http://") ||
      val.startsWith("https://"),
    {
      message:
        "thumbnail_url phải là URL hợp lệ hoặc đường dẫn /public/uploads/blogs",
    },
  )
  .optional();

exports.createBlogSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  content: z.string().min(1),
  thumbnail_url: thumbnailUrlSchema,
});

exports.updateBlogSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().optional(),
  content: z.string().min(1).optional(),
  thumbnail_url: thumbnailUrlSchema,
});
