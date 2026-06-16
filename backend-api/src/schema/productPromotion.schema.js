const { z } = require("zod");

exports.createProductPromotionSchema = z.object({
  product_id: z.number().int().positive(),
  promotion_id: z.number().int().positive(),
});

exports.updateProductPromotionSchema = z.object({
  product_id: z.number().int().positive().optional(),
  promotion_id: z.number().int().positive().optional(),
});
