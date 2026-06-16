const { z } = require("zod");

exports.createPaymentSchema = z.object({
  bank_name: z.string().min(1),
  card_holder_name: z.string().min(1),
  card_last4: z.string().regex(/^[0-9]{4}$/),
  is_default: z.boolean().optional(),
});

exports.updatePaymentSchema = z.object({
  bank_name: z.string().optional(),
  card_holder_name: z.string().optional(),
  card_last4: z
    .string()
    .regex(/^[0-9]{4}$/)
    .optional(),
  is_default: z.boolean().optional(),
});
