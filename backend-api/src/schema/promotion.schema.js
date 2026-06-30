const { z } = require("zod");

const discountValueSchema = (schema) =>
  schema.superRefine((data, ctx) => {
    if (
      data.discount_type === "percent" &&
      data.discount_value !== undefined &&
      data.discount_value > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discount_value"],
        message: "Phần trăm giảm giá không được vượt quá 100",
      });
    }
  });

exports.createPromotionSchema = discountValueSchema(
  z.object({
    name: z.string().min(1),
    discount_type: z.enum(["percent", "fixed"]),
    discount_value: z.coerce.number().positive(), // coerce để nhận string từ form
    start_date: z.string().min(1, "start_date là bắt buộc"),
    end_date: z.string().min(1, "end_date là bắt buộc"),
    is_active: z.boolean().optional().default(true),
    priority: z.coerce.number().int().optional(),
    stackable: z.boolean().optional(),
  }),
);

exports.updatePromotionSchema = discountValueSchema(
  z.object({
    name: z.string().optional(),
    discount_type: z.enum(["percent", "fixed"]).optional(),
    discount_value: z.coerce.number().positive().optional(),
    start_date: z.string().min(1, "start_date là bắt buộc").optional(),
    end_date: z.string().min(1, "end_date là bắt buộc").optional(),
    is_active: z.boolean().optional(),
    priority: z.coerce.number().int().optional(),
    stackable: z.boolean().optional(),
  }),
);
