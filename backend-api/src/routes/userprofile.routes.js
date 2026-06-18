const express = require("express");
const router = express.Router();

const userProfileController = require("../controller/userprofile.controller");
const verifyToken = require("../middlewares/verifyToken");
const validate = require("../middlewares/validate");

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

// Update current user profile (matches frontend)
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
  validate(userProfileSchema, { fieldLabels: profileFieldLabels }),
  userProfileController.createOrUpdateProfile,
);

// Get profile by userId (admin/internal)
router.get("/:userId", verifyToken(), userProfileController.getProfileByUserId);

// Delete profile by userId
router.delete("/:userId", verifyToken(), userProfileController.deleteProfile);

module.exports = router;
