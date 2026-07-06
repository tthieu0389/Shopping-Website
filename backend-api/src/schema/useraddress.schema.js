const { z } = require("zod");

exports.createAddressSchema = z.object({
  user_id: z.coerce.number().int().optional(),
  receiver_name: z
    .string({ required_error: "Vui lòng nhập tên người nhận" })
    .min(1, "Vui lòng nhập tên người nhận")
    .max(100, "Tên người nhận không được vượt quá 100 ký tự"),
  phone: z
    .string({ required_error: "Vui lòng nhập số điện thoại" })
    .regex(/^[0-9]{9,11}$/, "Số điện thoại không hợp lệ"),

  province: z
    .string({ required_error: "Vui lòng nhập tỉnh/thành" })
    .min(1, "Vui lòng nhập tỉnh/thành")
    .max(100, "Tỉnh/thành không được vượt quá 100 ký tự"),
  district: z
    .string({ required_error: "Vui lòng nhập quận/huyện" })
    .min(1, "Vui lòng nhập quận/huyện")
    .max(100, "Quận/huyện không được vượt quá 100 ký tự"),
  ward: z
    .string()
    .max(100, "Phường/xã không được vượt quá 100 ký tự")
    .optional(),
  address_line: z
    .string({ required_error: "Vui lòng nhập địa chỉ chi tiết" })
    .min(1, "Vui lòng nhập địa chỉ chi tiết")
    .max(500, "Địa chỉ chi tiết không được vượt quá 500 ký tự"),

  latitude: z
    .number()
    .min(-90, "Vĩ độ không hợp lệ")
    .max(90, "Vĩ độ không hợp lệ")
    .optional(),
  longitude: z
    .number()
    .min(-180, "Kinh độ không hợp lệ")
    .max(180, "Kinh độ không hợp lệ")
    .optional(),

  is_default: z.boolean().optional(),
});

exports.updateAddressSchema = z.object({
  receiver_name: z
    .string()
    .max(100, "Tên người nhận không được vượt quá 100 ký tự")
    .optional(),
  phone: z
    .string()
    .regex(/^[0-9]{9,11}$/)
    .optional(),
  province: z
    .string()
    .max(100, "Tỉnh/thành không được vượt quá 100 ký tự")
    .optional(),
  district: z
    .string()
    .max(100, "Quận/huyện không được vượt quá 100 ký tự")
    .optional(),
  ward: z
    .string()
    .max(100, "Phường/xã không được vượt quá 100 ký tự")
    .optional(),
  address_line: z
    .string()
    .max(500, "Địa chỉ chi tiết không được vượt quá 500 ký tự")
    .optional(),
  latitude: z
    .number()
    .min(-90, "Vĩ độ không hợp lệ")
    .max(90, "Vĩ độ không hợp lệ")
    .optional(),
  longitude: z
    .number()
    .min(-180, "Kinh độ không hợp lệ")
    .max(180, "Kinh độ không hợp lệ")
    .optional(),
  is_default: z.boolean().optional(),
});
