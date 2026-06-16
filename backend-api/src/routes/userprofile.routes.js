const express = require("express");
const router = express.Router();

const userProfileController = require("../controller/userprofile.controller");
const verifyToken = require("../middlewares/verifyToken");
const validate = require("../middlewares/validate");

const { upsertProfileSchema } = require("../schema/userprofile.schema");

const profileFieldLabels = {
  user_id: "User ID",
  full_name: "Họ và tên",
  avatar: "Ảnh đại diện",
  phone: "Số điện thoại",
  gender: "Giới tính",
  birthday: "Ngày sinh",
  bio: "Giới thiệu",
};

// Upsert profile
router.post(
  "/:userId",
  verifyToken,
  validate(upsertProfileSchema, { fieldLabels: profileFieldLabels }),
  userProfileController.createOrUpdateProfile,
);

// Get profile
router.get("/:userId", verifyToken, userProfileController.getProfileByUserId);

// Delete profile
router.delete("/:userId", verifyToken, userProfileController.deleteProfile);

module.exports = router;
