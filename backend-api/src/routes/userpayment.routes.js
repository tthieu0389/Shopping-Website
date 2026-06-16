const express = require("express");
const router = express.Router();

const userPaymentController = require("../controller/userpayment.controller");
const verifyToken = require("../middlewares/verifyToken");
const validate = require("../middlewares/validate");

const {
  createPaymentSchema,
  updatePaymentSchema,
} = require("../schema/userpayment.schema");

const paymentFieldLabels = {
  user_id: "User ID",
  provider: "Nhà cung cấp",
  card_number: "Số thẻ",
  card_holder: "Tên chủ thẻ",
  expiry_month: "Tháng hết hạn",
  expiry_year: "Năm hết hạn",
  is_default: "Mặc định",
};

// Create payment method
router.post(
  "/",
  verifyToken,
  validate(createPaymentSchema, { fieldLabels: paymentFieldLabels }),
  userPaymentController.createPaymentMethod,
);

// Get payments by user
router.get(
  "/user/:userId",
  verifyToken,
  userPaymentController.getPaymentsByUserId,
);

// Update payment
router.put(
  "/:id",
  verifyToken,
  validate(updatePaymentSchema, { fieldLabels: paymentFieldLabels }),
  userPaymentController.updatePaymentMethod,
);

// Delete payment
router.delete("/:id", verifyToken, userPaymentController.deletePaymentMethod);

module.exports = router;
