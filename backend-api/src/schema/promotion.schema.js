const { z } = require("zod");

exports.createPromotionSchema = z.object({
  name: z.string().min(1),
  discount_type: z.enum(["percent", "fixed"]),
  discount_value: z.coerce.number().positive(), // coerce để nhận string từ form
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_active: z.boolean().optional().default(true),
  priority: z.coerce.number().int().optional(),
  stackable: z.boolean().optional(),
});

exports.updatePromotionSchema = z.object({
  name: z.string().optional(),
  discount_type: z.enum(["percent", "fixed"]).optional(),
  discount_value: z.coerce.number().positive().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_active: z.boolean().optional(),
  priority: z.coerce.number().int().optional(),
  stackable: z.boolean().optional(),
});
