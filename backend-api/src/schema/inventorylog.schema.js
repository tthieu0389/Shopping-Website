const { z } = require("zod");

//QUERY PARAMS FOR LIST LOGS
exports.getInventoryLogsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

//FILTER BY INVENTORY ID
exports.inventoryIdParamSchema = z.object({
  inventory_id: z.coerce.number().int().positive(),
});

//FILTER BY PRODUCT ID
exports.productIdParamSchema = z.object({
  product_id: z.coerce.number().int().positive(),
});
