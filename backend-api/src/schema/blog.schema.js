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
  title: z.string().min(1).max(200, "Tiêu đề không được vượt quá 200 ký tự"),
  slug: z.string().max(200, "Slug không được vượt quá 200 ký tự").optional(),
  content: z
    .string()
    .min(1)
    .max(20000, "Nội dung bài viết không được vượt quá 20000 ký tự"),
  thumbnail_url: thumbnailUrlSchema,
});

exports.updateBlogSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(200, "Tiêu đề không được vượt quá 200 ký tự")
    .optional(),
  slug: z.string().max(200, "Slug không được vượt quá 200 ký tự").optional(),
  content: z
    .string()
    .min(1)
    .max(20000, "Nội dung bài viết không được vượt quá 20000 ký tự")
    .optional(),
  thumbnail_url: thumbnailUrlSchema,
});
