const express = require("express");
const router = express.Router();
const authController = require("../controller/auth.controller");
const { registerSchema, loginSchema } = require("../schema/user.schema");
const validate = require("../middlewares/validate");

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

module.exports = router;
