const { z } = require("zod");

exports.getInventoryLogsSchema = z
  .object({
    page: z.string().optional(),
    limit: z.string().optional(),
    action: z.enum(["import", "export", "adjust", "delete"]).optional(),
    product_id: z.string().regex(/^\d+$/, "product_id phải là số").optional(),
    search: z.string().optional(),
    q: z.string().optional(),
  })
  .optional();

exports.inventoryIdParamSchema = z.object({
  inventory_id: z.string().regex(/^\d+$/, "inventory_id phải là số"),
});

exports.productIdParamSchema = z.object({
  product_id: z.string().regex(/^\d+$/, "product_id phải là số"),
});
