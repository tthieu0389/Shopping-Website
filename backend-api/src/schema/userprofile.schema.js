const { z } = require("zod");

exports.createProfileSchema = z.object({
  full_name: z.string().trim().optional(),
  phone: z
    .string()
    .regex(/^[0-9]{9,11}$/, "Số điện thoại không hợp lệ")
    .optional(),
  date_of_birth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Ngày sinh không hợp lệ",
    })
    .optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});

exports.updateProfileSchema = z.object({
  full_name: z.string().trim().optional(),
  phone: z
    .string()
    .regex(/^[0-9]{9,11}$/, "Số điện thoại không hợp lệ")
    .optional(),
  date_of_birth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Ngày sinh không hợp lệ",
    })
    .optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});
