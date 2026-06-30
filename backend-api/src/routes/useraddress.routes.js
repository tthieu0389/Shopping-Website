const express = require("express");
const router = express.Router();

const userAddressController = require("../controller/useraddress.controller");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const validate = require("../middlewares/validate");
const checkOwnership = require("../middlewares/checkOwnership");

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

// Get current user addresses
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
  checkRole("admin", "staff"),
  userAddressController.getAddressesByUserId,
);

// Set default address (Cần checkOwnership vì thao tác trên :id)
router.put(
  "/:id/default",
  verifyToken(),
  checkOwnership("user_addresses"),
  userAddressController.setDefaultAddress,
);

// Update address (thêm checkOwnership để chống IDOR)
router.put(
  "/:id",
  verifyToken(),
  checkOwnership("user_addresses"),
  validate(updateAddressSchema, { fieldLabels: addressFieldLabels }),
  userAddressController.updateAddress,
);

// Delete address (thêm checkOwnership để chống IDOR)
router.delete(
  "/:id",
  verifyToken(),
  checkOwnership("user_addresses"),
  userAddressController.deleteAddress,
);

module.exports = router;
