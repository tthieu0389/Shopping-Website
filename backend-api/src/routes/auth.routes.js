const express = require("express");
const router = express.Router();
const authController = require("../controller/auth.controller");
const { registerSchema, loginSchema } = require("../schema/user.schema");
const validate = require("../middlewares/validate");
const {
  authLoginLimiter,
  registerLimiter,
} = require("../middlewares/RateLimit");

// registerLimiter: chặn spam tạo tài khoản rác / enumerate email (5 lần/ 10 phút /IP)
router.post(
  "/register",
  registerLimiter,
  validate(registerSchema),
  authController.register,
);
// authLoginLimiter: siết riêng route /login (10 lần/5 phút/IP)
// chống brute-force dò mật khẩu — chặt hơn so với loginLimiter
router.post(
  "/login",
  authLoginLimiter,
  validate(loginSchema),
  authController.login,
);

module.exports = router;
