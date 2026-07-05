const { z } = require("zod");

exports.getInventoryLogsSchema = z
  .object({
    page: z
      .string()
      .regex(/^\d+$/, "page phải là số")
      .refine((v) => Number(v) >= 1, "page phải >= 1")
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, "limit phải là số")
      .refine(
        (v) => Number(v) >= 1 && Number(v) <= 100,
        "limit phải từ 1 đến 100",
      )
      .optional(),
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
