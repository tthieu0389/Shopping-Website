const express = require("express");
const router = express.Router();

const userAddressController = require("../controller/useraddress.controller");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const validate = require("../middlewares/validate");

const {
  createAddressSchema,
  updateAddressSchema,
} = require("../schema/useraddress.schema");

const addressFieldLabels = {
  user_id: "User ID",
  address: "Địa chỉ",
  phone: "Số điện thoại",
  city: "Thành phố",
  district: "Quận/Huyện",
  ward: "Phường/Xã",
  is_default: "Địa chỉ mặc định",
};

// Get current user addresses (matches frontend)
router.get("/", verifyToken(), userAddressController.getAddressesByUserId);

// Create address
router.post(
  "/",
  verifyToken(),
  validate(createAddressSchema, { fieldLabels: addressFieldLabels }),
  userAddressController.createAddress,
);

// Get addresses by user ID (admin/internal)
router.get(
  "/user/:userId",
  verifyToken(),
  userAddressController.getAddressesByUserId,
);

// Update address
router.put(
  "/:id",
  verifyToken(),
  validate(updateAddressSchema, { fieldLabels: addressFieldLabels }),
  userAddressController.updateAddress,
);

// Delete address
router.delete("/:id", verifyToken(), userAddressController.deleteAddress);

module.exports = router;
