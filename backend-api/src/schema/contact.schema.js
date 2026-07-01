const { z } = require("zod");

exports.createContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
  order_id: z.coerce.number().int().positive().optional().nullable(),
});

exports.replyContactSchema = z.object({
  reply: z.string().min(1, "Nội dung phản hồi không được để trống"),
});
