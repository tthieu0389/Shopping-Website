const express = require("express");
const router = express.Router();
const authController = require("../controller/auth.controller");
const { registerSchema, loginSchema } = require("../schema/user.schema");
const validate = require("../middlewares/validate");
const { authLoginLimiter } = require("../middlewares/RateLimit");

router.post("/register", validate(registerSchema), authController.register);
// authLoginLimiter: siết riêng route /login (10 lần/5 phút/IP)
// chống brute-force dò mật khẩu — chặt hơn so với loginLimiter
router.post(
  "/login",
  authLoginLimiter,
  validate(loginSchema),
  authController.login,
);

module.exports = router;
