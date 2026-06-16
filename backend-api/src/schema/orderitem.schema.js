const { z } = require("zod");

exports.createOrderItemSchema = z.object({
  order_id: z.number().int(),
  product_id: z.number().int(),
  quantity: z.number().int().min(1).max(100),
});

exports.updateOrderItemSchema = z.object({
  quantity: z.number().int().min(1).max(100).optional(),
});

// OPTIONAL: nếu cần validate filter/query
exports.getOrderItemSchema = z.object({
  order_id: z.number().int().optional(),
  product_id: z.number().int().optional(),
});
