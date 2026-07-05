const { z } = require("zod");

exports.createContactSchema = z.object({
  name: z.string().min(1).max(100, "Họ tên không được vượt quá 100 ký tự"),
  email: z.string().email(),
  message: z
    .string()
    .min(1)
    .max(2000, "Nội dung không được vượt quá 2000 ký tự"),
  order_id: z.coerce.number().int().positive().optional().nullable(),
});

exports.replyContactSchema = z.object({
  reply: z
    .string()
    .min(1, "Nội dung phản hồi không được để trống")
    .max(2000, "Nội dung phản hồi không được vượt quá 2000 ký tự"),
});
