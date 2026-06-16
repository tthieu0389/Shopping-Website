const { z } = require("zod");

exports.createReviewSchema = z.object({
  product_id: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});
