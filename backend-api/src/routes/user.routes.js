const express = require("express");
const router = express.Router();
const userController = require("../controller/users.controller");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const validate = require("../middlewares/validate");
const pagination = require("../middlewares/pagination");
const { createUserSchema, updateUserSchema } = require("../schema/user.schema");

// Danh sách nhãn tiếng Việt
const userFieldLabels = {
  name: "Họ và tên",
  email: "Email",
  password: "Mật khẩu",
  role: "Vai trò",
};

// Lấy danh sách người dùng
router.get(
  "/",
  verifyToken,
  checkRole("admin"),
  pagination(),
  userController.getAllUsers
);

// Tạo người dùng mới
router.post(
  "/",
  verifyToken,
  checkRole("admin"),
  validate(createUserSchema, { fieldLabels: userFieldLabels }),
  userController.createUser
);

// Cập nhật thông tin người dùng
router.put(
  "/:id",
  verifyToken,
  checkRole("admin"),
  validate(updateUserSchema, { fieldLabels: userFieldLabels }),
  userController.updateUser
);

// Xóa người dùng
router.delete(
  "/:id",
  verifyToken,
  checkRole("admin"),
  userController.deleteUser
);

module.exports = router;
