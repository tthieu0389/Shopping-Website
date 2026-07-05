const { z } = require("zod");

exports.createStoreSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100, "Tên cửa hàng không được vượt quá 100 ký tự"),
  province: z
    .string()
    .min(1)
    .max(100, "Tỉnh/thành không được vượt quá 100 ký tự"),
  address: z.string().min(1).max(500, "Địa chỉ không được vượt quá 500 ký tự"),
  phone: z
    .string()
    .min(1)
    .max(20, "Số điện thoại không được vượt quá 20 ký tự"),
});

exports.updateStoreSchema = z.object({
  name: z
    .string()
    .max(100, "Tên cửa hàng không được vượt quá 100 ký tự")
    .optional(),
  province: z
    .string()
    .max(100, "Tỉnh/thành không được vượt quá 100 ký tự")
    .optional(),
  address: z
    .string()
    .max(500, "Địa chỉ không được vượt quá 500 ký tự")
    .optional(),
  phone: z
    .string()
    .max(20, "Số điện thoại không được vượt quá 20 ký tự")
    .optional(),
});
