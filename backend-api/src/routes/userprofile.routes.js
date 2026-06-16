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

router.post(
  "/:userId",
  verifyToken,
  validate(userProfileSchema, {
    fieldLabels: profileFieldLabels,
  }),
  userProfileController.createOrUpdateProfile,
);

router.get("/:userId", verifyToken, userProfileController.getProfileByUserId);

router.delete("/:userId", verifyToken, userProfileController.deleteProfile);

module.exports = router;
