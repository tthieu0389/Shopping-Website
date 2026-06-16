const { z } = require("zod");

exports.createProductImageSchema = z.object({
  product_id: z.coerce.number().int().positive(),
});
