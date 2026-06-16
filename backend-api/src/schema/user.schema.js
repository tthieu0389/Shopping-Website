const { z } = require("zod");

exports.registerSchema = z.object({
  name: z
    .string({ required_error: "Tên không được để trống" })
    .trim()
    .min(1, "Tên không được để trống"),
  email: z
    .string({ required_error: "Email không được để trống" })
    .trim()
    .email("Email không hợp lệ"),
  password: z
    .string({ required_error: "Mật khẩu không được để trống" })
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

exports.loginSchema = z.object({
  email: z
    .string({ required_error: "Email không được để trống" })
    .trim()
    .email("Email không hợp lệ"),
  password: z
    .string({ required_error: "Mật khẩu không được để trống" })
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

exports.createUserSchema = z.object({
  name: z
    .string({ required_error: "Tên không được để trống" })
    .trim()
    .min(1, "Tên không được để trống"),
  email: z
    .string({ required_error: "Email không được để trống" })
    .trim()
    .email("Email không hợp lệ"),
  password: z
    .string({ required_error: "Mật khẩu không được để trống" })
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  role: z.enum(["admin", "user"], {
    required_error: "Vai trò không hợp lệ",
    invalid_type_error: "Vai trò không hợp lệ",
  }),
});

exports.updateUserSchema = z.object({
  name: z.string().trim().min(1, "Tên không hợp lệ").optional(),
  email: z.string().trim().email("Email không hợp lệ").optional(),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").optional(),
  role: z.enum(["admin", "user"]).optional(),
});
