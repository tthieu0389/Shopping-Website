const { z } = require("zod");

exports.createReviewSchema = z.object({
  product_id: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z
    .string()
    .max(1500, "Nội dung đánh giá không được vượt quá 1500 ký tự")
    .optional(),
});
