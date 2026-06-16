const { z } = require("zod");

exports.addFavoriteSchema = z.object({
  product_id: z.number().int().positive(),
});
