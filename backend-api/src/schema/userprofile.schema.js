const { z } = require("zod");

exports.userProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .max(100, "Họ tên không được vượt quá 100 ký tự")
    .optional(),

  avatar: z
    .string()
    .trim()
    .max(255, "Đường dẫn avatar không được vượt quá 255 ký tự")
    .optional(),

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