const express = require("express");
const router = express.Router();

const userProfileController = require("../controller/userprofile.controller");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const validate = require("../middlewares/validate");
const upload = require("../middlewares/upload");

const { userProfileSchema } = require("../schema/userprofile.schema");

const profileFieldLabels = {
  user_id: "User ID",
  full_name: "Họ và tên",
  avatar: "Ảnh đại diện",
  phone: "Số điện thoại",
  gender: "Giới tính",
  birthday: "Ngày sinh",
  bio: "Giới thiệu",
};

// Get current user profile (matches frontend)
router.get("/", verifyToken(), userProfileController.getProfileByUserId);

// Upload avatar cho user đang đăng nhập (multipart/form-data, field "avatar")
router.post(
  "/avatar",
  verifyToken(),
  upload("avatars").single("avatar"),
  userProfileController.uploadAvatar,
);

// Update current user profile
router.put(
  "/",
  verifyToken(),
  validate(userProfileSchema, { fieldLabels: profileFieldLabels }),
  userProfileController.createOrUpdateProfile,
);

// Create or update profile by userId (admin/internal)
router.post(
  "/:userId",
  verifyToken(),
  checkRole("admin", "staff"),
  validate(userProfileSchema, { fieldLabels: profileFieldLabels }),
  userProfileController.createOrUpdateProfile,
);

// Upload avatar cho userId chỉ định (admin/internal)
router.post(
  "/:userId/avatar",
  verifyToken(),
  checkRole("admin", "staff"),
  upload("avatars").single("avatar"),
  userProfileController.uploadAvatar,
);

// Get profile by userId (admin/internal)
router.get(
  "/:userId",
  verifyToken(),
  checkRole("admin", "staff"),
  userProfileController.getProfileByUserId,
);

// Delete profile by userId
router.delete(
  "/:userId",
  verifyToken(),
  checkRole("admin", "staff"),
  userProfileController.deleteProfile,
);

module.exports = router;
