const { z } = require("zod");

exports.userProfileSchema = z.object({
  full_name: z.string().trim().optional(),

  avatar: z.string().trim().optional(),

  phone: z
    .string()
    .regex(/^[0-9]{9,11}$/, "Số điện thoại không hợp lệ")
    .optional(),

  birthday: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Ngày sinh không hợp lệ",
    })
    .optional(),

  gender: z.enum(["male", "female", "other"]).optional(),

  bio: z.string().max(500).optional(),
});
