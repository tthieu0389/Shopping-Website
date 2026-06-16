const { z } = require("zod");

exports.createPaymentSchema = z.object({
  user_id: z.coerce.number().int().optional(),
  payment_type: z.string().optional(),
  provider: z.string().optional(),
  bank_name: z.string().optional(),
  card_holder_name: z.string().optional(),
  card_last4: z
    .string()
    .regex(/^[0-9]{4}$/)
    .optional(),
  expiry_month: z.coerce.number().int().optional(),
  expiry_year: z.coerce.number().int().optional(),
  is_default: z.boolean().optional(),
});

exports.updatePaymentSchema = z.object({
  payment_type: z.string().optional(),
  provider: z.string().optional(),
  bank_name: z.string().optional(),
  card_holder_name: z.string().optional(),
  card_last4: z
    .string()
    .regex(/^[0-9]{4}$/)
    .optional(),
  expiry_month: z.coerce.number().int().optional(),
  expiry_year: z.coerce.number().int().optional(),
  is_default: z.boolean().optional(),
});
