const { z } = require("zod");

// discount_value NUMERIC(10,2) - tối đa 8 chữ số phần nguyên + 2 chữ số thập phân
const MAX_DISCOUNT_FIXED = 99999999.99;

const discountValueSchema = (schema) =>
  schema.superRefine((data, ctx) => {
    if (data.discount_value === undefined) return;

    if (data.discount_type === "percent" && data.discount_value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discount_value"],
        message: "Phần trăm giảm giá không được vượt quá 100",
      });
    }

    if (
      data.discount_type === "fixed" &&
      data.discount_value > MAX_DISCOUNT_FIXED
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discount_value"],
        message: `Số tiền giảm giá không được vượt quá ${MAX_DISCOUNT_FIXED.toLocaleString("vi-VN")}`,
      });
    }
  });

exports.createPromotionSchema = discountValueSchema(
  z.object({
    name: z
      .string()
      .min(1)
      .max(200, "Tên khuyến mãi không được vượt quá 200 ký tự"),
    discount_type: z.enum(["percent", "fixed"]),
    discount_value: z.coerce.number().positive(),
    start_date: z.string().min(1, "start_date là bắt buộc"),
    end_date: z.string().min(1, "end_date là bắt buộc"),
    is_active: z.boolean().optional().default(true),
    priority: z.coerce.number().int().optional(),
    stackable: z.boolean().optional(),
  }),
);

exports.updatePromotionSchema = discountValueSchema(
  z.object({
    name: z
      .string()
      .max(200, "Tên khuyến mãi không được vượt quá 200 ký tự")
      .optional(),
    discount_type: z.enum(["percent", "fixed"]).optional(),
    discount_value: z.coerce.number().positive().optional(),
    start_date: z.string().min(1, "start_date là bắt buộc").optional(),
    end_date: z.string().min(1, "end_date là bắt buộc").optional(),
    is_active: z.boolean().optional(),
    priority: z.coerce.number().int().optional(),
    stackable: z.boolean().optional(),
  }),
);
