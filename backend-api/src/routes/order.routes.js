const express = require("express");
const router = express.Router();

const orderController = require("../controller/order.controller");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const checkOwnership = require("../middlewares/checkOwnership");
const validate = require("../middlewares/validate");
const pagination = require("../middlewares/pagination");

const {
  createOrderSchema,
  updateOrderSchema,
  updatePaymentStatusSchema,
  previewOrderSchema,
} = require("../schema/order.schema");

// PREVIEW ORDER
router.post(
  "/preview",
  verifyToken(),
  validate(previewOrderSchema),
  orderController.previewOrder,
);

// CREATE ORDER
router.post(
  "/",
  verifyToken(),
  validate(createOrderSchema),
  orderController.createOrder,
);

// GET ALL ORDERS (ADMIN + STAFF xem toan bo, USER xem cua minh)
router.get("/", verifyToken(), pagination(), orderController.getAllOrders);

// GET MY ORDERS (STAFF) - don tu mua + don tao ho khach hang
router.get(
  "/staff/mine",
  verifyToken(),
  checkRole("staff"),
  pagination(),
  orderController.getMyOrders,
);

// GET ORDER BY ID
router.get("/:id", verifyToken(), orderController.getOrderById);

// UPDATE ORDER (ADMIN ONLY)
router.put(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  validate(updateOrderSchema),
  orderController.updateOrder,
);

// CANCEL ORDER (Khách hàng hoặc Admin tự hủy đơn)
router.post(
  "/:id/cancel",
  verifyToken(),
  checkOwnership("orders"),
  orderController.cancelOrder,
);

// UPDATE PAYMENT STATUS (ADMIN ONLY)
router.patch(
  "/:id/payment-status",
  verifyToken(),
  checkRole("admin"),
  validate(updatePaymentStatusSchema),
  orderController.updatePaymentStatus,
);

// DELETE ORDER (ADMIN ONLY)
router.delete(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  orderController.deleteOrder,
);

module.exports = router;
