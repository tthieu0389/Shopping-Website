const express = require("express");
const router = express.Router();

const userPaymentController = require("../controller/userpayment.controller");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const checkOwnership = require("../middlewares/checkOwnership");
const validate = require("../middlewares/validate");

const {
  createPaymentSchema,
  updatePaymentSchema,
} = require("../schema/userpayment.schema");

const paymentFieldLabels = {
  user_id: "User ID",
  payment_type: "Loại thanh toán",
  provider: "Nhà cung cấp",
  bank_name: "Tên ngân hàng",
  card_last4: "4 số cuối của thẻ",
  card_holder_name: "Tên chủ thẻ",
  expiry_month: "Tháng hết hạn",
  expiry_year: "Năm hết hạn",
  is_default: "Mặc định",
};

// Create payment method
router.post(
  "/",
  verifyToken(),
  validate(createPaymentSchema, { fieldLabels: paymentFieldLabels }),
  userPaymentController.createPaymentMethod,
);

// Get current user payment methods
router.get("/", verifyToken(), userPaymentController.getPaymentsByUserId);

// Get payments by user (Chỉ dành cho Admin/Staff xem thông tin người khác)
router.get(
  "/user/:userId",
  verifyToken(),
  checkRole("admin", "staff"),
  userPaymentController.getPaymentsByUserId,
);

// Update payment (Đã sửa lại tên bảng thành user_payment_methods)
router.put(
  "/:id",
  verifyToken(),
  checkOwnership("user_payment_methods"),
  validate(updatePaymentSchema, { fieldLabels: paymentFieldLabels }),
  userPaymentController.updatePaymentMethod,
);

// Delete payment (Đã sửa lại tên bảng thành user_payment_methods)
router.delete(
  "/:id",
  verifyToken(),
  checkOwnership("user_payment_methods"),
  userPaymentController.deletePaymentMethod,
);

module.exports = router;
