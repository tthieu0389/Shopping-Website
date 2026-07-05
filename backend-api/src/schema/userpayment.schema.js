const { z } = require("zod");

exports.createPaymentSchema = z.object({
  user_id: z.coerce.number().int().optional(),
  payment_type: z
    .string()
    .max(50, "Loại thanh toán không được vượt quá 50 ký tự")
    .optional(),
  provider: z
    .string()
    .max(50, "Nhà cung cấp không được vượt quá 50 ký tự")
    .optional(),
  bank_name: z
    .string()
    .max(100, "Tên ngân hàng không được vượt quá 100 ký tự")
    .optional(),
  card_holder_name: z
    .string()
    .max(100, "Tên chủ thẻ không được vượt quá 100 ký tự")
    .optional(),
  card_last4: z
    .string()
    .regex(/^[0-9]{4}$/)
    .optional(),
  expiry_month: z.coerce
    .number()
    .int()
    .min(1)
    .max(12, "Tháng hết hạn không hợp lệ")
    .optional(),
  expiry_year: z.coerce
    .number()
    .int()
    .min(2000)
    .max(2100, "Năm hết hạn không hợp lệ")
    .optional(),
  is_default: z.boolean().optional(),
});

exports.updatePaymentSchema = z.object({
  payment_type: z
    .string()
    .max(50, "Loại thanh toán không được vượt quá 50 ký tự")
    .optional(),
  provider: z
    .string()
    .max(50, "Nhà cung cấp không được vượt quá 50 ký tự")
    .optional(),
  bank_name: z
    .string()
    .max(100, "Tên ngân hàng không được vượt quá 100 ký tự")
    .optional(),
  card_holder_name: z
    .string()
    .max(100, "Tên chủ thẻ không được vượt quá 100 ký tự")
    .optional(),
  card_last4: z
    .string()
    .regex(/^[0-9]{4}$/)
    .optional(),
  expiry_month: z.coerce
    .number()
    .int()
    .min(1)
    .max(12, "Tháng hết hạn không hợp lệ")
    .optional(),
  expiry_year: z.coerce
    .number()
    .int()
    .min(2000)
    .max(2100, "Năm hết hạn không hợp lệ")
    .optional(),
  is_default: z.boolean().optional(),
});
