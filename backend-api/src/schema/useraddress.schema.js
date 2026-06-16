const { z } = require("zod");

exports.createAddressSchema = z.object({
  user_id: z.coerce.number().int().optional(),
  receiver_name: z.string().optional(),
  phone: z
    .string()
    .regex(/^[0-9]{9,11}$/)
    .optional(), // ← FIX: optional

  province: z.string().optional(),
  district: z.string().optional(),
  ward: z.string().optional(),
  address_line: z.string().optional(),

  latitude: z.number().optional(),
  longitude: z.number().optional(),

  is_default: z.boolean().optional(),
});

exports.updateAddressSchema = z.object({
  receiver_name: z.string().optional(),
  phone: z
    .string()
    .regex(/^[0-9]{9,11}$/)
    .optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  ward: z.string().optional(),
  address_line: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  is_default: z.boolean().optional(),
});
