const { z } = require("zod");

exports.createInventorySchema = z.object({
  product_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(0).default(0),
  min_quantity: z.coerce.number().int().min(0).default(5),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});

exports.updateInventorySchema = z.object({
  product_id: z.coerce.number().int().positive().optional(),
  quantity: z.coerce.number().int().min(0).optional(),
  min_quantity: z.coerce.number().int().min(0).optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
});
