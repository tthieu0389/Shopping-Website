const { z } = require("zod");

exports.createAddressSchema = z.object({
  receiver_name: z.string().min(1),
  phone: z.string().regex(/^[0-9]{9,11}$/),

  province: z.string(),
  district: z.string(),
  ward: z.string(),
  address_line: z.string(),

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
